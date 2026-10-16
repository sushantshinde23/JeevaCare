import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useReferrals } from '../../context/ReferralContext';
import { LanguageCode } from '../../i18n/translations';
import { UserRole } from '../../types';
import {
  HeartPulse,
  Languages,
  Sun,
  Moon,
  Monitor,
  User as UserIcon,
  Bell,
  LogOut,
  ChevronDown,
  PhoneCall,
  ShieldCheck,
  Check,
  Building2,
  Ambulance,
  Stethoscope,
  Activity,
  X,
  Mail,
  HardDrive,
  Menu,
  Layers,
} from 'lucide-react';
import { WorkspaceModal } from '../workspace/WorkspaceModal';
import { JeevaCareLogo } from './JeevaCareLogo';

type OpenMenu = 'none' | 'language' | 'theme' | 'profile' | 'notifications' | 'roleSwitch' | 'mobileMenu';

export const Navbar: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const {
    user,
    role,
    isAuthenticated,
    logout,
    switchRole,
    isGoogleConnected,
    updateUserPreferences,
  } = useAuth();
  const { notifications, markNotificationRead } = useReferrals();
  const navigate = useNavigate();
  const location = useLocation();

  // Mutually exclusive single state controller
  const [openMenu, setOpenMenu] = useState<OpenMenu>('none');
  const [show108Modal, setShow108Modal] = useState<boolean>(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState<boolean>(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setOpenMenu('none');
  }, [location.pathname]);

  // Close menus on click outside & Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu('none');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu('none');
        setShow108Modal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleMenu = (target: OpenMenu) => {
    setOpenMenu((current) => (current === target ? 'none' : target));
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang);
    updateUserPreferences({ language: lang });
    setOpenMenu('none');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    updateUserPreferences({ theme: newTheme });
    setOpenMenu('none');
  };

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    setOpenMenu('none');
    navigate(`/dashboard/${newRole}`);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const roleLabels: Record<UserRole, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    patient: { label: 'Mother & Family', icon: UserIcon },
    health_worker: { label: 'ASHA / ANM Worker', icon: Stethoscope },
    hospital_coordinator: { label: 'Receiving Hospital', icon: Building2 },
    transport_coordinator: { label: '108 Transport Fleet', icon: Ambulance },
    admin: { label: 'District Admin / CMO', icon: Activity },
  };

  // On authenticated dashboard routes, the dedicated DashboardTopBar + DashboardSidebar takes over
  if (location.pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <>
      <header
        ref={navRef}
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#172638]/95 backdrop-blur-md border-b border-[#DCE7EC] dark:border-[#334155] transition-colors shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <JeevaCareLogo variant="horizontal" size="md" showTagline={false} />
              </Link>
            </div>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-[#334155] dark:text-[#CBD5E1]">
              <Link
                to="/"
                className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] transition-colors"
              >
                {t('nav.home')}
              </Link>
              <a
                href="/#mission"
                className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] transition-colors"
              >
                {t('nav.mission')}
              </a>
              <a
                href="/#how-it-works"
                className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] transition-colors"
              >
                {t('nav.howItWorks')}
              </a>
              <Link
                to="/facilities"
                className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] transition-colors"
              >
                {t('nav.network')}
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] hover:bg-[#D4ECE8] dark:hover:bg-[#263e57] font-semibold transition-all border border-[#0F766E]/20 dark:border-[#2DD4BF]/20"
              >
                <Layers className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                {t('nav.dashboard')}
              </Link>
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Emergency 108 Shortcut */}
              <button
                type="button"
                onClick={() => setShow108Modal(true)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#DC2626]/20 transition-all cursor-pointer"
                title="Immediate 108 Ambulance Hotline"
              >
                <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                <span>108</span>
                <span className="hidden xl:inline">Emergency</span>
              </button>

              {/* Language Dropdown (Desktop / Tablet) */}
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  id="language-menu-button"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === 'language'}
                  onClick={() => toggleMenu('language')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    openMenu === 'language'
                      ? 'border-[#0F766E] bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] ring-2 ring-[#0F766E]/20'
                      : 'border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#E8F5F3] dark:hover:bg-[#203449]'
                  }`}
                  title="Switch Language (English / मराठी / हिंदी)"
                >
                  <Languages className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                  <span className="uppercase font-bold">{language}</span>
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>

                {openMenu === 'language' && (
                  <div
                    role="menu"
                    aria-labelledby="language-menu-button"
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                      Select Language
                    </div>
                    {[
                      { code: 'en', label: 'English', sub: 'Default' },
                      { code: 'mr', label: 'मराठी', sub: 'Marathi' },
                      { code: 'hi', label: 'हिंदी', sub: 'Hindi' },
                    ].map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        role="menuitem"
                        onClick={() => handleLanguageChange(item.code as LanguageCode)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                          language === item.code
                            ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                            : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]/70'
                        }`}
                      >
                        <div>
                          <span className="block">{item.label}</span>
                          <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{item.sub}</span>
                        </div>
                        {language === item.code && (
                          <Check className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  id="theme-menu-button"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === 'theme'}
                  onClick={() => toggleMenu('theme')}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    openMenu === 'theme'
                      ? 'border-[#0F766E] bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] ring-2 ring-[#0F766E]/20'
                      : 'border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#E8F5F3] dark:hover:bg-[#203449]'
                  }`}
                  title="Toggle Light / Dark mode"
                >
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-[#2DD4BF]" />
                  ) : theme === 'light' ? (
                    <Sun className="w-4 h-4 text-[#D97706]" />
                  ) : (
                    <Monitor className="w-4 h-4 text-[#0F766E]" />
                  )}
                </button>

                {openMenu === 'theme' && (
                  <div
                    role="menu"
                    aria-labelledby="theme-menu-button"
                    className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                      Theme Mode
                    </div>
                    {[
                      { key: 'light', label: 'Light', icon: Sun, color: 'text-[#D97706]' },
                      { key: 'dark', label: 'Dark', icon: Moon, color: 'text-[#2DD4BF]' },
                      { key: 'system', label: 'System', icon: Monitor, color: 'text-[#64748B]' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          role="menuitem"
                          onClick={() => handleThemeChange(item.key as 'light' | 'dark' | 'system')}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                            theme === item.key
                              ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                              : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]/70'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                            {item.label}
                          </span>
                          {theme === item.key && (
                            <Check className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Google Workspace & Cloud Sync Button */}
              <button
                type="button"
                onClick={() => setShowWorkspaceModal(true)}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isGoogleConnected
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Google Workspace (Gmail & Drive) & Cloud Sync"
              >
                <div className="flex items-center -space-x-1">
                  <Mail className="w-3.5 h-3.5 text-red-500" />
                  <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="hidden sm:inline">Workspace</span>
                {isGoogleConnected ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>

              {/* Demo Role Switcher (Desktop) */}
              <div className="relative hidden lg:block">
                <button
                  type="button"
                  id="role-menu-button"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === 'roleSwitch'}
                  onClick={() => toggleMenu('roleSwitch')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    openMenu === 'roleSwitch'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Switch Role Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="max-w-[110px] truncate">{roleLabels[role]?.label.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {openMenu === 'roleSwitch' && (
                  <div
                    role="menu"
                    aria-labelledby="role-menu-button"
                    className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Role (Demo)
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        View experience for each authorized stakeholder
                      </p>
                    </div>
                    {(Object.keys(roleLabels) as UserRole[]).map((r) => {
                      const item = roleLabels[r];
                      const Icon = item.icon;
                      return (
                        <button
                          key={r}
                          type="button"
                          role="menuitem"
                          onClick={() => handleRoleChange(r)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                            role === r
                              ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            {item.label}
                          </span>
                          {role === r && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* In-App Notifications */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleMenu('notifications')}
                    aria-expanded={openMenu === 'notifications'}
                    className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Alerts & Notifications"
                  >
                    <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {openMenu === 'notifications' && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Referral Alerts ({notifications.length})
                        </span>
                        {unreadCount > 0 && (
                          <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">No alerts</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className={`p-3 text-xs cursor-pointer transition-colors ${
                                !n.isRead
                                  ? 'bg-amber-50/70 dark:bg-amber-950/30'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {n.title}
                                </span>
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="mt-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                                {n.message}
                              </p>
                              <span className="block mt-1 text-[10px] text-slate-400">
                                {new Date(n.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Menu */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    type="button"
                    id="profile-menu-button"
                    aria-haspopup="menu"
                    aria-expanded={openMenu === 'profile'}
                    onClick={() => toggleMenu('profile')}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all cursor-pointer ${
                      openMenu === 'profile'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {user.name.charAt(0)}
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {openMenu === 'profile' && (
                    <div
                      role="menu"
                      aria-labelledby="profile-menu-button"
                      className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                        <div className="mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                          {roleLabels[role]?.label}
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                        >
                          <Layers className="w-4 h-4 text-teal-600" />
                          {t('nav.dashboard')}
                        </Link>
                        <Link
                          to="/facilities"
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        >
                          <Building2 className="w-4 h-4 text-teal-600" />
                          {t('nav.facilities')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setShowWorkspaceModal(true);
                            setOpenMenu('none');
                          }}
                          className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-red-500" />
                            Gmail &amp; Google Drive
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                            {isGoogleConnected ? 'Active' : 'Setup'}
                          </span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setOpenMenu('none');
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('nav.signOut')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400"
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs"
                  >
                    {t('nav.createAccount')}
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => toggleMenu('mobileMenu')}
                aria-expanded={openMenu === 'mobileMenu'}
                className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Open Navigation Menu"
              >
                {openMenu === 'mobileMenu' ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {openMenu === 'mobileMenu' && (
          <div className="lg:hidden border-t border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638] px-4 pt-4 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top duration-150 max-h-[85vh] overflow-y-auto">
            {/* Primary Navigation Links */}
            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setOpenMenu('none')}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#12304A] dark:text-[#F1F5F9] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]"
              >
                {t('nav.home')}
              </Link>
              <a
                href="/#mission"
                onClick={() => setOpenMenu('none')}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#12304A] dark:text-[#F1F5F9] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]"
              >
                {t('nav.mission')}
              </a>
              <a
                href="/#how-it-works"
                onClick={() => setOpenMenu('none')}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#12304A] dark:text-[#F1F5F9] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]"
              >
                {t('nav.howItWorks')}
              </a>
              <Link
                to="/facilities"
                onClick={() => setOpenMenu('none')}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#12304A] dark:text-[#F1F5F9] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]"
              >
                {t('nav.network')}
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setOpenMenu('none')}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] border border-[#0F766E]/20 dark:border-[#2DD4BF]/20"
              >
                <Layers className="w-4 h-4" />
                {t('nav.dashboard')}
              </Link>
            </div>

            {/* Mobile Language Switcher */}
            <div className="pt-3 border-t border-[#DCE7EC] dark:border-[#334155] space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                {t('nav.language')} / भाषा निवडा
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'mr', label: 'मराठी' },
                  { code: 'hi', label: 'हिंदी' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleLanguageChange(item.code as LanguageCode)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      language === item.code
                        ? 'border-[#0F766E] bg-[#0F766E] text-white shadow-xs'
                        : 'border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#E8F5F3]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Theme Switcher */}
            <div className="pt-3 border-t border-[#DCE7EC] dark:border-[#334155] space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                {t('nav.theme')} / Display Theme
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'light', label: 'Light', icon: Sun },
                  { key: 'dark', label: 'Dark', icon: Moon },
                  { key: 'system', label: 'System', icon: Monitor },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleThemeChange(item.key as 'light' | 'dark' | 'system')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        theme === item.key
                          ? 'border-[#0F766E] bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                          : 'border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#334155] dark:text-[#CBD5E1]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google Workspace & Cloud Sync Quick Card */}
            <div className="pt-3 border-t border-[#DCE7EC] dark:border-[#334155]">
              <button
                type="button"
                onClick={() => {
                  setOpenMenu('none');
                  setShowWorkspaceModal(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-xs font-semibold text-[#12304A] dark:text-[#CBD5E1] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1">
                    <Mail className="w-4 h-4 text-[#DC2626]" />
                    <HardDrive className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <span>Google Workspace &amp; Drive Records</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F5F3] text-[#0F766E] dark:bg-[#101C2C] dark:text-[#2DD4BF] font-bold">
                  {isGoogleConnected ? 'Connected' : 'Sync'}
                </span>
              </button>
            </div>

            {/* Mobile Role Switcher */}
            <div className="pt-3 border-t border-[#DCE7EC] dark:border-[#334155]">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-2">
                {t('nav.switchRole')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(roleLabels) as UserRole[]).map((r) => {
                  const item = roleLabels[r];
                  const Icon = item.icon;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left truncate transition-colors cursor-pointer ${
                        role === r
                          ? 'bg-[#0F766E] text-white shadow-xs'
                          : 'bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Auth Actions */}
            {!isAuthenticated ? (
              <div className="pt-3 border-t border-[#DCE7EC] dark:border-[#334155] flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpenMenu('none')}
                  className="flex-1 text-center py-2.5 text-xs font-bold rounded-xl border border-[#DCE7EC] dark:border-[#334155] text-[#12304A] dark:text-[#F1F5F9] bg-[#F7FAFC] dark:bg-[#203449]"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpenMenu('none')}
                  className="flex-1 text-center py-2.5 text-xs font-bold rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white shadow-xs"
                >
                  {t('nav.createAccount')}
                </Link>
              </div>
            ) : (
              <div className="pt-3 border-t border-[#DCE7EC] dark:border-[#334155] flex justify-between items-center text-xs">
                <span className="text-[#64748B] dark:text-[#94A3B8] truncate">{user?.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpenMenu('none');
                    navigate('/');
                  }}
                  className="font-bold text-[#DC2626] dark:text-[#F87171] hover:underline cursor-pointer"
                >
                  {t('nav.signOut')}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 108 Emergency Dial Confirmation Modal */}
      {show108Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  National Emergency Ambulance (108)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShow108Modal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p className="leading-relaxed">
                You are about to contact the <strong>Maharashtra Emergency Medical Services (108)</strong> hotline for urgent maternal or neonatal ambulance dispatch.
              </p>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs">
                <strong>Emergency Priority:</strong> Please have the patient's location, gestational age, and danger signs ready (e.g. bleeding, convulsions, or unconsciousness).
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">JSSK Drop Back</span>
                  <span className="font-bold text-slate-900 dark:text-white">Dial 102</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Advisory</span>
                  <span className="font-bold text-slate-900 dark:text-white">Dial 104</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShow108Modal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <a
                href="tel:108"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                <PhoneCall className="w-4 h-4" />
                Call 108 Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Google Workspace & Cloud Sync Modal */}
      <WorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
      />
    </>
  );
};
