import React from 'react';
import { LayoutDashboard, FileText, Building2, Bell, Menu } from 'lucide-react';
import { DashboardView } from './DashboardSidebar';
import { useReferrals } from '../../context/ReferralContext';

interface MobileBottomNavProps {
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  onOpenMoreDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenMoreDrawer,
}) => {
  const { referrals, notifications } = useReferrals();

  const unreadAlerts = notifications.filter((n) => !n.isRead).length;
  const activeReferrals = referrals.filter(
    (r) => r.status === 'IN_TRANSIT' || r.status === 'AWAITING_ACKNOWLEDGEMENT' || r.status === 'SUBMITTED'
  ).length;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#172638]/95 backdrop-blur-md border-t border-[#DCE7EC] dark:border-[#334155] px-2 py-1 shadow-lg flex items-center justify-around select-none no-print"
      aria-label="Mobile Bottom Navigation"
    >
      {/* 1. Home / Overview */}
      <button
        type="button"
        onClick={() => onSelectView('overview')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition cursor-pointer ${
          currentView === 'overview'
            ? 'text-[#0F766E] dark:text-[#2DD4BF] font-bold'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#12304A]'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Home</span>
      </button>

      {/* 2. Referrals */}
      <button
        type="button"
        onClick={() => onSelectView('referrals')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition relative cursor-pointer ${
          currentView === 'referrals' || currentView === 'new-referral' || currentView === 'tracking'
            ? 'text-[#0F766E] dark:text-[#2DD4BF] font-bold'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#12304A]'
        }`}
      >
        <div className="relative">
          <FileText className="w-5 h-5" />
          {activeReferrals > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
          )}
        </div>
        <span className="text-[10px] mt-0.5">Referrals</span>
      </button>

      {/* 3. Facilities */}
      <button
        type="button"
        onClick={() => onSelectView('facilities')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition cursor-pointer ${
          currentView === 'facilities' || currentView === 'readiness' || currentView === 'maps'
            ? 'text-[#0F766E] dark:text-[#2DD4BF] font-bold'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#12304A]'
        }`}
      >
        <Building2 className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Facilities</span>
      </button>

      {/* 4. Alerts / Notifications */}
      <button
        type="button"
        onClick={() => onSelectView('notifications')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition relative cursor-pointer ${
          currentView === 'notifications'
            ? 'text-[#0F766E] dark:text-[#2DD4BF] font-bold'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#12304A]'
        }`}
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#DC2626] text-[8px] font-black text-white">
              {unreadAlerts}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Alerts</span>
      </button>

      {/* 5. More (Opens Category Drawer) */}
      <button
        type="button"
        onClick={onOpenMoreDrawer}
        className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#12304A] transition cursor-pointer"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">More</span>
      </button>
    </nav>
  );
};
