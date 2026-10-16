import React from 'react';
import { useReferrals } from '../context/ReferralContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import {
  HeartPulse,
  PhoneCall,
  MapPin,
  Ambulance,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { referrals, facilities, transports } = useReferrals();

  // Find active referral for this patient or default to the in-transit demo case
  const activeReferral =
    referrals.find((r) => r.patient.name.toLowerCase().includes('pooja') || r.status === 'IN_TRANSIT') ||
    referrals[0];

  const assignedFacility = facilities.find((f) => f.id === activeReferral?.receivingFacilityId);
  const activeTransport = transports.find((t) => t.referralId === activeReferral?.id);

  const steps = [
    { key: 'SUBMITTED', label: '1. Referral Submitted' },
    { key: 'ACKNOWLEDGED', label: '2. Hospital Alerted' },
    { key: 'ACCEPTED', label: '3. Bed & Team Reserved' },
    { key: 'IN_TRANSIT', label: '4. Ambulance En Route' },
    { key: 'ARRIVED', label: '5. Arrived at Hospital' },
    { key: 'HANDOVER_COMPLETED', label: '6. Admitted & Treated' },
  ];

  const getCurrentStepIndex = () => {
    if (!activeReferral) return 0;
    const status = activeReferral.status;
    if (status === 'SUBMITTED' || status === 'AWAITING_ACKNOWLEDGEMENT') return 0;
    if (status === 'ACKNOWLEDGED') return 1;
    if (status === 'ACCEPTED' || status === 'TRANSPORT_REQUESTED' || status === 'TRANSPORT_ASSIGNED') return 2;
    if (status === 'IN_TRANSIT') return 3;
    if (status === 'ARRIVED') return 4;
    if (status === 'HANDOVER_COMPLETED' || status === 'CLOSED') return 5;
    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#101C2C] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E8F5F3] text-[#0F766E] dark:bg-[#203449] dark:text-[#2DD4BF] border border-[#0F766E]/20 dark:border-[#2DD4BF]/30">
                Patient &amp; Family Portal
              </span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">&bull; Live Tracking</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] mt-1">
              Welcome, {user?.name || 'Pooja Nitin Shinde'}
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Live status and clinical coordination for your emergency referral journey.
            </p>
          </div>

          <a
            href="tel:108"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#DC2626]/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            Call 108 Emergency
          </a>
        </div>

        {/* Active Referral Tracker */}
        {activeReferral ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE7EC] dark:border-[#334155]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#0F766E] dark:text-[#2DD4BF]">
                    {activeReferral.referralCode}
                  </span>
                  <StatusBadge status={activeReferral.status} />
                  <UrgencyBadge urgency={activeReferral.urgency} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#12304A] dark:text-[#F1F5F9] mt-1">
                  Maternal Referral for {activeReferral.patient.name}
                </h2>
              </div>
              <div className="text-left sm:text-right text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span>Initiated: {new Date(activeReferral.createdAt).toLocaleTimeString()}</span>
                <span className="block font-semibold text-[#12304A] dark:text-[#CBD5E1]">
                  By {activeReferral.referringHealthWorkerName}
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                Emergency Journey Progress
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                {steps.map((s, idx) => {
                  const isDone = idx < currentIndex;
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={s.key}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'border-[#0F766E] bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold ring-2 ring-[#0F766E]/20'
                          : isDone
                          ? 'border-[#DCE7EC] dark:border-[#334155] bg-[#DCFCE7] dark:bg-[#14532D]/30 text-[#15803D] dark:text-[#BBF7D0] font-medium'
                          : 'border-[#DCE7EC]/60 dark:border-[#334155]/60 bg-[#F7FAFC] dark:bg-[#203449]/40 text-[#64748B] dark:text-[#94A3B8]'
                      }`}
                    >
                      <div className="flex justify-center mb-1">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-[#4ADE80]" />
                        ) : isCurrent ? (
                          <Clock className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF] animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[#DCE7EC] dark:border-[#334155]" />
                        )}
                      </div>
                      <span className="text-[11px] leading-tight block">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Receiving Hospital Card */}
              <div className="p-5 rounded-xl bg-[#F7FAFC] dark:bg-[#203449]/50 border border-[#DCE7EC] dark:border-[#334155] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                    Receiving Hospital (Alerted)
                  </span>
                  {assignedFacility?.isVerified && (
                    <span className="text-[10px] font-bold text-[#0F766E] dark:text-[#2DD4BF] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" /> Verified FRU
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                    {activeReferral.receivingFacilityName}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                    {assignedFacility?.address || 'District First Referral Unit, Maharashtra'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#BBF7D0] font-bold">
                    CEmONC C-Section Ready
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] dark:bg-[#7F1D1D]/40 dark:text-[#FECACA] font-bold">
                    Blood Bank Active
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E3A8A]/40 dark:text-[#BFDBFE] font-bold">
                    NICU / SNCU Ready
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-[#DCE7EC] dark:border-[#334155]">
                  <span className="font-semibold text-[#12304A] dark:text-[#CBD5E1]">
                    Hospital Helpline:
                  </span>
                  <a
                    href={`tel:${assignedFacility?.emergencyHelpline || '108'}`}
                    className="font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
                  >
                    {assignedFacility?.emergencyHelpline || '108'}
                  </a>
                </div>
              </div>

              {/* 108 Transport Dispatch Card */}
              <div className="p-5 rounded-xl bg-[#F7FAFC] dark:bg-[#203449]/50 border border-[#DCE7EC] dark:border-[#334155] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <Ambulance className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
                    108 Emergency Transport
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E3A8A]/60 dark:text-[#BFDBFE]">
                    {activeTransport?.ambulanceType || '108 ALS Unit'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">Vehicle Number:</span>
                    <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] font-mono">
                      {activeTransport?.vehicleNumber || 'MH-12-EM-1081'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">Pilot (Driver):</span>
                    <span className="font-semibold text-[#12304A] dark:text-[#CBD5E1]">{activeTransport?.driverName || 'Santosh Gole'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">EMT Paramedic:</span>
                    <span className="font-semibold text-[#12304A] dark:text-[#CBD5E1]">{activeTransport?.paramedicName || 'Vikram Sawant'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">Estimated Arrival (ETA):</span>
                    <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">
                      {activeTransport?.estimatedArrivalMinutes || 22} minutes
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-[#DCE7EC] dark:border-[#334155]">
                  <span className="font-semibold text-[#12304A] dark:text-[#CBD5E1]">
                    Direct Ambulance Call:
                  </span>
                  <a
                    href={`tel:${activeTransport?.driverPhone || '108'}`}
                    className="font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                  >
                    {activeTransport?.driverPhone || '108'}
                  </a>
                </div>
              </div>
            </div>

            {/* Crucial Instructions for the Family */}
            <div className="p-4 rounded-xl bg-[#E8F5F3] dark:bg-[#203449] border border-[#0F766E]/20 dark:border-[#2DD4BF]/20 space-y-2 text-xs">
              <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                Important Family Instructions During Transit
              </span>
              <ul className="list-disc list-inside space-y-1 text-[#334155] dark:text-[#CBD5E1]">
                <li>Keep the mother lying on her <strong>left side</strong> to ensure adequate oxygen to the baby.</li>
                <li>Carry the Mother-Child Protection (MCP) card, Aadhaar card, and previous sonography reports.</li>
                <li>Do NOT give solid foods, milk, or fluids to the mother during transport.</li>
                <li>The receiving hospital has already reserved a bed and their obstetric team is on standby.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] space-y-3">
            <HeartPulse className="w-12 h-12 text-[#0F766E] dark:text-[#2DD4BF] mx-auto opacity-70" />
            <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9]">
              No Active Referrals Found
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto">
              If an emergency referral was initiated by your ASHA worker, it will appear here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
