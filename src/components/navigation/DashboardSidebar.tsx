import React, { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useReferrals } from '../../context/ReferralContext';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  MapPin,
  Users,
  Calendar,
  ShieldCheck,
  Bot,
  BarChart3,
  Bell,
  HardDrive,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  PhoneCall,
  User as UserIcon,
  Stethoscope,
  Ambulance,
  HeartPulse,
} from 'lucide-react';
import { JeevaCareLogo } from '../common/JeevaCareLogo';

export type DashboardView =
  | 'overview'
  | 'new-referral'
  | 'referrals'
  | 'tracking'
  | 'escalations'
  | 'facilities'
  | 'readiness'
  | 'maps'
  | 'records'
  | 'followups'
  | 'continuity'
  | 'ai-assistant'
  | 'analytics'
  | 'notifications'
  | 'documents'
  | 'integrations'
  | 'settings';

interface DashboardSidebarProps {
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  onOpenCopilot?: () => void;
  onOpenWorkspace?: () => void;
  className?: string;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentView,
  onSelectView,
  onOpenCopilot,
  onOpenWorkspace,
  className = '',
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const { t, language } = useTranslation();
  const { user, role, switchRole } = useAuth();
  const { referrals, facilities, offlineDraftCount, notifications } = useReferrals();

  // Category collapse state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    overview: true,
    emergency: true,
    facility: true,
    care: true,
    intelligence: true,
    system: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Real data metrics for badges
  const awaitingAckCount = referrals.filter(
    (r) => r.status === 'AWAITING_ACKNOWLEDGEMENT' || r.status === 'SUBMITTED'
  ).length;
  const inTransitCount = referrals.filter((r) => r.status === 'IN_TRANSIT').length;
  const unreadAlertsCount = notifications.filter((n) => !n.isRead).length;

  const handleItemClick = (view: DashboardView) => {
    onSelectView(view);
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const roleConfigs: Record<
    UserRole,
    { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    patient: { label: 'Mother & Family', badge: 'Patient View', icon: UserIcon },
    health_worker: { label: 'ASHA / ANM Worker', badge: 'Frontline Triage', icon: Stethoscope },
    hospital_coordinator: { label: 'Receiving Hospital', badge: 'Triage Desk', icon: Building2 },
    transport_coordinator: { label: '108 Ambulance Dispatch', badge: 'EMS Fleet', icon: Ambulance },
    admin: { label: 'District Admin / CMO', badge: 'Governance', icon: Activity },
  };

  const currentRoleConfig = roleConfigs[role] || roleConfigs.health_worker;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-[#172638] border-r border-[#DCE7EC] dark:border-[#334155] select-none ${className}`}
    >
      {/* Brand & Identity Area in Sidebar */}
      <div className="p-4 border-b border-[#DCE7EC] dark:border-[#334155] flex items-center justify-between">
        <JeevaCareLogo variant="horizontal" size="sm" showTagline={false} />
        {isMobileDrawer && onCloseMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="p-1 rounded-lg text-[#64748B] hover:bg-[#F7FAFC] dark:hover:bg-[#203449] cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Badge & Quick Switcher */}
      <div className="px-4 py-3 bg-[#F7FAFC] dark:bg-[#203449]/40 border-b border-[#DCE7EC] dark:border-[#334155]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <RoleIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] block text-xs truncate">
                {user?.name || currentRoleConfig.label}
              </span>
              <span className="text-[10px] text-[#0F766E] dark:text-[#2DD4BF] font-semibold">
                {currentRoleConfig.badge}
              </span>
            </div>
          </div>
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] border border-[#0F766E]/20">
            {role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
        {/* GROUP 1: OVERVIEW */}
        <div>
          <button
            type="button"
            onClick={() => handleItemClick('overview')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition cursor-pointer ${
              currentView === 'overview'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#12304A] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard Home</span>
            </span>
          </button>
        </div>

        {/* GROUP 2: EMERGENCY OPERATIONS */}
        <div>
          <button
            type="button"
            onClick={() => toggleCategory('emergency')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:text-[#12304A]"
          >
            <span>Emergency Operations</span>
            {expandedCategories.emergency ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {expandedCategories.emergency && (
            <div className="mt-1 space-y-0.5 pl-1">
              {/* Authorized Create Referral */}
              {(role === 'health_worker' || role === 'hospital_coordinator' || role === 'admin') && (
                <button
                  type="button"
                  onClick={() => handleItemClick('new-referral')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                    currentView === 'new-referral'
                      ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                      : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" />
                    <span>Create Referral</span>
                  </span>
                  {offlineDraftCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-500 text-white">
                      {offlineDraftCount} draft{offlineDraftCount === 1 ? '' : 's'}
                    </span>
                  )}
                </button>
              )}

              {/* Referral Management */}
              <button
                type="button"
                onClick={() => handleItemClick('referrals')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'referrals'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Referral Management</span>
                </span>
                <span className="text-[10px] text-[#64748B] font-bold">{referrals.length}</span>
              </button>

              {/* Referral Tracking */}
              <button
                type="button"
                onClick={() => handleItemClick('tracking')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'tracking'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Live Tracking &amp; Timeline</span>
                </span>
                {inTransitCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#0F766E] text-white animate-pulse">
                    {inTransitCount} transit
                  </span>
                )}
              </button>

              {/* Escalations */}
              <button
                type="button"
                onClick={() => handleItemClick('escalations')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'escalations'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Escalation Centre</span>
                </span>
                {awaitingAckCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#DC2626] text-white">
                    {awaitingAckCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* GROUP 3: FACILITY NETWORK */}
        <div>
          <button
            type="button"
            onClick={() => toggleCategory('facility')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:text-[#12304A]"
          >
            <span>Facility Network</span>
            {expandedCategories.facility ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {expandedCategories.facility && (
            <div className="mt-1 space-y-0.5 pl-1">
              <button
                type="button"
                onClick={() => handleItemClick('facilities')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'facilities'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Verified First Referral Units</span>
                </span>
                <span className="text-[10px] text-[#64748B] font-bold">{facilities.length}</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('readiness')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'readiness'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Facility Readiness Monitor</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('maps')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'maps'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Emergency Map &amp; Routes</span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* GROUP 4: CARE MANAGEMENT */}
        <div>
          <button
            type="button"
            onClick={() => toggleCategory('care')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:text-[#12304A]"
          >
            <span>Care Management</span>
            {expandedCategories.care ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {expandedCategories.care && (
            <div className="mt-1 space-y-0.5 pl-1">
              <button
                type="button"
                onClick={() => handleItemClick('records')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'records'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Patient &amp; Clinical Records</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('followups')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'followups'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Postnatal Follow-up Planner</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('continuity')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'continuity'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" />
                  <span>Care Continuity Passport</span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* GROUP 5: INTELLIGENCE & AI */}
        <div>
          <button
            type="button"
            onClick={() => toggleCategory('intelligence')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:text-[#12304A]"
          >
            <span>Intelligence &amp; AI</span>
            {expandedCategories.intelligence ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {expandedCategories.intelligence && (
            <div className="mt-1 space-y-0.5 pl-1">
              <button
                type="button"
                onClick={() => handleItemClick('ai-assistant')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'ai-assistant'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" />
                  <span>JeevaCare AI Assistant</span>
                </span>
                <span className="text-[9px] px-1 rounded bg-[#0F766E]/15 text-[#0F766E] dark:text-[#2DD4BF] font-bold">
                  Live
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'analytics'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>District Delay Analytics</span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* GROUP 6: SYSTEM */}
        <div>
          <button
            type="button"
            onClick={() => toggleCategory('system')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:text-[#12304A]"
          >
            <span>System &amp; Tools</span>
            {expandedCategories.system ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {expandedCategories.system && (
            <div className="mt-1 space-y-0.5 pl-1">
              <button
                type="button"
                onClick={() => handleItemClick('notifications')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'notifications'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Alerts &amp; Notifications</span>
                </span>
                {unreadAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#DC2626] text-white">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('documents')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'documents'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Documents &amp; Exports</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('integrations')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'integrations'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Google Drive &amp; Gmail</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick('settings')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${
                  currentView === 'settings'
                    ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                    : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings &amp; Roles</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Emergency 108 Footer Strip in Sidebar */}
      <div className="p-3 bg-[#DC2626]/10 border-t border-[#DC2626]/20">
        <a
          href="tel:108"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-md shadow-[#DC2626]/20 transition-all cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
          <span>108 Emergency Hotline</span>
        </a>
      </div>
    </aside>
  );
};
