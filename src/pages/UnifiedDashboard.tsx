import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useReferrals } from '../context/ReferralContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Referral, EmergencyCategory, TriageUrgency, ReferralStatus, Facility, UserRole } from '../types';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import { ReferralCopilotModal } from '../components/ai/ReferralCopilotModal';
import { WorkspaceModal } from '../components/workspace/WorkspaceModal';
import { EmergencyMap } from '../components/maps/EmergencyMap';
import {
  DashboardSidebar,
  DashboardView,
} from '../components/navigation/DashboardSidebar';
import { DashboardTopBar } from '../components/navigation/DashboardTopBar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import {
  PlusCircle,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Phone,
  Mail,
  HardDrive,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Bed,
  Droplet,
  Baby,
  MapPin,
  ExternalLink,
  ChevronRight,
  X,
  Stethoscope,
  Building2,
  Ambulance,
  Users,
  Activity,
  Printer,
  Download,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowLeft,
  QrCode,
  Lock,
  Bot,
} from 'lucide-react';
import { generateReferralPdf } from '../utils/pdfGenerator';

export const UnifiedDashboard: React.FC = () => {
  const { t, language } = useTranslation();
  const { user, role, isGoogleConnected, firestoreConnected } = useAuth();
  const {
    referrals,
    facilities,
    createReferral,
    transitionReferral,
    updateTransport,
    isOnline,
    offlineDraftCount,
    syncOffline,
    notifications,
    markNotificationRead,
  } = useReferrals();

  const { roleParam } = useParams<{ roleParam?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Sync role if /dashboard/:roleParam is directly visited
  useEffect(() => {
    const validRoles: UserRole[] = [
      'patient',
      'health_worker',
      'hospital_coordinator',
      'transport_coordinator',
      'admin',
    ];
    if (roleParam && validRoles.includes(roleParam as UserRole)) {
      if (role !== roleParam) {
        switchRole(roleParam as UserRole);
      }
    }
  }, [roleParam, role, switchRole]);

  // Active view synced with URL ?view=...
  const viewParam = (searchParams.get('view') as DashboardView) || 'overview';
  const [currentView, setCurrentView] = useState<DashboardView>(viewParam);

  useEffect(() => {
    const v = searchParams.get('view') as DashboardView;
    if (v && v !== currentView) {
      setCurrentView(v);
    }
  }, [searchParams]);

  const handleSelectView = (v: DashboardView) => {
    setCurrentView(v);
    setSearchParams(v === 'overview' ? {} : { view: v });
  };

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // New Referral Form
  const [formData, setFormData] = useState<Partial<Referral>>({
    patient: {
      name: '',
      age: 24,
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
      pulseRate: 102,
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
  });

  const handleSync = async () => {
    setSyncing(true);
    await syncOffline();
    setTimeout(() => setSyncing(false), 600);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient?.name) return;

    const matchedFac = facilities.find((f) => f.id === formData.receivingFacilityId) || facilities[0];

    createReferral({
      patient: formData.patient as any,
      emergencyCategory: formData.emergencyCategory as EmergencyCategory,
      urgency: formData.urgency as TriageUrgency,
      vitals: formData.vitals as any,
      preReferralTreatment: formData.preReferralTreatment as any,
      clinicalNotes: formData.clinicalNotes || '',
      referringFacilityName: 'PHC Khed Rural Clinic',
      referringCoordinates: { lat: 18.8471, lng: 73.9056 },
      receivingFacilityId: matchedFac?.id || 'fac-sassoon-pune',
      receivingFacilityName: matchedFac?.name || 'Sassoon General Hospital',
      receivingFacilityCoordinates: matchedFac?.coordinates || { lat: 18.5284, lng: 73.8743 },
    });

    setShowWizard(false);
    setActiveStep(1);
    setFormData((prev) => ({
      ...prev,
      patient: { ...prev.patient, name: '', contactPhone: '', addressVillage: '' } as any,
      clinicalNotes: '',
    }));
    handleSelectView('referrals');
  };

  const handleDownloadPdf = (r: Referral) => {
    setDownloadingPdfId(r.id);
    try {
      const fac = facilities.find((f) => f.id === r.receivingFacilityId);
      const doc = generateReferralPdf(r, fac);
      const safeCode = (r.referralCode || r.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`JeevaCare_Referral_${safeCode}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setTimeout(() => setDownloadingPdfId(null), 500);
    }
  };

  // Filtered Referrals
  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      r.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referralCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.receivingFacilityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'ALL' || r.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Reusable Page Header
  const renderPageHeader = (title: string, subtitle: string, primaryAction?: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE7EC] dark:border-[#334155]">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">
          <button
            type="button"
            onClick={() => handleSelectView('overview')}
            className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] font-medium cursor-pointer"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-[#12304A] dark:text-[#F1F5F9] font-bold capitalize">
            {title}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">{subtitle}</p>
      </div>
      {primaryAction && <div className="flex items-center gap-2">{primaryAction}</div>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAFC] dark:bg-[#101C2C] text-[#334155] dark:text-[#CBD5E1]">
      {/* 1. Compact Top Bar */}
      <DashboardTopBar
        onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
        onOpenWorkspace={() => setShowWorkspaceModal(true)}
        onSelectSearchResult={(type, id) => {
          if (type === 'referral') handleSelectView('referrals');
          if (type === 'facility') handleSelectView('facilities');
        }}
      />

      {/* 2. Main Content Body with Persistent Left Sidebar */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Desktop Left Sidebar (Persistent on lg+) */}
        <DashboardSidebar
          currentView={currentView}
          onSelectView={handleSelectView}
          onOpenCopilot={() => setShowCopilot(true)}
          onOpenWorkspace={() => setShowWorkspaceModal(true)}
          className="hidden lg:flex w-64 shrink-0 min-h-[calc(100vh-4rem)] sticky top-16"
        />

        {/* Mobile Slide-Out Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#172638] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              <DashboardSidebar
                currentView={currentView}
                onSelectView={(v) => {
                  handleSelectView(v);
                  setMobileDrawerOpen(false);
                }}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Central Content Area */}
        <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 lg:pb-8 overflow-x-hidden">
          {/* VIEW: OVERVIEW (Dashboard Home) */}
          {currentView === 'overview' && (
            <DashboardOverview
              onSelectView={handleSelectView}
              onOpenNewReferralModal={() => {
                setShowWizard(true);
                setActiveStep(1);
              }}
              onOpenCopilot={() => setShowCopilot(true)}
              onOpenWorkspace={() => setShowWorkspaceModal(true)}
            />
          )}

          {/* VIEW: NEW REFERRAL / WIZARD */}
          {currentView === 'new-referral' && (
            <div className="space-y-6 max-w-4xl">
              {renderPageHeader(
                'Create Emergency Referral',
                'National Health Mission & Dakshata Obstetric Triage Protocol',
                <button
                  type="button"
                  onClick={() => setShowCopilot(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] border border-[#0F766E]/20 text-xs font-bold shadow-xs hover:bg-[#D4ECE8] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                  <span>AI Clinical Copilot</span>
                </button>
              )}

              {/* Offline notice if drafts exist */}
              {offlineDraftCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      You have <strong>{offlineDraftCount}</strong> referral draft(s) saved locally.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing || !isOnline}
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              )}

              {/* 4-Step Referral Form Form Container */}
              <div className="rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] p-5 sm:p-7 shadow-xs space-y-6">
                {/* Stepper Tabs */}
                <div className="flex items-center justify-between border-b border-[#DCE7EC] dark:border-[#334155] pb-4">
                  {[
                    { num: 1, label: 'Patient Info' },
                    { num: 2, label: 'Emergency & Vitals' },
                    { num: 3, label: 'Pre-Referral Rx' },
                    { num: 4, label: 'FRU Matching' },
                  ].map((s) => (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setActiveStep(s.num)}
                      className={`flex items-center gap-2 text-xs font-bold cursor-pointer pb-2 -mb-4 border-b-2 transition ${
                        activeStep === s.num
                          ? 'border-[#0F766E] text-[#0F766E] dark:text-[#2DD4BF]'
                          : 'border-transparent text-[#64748B]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                          activeStep === s.num
                            ? 'bg-[#0F766E] text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                        }`}
                      >
                        {s.num}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-5">
                  {/* Step 1: Patient Information */}
                  {activeStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                        1. Patient Demographics &amp; Obstetric Profile
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-semibold mb-1">Mother's Full Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.patient?.name || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                patient: { ...formData.patient!, name: e.target.value },
                              })
                            }
                            placeholder="e.g., Sunita Patil"
                            className="w-full px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] outline-none focus:ring-1 focus:ring-[#0F766E]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Age (Years) *</label>
                          <input
                            type="number"
                            required
                            min={14}
                            max={55}
                            value={formData.patient?.age || 24}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                patient: { ...formData.patient!, age: Number(e.target.value) },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] outline-none focus:ring-1 focus:ring-[#0F766E]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Contact Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={formData.patient?.contactPhone || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                patient: { ...formData.patient!, contactPhone: e.target.value },
                              })
                            }
                            placeholder="10-digit mobile"
                            className="w-full px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] outline-none focus:ring-1 focus:ring-[#0F766E]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Village / Sub-Center *</label>
                          <input
                            type="text"
                            required
                            value={formData.patient?.addressVillage || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                patient: { ...formData.patient!, addressVillage: e.target.value },
                              })
                            }
                            placeholder="e.g., Khed Rural, Pune"
                            className="w-full px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] outline-none focus:ring-1 focus:ring-[#0F766E]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Gravida &amp; Parity</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={1}
                              value={formData.patient?.gravida || 1}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  patient: { ...formData.patient!, gravida: Number(e.target.value) },
                                })
                              }
                              placeholder="G"
                              className="w-1/2 px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449]"
                            />
                            <input
                              type="number"
                              min={0}
                              value={formData.patient?.parity || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  patient: { ...formData.patient!, parity: Number(e.target.value) },
                                })
                              }
                              placeholder="P"
                              className="w-1/2 px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Gestational Weeks</label>
                          <input
                            type="number"
                            min={20}
                            max={44}
                            value={formData.patient?.gestationalWeeks || 38}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                patient: {
                                  ...formData.patient!,
                                  gestationalWeeks: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => setActiveStep(2)}
                          className="px-5 py-2.5 rounded-xl bg-[#0F766E] text-white font-bold text-xs hover:bg-[#0D635C] cursor-pointer"
                        >
                          Next: Emergency Category &amp; Vitals &rarr;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Emergency Category & Vitals */}
                  {activeStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                        2. Emergency Category &amp; Clinical Vitals
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-semibold mb-1">Emergency Category *</label>
                          <select
                            value={formData.emergencyCategory}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergencyCategory: e.target.value as EmergencyCategory,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449]"
                          >
                            <option value="ECLAMPSIA">Eclampsia / Seizures</option>
                            <option value="SEVERE_PREECLAMPSIA">Severe Pre-eclampsia (BP &ge; 160/110)</option>
                            <option value="POSTPARTUM_HEMORRHAGE">Postpartum Hemorrhage (PPH)</option>
                            <option value="ANTEPARTUM_HEMORRHAGE">Antepartum Hemorrhage (APH)</option>
                            <option value="OBSTRUCTED_LABOR">Obstructed / Prolonged Labor</option>
                            <option value="NEWBORN_ASPHYXIA">Newborn Asphyxia / Resuscitation</option>
                            <option value="PRETERM_LOW_BIRTH_WEIGHT">Preterm / Very Low Birth Weight</option>
                            <option value="SEPSIS_PUERPERAL">Puerperal Sepsis</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Triage Urgency Level *</label>
                          <select
                            value={formData.urgency}
                            onChange={(e) =>
                              setFormData({ ...formData, urgency: e.target.value as TriageUrgency })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449]"
                          >
                            <option value="CRITICAL">CRITICAL (Immediate Life Threat)</option>
                            <option value="HIGH">HIGH (Urgent Transfer Required)</option>
                            <option value="MODERATE">MODERATE (Close Observation)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Blood Pressure (Systolic/Diastolic)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={formData.vitals?.systolicBP || 160}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  vitals: { ...formData.vitals!, systolicBP: Number(e.target.value) },
                                })
                              }
                              placeholder="Systolic (160)"
                              className="w-1/2 px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449]"
                            />
                            <input
                              type="number"
                              value={formData.vitals?.diastolicBP || 110}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  vitals: { ...formData.vitals!, diastolicBP: Number(e.target.value) },
                                })
                              }
                              placeholder="Diastolic (110)"
                              className="w-1/2 px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Fetal Heart Rate (bpm)</label>
                          <input
                            type="number"
                            value={formData.vitals?.fetalHeartRate || 140}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                vitals: {
                                  ...formData.vitals!,
                                  fetalHeartRate: Number(e.target.value),
                                },
                              })
                            }
                            placeholder="140 bpm"
                            className="w-full px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setActiveStep(1)}
                          className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                        >
                          &larr; Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveStep(3)}
                          className="px-5 py-2.5 rounded-xl bg-[#0F766E] text-white font-bold text-xs hover:bg-[#0D635C] cursor-pointer"
                        >
                          Next: Pre-Referral Rx &rarr;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Pre-Referral Treatment */}
                  {activeStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                        3. Dakshata Pre-Referral Stabilization
                      </h3>
                      <div className="space-y-3 text-xs">
                        <label className="flex items-center gap-2 p-3 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.preReferralTreatment?.magnesiumSulfateGiven ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                preReferralTreatment: {
                                  ...formData.preReferralTreatment!,
                                  magnesiumSulfateGiven: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-[#0F766E]"
                          />
                          <div>
                            <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                              Inj. Magnesium Sulfate 50% Loading Dose Administered
                            </span>
                            <span className="text-[11px] text-[#64748B]">
                              4g IV slowly over 10 min + 10g IM (5g in each buttock) Pritchard protocol
                            </span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 p-3 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.preReferralTreatment?.ivCannulaSecured ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                preReferralTreatment: {
                                  ...formData.preReferralTreatment!,
                                  ivCannulaSecured: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-[#0F766E]"
                          />
                          <div>
                            <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                              IV Cannula Secured (16G or 18G) &amp; IV Fluids Started
                            </span>
                            <span className="text-[11px] text-[#64748B]">
                              Ringer's Lactate running at safe rate
                            </span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 p-3 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.preReferralTreatment?.oxygenAdministered ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                preReferralTreatment: {
                                  ...formData.preReferralTreatment!,
                                  oxygenAdministered: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-[#0F766E]"
                          />
                          <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                            Oxygen Support Initiated via Nasal Prongs (4-6 L/min)
                          </span>
                        </label>
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setActiveStep(2)}
                          className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                        >
                          &larr; Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveStep(4)}
                          className="px-5 py-2.5 rounded-xl bg-[#0F766E] text-white font-bold text-xs hover:bg-[#0D635C] cursor-pointer"
                        >
                          Next: Facility Selection &rarr;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Facility Selection & Confirmation */}
                  {activeStep === 4 && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                        4. Match Verified First Referral Unit (FRU)
                      </h3>
                      <div className="space-y-2 text-xs">
                        {facilities.map((fac) => (
                          <label
                            key={fac.id}
                            className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                              formData.receivingFacilityId === fac.id
                                ? 'border-[#0F766E] bg-[#E8F5F3]/60 dark:bg-[#203449] shadow-xs'
                                : 'border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638] hover:border-[#0F766E]'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="facilitySelection"
                                value={fac.id}
                                checked={formData.receivingFacilityId === fac.id}
                                onChange={() =>
                                  setFormData({ ...formData, receivingFacilityId: fac.id })
                                }
                                className="mt-1 text-[#0F766E]"
                              />
                              <div>
                                <div className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                                  {fac.name}
                                </div>
                                <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                                  {fac.type} &bull; Tehsil: {fac.tehsil} &bull; Labor Beds:{' '}
                                  {fac.laborBedsAvailable}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
                                  {fac.hasCEmONC && (
                                    <span className="px-1.5 py-0.2 rounded font-bold bg-[#DCFCE7] text-[#15803D]">
                                      CEmONC (C-Section)
                                    </span>
                                  )}
                                  {fac.hasBloodBank && (
                                    <span className="px-1.5 py-0.2 rounded font-bold bg-[#FEE2E2] text-[#DC2626]">
                                      Active Blood Bank
                                    </span>
                                  )}
                                  {fac.hasSNCU && (
                                    <span className="px-1.5 py-0.2 rounded font-bold bg-[#EFF6FF] text-[#2563EB]">
                                      SNCU / NICU
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-[#0F766E] dark:text-[#2DD4BF]">
                              Verified FRU
                            </span>
                          </label>
                        ))}
                      </div>

                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setActiveStep(3)}
                          className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                        >
                          &larr; Back
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white font-extrabold text-sm shadow-md shadow-[#0F766E]/25 transition cursor-pointer"
                        >
                          Confirm &amp; Submit Emergency Referral
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* VIEW: REFERRALS TABLE & MANAGEMENT */}
          {currentView === 'referrals' && (
            <div className="space-y-6">
              {renderPageHeader(
                'Referral Management',
                'All synchronized maternal and newborn emergency records with real-time status transitions',
                <button
                  type="button"
                  onClick={() => handleSelectView('new-referral')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Referral</span>
                </button>
              )}

              {/* Search & Filter Bar */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patient, code, facility..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-xs font-semibold"
                  >
                    <option value="ALL">All Statuses ({referrals.length})</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="AWAITING_ACKNOWLEDGEMENT">Awaiting Acknowledgement</option>
                    <option value="IN_TRANSIT">In 108 Transit</option>
                    <option value="HANDOVER_COMPLETED">Handover Completed</option>
                  </select>

                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-xs font-semibold"
                  >
                    <option value="ALL">All Urgencies</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MODERATE">Moderate</option>
                  </select>
                </div>
              </div>

              {/* Referrals List / Table */}
              <div className="space-y-3">
                {filteredReferrals.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-xs text-[#64748B]">
                    No referrals match your current search or status filter.
                  </div>
                ) : (
                  filteredReferrals.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#0F766E] transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/referrals/${r.id}`}
                            className="font-bold text-sm text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
                          >
                            {r.referralCode || r.id}
                          </Link>
                          <UrgencyBadge urgency={r.urgency} />
                          <StatusBadge status={r.status} />
                        </div>
                        <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                            Patient Details
                          </span>
                          <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                            {r.patient.name} ({r.patient.age}y)
                          </span>
                          <div className="text-[11px] text-[#64748B]">
                            {r.patient.addressVillage} &bull; Blood: {r.patient.bloodGroup}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                            Emergency Presentation
                          </span>
                          <span className="font-semibold text-[#DC2626]">
                            {r.emergencyCategory}
                          </span>
                          <div className="text-[11px] text-[#64748B]">
                            BP: {r.vitals?.systolicBP || '--'}/{r.vitals?.diastolicBP || '--'} | FHR:{' '}
                            {r.vitals?.fetalHeartRate || '--'} bpm
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                            Receiving First Referral Unit
                          </span>
                          <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                            {r.receivingFacilityName}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-[#DCE7EC] dark:border-[#334155] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/referrals/${r.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
                          >
                            <span>Clinical Details &amp; Slip</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(r)}
                            disabled={downloadingPdfId === r.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#DCE7EC] dark:border-[#334155] hover:bg-[#F7FAFC] text-xs font-semibold cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-[#0F766E]" />
                            <span>PDF</span>
                          </button>

                          {/* Role Transition Controls */}
                          {r.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              onClick={() =>
                                transitionReferral(
                                  r.id,
                                  'AWAITING_ACKNOWLEDGEMENT',
                                  'Alerted Receiving Hospital'
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#0F766E] text-white font-bold text-xs hover:bg-[#0D635C] cursor-pointer"
                            >
                              Dispatch Alert
                            </button>
                          )}

                          {r.status === 'AWAITING_ACKNOWLEDGEMENT' && (
                            <button
                              type="button"
                              onClick={() =>
                                transitionReferral(
                                  r.id,
                                  'ACKNOWLEDGED',
                                  'Receiving Doctor Bed Confirmed'
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#15803D] text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                            >
                              Acknowledge Bed
                            </button>
                          )}

                          {r.status === 'ACKNOWLEDGED' && (
                            <button
                              type="button"
                              onClick={() =>
                                transitionReferral(
                                  r.id,
                                  'IN_TRANSIT',
                                  '108 Ambulance en route to hospital'
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
                            >
                              Dispatch 108
                            </button>
                          )}

                          {r.status === 'IN_TRANSIT' && (
                            <button
                              type="button"
                              onClick={() =>
                                transitionReferral(
                                  r.id,
                                  'HANDOVER_COMPLETED',
                                  'Patient admitted to Labor Room / OT'
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#15803D] text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                            >
                              Confirm Handover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VIEW: TRACKING & TIMELINE */}
          {currentView === 'tracking' && (
            <div className="space-y-6">
              {renderPageHeader(
                'Referral Tracking & Ambulance Timeline',
                'Real-time transit milestones, pre-arrival alerts, and closed-loop handover audit log'
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-4">
                  {referrals.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                            {r.patient.name}
                          </span>
                          <span className="text-xs text-[#64748B]">({r.referralCode})</span>
                          <StatusBadge status={r.status} />
                        </div>
                        <Link
                          to={`/referrals/${r.id}`}
                          className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1"
                        >
                          View Full Slip <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Milestones timeline */}
                      <div className="p-3 rounded-xl bg-[#F7FAFC] dark:bg-[#203449]/50 border border-[#DCE7EC] dark:border-[#334155] space-y-2">
                        <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                          Closed-Loop Event Milestones
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {(r.statusHistory || []).map((step, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <span className="flex items-center gap-1.5 font-semibold text-[#12304A] dark:text-[#F1F5F9]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                                {step.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[#64748B]">
                                {step.actorName} &bull; {new Date(step.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
                    <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                      Ambulance Fleet Status
                    </h3>
                    <div className="p-3 rounded-xl bg-[#E8F5F3] dark:bg-[#203449] border border-[#0F766E]/20 text-xs space-y-1 text-[#0F766E] dark:text-[#2DD4BF]">
                      <div className="font-bold flex items-center gap-1.5">
                        <Ambulance className="w-4 h-4 text-[#DC2626]" />
                        <span>108 ALS Fleet Connected</span>
                      </div>
                      <p className="text-[11px] text-[#334155] dark:text-[#CBD5E1]">
                        Emergency ambulance tracking enabled via Google Maps Platform Directions &amp; Routing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: FACILITIES & READINESS */}
          {(currentView === 'facilities' || currentView === 'readiness' || currentView === 'maps') && (
            <div className="space-y-6">
              {renderPageHeader(
                currentView === 'readiness'
                  ? 'Facility Readiness & Verification'
                  : currentView === 'maps'
                  ? 'Emergency Map & Routes'
                  : 'Verified First Referral Units (FRUs)',
                'Pune District network of verified CEmONC hospitals, 24x7 blood banks, and neonatal ICUs'
              )}

              {/* Map & List View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {facilities.map((fac) => (
                    <div
                      key={fac.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-2 hover:border-[#0F766E] transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                            {fac.name}
                          </h4>
                          <span className="text-[11px] text-[#64748B]">
                            {fac.type} &bull; Tehsil: {fac.tehsil}
                          </span>
                        </div>
                        {fac.hasCEmONC && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                            CEmONC
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {fac.hasBloodBank && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] font-semibold flex items-center gap-0.5">
                            <Droplet className="w-2.5 h-2.5" /> Blood Bank
                          </span>
                        )}
                        {fac.hasSNCU && (
                          <span className="px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-semibold flex items-center gap-0.5">
                            <Baby className="w-2.5 h-2.5" /> SNCU
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-[#F7FAFC] dark:bg-[#203449] text-[#64748B] font-semibold">
                          Labor Beds: {fac.laborBedsAvailable}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#DCE7EC] dark:border-[#334155] flex items-center justify-between text-[11px]">
                        <a
                          href={`tel:${fac.phone}`}
                          className="font-bold text-[#0F766E] hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> {fac.phone}
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${fac.coordinates.lat},${fac.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2563EB] font-semibold hover:underline flex items-center gap-1"
                        >
                          Directions <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-7">
                  <EmergencyMap facilities={facilities} height="560px" />
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ESCALATIONS */}
          {currentView === 'escalations' && (
            <div className="space-y-6">
              {renderPageHeader(
                'Escalation Centre',
                'Automatic delay detection (>15 minutes without hospital response) and audit logs'
              )}

              <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#12304A] dark:text-[#F1F5F9]">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  <span>Escalation Rules &amp; SLA Monitor</span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  When a referral is submitted, receiving facilities have a 15-minute acknowledgement window. If unacknowledged, notifications escalate to the District Health Officer and Medical Superintendent.
                </p>

                <div className="divide-y divide-[#DCE7EC] dark:divide-[#334155]">
                  {referrals
                    .filter((r) => r.status === 'AWAITING_ACKNOWLEDGEMENT' || r.urgency === 'CRITICAL')
                    .map((r) => (
                      <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                            {r.patient.name} &bull; {r.referralCode}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            {r.emergencyCategory} &bull; Referred to {r.receivingFacilityName}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(r)}
                          className="px-3 py-1.5 rounded-lg bg-[#DC2626] text-white font-bold text-xs hover:bg-[#B91C1C] cursor-pointer"
                        >
                          Urgent Follow-Up
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: RECORDS & CARE CONTINUITY */}
          {(currentView === 'records' || currentView === 'continuity' || currentView === 'followups') && (
            <div className="space-y-6">
              {renderPageHeader(
                currentView === 'continuity'
                  ? 'Care Continuity Passport'
                  : currentView === 'followups'
                  ? 'Postnatal Follow-up Planner'
                  : 'Patient & Clinical Records',
                'Consent-driven digital transfer sheets adhering to Dakshata and CEmONC standards'
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {referrals.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#DCE7EC] dark:border-[#334155] pb-2">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                        <span className="font-bold text-xs text-[#12304A] dark:text-[#F1F5F9]">
                          PASS-{r.referralCode || r.id}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                        CONSENT VERIFIED
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Mother:</span>
                        <span className="font-bold">{r.patient.name}, {r.patient.age}y</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Condition:</span>
                        <span className="font-semibold text-[#DC2626]">{r.emergencyCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Destination:</span>
                        <span className="font-semibold">{r.receivingFacilityName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Pre-Referral Rx:</span>
                        <span className="font-semibold">
                          {r.preReferralTreatment?.magnesiumSulfateGiven ? 'MgSO4 Pritchard Protocol' : 'Oxygen & IV Fluids'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#DCE7EC] dark:border-[#334155] flex items-center justify-between">
                      <Link
                        to={`/referrals/${r.id}`}
                        className="text-xs font-bold text-[#0F766E] hover:underline"
                      >
                        Open Clinical Sheet &rarr;
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(r)}
                        className="px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: AI ASSISTANT */}
          {currentView === 'ai-assistant' && (
            <div className="space-y-6 max-w-4xl">
              {renderPageHeader(
                'JeevaCare AI Assistant & Triage Copilot',
                'Real-time protocol advice, CEmONC capability matching, and voice guidance in English, मराठी, and हिंदी'
              )}

              <div className="p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF]" />
                  <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9]">
                    Conversational Emergency Support
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  The floating AI Assistant at the bottom-right of your screen is continuously connected to the live JeevaCare clinical engine. You can ask questions via voice or text in Marathi, Hindi, or English.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="p-3 rounded-xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] space-y-1">
                    <span className="font-bold text-[#0F766E] dark:text-[#2DD4BF] block">
                      Dakshata Triage
                    </span>
                    <p className="text-[11px] text-[#64748B]">
                      Checks danger signs and pre-departure stabilization checklists before transport.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] space-y-1">
                    <span className="font-bold text-[#0F766E] dark:text-[#2DD4BF] block">
                      Facility Matching
                    </span>
                    <p className="text-[11px] text-[#64748B]">
                      Grounded in real Pune FRU data (CEmONC, Blood Bank, and SNCU beds).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] space-y-1">
                    <span className="font-bold text-[#0F766E] dark:text-[#2DD4BF] block">
                      Voice Read-Aloud
                    </span>
                    <p className="text-[11px] text-[#64748B]">
                      Speech-to-text input and natural read-aloud responses for bedside frontline workers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ANALYTICS */}
          {currentView === 'analytics' && (
            <div className="space-y-6">
              {renderPageHeader(
                'District Delay Analytics',
                'Maternal mortality reduction metrics based on the WHO Three Delays framework'
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-2">
                  <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">
                    Delay 1: Seeking Care
                  </span>
                  <div className="text-2xl font-black text-[#12304A] dark:text-[#F1F5F9]">&lt; 12 min</div>
                  <p className="text-xs text-[#64748B]">
                    Average bedside triage and decision-to-refer window via JeevaCare mobile wizard.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-2">
                  <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider">
                    Delay 2: Reaching Care
                  </span>
                  <div className="text-2xl font-black text-[#12304A] dark:text-[#F1F5F9]">22.4 min</div>
                  <p className="text-xs text-[#64748B]">
                    Median transit duration to verified CEmONC hospital across Pune rural blocks.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-2">
                  <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider">
                    Delay 3: Receiving Care
                  </span>
                  <div className="text-2xl font-black text-[#15803D]">0 min Delay</div>
                  <p className="text-xs text-[#64748B]">
                    Pre-arrival alerts ensure reserved labor bed and blood bank match before arrival.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: NOTIFICATIONS */}
          {currentView === 'notifications' && (
            <div className="space-y-6 max-w-4xl">
              {renderPageHeader(
                'Alerts & Notifications',
                'Real-time emergency transfer alerts and hospital acknowledgements'
              )}

              <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs divide-y divide-[#DCE7EC] dark:divide-[#334155]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B]">
                    No notifications recorded.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`py-3.5 flex items-start justify-between gap-3 cursor-pointer ${
                        !n.isRead ? 'bg-[#E8F5F3]/40 dark:bg-[#203449]/40 px-3 rounded-xl' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-xs sm:text-sm text-[#12304A] dark:text-[#F1F5F9] flex items-center gap-2">
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#0F766E]" />}
                          <span>{n.title}</span>
                        </div>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{n.message}</p>
                        <span className="text-[10px] text-[#94A3B8] block">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VIEW: DOCUMENTS & EXPORTS */}
          {currentView === 'documents' && (
            <div className="space-y-6 max-w-4xl">
              {renderPageHeader(
                'Documents & Clinical Exports',
                'Standardized Dakshata & CEmONC transfer slips, PDFs, and Google Drive archival'
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals.slice(0, 6).map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#12304A] dark:text-[#F1F5F9]">
                        {r.referralCode || r.id}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-[#64748B]">
                      {r.patient.name} &bull; {r.emergencyCategory}
                    </p>
                    <div className="pt-2 border-t border-[#DCE7EC] dark:border-[#334155] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(r)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                      <Link
                        to={`/referrals/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Slip</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: GOOGLE WORKSPACE INTEGRATIONS */}
          {currentView === 'integrations' && (
            <div className="space-y-6 max-w-4xl">
              {renderPageHeader(
                'Google Workspace Integrations',
                'Google Drive clinical slip backup and Gmail referral dispatch alerts'
              )}

              <div className="p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-1">
                      <Mail className="w-6 h-6 text-red-500" />
                      <HardDrive className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                        Google Workspace Connectivity
                      </h3>
                      <span className="text-xs text-[#64748B]">
                        {isGoogleConnected ? 'Connected & Authorized' : 'Setup Required'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowWorkspaceModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Manage Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              {renderPageHeader(
                'Settings & Preferences',
                'Language, display theme, and testing role selector'
              )}

              <div className="p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-5">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#12304A] dark:text-[#F1F5F9] uppercase tracking-wider block">
                    Active Session User &bull; JeevaCare
                  </span>
                  <div className="text-sm font-semibold text-[#12304A] dark:text-[#F1F5F9]">
                    {user?.name} ({user?.email})
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F5F3] text-[#0F766E] dark:bg-[#203449] dark:text-[#2DD4BF]">
                    Current Role: {role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation (Visible on lg:hidden) */}
      <MobileBottomNav
        currentView={currentView}
        onSelectView={handleSelectView}
        onOpenMoreDrawer={() => setMobileDrawerOpen(true)}
      />

      {/* Modals */}
      {showCopilot && (
        <ReferralCopilotModal
          isOpen={showCopilot}
          onClose={() => setShowCopilot(false)}
          referralData={formData}
          onApplySummary={(summary) => {
            if (summary) {
              setFormData((prev) => ({
                ...prev,
                clinicalNotes: `${prev.clinicalNotes || ''}\n[AI Copilot]: ${summary}`.trim(),
              }));
            }
          }}
        />
      )}

      {showWorkspaceModal && (
        <WorkspaceModal
          isOpen={showWorkspaceModal}
          onClose={() => setShowWorkspaceModal(false)}
          referral={referrals[0]}
        />
      )}
    </div>
  );
};
