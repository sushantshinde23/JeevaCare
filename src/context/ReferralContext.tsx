import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Referral, Facility, TransportRequest, InAppNotification, ReferralStatus } from '../types';
import { apiClient } from '../services/api';
import { getOfflineDrafts } from '../services/storage';
import { firestoreSync } from '../services/firebase';
import { useAuth } from './AuthContext';

interface ReferralContextType {
  referrals: Referral[];
  facilities: Facility[];
  transports: TransportRequest[];
  notifications: InAppNotification[];
  isOnline: boolean;
  offlineDraftCount: number;
  loading: boolean;
  createReferral: (data: Partial<Referral>) => Promise<Referral>;
  transitionReferral: (id: string, targetStatus: ReferralStatus, note?: string, extra?: any) => Promise<Referral>;
  updateFacilityReadiness: (id: string, updates: Partial<Facility>) => Promise<void>;
  updateTransport: (id: string, updates: Partial<TransportRequest>) => Promise<void>;
  syncOffline: () => Promise<{ synced: number; failed: number }>;
  markNotificationRead: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [transports, setTransports] = useState<TransportRequest[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineDraftCount, setOfflineDraftCount] = useState<number>(0);
  const { googleUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      apiClient.syncOfflineQueue().then((res) => {
        if (res.synced > 0) {
          updateOfflineCount();
          refreshData();
        }
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateOfflineCount = () => {
    setOfflineDraftCount(getOfflineDrafts().length);
  };

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [facs, refs, trans, notifs] = await Promise.all([
        apiClient.getFacilities(),
        apiClient.getReferrals(),
        apiClient.getTransports(),
        apiClient.getNotifications(),
      ]);
      setFacilities(facs);
      setReferrals(refs);
      setTransports(trans);
      setNotifications(notifs);
      updateOfflineCount();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time Firestore sync listener for multi-device sync
  // Per React Firebase Setup guideline: "Only attach onSnapshot listeners if auth is ready and user is authenticated."
  useEffect(() => {
    if (!googleUser) {
      return;
    }
    const unsubscribe = firestoreSync.subscribeReferrals((firestoreRefs) => {
      if (firestoreRefs.length > 0) {
        setReferrals((prev) => {
          // Merge Firestore referrals with local state
          const map = new Map<string, Referral>();
          prev.forEach((r) => map.set(r.id, r));
          firestoreRefs.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });
      }
    });

    return () => unsubscribe();
  }, [googleUser]);

  const createReferral = async (data: Partial<Referral>): Promise<Referral> => {
    const created = await apiClient.createReferral(data, isOnline);
    setReferrals((prev) => [created, ...prev]);
    updateOfflineCount();

    // Persist to Firestore if online
    if (isOnline) {
      firestoreSync.saveReferral(created).catch((err) => {
        console.warn('Firestore sync note for created referral:', err);
      });
    }

    return created;
  };

  const transitionReferral = async (
    id: string,
    targetStatus: ReferralStatus,
    note?: string,
    extra: any = {}
  ): Promise<Referral> => {
    const updated = await apiClient.transitionReferral(id, {
      targetStatus,
      actorId: extra.actorId || 'usr-hosp-1',
      actorName: extra.actorName || 'Hospital Coordinator',
      actorRole: extra.actorRole || 'hospital_coordinator',
      note,
      handoverDetails: extra.handoverDetails,
      rejectionReason: extra.rejectionReason,
      alternativeFacilityId: extra.alternativeFacilityId,
    });

    setReferrals((prev) => prev.map((r) => (r.id === id ? updated : r)));

    // Persist state transition to Firestore
    if (isOnline) {
      firestoreSync
        .updateReferral(id, {
          status: targetStatus,
          statusHistory: updated.statusHistory,
        })
        .catch((err) => {
          console.warn('Firestore sync note for status update:', err);
        });
    }

    return updated;
  };

  const updateFacilityReadiness = async (id: string, updates: Partial<Facility>) => {
    const updated = await apiClient.updateFacilityReadiness(id, updates);
    if (updated) {
      setFacilities((prev) => prev.map((f) => (f.id === id ? updated : f)));
    }
  };

  const updateTransport = async (id: string, updates: Partial<TransportRequest>) => {
    const updated = await apiClient.updateTransport(id, updates);
    if (updated) {
      setTransports((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (isOnline) {
        firestoreSync.saveTransport(updated).catch(() => {});
      }
    }
  };

  const syncOffline = async () => {
    const result = await apiClient.syncOfflineQueue();
    updateOfflineCount();
    await refreshData();
    return result;
  };

  const markNotificationRead = async (id: string) => {
    await apiClient.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <ReferralContext.Provider
      value={{
        referrals,
        facilities,
        transports,
        notifications,
        isOnline,
        offlineDraftCount,
        loading,
        createReferral,
        transitionReferral,
        updateFacilityReadiness,
        updateTransport,
        syncOffline,
        markNotificationRead,
        refreshData,
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
};

export const useReferrals = () => {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error('useReferrals must be used within a ReferralProvider');
  }
  return context;
};
