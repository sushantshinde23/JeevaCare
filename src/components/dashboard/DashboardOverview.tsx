import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useReferrals } from '../../context/ReferralContext';
import { DashboardView } from '../navigation/DashboardSidebar';
import {
  HeartPulse,
  PlusCircle,
  PhoneCall,
  Activity,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ambulance,
  Calendar,
  Users,
  ShieldCheck,
  Bot,
  BarChart3,
  Search,
  MapPin,
  HardDrive,
  Mail,
  Printer,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Mic,
  Settings,
  Bell,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface DashboardOverviewProps {
  onSelectView: (view: DashboardView) => void;
  onOpenNewReferralModal?: () => void;
  onOpenCopilot?: () => void;
  onOpenWorkspace?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectView,
  onOpenNewReferralModal,
  onOpenCopilot,
  onOpenWorkspace,
}) => {
  const { t, language } = useTranslation();
  const { user, role } = useAuth();
  const {
    referrals,
    facilities,
    offlineDraftCount,
    syncOffline,
    isOnline,
    transitionReferral,
  } = useReferrals();

  // Calculated Real Operational Metrics
  const activeReferrals = referrals.filter(
    (r) => r.status === 'IN_TRANSIT' || r.status === 'SUBMITTED' || r.status === 'AWAITING_ACKNOWLEDGEMENT'
  );
  const awaitingAck = referrals.filter(
    (r) => r.status === 'AWAITING_ACKNOWLEDGEMENT' || r.status === 'SUBMITTED'
  );
  const inTransit = referrals.filter((r) => r.status === 'IN_TRANSIT');
  const completedHandovers = referrals.filter(
    (r) => r.status === 'HANDOVER_COMPLETED' || r.status === 'CLOSED'
  );
  const verifiedCemoncCount = facilities.filter((f) => f.isVerified && f.hasCEmONC).length;
  const bloodBankCount = facilities.filter((f) => f.hasBloodBank || f.hasBloodStorage).length;

  // Real "Needs Attention" Items based on authorized role
  interface AttentionItem {
    id: string;
    title: string;
    desc: string;
    priority: 'CRITICAL' | 'WARNING' | 'INFO';
    view: DashboardView;
    referralId?: string;
  }

  const attentionItems: AttentionItem[] = [];

  // 1. Referrals awaiting hospital acknowledgement
  if (role === 'hospital_coordinator' || role === 'admin' || role === 'health_worker') {
    awaitingAck.forEach((r) => {
      attentionItems.push({
        id: `att-ack-${r.id}`,
        title: `Awaiting Acknowledgement: ${r.patient.name} (${r.referralCode || r.id})`,
        desc: `${r.emergencyCategory} referred to ${r.receivingFacilityName}. Urgency: ${r.urgency}. Pre-arrival prep needed.`,
        priority: r.urgency === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        view: 'referrals',
        referralId: r.id,
      });
    });
  }

  // 2. Active transit needing ETA / ambulance monitoring
  if (role === 'transport_coordinator' || role === 'admin' || role === 'hospital_coordinator') {
    inTransit.forEach((r) => {
      attentionItems.push({
        id: `att-transit-${r.id}`,
        title: `Active 108 Ambulance En Route: ${r.patient.name}`,
        desc: `Heading to ${r.receivingFacilityName}. Monitor GPS route & bed prep.`,
        priority: 'WARNING',
        view: 'tracking',
        referralId: r.id,
      });
    });
  }

  // 3. Offline draft backlog needing synchronization
  if (offlineDraftCount > 0 && (role === 'health_worker' || role === 'admin')) {
    attentionItems.push({
      id: 'att-offline-sync',
      title: `${offlineDraftCount} Offline Referral Draft${offlineDraftCount === 1 ? '' : 's'} Pending Sync`,
      desc: isOnline
        ? 'Network is available. Tap to synchronize pending emergency drafts to central server.'
        : 'Device is offline. Drafts are safely stored in local encrypted cache.',
      priority: isOnline ? 'WARNING' : 'INFO',
      view: 'new-referral',
    });
  }

  // Subtitle by role
  const roleSubtitles: Record<string, string> = {
    patient: 'Mother & Family Portal • Live Referral Tracking & Care Continuity',
    health_worker: 'Frontline ASHA / ANM Clinic • Pune Rural Triage & Emergency Referral Dispatch',
    hospital_coordinator: 'Receiving First Referral Unit (FRU) • Pre-Arrival Obstetric Triage Desk',
    transport_coordinator: 'Maharashtra 108 EMS Fleet • Emergency Dispatch & Transit Monitoring',
    admin: 'District Health Officer / CMO • Maternal Emergency Governance & Analytics',
  };

  const currentDateFormatted = new Date().toLocaleDateString(
    language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* 1. Welcome Header Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0F766E]/10 via-[#E8F5F3] to-white dark:from-[#172638] dark:via-[#203449] dark:to-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#15803D] animate-ping" />
            <span className="text-[11px] font-bold text-[#0F766E] dark:text-[#2DD4BF] uppercase tracking-wider">
              {currentDateFormatted}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
            Welcome back, {user?.name || 'Healthcare Worker'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
            {roleSubtitles[role] || 'Maternal & Newborn Emergency Coordination Dashboard'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Prominent Create Referral for Authorized Roles */}
          {(role === 'health_worker' || role === 'hospital_coordinator' || role === 'admin') && (
            <button
              type="button"
              onClick={() => {
                if (onOpenNewReferralModal) onOpenNewReferralModal();
                else onSelectView('new-referral');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0F766E]/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Emergency Referral</span>
            </button>
          )}

          {/* Quick-Access 108 Emergency Assistance */}
          <a
            href="tel:108"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#DC2626]/20 transition-all cursor-pointer"
            title="Immediate 108 Ambulance Hotline"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>108 Ambulance</span>
          </a>
        </div>
      </div>

      {/* 2. Operational Summary Cards (Real Database Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Active Referrals */}
        <div
          onClick={() => onSelectView('referrals')}
          className="p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#0F766E] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Active Referrals
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#12304A] dark:text-[#F1F5F9]">
            {activeReferrals.length}
          </div>
          <p className="mt-1 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
            {activeReferrals.length === 0
              ? 'No active cases in transit'
              : `${inTransit.length} in 108 transit`}
          </p>
        </div>

        {/* Card 2: Awaiting Acknowledgement */}
        <div
          onClick={() => onSelectView('escalations')}
          className="p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#D97706] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Awaiting Ack
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#D97706]">
            {awaitingAck.length}
          </div>
          <p className="mt-1 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
            {awaitingAck.length === 0
              ? 'All referrals acknowledged'
              : 'Requires hospital response'}
          </p>
        </div>

        {/* Card 3: Transport Requests */}
        <div
          onClick={() => onSelectView('tracking')}
          className="p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#DC2626] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              108 Transports
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[#DC2626] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Ambulance className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#12304A] dark:text-[#F1F5F9]">
            {inTransit.length}
          </div>
          <p className="mt-1 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
            {inTransit.length === 0 ? 'No ambulances currently en route' : 'Live Google Maps tracking'}
          </p>
        </div>

        {/* Card 4: Follow-ups / Completed Handovers */}
        <div
          onClick={() => onSelectView('followups')}
          className="p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#15803D] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Safe Handovers
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#15803D] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#15803D]">
            {completedHandovers.length}
          </div>
          <p className="mt-1 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
            {completedHandovers.length === 0 ? 'No completed cases yet' : 'Physician sign-off verified'}
          </p>
        </div>

        {/* Card 5: Verified Facilities */}
        <div
          onClick={() => onSelectView('facilities')}
          className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#0F766E] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Verified FRUs
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#12304A] dark:text-[#F1F5F9]">
            {facilities.length}
          </div>
          <p className="mt-1 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
            {verifiedCemoncCount} CEmONC &bull; {bloodBankCount} Blood Banks
          </p>
        </div>
      </div>

      {/* 3. Priority Action Section ("Needs Attention") */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#DCE7EC] dark:border-[#334155] pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <h2 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9] uppercase tracking-wider">
              Priority Actions &bull; Needs Attention
            </h2>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5F3] text-[#0F766E] dark:bg-[#203449] dark:text-[#2DD4BF]">
            {attentionItems.length} Pending
          </span>
        </div>

        {attentionItems.length === 0 ? (
          /* Reassuring Empty State */
          <div className="p-6 text-center rounded-xl bg-[#E8F5F3]/50 dark:bg-[#203449]/40 border border-[#0F766E]/20 space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#15803D]/10 text-[#15803D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#15803D] dark:text-[#2DD4BF]">
              All Systems Operational &amp; Clear
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
              No pending acknowledgements, delayed transports, or synchronization errors require your attention at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectView(item.view)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  item.priority === 'CRITICAL'
                    ? 'border-[#FCA5A5] bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 text-[#DC2626] hover:bg-[#FEE2E2]'
                    : item.priority === 'WARNING'
                    ? 'border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 text-[#D97706] hover:bg-amber-100/60'
                    : 'border-[#DCE7EC] bg-[#F7FAFC] dark:bg-[#203449]/60 text-[#12304A] hover:bg-[#E8F5F3]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    {item.priority === 'CRITICAL' ? (
                      <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0" />
                    ) : item.priority === 'WARNING' ? (
                      <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
                    ) : (
                      <Activity className="w-4 h-4 text-[#0F766E] shrink-0" />
                    )}
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-[#CBD5E1] line-clamp-1">
                    {item.desc}
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-xs font-bold text-[#12304A] dark:text-[#F1F5F9] shadow-2xs hover:bg-[#E8F5F3] shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Resolve</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Quick-Access Feature Grid (6 Groups) */}
      <div className="space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
            Central Platform Features &amp; Modules
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Direct 1-click access to all clinical, transport, and facility tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* GROUP 1: Emergency Care */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7EC] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center font-bold">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  Emergency Care
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#0F766E] uppercase">SOP</span>
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onSelectView('new-referral')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    New Emergency Referral
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    4-step Dakshata triage &amp; facility matching
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('tracking')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Referral Tracking
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Live status, pre-arrival alert &amp; milestones
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('facilities')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Smart Facility Navigator
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    CEmONC capability matching &amp; bed readiness
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* GROUP 2: Healthcare Network */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7EC] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  Healthcare Network
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#0F766E] uppercase">Verified</span>
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onSelectView('facilities')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Verified Facilities
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    First Referral Units directory in Pune district
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('readiness')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Facility Readiness &amp; Verification
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Active CEmONC, OT, and blood bank status
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('maps')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Maps &amp; Route Directions
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Google Maps Platform interactive navigation
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* GROUP 3: Coordination */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7EC] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[#DC2626] flex items-center justify-center font-bold">
                  <Ambulance className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  Coordination
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#DC2626] uppercase">108 Fleet</span>
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onSelectView('referrals')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Hospital Referral Inbox
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Incoming transfer alerts, accept or redirect
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('tracking')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Transport Coordination
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Ambulance assignment &amp; transit timestamps
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('escalations')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Escalation Centre
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Unresolved delays &gt;15 min auto-alerting
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* GROUP 4: Mother and Newborn Care */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7EC] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  Mother &amp; Newborn Care
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#15803D] uppercase">Dakshata</span>
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onSelectView('records')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Patient &amp; Care Records
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Maternal vitals, obstetric history &amp; treatments
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('followups')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Follow-up Planner
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Postnatal &amp; neonatal 7-day care schedule
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('continuity')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Care Continuity Summary
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Consent-based transfer slip &amp; QR verification
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* GROUP 5: Intelligence & AI */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7EC] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  Intelligence &amp; AI
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#0F766E] uppercase">Gemini</span>
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onSelectView('ai-assistant')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    JeevaCare AI Assistant
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Clinical protocols, voice queries &amp; FRU lookup
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenCopilot) onOpenCopilot();
                  else onSelectView('new-referral');
                }}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Referral Summaries Copilot
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Dakshata danger sign check &amp; pre-departure review
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('analytics')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    District Delay Analytics
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    The Three Delays model, transit times &amp; bottlenecks
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* GROUP 6: Tools and Settings */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE7EC] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center font-bold">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  Tools &amp; Settings
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase">System</span>
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onSelectView('documents')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Reports &amp; PDF Downloads
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Generate standardized Dakshata referral slips
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenWorkspace) onOpenWorkspace();
                  else onSelectView('integrations');
                }}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Google Drive &amp; Gmail
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Manage cloud archival and automated triage dispatch
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onSelectView('settings')}
                className="w-full p-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] bg-[#F7FAFC] dark:bg-[#203449]/40 flex items-center justify-between group transition cursor-pointer"
              >
                <div className="text-left">
                  <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block">
                    Language &amp; Theme Settings
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    English, मराठी, हिंदी &bull; Dark/Light display
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
