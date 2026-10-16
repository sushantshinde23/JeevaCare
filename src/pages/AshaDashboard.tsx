import React, { useState } from 'react';
import { useReferrals } from '../context/ReferralContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Referral, EmergencyCategory, TriageUrgency } from '../types';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import { ReferralCopilotModal } from '../components/ai/ReferralCopilotModal';
import {
  Stethoscope,
  PlusCircle,
  Sparkles,
  WifiOff,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  FileText,
  User,
  HeartPulse,
  Droplet,
  Baby,
  X,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const AshaDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { referrals, facilities, createReferral, isOnline, offlineDraftCount, syncOffline } = useReferrals();

  const [showWizard, setShowWizard] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [syncing, setSyncing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Referral>>({
    patient: {
      name: '',
      age: 22,
      husbandOrFatherName: '',
      contactPhone: '',
      addressVillage: '',
      district: 'Pune',
      gravida: 1,
      parity: 0,
      gestationalWeeks: 38,
      bloodGroup: 'B+',
      rchId: '',
    },
    emergencyCategory: 'ECLAMPSIA',
    urgency: 'CRITICAL',
    vitals: {
      systolicBP: 160,
      diastolicBP: 110,
      pulseRate: 104,
      fetalHeartRate: 140,
      spO2: 96,
      temperatureF: 98.6,
      bleedingIntensity: 'MILD',
      consciousness: 'DROWSY',
    },
    preReferralTreatment: {
      magnesiumSulfateGiven: true,
      magnesiumSulfateDose: 'Loading dose (4g IV + 10g IM Pritchard protocol)',
      oxytocinGiven: false,
      ivCannulaSecured: true,
      ivFluidsStarted: 'Ringer Lactate',
      oxygenAdministered: true,
      warmthMaintained: true,
      notes: '',
    },
    clinicalNotes: '',
    receivingFacilityId: facilities[0]?.id || '',
    receivingFacilityName: facilities[0]?.name || '',
    referringHealthWorkerId: user?.id || 'usr-asha-1',
    referringHealthWorkerName: user?.name || 'Asha Meena Jadhav',
    referringFacilityName: 'PHC Khed Rural',
  });

  const handleCreateSubmit = async () => {
    try {
      const selectedFac = facilities.find((f) => f.id === formData.receivingFacilityId);
      await createReferral({
        ...formData,
        receivingFacilityName: selectedFac?.name || formData.receivingFacilityName,
        receivingFacilityCoordinates: selectedFac?.coordinates,
      });
      setShowWizard(false);
      setActiveStep(1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await syncOffline();
    } finally {
      setSyncing(false);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.patient.name.toLowerCase().includes(q) ||
        r.referralCode.toLowerCase().includes(q) ||
        r.emergencyCategory.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#101C2C] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E8F5F3] text-[#0F766E] dark:bg-[#203449] dark:text-[#2DD4BF] flex items-center gap-1 border border-[#0F766E]/20 dark:border-[#2DD4BF]/30">
                <Stethoscope className="w-3.5 h-3.5" /> Frontline Health Worker Portal
              </span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">&bull; PHC Khed Catchment</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] mt-1">
              {user?.name || 'Asha Meena Jadhav'}
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Initiate structured referrals, monitor hospital acceptance, and manage follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowWizard(true);
                setActiveStep(1);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0F766E]/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              New Emergency Referral
            </button>
          </div>
        </div>

        {/* Offline Queue Notice if any */}
        {offlineDraftCount > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-semibold">
              <WifiOff className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>{offlineDraftCount} referral draft(s) saved locally during low connectivity.</span>
            </div>
            <button
              onClick={handleManualSync}
              disabled={syncing || !isOnline}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to Server'}
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, code, or emergency..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] placeholder-[#64748B] focus:ring-2 focus:ring-[#0F766E] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#64748B]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] font-semibold focus:ring-2 focus:ring-[#0F766E] outline-none"
            >
              <option value="ALL">All Referral Statuses</option>
              <option value="SUBMITTED">Submitted / Awaiting Ack</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="HANDOVER_COMPLETED">Handover Completed</option>
            </select>
          </div>
        </div>

        {/* Referrals List */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
            Active &amp; Historical Referrals ({filteredReferrals.length})
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredReferrals.map((ref) => (
              <div
                key={ref.id}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#0F766E]/50 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DCE7EC] dark:border-[#334155]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF]">
                      {ref.referralCode}
                    </span>
                    <StatusBadge status={ref.status} />
                    <UrgencyBadge urgency={ref.urgency} />
                    {ref.isOfflineDraft && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
                        Offline Draft
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    {new Date(ref.createdAt).toLocaleDateString()} at{' '}
                    {new Date(ref.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Patient Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">Patient</span>
                    <span className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                      {ref.patient.name} ({ref.patient.age} yrs)
                    </span>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">
                      G{ref.patient.gravida}P{ref.patient.parity} at {ref.patient.gestationalWeeks}w
                    </span>
                  </div>

                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">Emergency Category</span>
                    <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                      {ref.emergencyCategory.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">
                      BP: {ref.vitals.systolicBP || '--'}/{ref.vitals.diastolicBP || '--'} | Pulse: {ref.vitals.pulseRate || '--'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">Receiving Facility</span>
                    <span className="font-bold text-[#0F766E] dark:text-[#2DD4BF] block">
                      {ref.receivingFacilityName}
                    </span>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">
                      Pre-arrival alert confirmed
                    </span>
                  </div>

                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">Pre-referral Stabilization</span>
                    <span className="font-semibold text-[#334155] dark:text-[#CBD5E1] block truncate">
                      {ref.preReferralTreatment.magnesiumSulfateGiven && 'MgSO4 Loading Dose Given • '}
                      {ref.preReferralTreatment.oxytocinGiven && 'Oxytocin Given • '}
                      {ref.preReferralTreatment.ivCannulaSecured && 'IV Secured'}
                    </span>
                  </div>
                </div>

                {/* AI Summary Banner if available */}
                {ref.aiSummary && (
                  <div className="p-3 rounded-xl bg-[#E8F5F3] dark:bg-[#203449] border border-[#0F766E]/20 dark:border-[#2DD4BF]/20 text-xs text-[#334155] dark:text-[#CBD5E1] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#12304A] dark:text-[#F1F5F9]">AI Handover Summary:</strong>{' '}
                      {ref.aiSummary}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Step Emergency Referral Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-teal-200" />
                  Initiate Maternal / Newborn Emergency Referral
                </h3>
                <p className="text-xs text-teal-100">
                  Step {activeStep} of 3 &bull; Standard Dakshata Protocol
                </p>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveStep(1)}
                className={`flex items-center gap-1.5 ${
                  activeStep === 1 ? 'text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                Demographics
              </button>
              <button
                onClick={() => setActiveStep(2)}
                className={`flex items-center gap-1.5 ${
                  activeStep === 2 ? 'text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                Emergency &amp; Vitals
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className={`flex items-center gap-1.5 ${
                  activeStep === 3 ? 'text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                Stabilization &amp; Receiving Hospital
              </button>
            </div>

            {/* Wizard Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* STEP 1: Demographics */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Patient Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.patient?.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patient: { ...formData.patient!, name: e.target.value },
                          })
                        }
                        placeholder="e.g. Rohini Santosh Shinde"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        value={formData.patient?.age}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patient: { ...formData.patient!, age: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Gravida (G)
                      </label>
                      <input
                        type="number"
                        value={formData.patient?.gravida}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patient: { ...formData.patient!, gravida: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Parity (P)
                      </label>
                      <input
                        type="number"
                        value={formData.patient?.parity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patient: { ...formData.patient!, parity: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Gestational Age (Weeks)
                      </label>
                      <input
                        type="number"
                        value={formData.patient?.gestationalWeeks}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patient: { ...formData.patient!, gestationalWeeks: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.patient?.contactPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patient: { ...formData.patient!, contactPhone: e.target.value },
                          })
                        }
                        placeholder="+91 98220 00000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Village &amp; Sub-Center
                      </label>
                      <input
                        type="text"
                        value={formData.patient?.addressVillage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patient: { ...formData.patient!, addressVillage: e.target.value },
                          })
                        }
                        placeholder="e.g. Village Mahalunge, Khed"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Emergency & Vitals */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Emergency Clinical Category *
                    </label>
                    <select
                      value={formData.emergencyCategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyCategory: e.target.value as EmergencyCategory,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="ECLAMPSIA">ECLAMPSIA (Convulsions / Severe Pre-eclampsia)</option>
                      <option value="POSTPARTUM_HEMORRHAGE">POSTPARTUM HEMORRHAGE (PPH - Severe Bleeding)</option>
                      <option value="ANTEPARTUM_HEMORRHAGE">ANTEPARTUM HEMORRHAGE (APH - Placenta Previa/Abruption)</option>
                      <option value="OBSTRUCTED_LABOR">OBSTRUCTED LABOR / Cephalopelvic Disproportion</option>
                      <option value="SEPSIS_PUERPERAL">PUERPERAL SEPSIS (High fever, foul discharge)</option>
                      <option value="RUPTURED_UTERUS">RUPTURED UTERUS (Severe pain, cessation of contractions)</option>
                      <option value="NEWBORN_ASPHYXIA">NEONATAL ASPHYXIA (No cry, apnea)</option>
                      <option value="PRETERM_LOW_BIRTH_WEIGHT">PRETERM / VERY LOW BIRTH WEIGHT (&lt;1800g)</option>
                      <option value="NEONATAL_SEPSIS">NEONATAL SEPSIS / Hypothermia</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Systolic BP (mmHg)
                      </label>
                      <input
                        type="number"
                        value={formData.vitals?.systolicBP}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vitals: { ...formData.vitals!, systolicBP: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Diastolic BP (mmHg)
                      </label>
                      <input
                        type="number"
                        value={formData.vitals?.diastolicBP}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vitals: { ...formData.vitals!, diastolicBP: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Pulse Rate (bpm)
                      </label>
                      <input
                        type="number"
                        value={formData.vitals?.pulseRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vitals: { ...formData.vitals!, pulseRate: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Fetal Heart Rate
                      </label>
                      <input
                        type="number"
                        value={formData.vitals?.fetalHeartRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vitals: { ...formData.vitals!, fetalHeartRate: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Clinical Observations &amp; Danger Signs
                    </label>
                    <textarea
                      rows={2}
                      value={formData.clinicalNotes}
                      onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                      placeholder="e.g. Generalized tonic clonic seizure, severe epigastric pain, active vaginal bleeding..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Stabilization & Facility Selector */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  {/* Pre-referral treatments checklist */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider block">
                      Pre-Referral Stabilization Checklist
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preReferralTreatment?.magnesiumSulfateGiven}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              preReferralTreatment: {
                                ...formData.preReferralTreatment!,
                                magnesiumSulfateGiven: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-teal-600"
                        />
                        <span>Inj. Magnesium Sulfate Loading Dose</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preReferralTreatment?.ivCannulaSecured}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              preReferralTreatment: {
                                ...formData.preReferralTreatment!,
                                ivCannulaSecured: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-teal-600"
                        />
                        <span>IV Cannula (16G/18G) &amp; Ringer Lactate</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preReferralTreatment?.oxygenAdministered}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              preReferralTreatment: {
                                ...formData.preReferralTreatment!,
                                oxygenAdministered: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-teal-600"
                        />
                        <span>Oxygen Therapy (4-6 L/min)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preReferralTreatment?.warmthMaintained}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              preReferralTreatment: {
                                ...formData.preReferralTreatment!,
                                warmthMaintained: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-teal-600"
                        />
                        <span>Newborn Warmth / KMC / Left Tilt</span>
                      </label>
                    </div>
                  </div>

                  {/* AI Copilot Review Trigger */}
                  <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                      <span className="font-semibold text-teal-900 dark:text-teal-200">
                        Run AI Referral Copilot Summary &amp; Protocol Verification
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCopilot(true)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs shadow-xs hover:bg-teal-700 cursor-pointer"
                    >
                      Analyze with AI
                    </button>
                  </div>

                  {/* Receiving Facility Selection */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Receiving First Referral Unit (FRU) *
                    </label>
                    <select
                      value={formData.receivingFacilityId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          receivingFacilityId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      {facilities.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name} &bull; {fac.hasCEmONC ? 'CEmONC (C-Section)' : 'BEmONC'} &bull; Labor Beds: {fac.laborBedsAvailable}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Navigation Buttons */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              {activeStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              ) : (
                <div />
              )}

              {activeStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer flex items-center gap-1"
                >
                  Next Step <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateSubmit}
                  className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md shadow-teal-600/30 cursor-pointer flex items-center gap-2"
                >
                  <HeartPulse className="w-4 h-4" />
                  Submit Emergency Referral
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Referral Copilot Modal */}
      <ReferralCopilotModal
        referralData={formData}
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        onApplySummary={(summary) =>
          setFormData({
            ...formData,
            clinicalNotes: `${formData.clinicalNotes ? formData.clinicalNotes + '\n\n' : ''}[AI Summary]: ${summary}`,
          })
        }
      />
    </div>
  );
};
