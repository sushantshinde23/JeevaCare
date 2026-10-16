import { Facility, Referral, TransportRequest, InAppNotification, ReferralStatus } from '../types';
import {
  INITIAL_FACILITIES,
  INITIAL_REFERRALS,
  INITIAL_TRANSPORTS,
  INITIAL_NOTIFICATIONS,
  loadStoredData,
  saveStoredData,
  saveOfflineDraft,
  getOfflineDrafts,
  removeOfflineDraft,
} from './storage';

const API_BASE = '/api';

export const apiClient = {
  // Facilities
  async getFacilities(): Promise<Facility[]> {
    try {
      const res = await fetch(`${API_BASE}/facilities`);
      if (res.ok) {
        const data = await res.json();
        saveStoredData('cached_facilities', data.facilities);
        return data.facilities;
      }
    } catch {
      // offline or network error fallback
    }
    return loadStoredData<Facility[]>('cached_facilities', INITIAL_FACILITIES);
  },

  async updateFacilityReadiness(id: string, updates: Partial<Facility>): Promise<Facility | null> {
    try {
      const res = await fetch(`${API_BASE}/facilities/${id}/readiness`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        return data.facility;
      }
    } catch {
      // offline
    }
    return null;
  },

  // Referrals
  async getReferrals(filters?: { status?: string; facilityId?: string; workerId?: string }): Promise<Referral[]> {
    try {
      const query = new URLSearchParams(filters as Record<string, string>).toString();
      const res = await fetch(`${API_BASE}/referrals?${query}`);
      if (res.ok) {
        const data = await res.json();
        saveStoredData('cached_referrals', data.referrals);
        return data.referrals;
      }
    } catch {
      // fallback
    }
    return loadStoredData<Referral[]>('cached_referrals', INITIAL_REFERRALS);
  },

  async getReferralById(id: string): Promise<Referral | null> {
    try {
      const res = await fetch(`${API_BASE}/referrals/${id}`);
      if (res.ok) {
        const data = await res.json();
        return data.referral;
      }
    } catch {
      // fallback
    }
    const all = loadStoredData<Referral[]>('cached_referrals', INITIAL_REFERRALS);
    return all.find((r) => r.id === id || r.referralCode === id) || null;
  },

  async createReferral(referralData: Partial<Referral>, isOnline = true): Promise<Referral> {
    if (!isOnline) {
      // Save directly to offline drafts
      const draftId = `draft-${Date.now()}`;
      const offlineReferral: Referral = {
        id: draftId,
        referralCode: `MC-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`,
        patient: referralData.patient!,
        emergencyCategory: referralData.emergencyCategory || 'OTHER_CRITICAL',
        urgency: referralData.urgency || 'HIGH',
        vitals: referralData.vitals || {},
        preReferralTreatment: referralData.preReferralTreatment || {},
        clinicalNotes: referralData.clinicalNotes || '',
        referringHealthWorkerId: referralData.referringHealthWorkerId || 'usr-asha-1',
        referringHealthWorkerName: referralData.referringHealthWorkerName || 'Health Worker',
        referringFacilityName: referralData.referringFacilityName || 'Rural Sub-Center',
        referringCoordinates: referralData.referringCoordinates || { lat: 18.8471, lng: 73.9056 },
        receivingFacilityId: referralData.receivingFacilityId!,
        receivingFacilityName: referralData.receivingFacilityName || 'First Referral Unit',
        receivingFacilityCoordinates: referralData.receivingFacilityCoordinates,
        status: 'SUBMITTED',
        statusHistory: [
          {
            id: `evt-offline-${Date.now()}`,
            referralId: draftId,
            status: 'SUBMITTED',
            actorId: referralData.referringHealthWorkerId || 'usr-asha-1',
            actorName: referralData.referringHealthWorkerName || 'Health Worker',
            actorRole: 'health_worker',
            timestamp: new Date().toISOString(),
            note: 'Draft saved locally (Offline mode)',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOfflineDraft: true,
      };

      saveOfflineDraft(offlineReferral);
      return offlineReferral;
    }

    try {
      const res = await fetch(`${API_BASE}/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referralData),
      });
      if (res.ok) {
        const data = await res.json();
        return data.referral;
      }
    } catch {
      // If server unreachable, save as offline draft
      return this.createReferral(referralData, false);
    }
    throw new Error('Failed to create referral');
  },

  async transitionReferral(
    id: string,
    params: {
      targetStatus: ReferralStatus;
      actorId: string;
      actorName: string;
      actorRole: string;
      note?: string;
      handoverDetails?: any;
      rejectionReason?: string;
      alternativeFacilityId?: string;
    }
  ): Promise<Referral> {
    const res = await fetch(`${API_BASE}/referrals/${id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed transition to ${params.targetStatus}`);
    }

    const data = await res.json();
    return data.referral;
  },

  // Transports
  async getTransports(): Promise<TransportRequest[]> {
    try {
      const res = await fetch(`${API_BASE}/transport`);
      if (res.ok) {
        const data = await res.json();
        return data.transports;
      }
    } catch {
      // fallback
    }
    return INITIAL_TRANSPORTS;
  },

  async updateTransport(id: string, updates: Partial<TransportRequest>): Promise<TransportRequest | null> {
    try {
      const res = await fetch(`${API_BASE}/transport/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        return data.transport;
      }
    } catch {
      // fallback
    }
    return null;
  },

  // Notifications
  async getNotifications(role?: string): Promise<InAppNotification[]> {
    try {
      const url = role ? `${API_BASE}/notifications?role=${role}` : `${API_BASE}/notifications`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return data.notifications;
      }
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // ignore
    }
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch {
      // fallback
    }
    return {
      totalReferrals: INITIAL_REFERRALS.length,
      criticalCount: 2,
      inTransitCount: 1,
      completedCount: 1,
      awaitingAckCount: 1,
      medianAckMinutes: 6.5,
      medianTransitMinutes: 34.2,
      medianHandoverMinutes: 11.0,
      categoryBreakdown: { ECLAMPSIA: 1, POSTPARTUM_HEMORRHAGE: 1, OBSTRUCTED_LABOR: 1 },
      dataNotice: 'Calculated from local demo dataset.',
    };
  },

  // AI Service Calls
  async getAiReferralSummary(referralData: Partial<Referral>, language = 'en') {
    try {
      const res = await fetch(`${API_BASE}/ai/referral-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralData, language }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return {
      success: true,
      aiOutput: {
        summary: `Maternal emergency referral for ${referralData.patient?.name || 'patient'}. Immediate CEmONC assessment requested.`,
        dangerSignsIdentified: ['High-risk obstetric emergency category', 'Pre-referral monitoring required'],
        missingCriticalFields: ['Verify blood pressure and fetal heart sounds before transfer'],
        receivingFacilityRequirements: ['CEmONC capability with 24x7 blood bank and obstetrician'],
      },
      source: 'offline-rule-engine',
    };
  },

  async sendAiChat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    language = 'en',
    userRole = 'health_worker',
    userId?: string
  ): Promise<{ reply: string; source: string; suggestedActions?: Array<{ label: string; action: string }> }> {
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, language, userRole, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          reply: data.reply || data.answer || '',
          source: data.source || 'gemini-3.8-flash',
          suggestedActions: data.suggestedActions,
        };
      }
    } catch {
      // fallback
    }

    // Secondary fallback to single question endpoint
    const lastMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const answer = await this.askAiAssistant(lastMsg, language, userRole, userId);
    return {
      reply: answer,
      source: 'clinical-knowledge-engine',
    };
  },

  async askAiAssistant(question: string, language = 'en', userRole = 'health_worker', userId?: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/ai/multilingual-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language, userRole, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.answer || data.reply || '';
      }
    } catch {
      // fallback
    }
    if (language === 'mr') {
      return 'JeevaCare २४ तास सिझेरियन, रक्तपेढी आणि नवजात आयसीयू सुविधा असलेल्या प्रमाणित रुग्णालयांशी जोडते. तातडीची परिस्थिती असल्यास त्वरित १०८ रुग्णवाहिकेला कॉल करा.';
    }
    if (language === 'hi') {
      return 'JeevaCare 24x7 सी-सेक्शन, ब्लड बैंक और एनआईसीयू युक्त प्रमाणित अस्पतालों से जोड़ता है। आपातकालीन स्थिति में तुरंत 108 पर कॉल करें।';
    }
    return 'JeevaCare connects frontline health workers with verified First Referral Units (FRUs) and 108 emergency transport. Please call 108 immediately for urgent ambulance coordination.';
  },

  // Sync all offline drafts
  async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
    const drafts = getOfflineDrafts();
    let synced = 0;
    let failed = 0;

    for (const draft of drafts) {
      try {
        const res = await fetch(`${API_BASE}/referrals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });
        if (res.ok) {
          removeOfflineDraft(draft.id);
          synced++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { synced, failed };
  },
};
