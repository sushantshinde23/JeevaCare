import React, { useState } from 'react';
import { useReferrals } from '../context/ReferralContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { TransportRequest, TransportStatus } from '../types';
import { EmergencyMap } from '../components/maps/EmergencyMap';
import {
  Ambulance,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  ShieldCheck,
  User,
  ArrowRight,
} from 'lucide-react';

export const TransportDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { transports, updateTransport, facilities } = useReferrals();

  const [selectedTransport, setSelectedTransport] = useState<TransportRequest | null>(
    transports[0] || null
  );
  const [delayNotes, setDelayNotes] = useState('');

  const handleUpdateStatus = async (transportId: string, nextStatus: TransportStatus) => {
    await updateTransport(transportId, {
      status: nextStatus,
      lastLocationUpdate: new Date().toISOString(),
      ...(nextStatus === 'PATIENT_PICKED_UP' ? { pickupAt: new Date().toISOString() } : {}),
      ...(nextStatus === 'ARRIVED_FACILITY' ? { deliveredAt: new Date().toISOString() } : {}),
    });

    if (selectedTransport?.id === transportId) {
      setSelectedTransport((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
  };

  const getStatusColor = (status: TransportStatus) => {
    switch (status) {
      case 'IN_TRANSIT':
      case 'EN_ROUTE_PICKUP':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300';
      case 'ARRIVED_FACILITY':
        return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#101C2C] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E8F5F3] text-[#0F766E] dark:bg-[#203449] dark:text-[#2DD4BF] flex items-center gap-1 border border-[#0F766E]/20 dark:border-[#2DD4BF]/30">
                <Ambulance className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" /> 108 Emergency Ambulance Dispatch
              </span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">&bull; Pune District MEMS Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] mt-1">
              Active Fleet &amp; Transport Jobs
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Live journey tracking, ETA communication, and receiving hospital sync.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] text-xs font-bold text-[#12304A] dark:text-[#CBD5E1]">
              {transports.length} Active Unit(s)
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Jobs Feed (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Transport Missions ({transports.length})
            </div>

            <div className="space-y-3">
              {transports.map((t) => {
                const isSelected = selectedTransport?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTransport(t)}
                    className={`p-4 rounded-2xl bg-white dark:bg-[#172638] border transition-all cursor-pointer shadow-xs space-y-3 ${
                      isSelected
                        ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 dark:border-[#2DD4BF]'
                        : 'border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                        {t.vehicleNumber || '108 ALS UNIT'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(t.status)}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                        {t.patientName} &bull; Case: {t.referralCode}
                      </h4>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                        {t.pickupLocation} &rarr; {t.destinationFacilityName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#DCE7EC] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8]">
                      <span>Pilot: {t.driverName}</span>
                      <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">
                        ETA: {t.estimatedArrivalMinutes || 20}m
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transport Detail, Stepper & Map (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {selectedTransport ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-md space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#DCE7EC] dark:border-[#334155]">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                      Vehicle: {selectedTransport.vehicleNumber} ({selectedTransport.ambulanceType})
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#12304A] dark:text-[#F1F5F9]">
                      Mission for {selectedTransport.patientName}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA]">
                    Est. Transit Time: {selectedTransport.estimatedArrivalMinutes || 22} mins
                  </span>
                </div>

                {/* Milestone Stepper */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider block">
                    Update Journey Milestones
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { status: 'EN_ROUTE_PICKUP', label: '1. En Route to PHC' },
                      { status: 'PATIENT_PICKED_UP', label: '2. Patient Onboard' },
                      { status: 'IN_TRANSIT', label: '3. En Route Hospital' },
                      { status: 'ARRIVED_FACILITY', label: '4. Arrived Hospital' },
                    ].map((step) => {
                      const isCurrent = selectedTransport.status === step.status;
                      return (
                        <button
                          key={step.status}
                          onClick={() => handleUpdateStatus(selectedTransport.id, step.status as TransportStatus)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-semibold ${
                            isCurrent
                              ? 'bg-[#0F766E] text-white border-[#0D635C] shadow-sm'
                              : 'bg-[#F7FAFC] dark:bg-[#203449] text-[#334155] dark:text-[#CBD5E1] border-[#DCE7EC] dark:border-[#334155] hover:bg-[#E8F5F3]'
                          }`}
                        >
                          {step.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Map Preview */}
                <div>
                  <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider block mb-2">
                    Live Route Trajectory
                  </span>
                  <EmergencyMap
                    facilities={facilities}
                    userLocation={selectedTransport.currentCoordinates}
                    height="280px"
                  />
                </div>

                {/* Crew Details & Direct Contacts */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#F7FAFC] dark:bg-[#203449]/50 text-xs border border-[#DCE7EC] dark:border-[#334155]">
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">Ambulance Pilot</span>
                    <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                      {selectedTransport.driverName || 'Santosh Gole'}
                    </span>
                    <a
                      href={`tel:${selectedTransport.driverPhone || '108'}`}
                      className="text-[#2563EB] dark:text-[#60A5FA] font-semibold hover:underline block mt-0.5"
                    >
                      {selectedTransport.driverPhone || '+91 98223 99881'}
                    </a>
                  </div>
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">EMT Paramedic</span>
                    <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                      {selectedTransport.paramedicName || 'EMT Vikram Sawant'}
                    </span>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block mt-0.5">Airway &amp; Vitals Support</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8]">
                Select a transport mission to view route and progress.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
