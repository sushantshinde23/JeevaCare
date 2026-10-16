import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useReferrals } from '../../context/ReferralContext';
import { LanguageCode } from '../../i18n/translations';
import { UserRole } from '../../types';
import {
  Search,
  Languages,
  Sun,
  Moon,
  Monitor,
  Bell,
  Mail,
  HardDrive,
  LogOut,
  ChevronDown,
  PhoneCall,
  Menu,
  Check,
  Building2,
  FileText,
  X,
  Stethoscope,
  Ambulance,
  Activity,
  User as UserIcon,
} from 'lucide-react';
import { JeevaCareLogo } from '../common/JeevaCareLogo';

interface DashboardTopBarProps {
  onToggleMobileDrawer: () => void;
  onOpenWorkspace: () => void;
  onSelectSearchResult?: (type: 'referral' | 'facility', id: string) => void;
}

export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  onToggleMobileDrawer,
  onOpenWorkspace,
  onSelectSearchResult,
}) => {
  const { language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, role, logout, switchRole, isGoogleConnected, updateUserPreferences } = useAuth();
  const { referrals, facilities, notifications, markNotificationRead } = useReferrals();
  const navigate = useNavigate();

  // Dropdown states (mutually exclusive)
  const [openDropdown, setOpenDropdown] = useState<'none' | 'search' | 'lang' | 'theme' | 'notif' | 'profile'>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const barRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown('none');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown('none');
      // Global Search shortcut ⌘K or /
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpenDropdown('search');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDropdown = (target: 'none' | 'search' | 'lang' | 'theme' | 'notif' | 'profile') => {
    setOpenDropdown((cur) => (cur === target ? 'none' : target));
  };

  const handleLanguageSelect = (lang: LanguageCode) => {
    setLanguage(lang);
    updateUserPreferences({ language: lang });
    setOpenDropdown('none');
  };

  const handleThemeSelect = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    updateUserPreferences({ theme: newTheme });
    setOpenDropdown('none');
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    setOpenDropdown('none');
  };

  // Search matching
  const matchingReferrals = searchQuery.trim()
    ? referrals.filter(
        (r) =>
          r.referralCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.emergencyCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.patient.addressVillage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const matchingFacilities = searchQuery.trim()
    ? facilities.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.tehsil.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const unreadAlerts = notifications.filter((n) => !n.isRead);

  return (
    <header
      ref={barRef}
      className="sticky top-0 z-40 bg-white/95 dark:bg-[#172638]/95 backdrop-blur-md border-b border-[#DCE7EC] dark:border-[#334155] h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 shadow-2xs transition-colors"
    >
      {/* Left: Mobile Drawer Trigger + Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleMobileDrawer}
          className="lg:hidden p-2 rounded-xl text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] cursor-pointer"
          title="Open Navigation Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center group">
          <JeevaCareLogo variant="horizontal" size="sm" showTagline={false} />
        </Link>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-2 hidden md:block relative">
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setOpenDropdown('search')}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search referrals by patient, code, or facility... (⌘K)"
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] outline-none focus:ring-1 focus:ring-[#0F766E] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#12304A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {openDropdown === 'search' && searchQuery.trim() && (
          <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-2xl p-3 z-50 text-xs space-y-3 max-h-96 overflow-y-auto animate-in fade-in duration-100">
            {/* Referrals Section */}
            <div>
              <div className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Matching Referrals ({matchingReferrals.length})</span>
                <span className="text-teal-600 font-semibold">Active Database</span>
              </div>
              {matchingReferrals.length === 0 ? (
                <div className="text-[11px] text-[#64748B] py-1 pl-1">No referrals match "{searchQuery}"</div>
              ) : (
                <div className="space-y-1">
                  {matchingReferrals.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setOpenDropdown('none');
                        setSearchQuery('');
                        if (onSelectSearchResult) onSelectSearchResult('referral', r.id);
                        navigate(`/referrals/${r.id}`);
                      }}
                      className="p-2 rounded-xl bg-[#F7FAFC] dark:bg-[#203449] hover:bg-[#E8F5F3] dark:hover:bg-[#263e57] border border-[#DCE7EC] dark:border-[#334155] cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF] shrink-0" />
                        <div>
                          <div className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                            {r.patient.name} ({r.referralCode})
                          </div>
                          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                            {r.emergencyCategory} &bull; {r.patient.addressVillage}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#E8F5F3] text-[#0F766E]">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Facilities Section */}
            <div className="pt-2 border-t border-[#DCE7EC] dark:border-[#334155]">
              <div className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Matching First Referral Units ({matchingFacilities.length})
              </div>
              {matchingFacilities.length === 0 ? (
                <div className="text-[11px] text-[#64748B] py-1 pl-1">No facilities match "{searchQuery}"</div>
              ) : (
                <div className="space-y-1">
                  {matchingFacilities.slice(0, 3).map((f) => (
                    <div
                      key={f.id}
                      onClick={() => {
                        setOpenDropdown('none');
                        setSearchQuery('');
                        if (onSelectSearchResult) onSelectSearchResult('facility', f.id);
                        navigate('/facilities');
                      }}
                      className="p-2 rounded-xl bg-[#F7FAFC] dark:bg-[#203449] hover:bg-[#E8F5F3] dark:hover:bg-[#263e57] border border-[#DCE7EC] dark:border-[#334155] cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#15803D] shrink-0" />
                        <div>
                          <div className="font-bold text-[#12304A] dark:text-[#F1F5F9]">{f.name}</div>
                          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                            {f.type} &bull; {f.tehsil}
                          </div>
                        </div>
                      </div>
                      {f.hasCEmONC && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#DCFCE7] text-[#15803D]">
                          CEmONC
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Emergency 108, Workspace, Lang, Theme, Notif, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile Search Icon Trigger */}
        <button
          type="button"
          onClick={() => toggleDropdown('search')}
          className="md:hidden p-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* 108 Emergency Direct Action */}
        <a
          href="tel:108"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-md shadow-[#DC2626]/20 transition-all cursor-pointer"
          title="Direct 108 Ambulance Hotline"
        >
          <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
          <span>108</span>
          <span className="hidden xl:inline">Emergency</span>
        </a>

        {/* Language Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('lang')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
              openDropdown === 'lang'
                ? 'border-[#0F766E] bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF]'
                : 'border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
            }`}
            title="Language / भाषा"
          >
            <Languages className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
            <span className="uppercase text-[11px] hidden sm:inline">{language}</span>
          </button>

          {openDropdown === 'lang' && (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xl py-1.5 z-50 animate-in fade-in text-xs">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Language / भाषा निवडा
              </div>
              {[
                { code: 'en', label: 'English', desc: 'Default Clinical' },
                { code: 'mr', label: 'मराठी', desc: 'महाराष्ट्र शासन प्रमाण' },
                { code: 'hi', label: 'हिंदी', desc: 'राष्ट्रीय स्वास्थ्य' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleLanguageSelect(item.code as LanguageCode)}
                  className={`w-full flex items-center justify-between px-3 py-2 cursor-pointer transition ${
                    language === item.code
                      ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                      : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]/70'
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{item.label}</span>
                    <span className="text-[10px] text-[#64748B]">{item.desc}</span>
                  </div>
                  {language === item.code && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('theme')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              openDropdown === 'theme'
                ? 'border-[#0F766E] bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF]'
                : 'border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
            }`}
            title="Display Theme"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-[#2DD4BF]" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-[#D97706]" />
            ) : (
              <Monitor className="w-4 h-4 text-[#0F766E]" />
            )}
          </button>

          {openDropdown === 'theme' && (
            <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xl py-1.5 z-50 animate-in fade-in text-xs">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Theme Mode
              </div>
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
                    onClick={() => handleThemeSelect(item.key as any)}
                    className={`w-full flex items-center justify-between px-3 py-2 cursor-pointer transition ${
                      theme === item.key
                        ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                        : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]/70'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                    {theme === item.key && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Google Workspace Button */}
        <button
          type="button"
          onClick={onOpenWorkspace}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
            isGoogleConnected
              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              : 'border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
          }`}
          title="Google Drive & Gmail Integration Status"
        >
          <div className="flex items-center -space-x-1">
            <Mail className="w-3.5 h-3.5 text-red-500" />
            <HardDrive className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="hidden md:inline">Workspace</span>
          <span
            className={`w-2 h-2 rounded-full ${isGoogleConnected ? 'bg-[#15803D]' : 'bg-amber-400'}`}
          />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('notif')}
            className={`p-2 rounded-xl border relative transition-all cursor-pointer ${
              openDropdown === 'notif'
                ? 'border-[#0F766E] bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF]'
                : 'border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
            }`}
            title="Referral Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[9px] font-black text-white ring-2 ring-white dark:ring-[#172638] animate-pulse">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {openDropdown === 'notif' && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-2xl py-2 z-50 animate-in fade-in text-xs">
              <div className="px-4 py-2 border-b border-[#DCE7EC] dark:border-[#334155] flex items-center justify-between">
                <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] uppercase tracking-wider text-[11px]">
                  Referral Alerts ({notifications.length})
                </span>
                {unreadAlerts.length > 0 && (
                  <span className="text-[10px] font-bold text-[#0F766E] dark:text-[#2DD4BF]">
                    {unreadAlerts.length} unread
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#DCE7EC]/60 dark:divide-[#334155]/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#64748B]">No notifications recorded</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 cursor-pointer transition ${
                        !n.isRead ? 'bg-[#E8F5F3]/50 dark:bg-[#203449]/70' : 'hover:bg-[#F7FAFC] dark:hover:bg-[#203449]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#12304A] dark:text-[#F1F5F9] text-xs leading-snug">
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#0F766E] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                        {n.message}
                      </p>
                      <span className="block mt-1 text-[9px] text-[#94A3B8]">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Demo Role Switching Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('profile')}
            className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-all cursor-pointer ${
              openDropdown === 'profile'
                ? 'border-[#0F766E] bg-[#E8F5F3] dark:bg-[#203449]'
                : 'border-[#DCE7EC] dark:border-[#334155] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]'
            }`}
            title="Account & Role Settings"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {user?.name?.[0]?.toUpperCase() || 'J'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:block" />
          </button>

          {openDropdown === 'profile' && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-2xl py-2 z-50 animate-in fade-in text-xs space-y-1">
              <div className="px-3.5 py-2 border-b border-[#DCE7EC] dark:border-[#334155]">
                <div className="font-bold text-[#12304A] dark:text-[#F1F5F9] text-sm">
                  {user?.name || 'Active User'}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                  {user?.email || 'user@jeevacare.org'}
                </div>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5F3] text-[#0F766E] dark:bg-[#203449] dark:text-[#2DD4BF]">
                  Role: {role.replace('_', ' ')}
                </span>
              </div>

              {/* Role Switching for Hackathon / Testing */}
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Switch Active Role
              </div>
              {[
                { r: 'health_worker' as UserRole, label: 'ASHA / ANM Worker', icon: Stethoscope },
                { r: 'hospital_coordinator' as UserRole, label: 'Receiving Hospital', icon: Building2 },
                { r: 'transport_coordinator' as UserRole, label: '108 Transport Fleet', icon: Ambulance },
                { r: 'patient' as UserRole, label: 'Mother & Family', icon: UserIcon },
                { r: 'admin' as UserRole, label: 'District Admin / CMO', icon: Activity },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => handleRoleSwitch(item.r)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 cursor-pointer transition ${
                      role === item.r
                        ? 'bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-bold'
                        : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#203449]/70'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                    {role === item.r && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
                  </button>
                );
              })}

              <div className="pt-1 border-t border-[#DCE7EC] dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpenDropdown('none');
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/30 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
