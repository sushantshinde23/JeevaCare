import React, { useState } from 'react';
import { useReferrals } from '../context/ReferralContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Referral, ReferralStatus } from '../types';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bed,
  Droplet,
  HeartPulse,
  Baby,
  Stethoscope,
  XCircle,
  FileCheck,
  Check,
  UserCheck,
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { referrals, facilities, transitionReferral, updateFacilityReadiness } = useReferrals();

  // Find facility assigned to this hospital user (default: Sassoon General Hospital)
  const currentFacility =
    facilities.find((f) => f.id === user?.assignedFacilityId) || facilities[0];

  const hospitalReferrals = referrals.filter(
    (r) => r.receivingFacilityId === currentFacility?.id || r.receivingFacilityName.includes('Sassoon')
  );

  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(
    hospitalReferrals[0] || null
  );

  // Handover modal state
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [receivingDoctor, setReceivingDoctor] = useState('Dr. Suresh Deshmukh (MD OBGYN)');
  const [admissionWard, setAdmissionWard] = useState('Obstetric HDU / Labor OT');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Decline modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('OT occupied with active uterine rupture emergency');
  const [alternativeFacilityId, setAlternativeFacilityId] = useState(facilities[1]?.id || '');

  // Readiness toggle state
  const [laborBeds, setLaborBeds] = useState(currentFacility?.laborBedsAvailable || 8);
  const [icuBeds, setIcuBeds] = useState(currentFacility?.icuBedsAvailable || 4);
  const [sncuBeds, setSncuBeds] = useState(currentFacility?.sncuBedsAvailable || 5);
  const [readinessSaved, setReadinessSaved] = useState(false);

  const handleAcknowledge = async (ref: Referral) => {
    setActionLoading(true);
    try {
      const updated = await transitionReferral(
        ref.id,
        'ACKNOWLEDGED',
        `Pre-arrival alert acknowledged by ${user?.name || 'Receiving Hospital Coordinator'}`
      );
      setSelectedReferral(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (ref: Referral) => {
    setActionLoading(true);
    try {
      const updated = await transitionReferral(
        ref.id,
        'ACCEPTED',
        `Referral accepted. Bed reserved in ${admissionWard}. Obstetric & neonatal team on standby.`
      );
      setSelectedReferral(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedReferral) return;
    setActionLoading(true);
    try {
      const updated = await transitionReferral(
        selectedReferral.id,
        'REJECTED',
        `Declined with justification: ${declineReason}`,
        {
          rejectionReason: declineReason,
          alternativeFacilityId,
        }
      );
      setSelectedReferral(updated);
      setShowDeclineModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteHandover = async () => {
    if (!selectedReferral) return;
    setActionLoading(true);
    try {
      const updated = await transitionReferral(
        selectedReferral.id,
        'HANDOVER_COMPLETED',
        `Patient received and admitted by ${receivingDoctor} in ${admissionWard}`,
        {
          handoverDetails: {
            handoverTime: new Date().toISOString(),
            receivingDoctorName: receivingDoctor,
            admissionWard,
            handoverNotes,
            arrivalVitals: selectedReferral.vitals,
          },
        }
      );
      setSelectedReferral(updated);
      setShowHandoverModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveReadiness = async () => {
    if (!currentFacility) return;
    await updateFacilityReadiness(currentFacility.id, {
      laborBedsAvailable: laborBeds,
      icuBedsAvailable: icuBeds,
      sncuBedsAvailable: sncuBeds,
    });
    setReadinessSaved(true);
    setTimeout(() => setReadinessSaved(false), 3000);
  };

  const pendingAckCount = hospitalReferrals.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'AWAITING_ACKNOWLEDGEMENT'
  ).length;

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#101C2C] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E8F5F3] text-[#0F766E] dark:bg-[#203449] dark:text-[#2DD4BF] flex items-center gap-1 border border-[#0F766E]/20 dark:border-[#2DD4BF]/30">
                <Building2 className="w-3.5 h-3.5" /> Receiving Hospital Emergency Triage
              </span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">&bull; {currentFacility?.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] mt-1">
              Obstetric Emergency Dashboard
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Pre-arrival clinical alerts, bed preparation, and closed-loop patient handovers.
            </p>
          </div>

          {/* Pending Alert Badge */}
          {pendingAckCount > 0 && (
            <div className="px-4 py-2 rounded-xl bg-[#D97706] text-white font-bold text-xs flex items-center gap-2 animate-bounce shadow-md">
              <AlertTriangle className="w-4 h-4" />
              <span>{pendingAckCount} Referral(s) Awaiting Immediate Ack</span>
            </div>
          )}
        </div>

        {/* Live Operational Bed Readiness Bar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-[#12304A] dark:text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                Live Facility Operational Readiness
              </span>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                Updating your capacity helps frontline workers route emergencies to open facilities.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {readinessSaved && (
                <span className="text-xs font-semibold text-[#15803D] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Readiness Saved
                </span>
              )}
              <button
                onClick={handleSaveReadiness}
                className="px-3.5 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0D635C] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Capacity
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-[#F7FAFC] dark:bg-[#203449]/60 border border-[#DCE7EC] dark:border-[#334155]">
              <label className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1">
                Labor Beds Available
              </label>
              <input
                type="number"
                value={laborBeds}
                onChange={(e) => setLaborBeds(Number(e.target.value))}
                className="w-full px-2 py-1 rounded bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] font-extrabold text-[#0F766E] dark:text-[#2DD4BF]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#F7FAFC] dark:bg-[#203449]/60 border border-[#DCE7EC] dark:border-[#334155]">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                ICU / HDU Beds Available
              </label>
              <input
                type="number"
                value={icuBeds}
                onChange={(e) => setIcuBeds(Number(e.target.value))}
                className="w-full px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-extrabold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                SNCU / NICU Beds Available
              </label>
              <input
                type="number"
                value={sncuBeds}
                onChange={(e) => setSncuBeds(Number(e.target.value))}
                className="w-full px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-extrabold text-blue-700 dark:text-blue-400"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-slate-500 block">
                24x7 C-Section OT &amp; Blood
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full CEmONC Active
              </span>
            </div>
          </div>
        </div>

        {/* Triage Queue & Clinical Sheet Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Incoming Referrals Queue (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assigned Emergency Referrals ({hospitalReferrals.length})
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {hospitalReferrals.map((ref) => {
                const isSelected = selectedReferral?.id === ref.id;
                const isUrgent =
                  ref.status === 'SUBMITTED' || ref.status === 'AWAITING_ACKNOWLEDGEMENT';

                return (
                  <div
                    key={ref.id}
                    onClick={() => setSelectedReferral(ref)}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-xs space-y-2.5 ${
                      isSelected
                        ? 'border-teal-500 ring-2 ring-teal-500/20'
                        : isUrgent
                        ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                        {ref.referralCode}
                      </span>
                      <StatusBadge status={ref.status} size="sm" />
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {ref.patient.name} ({ref.patient.age} yrs)
                      </h4>
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {ref.emergencyCategory.replace(/_/g, ' ')} &bull; G{ref.patient.gravida}P{ref.patient.parity} ({ref.patient.gestationalWeeks}w)
                      </p>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Origin: {ref.referringFacilityName}</span>
                      <span className="font-medium">
                        {new Date(ref.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Referral Clinical Sheet & Actions (7 cols) */}
          <div className="lg:col-span-7">
            {selectedReferral ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-teal-700 dark:text-teal-400">
                        {selectedReferral.referralCode}
                      </span>
                      <StatusBadge status={selectedReferral.status} />
                      <UrgencyBadge urgency={selectedReferral.urgency} />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {selectedReferral.patient.name} ({selectedReferral.patient.age}y, Blood: {selectedReferral.patient.bloodGroup || 'O+'})
                    </h3>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(selectedReferral.status === 'SUBMITTED' ||
                      selectedReferral.status === 'AWAITING_ACKNOWLEDGEMENT') && (
                      <button
                        onClick={() => handleAcknowledge(selectedReferral)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-75"
                      >
                        Acknowledge Receipt
                      </button>
                    )}

                    {(selectedReferral.status === 'ACKNOWLEDGED' ||
                      selectedReferral.status === 'SUBMITTED') && (
                      <>
                        <button
                          onClick={() => handleAccept(selectedReferral)}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-75"
                        >
                          Accept &amp; Reserve Bed
                        </button>
                        <button
                          onClick={() => setShowDeclineModal(true)}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs cursor-pointer"
                        >
                          Decline / Re-route
                        </button>
                      </>
                    )}

                    {selectedReferral.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => setShowHandoverModal(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" /> Record Arrival &amp; Handover
                      </button>
                    )}
                  </div>
                </div>

                {/* Vitals & Danger Sign Sheet */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {selectedReferral.vitals.systolicBP || '--'}/{selectedReferral.vitals.diastolicBP || '--'} mmHg
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Pulse Rate</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {selectedReferral.vitals.pulseRate || '--'} bpm
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Fetal Heart Rate</span>
                    <span className="font-extrabold text-sm text-teal-700 dark:text-teal-400">
                      {selectedReferral.vitals.fetalHeartRate || '--'} bpm
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px]">SpO2 / Bleeding</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {selectedReferral.vitals.spO2 || 96}% &bull; {selectedReferral.vitals.bleedingIntensity || 'None'}
                    </span>
                  </div>
                </div>

                {/* Pre-referral Treatments Documented */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Pre-Referral Medications Given at PHC
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          selectedReferral.preReferralTreatment.magnesiumSulfateGiven
                            ? 'text-emerald-600'
                            : 'text-slate-300'
                        }`}
                      />
                      <span>Inj. Magnesium Sulfate Loading Dose</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          selectedReferral.preReferralTreatment.oxytocinGiven
                            ? 'text-emerald-600'
                            : 'text-slate-300'
                        }`}
                      />
                      <span>Inj. Oxytocin / Uterotonics</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          selectedReferral.preReferralTreatment.ivCannulaSecured
                            ? 'text-emerald-600'
                            : 'text-slate-300'
                        }`}
                      />
                      <span>IV Line &amp; Crystalloid Infusion</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          selectedReferral.preReferralTreatment.oxygenAdministered
                            ? 'text-emerald-600'
                            : 'text-slate-300'
                        }`}
                      />
                      <span>Oxygen Therapy</span>
                    </div>
                  </div>
                  {selectedReferral.preReferralTreatment.notes && (
                    <p className="mt-2 text-slate-600 dark:text-slate-300 italic border-t pt-2">
                      Notes: {selectedReferral.preReferralTreatment.notes}
                    </p>
                  )}
                </div>

                {/* AI Summary Banner */}
                {selectedReferral.aiSummary && (
                  <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong className="text-teal-900 dark:text-teal-200 block mb-1">
                      AI Triage Copilot Summary:
                    </strong>
                    {selectedReferral.aiSummary}
                  </div>
                )}

                {/* Completed Handover Details if available */}
                {selectedReferral.handoverDetails && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 block flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Verified Patient Handover Record
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">
                      Admitted by <strong>{selectedReferral.handoverDetails.receivingDoctorName}</strong> in{' '}
                      <strong>{selectedReferral.handoverDetails.admissionWard}</strong>.
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Handover Time: {new Date(selectedReferral.handoverDetails.handoverTime).toLocaleString()}
                    </p>
                    {selectedReferral.handoverDetails.handoverNotes && (
                      <p className="text-slate-600 dark:text-slate-300 mt-1 italic">
                        Doctor Notes: {selectedReferral.handoverDetails.handoverNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                Select a referral from the incoming triage queue.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Handover Confirmation Modal */}
      {showHandoverModal && selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Confirm Patient Arrival &amp; Handover
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Record receiving medical officer and admission ward to close the referral loop.
            </p>

            <div>
              <label className="block font-semibold mb-1">Receiving Doctor / Obstetrician</label>
              <input
                type="text"
                value={receivingDoctor}
                onChange={(e) => setReceivingDoctor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Admission Ward / Unit</label>
              <input
                type="text"
                value={admissionWard}
                onChange={(e) => setAdmissionWard(e.target.value)}
                placeholder="Obstetric HDU / Emergency Labor Room"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Initial Clinical Plan &amp; Notes</label>
              <textarea
                rows={3}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Patient received stable, cross-matched 2 units packed RBCs, emergency LSCS scheduled..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHandoverModal(false)}
                className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteHandover}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
              >
                Complete Handover &amp; Admit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline / Re-route Justification Modal */}
      {showDeclineModal && selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-base text-rose-600">
              Decline &amp; Re-route Referral
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              A clinical or operational reason is strictly required by the district audit protocol.
            </p>

            <div>
              <label className="block font-semibold mb-1">Mandatory Justification Reason</label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Recommended Alternative Facility</label>
              <select
                value={alternativeFacilityId}
                onChange={(e) => setAlternativeFacilityId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                {facilities
                  .filter((f) => f.id !== currentFacility?.id)
                  .map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} &bull; Labor Beds: {fac.laborBedsAvailable}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecline}
                disabled={actionLoading || !declineReason.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Confirm Decline &amp; Re-route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
