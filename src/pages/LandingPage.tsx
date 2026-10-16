import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useReferrals } from '../context/ReferralContext';
import { Facility, UserRole } from '../types';
import {
  HeartPulse,
  PhoneCall,
  ShieldCheck,
  Building2,
  Ambulance,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  Users,
  MapPin,
  Lock,
  Search,
  Filter,
  Layers,
  Clock,
  ExternalLink,
  ChevronRight,
  Check,
  Stethoscope,
  Heart,
  Droplet,
  Baby,
  Mic,
  Volume2,
  QrCode,
  FileText,
  Radio,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { EmergencyMap } from '../components/maps/EmergencyMap';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, switchRole } = useAuth();
  const { facilities, referrals } = useReferrals();

  // Interactive Facility Finder state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'cemonc' | 'blood' | 'sncu'>('ALL');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(facilities[0] || null);

  // Interactive Voice & AI Showcase state
  const [showcaseLang, setShowcaseLang] = useState<'en' | 'mr' | 'hi'>('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeVoicePrompt, setActiveVoicePrompt] = useState<{
    text: string;
    category: string;
    urgency: string;
    protocol: string;
    facilityMatch: string;
  }>({
    text: 'Mother in labor with severe headache, blurred vision, and BP 160/110 mmHg at 37 weeks',
    category: 'Severe Pre-eclampsia / Impending Eclampsia',
    urgency: 'CRITICAL',
    protocol: 'Dakshata Step 4: Administer loading dose of Inj. Magnesium Sulfate 50% (4g IV + 10g IM). Continuous BP & fetal monitoring.',
    facilityMatch: 'Sub-District Hospital Baramati (Verified CEmONC, OT Ready & Active Blood Bank)',
  });

  const handlePlayVoice = (text: string, lang: 'en' | 'mr' | 'hi') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectRole = (targetRole: UserRole) => {
    switchRole(targetRole);
    navigate(`/dashboard/${targetRole}`);
  };

  const filteredFacilities = facilities.filter((fac) => {
    const matchesSearch =
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.tehsil.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.type.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'cemonc') return fac.hasCEmONC;
    if (filterType === 'blood') return fac.hasBloodBank || fac.hasBloodStorage;
    if (filterType === 'sncu') return fac.hasSNCU;
    return true;
  });

  const activeReferralsCount = referrals.filter(
    (r) => r.status === 'IN_TRANSIT' || r.status === 'SUBMITTED' || r.status === 'AWAITING_ACKNOWLEDGEMENT'
  ).length;

  const verifiedFrusCount = facilities.filter((f) => f.isVerified).length;
  const completedHandoversCount = referrals.filter(
    (r) => r.status === 'HANDOVER_COMPLETED' || r.status === 'CLOSED'
  ).length;

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#101C2C] text-[#334155] dark:text-[#CBD5E1] transition-colors selection:bg-[#0F766E]/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-[#DCE7EC] dark:border-[#334155] bg-gradient-to-b from-[#E8F5F3]/60 via-white to-[#F7FAFC] dark:from-[#172638] dark:via-[#101C2C] dark:to-[#101C2C]">
        {/* Soft Background Radial Gradient Accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0F766E]/10 dark:bg-[#2DD4BF]/5 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#E8F5F3] dark:bg-[#203449]/30 rounded-full blur-2xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F5F3] dark:bg-[#203449] border border-[#0F766E]/25 dark:border-[#2DD4BF]/30 text-[#0F766E] dark:text-[#2DD4BF] text-xs font-bold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-[#0F766E] dark:bg-[#2DD4BF] animate-pulse" />
                <span>{t('hero.eyebrow')}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#12304A] dark:text-[#F1F5F9] leading-[1.15]">
                Every Mother Deserves Timely Care.{' '}
                <span className="text-[#0F766E] dark:text-[#2DD4BF] block sm:inline">
                  Every Newborn Deserves a Safe Start.
                </span>
              </h1>

              {/* Short, clear explanation */}
              <p className="text-base sm:text-lg text-[#334155] dark:text-[#CBD5E1] leading-relaxed max-w-2xl font-normal mx-auto lg:mx-0">
                JeevaCare coordinates frontline health workers, verified First Referral Units, and 108 emergency transport with pre-arrival bed readiness and real-time closed-loop tracking.
              </p>

              {/* Hero Call to Actions */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to={isAuthenticated ? '/dashboard' : '/register'}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#0F766E]/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <HeartPulse className="w-4 h-4" />
                  <span>{t('hero.btn.getStarted')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] hover:bg-[#E8F5F3] dark:hover:bg-[#203449] text-[#12304A] dark:text-[#F1F5F9] font-bold text-sm shadow-xs transition-all cursor-pointer"
                >
                  <span>{t('hero.btn.howItWorks')}</span>
                  <ChevronRight className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                </a>

                <a
                  href="tel:108"
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-sm shadow-md shadow-[#DC2626]/20 transition-all cursor-pointer"
                  title="Direct 108 Ambulance Hotline"
                >
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                  <span>108 Emergency</span>
                </a>
              </div>

              {/* Trust & Verification Metric Strip */}
              <div className="pt-6 border-t border-[#DCE7EC] dark:border-[#334155] grid grid-cols-3 gap-4 text-left">
                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-[#0F766E] dark:text-[#2DD4BF]">
                    Zero Delay
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                    Closed-loop handover protocol
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-[#12304A] dark:text-[#F1F5F9]">
                    {verifiedFrusCount} FRUs
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                    Verified CEmONC &amp; SNCU units
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-[#0F766E] dark:text-[#2DD4BF]">
                    3 Languages
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                    English, मराठी, हिंदी
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero: Animated Healthcare Composition & Connected Nodes */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-3xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xl overflow-hidden p-6 sm:p-7">
                {/* Visual Canvas Top Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-[#DCE7EC] dark:border-[#334155]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-ping" />
                    <span className="text-xs font-bold text-[#12304A] dark:text-[#F1F5F9] uppercase tracking-wider">
                      JeevaCare Emergency Network
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5F3] text-[#0F766E] dark:bg-[#203449] dark:text-[#2DD4BF] border border-[#0F766E]/20">
                    Live Telemetry
                  </span>
                </div>

                {/* Animated Healthcare Care Symbol & Connected Nodes */}
                <div className="relative my-4 h-56 sm:h-64 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-[#F7FAFC] via-[#E8F5F3]/50 to-[#F7FAFC] dark:from-[#101C2C] dark:via-[#172638] dark:to-[#101C2C] border border-[#DCE7EC]/60 dark:border-[#334155]/60">
                  {/* Subtle Expanding Ripple Rings around Center */}
                  <div className="absolute w-44 h-44 rounded-full border border-[#0F766E]/20 dark:border-[#2DD4BF]/20 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-32 h-32 rounded-full border border-[#0F766E]/30 dark:border-[#2DD4BF]/30 animate-pulse pointer-events-none" />

                  {/* SVG Connecting Vectors */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 dark:opacity-30" xmlns="http://www.w3.org/2000/svg">
                    <line x1="20%" y1="25%" x2="50%" y2="50%" stroke="#0F766E" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="80%" y1="25%" x2="50%" y2="50%" stroke="#0F766E" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="20%" y1="80%" x2="50%" y2="50%" stroke="#0F766E" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="80%" y1="80%" x2="50%" y2="50%" stroke="#0F766E" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>

                  {/* Central Care Symbol: Mother & Newborn Heart Symbol */}
                  <div className="relative z-10 w-20 h-20 rounded-2xl bg-[#0F766E] text-white flex flex-col items-center justify-center shadow-xl shadow-[#0F766E]/30 transform hover:scale-105 transition-transform">
                    <HeartPulse className="w-8 h-8 animate-pulse text-[#E8F5F3]" />
                    <span className="text-[9px] font-extrabold uppercase tracking-widest mt-0.5 text-teal-100">Jeeva</span>
                  </div>

                  {/* Node 1: Rural PHC / Health Worker (Top-Left) */}
                  <div className="absolute top-4 left-4 z-10 p-2 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-md flex items-center gap-1.5 text-[11px] font-bold text-[#12304A] dark:text-[#F1F5F9] animate-bounce" style={{ animationDuration: '4s' }}>
                    <Stethoscope className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                    <span>ASHA / PHC</span>
                  </div>

                  {/* Node 2: 108 Emergency Ambulance (Top-Right) */}
                  <div className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-md flex items-center gap-1.5 text-[11px] font-bold text-[#DC2626] animate-bounce" style={{ animationDuration: '4.5s' }}>
                    <Ambulance className="w-4 h-4 text-[#DC2626]" />
                    <span>108 ALS Fleet</span>
                  </div>

                  {/* Node 3: Verified CEmONC FRU Hospital (Bottom-Left) */}
                  <div className="absolute bottom-4 left-4 z-10 p-2 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-md flex items-center gap-1.5 text-[11px] font-bold text-[#15803D] animate-bounce" style={{ animationDuration: '5s' }}>
                    <Building2 className="w-4 h-4 text-[#15803D]" />
                    <span>CEmONC Hospital</span>
                  </div>

                  {/* Node 4: Mother & Family Tracker (Bottom-Right) */}
                  <div className="absolute bottom-4 right-4 z-10 p-2 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-md flex items-center gap-1.5 text-[11px] font-bold text-[#2563EB] animate-bounce" style={{ animationDuration: '5.2s' }}>
                    <Users className="w-4 h-4 text-[#2563EB]" />
                    <span>Family Tracker</span>
                  </div>
                </div>

                {/* Case Status Strip */}
                <div className="p-3.5 rounded-xl bg-[#F7FAFC] dark:bg-[#203449]/70 border border-[#DCE7EC] dark:border-[#334155] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                    <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                      Dakshata &amp; CEmONC Standards
                    </span>
                  </div>
                  <span className="font-semibold text-[#15803D] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Protocol Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section C: Trust and Mission — "Care That Connects Every Step" */}
      <section id="mission" className="py-16 sm:py-20 bg-white dark:bg-[#172638] border-b border-[#DCE7EC] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] uppercase tracking-wider">
              {t('brand.name')} Platform Pillars
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
              {t('trust.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              {t('trust.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9] mb-2">
                {t('trust.card1.title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t('trust.card1.desc')}
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9] mb-2">
                {t('trust.card2.title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t('trust.card2.desc')}
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Ambulance className="w-6 h-6 text-[#DC2626]" />
              </div>
              <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9] mb-2">
                {t('trust.card3.title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t('trust.card3.desc')}
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] shadow-xs hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-[#15803D]" />
              </div>
              <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9] mb-2">
                {t('trust.card4.title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t('trust.card4.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section D: How JeevaCare Works — 6-Step Closed Loop Workflow */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-[#F7FAFC] dark:bg-[#101C2C] border-b border-[#DCE7EC] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] uppercase tracking-wider">
              Standard Operating Procedure
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
              {t('how.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              {t('how.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num: '1', title: t('how.step1.title'), desc: t('how.step1.desc'), icon: Stethoscope },
              { num: '2', title: t('how.step2.title'), desc: t('how.step2.desc'), icon: Sparkles },
              { num: '3', title: t('how.step3.title'), desc: t('how.step3.desc'), icon: MapPin },
              { num: '4', title: t('how.step4.title'), desc: t('how.step4.desc'), icon: Building2 },
              { num: '5', title: t('how.step5.title'), desc: t('how.step5.desc'), icon: Ambulance },
              { num: '6', title: t('how.step6.title'), desc: t('how.step6.desc'), icon: CheckCircle2 },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3 relative overflow-hidden group hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center font-bold text-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-[#DCE7EC] dark:text-[#334155]">
                      0{step.num}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9]">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section E: Role-Based User Entry */}
      <section id="roles" className="py-16 sm:py-20 bg-white dark:bg-[#172638] border-b border-[#DCE7EC] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] uppercase tracking-wider">
              Synchronized Healthcare Roles
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
              {t('roles.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              JeevaCare provides dedicated role experiences ensuring frontline workers, ambulance dispatchers, receiving clinicians, and families share one synchronized source of truth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* 1. Mothers and Families */}
            <div className="p-5 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  {t('roles.patient')}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Track live ambulance ETA, view receiving hospital details, access care continuity passport and 108 emergency help.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectRole('patient')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:bg-[#E8F5F3] dark:hover:bg-[#203449] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Open Mother Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. ASHA / ANM Workers */}
            <div className="p-5 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#0F766E]/40 dark:border-[#2DD4BF]/40 bg-gradient-to-b from-[#E8F5F3]/40 to-[#F7FAFC] dark:from-[#203449] dark:to-[#172638] transition-all flex flex-col justify-between group shadow-sm">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#0F766E] text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-[#0F766E]/20">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                    ASHA / ANM Workers
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#0F766E] text-white">
                    Core
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Rapid bedside triage, multilingual voice assistant, offline referral drafts with automated background sync, and Dakshata checks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectRole('health_worker')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#0F766E]/25"
              >
                <span>Open ASHA Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Receiving Hospitals */}
            <div className="p-5 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  Receiving Hospitals
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Pre-arrival clinical sheets, emergency bed acknowledgement, blood and OT preparation, and closed-loop handover confirmation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectRole('hospital_coordinator')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:bg-[#E8F5F3] dark:hover:bg-[#203449] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Open Hospital Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4. Transport Coordinators */}
            <div className="p-5 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] dark:bg-[#7F1D1D]/30 text-[#DC2626] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Ambulance className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  108 Transport Fleet
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Dispatch ambulance units, update live transit milestones, receive delay warnings, and confirm digital patient handovers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectRole('transport_coordinator')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-xs font-bold text-[#DC2626] dark:text-[#F87171] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Open 108 Dispatch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5. District Administrators */}
            <div className="p-5 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  District Admin / CMO
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Real-time referral delay analysis, facility verification freshness, block-level equity audits, and emergency governance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectRole('admin')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:bg-[#E8F5F3] dark:hover:bg-[#203449] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Open CMO Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section F: Interactive Facility Finder */}
      <section id="facilities-finder" className="py-16 sm:py-20 bg-[#F7FAFC] dark:bg-[#101C2C] border-b border-[#DCE7EC] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] uppercase tracking-wider">
                Real-time Healthcare Network
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
                Verified First Referral Units &amp; Hospital Finder
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] max-w-xl">
                Locate verified maternal and newborn emergency care facilities in Pune district. Real-time CEmONC, blood bank, and SNCU status.
              </p>
            </div>

            <Link
              to="/facilities"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
            >
              Full Interactive Directory &rarr;
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospital name or tehsil..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638] text-[#12304A] dark:text-[#CBD5E1] outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white dark:bg-[#172638] text-[#334155] dark:text-[#CBD5E1] border border-[#DCE7EC] dark:border-[#334155]'
                }`}
              >
                All FRUs ({facilities.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('cemonc')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  filterType === 'cemonc'
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white dark:bg-[#172638] text-[#334155] dark:text-[#CBD5E1] border border-[#DCE7EC] dark:border-[#334155]'
                }`}
              >
                CEmONC (C-Section)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('blood')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  filterType === 'blood'
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white dark:bg-[#172638] text-[#334155] dark:text-[#CBD5E1] border border-[#DCE7EC] dark:border-[#334155]'
                }`}
              >
                Active Blood Bank
              </button>
              <button
                type="button"
                onClick={() => setFilterType('sncu')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  filterType === 'sncu'
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white dark:bg-[#172638] text-[#334155] dark:text-[#CBD5E1] border border-[#DCE7EC] dark:border-[#334155]'
                }`}
              >
                SNCU / NICU
              </button>
            </div>
          </div>

          {/* Interactive Map & Facility Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Facility Cards Column */}
            <div className="lg:col-span-5 space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredFacilities.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8]">
                  No matching facilities found. Try expanding your search filter.
                </div>
              ) : (
                filteredFacilities.map((fac) => (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedFacility?.id === fac.id
                        ? 'border-[#0F766E] bg-[#E8F5F3]/50 dark:bg-[#203449] shadow-sm'
                        : 'border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638] hover:border-[#0F766E]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#12304A] dark:text-[#F1F5F9]">
                          {fac.name}
                        </h4>
                        <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          {fac.type.replace(/_/g, ' ')} &bull; {fac.tehsil}
                        </span>
                      </div>
                      {fac.hasCEmONC && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#BBF7D0]">
                          CEmONC
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
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
                      <span className="px-1.5 py-0.5 rounded bg-[#F7FAFC] dark:bg-[#203449] text-[#64748B] dark:text-[#94A3B8]">
                        Labor Beds: {fac.laborBedsAvailable}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#DCE7EC] dark:border-[#334155] flex items-center justify-between text-[11px]">
                      <a
                        href={`tel:${fac.phone}`}
                        className="font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PhoneCall className="w-3 h-3" /> {fac.phone}
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${fac.coordinates.lat},${fac.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] font-semibold hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Directions <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Google Map Column */}
            <div className="lg:col-span-7">
              <EmergencyMap
                facilities={filteredFacilities}
                selectedFacilityId={selectedFacility?.id}
                onSelectFacility={(f) => setSelectedFacility(f)}
                height="480px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section G: Multilingual Voice & AI Assistance Showcase */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#172638] border-b border-[#DCE7EC] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F5F3] dark:bg-[#203449] border border-[#0F766E]/20 text-[#0F766E] dark:text-[#2DD4BF] text-xs font-bold uppercase tracking-wider">
              <Mic className="w-3.5 h-3.5" />
              <span>Dakshata-Compliant Frontline Copilot</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
              Multilingual Voice Assistant &amp; Clinical Triage
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Frontline ASHA and ANM workers speak emergency symptoms in their regional language. JeevaCare maps symptoms to Dakshata guidelines, identifies required hospital capabilities, and requires human confirmation before saving.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Interactive Voice Demo Controller (Left Column) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#12304A] dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF] animate-pulse" />
                    Interactive Speech Simulation
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    {(['en', 'mr', 'hi'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setShowcaseLang(lang);
                          if (lang === 'mr') {
                            setActiveVoicePrompt({
                              text: 'तातडीने CEmONC रुग्णालय शोधा - गरोदर मातेला तीव्र डोकेदुखी व रक्तदाब १६०/११०',
                              category: 'Severe Pre-eclampsia / Impending Eclampsia',
                              urgency: 'CRITICAL',
                              protocol: 'दक्षता पायरी ४: Inj. मॅग्नेशियम सल्फेट ५०% लोडिंग डोस (४ ग्रॅम IV + १० ग्रॅम IM) द्या. सतत रक्तदाब निरीक्षण.',
                              facilityMatch: 'उपजिल्हा रुग्णालय बारामती (CEmONC व रक्तपेढी उपलब्ध)',
                            });
                          } else if (lang === 'hi') {
                            setActiveVoicePrompt({
                              text: 'प्रसव पीड़ा, तेज सिरदर्द और रक्तचाप 160/110 - तत्काल CEmONC रेफरल',
                              category: 'Severe Pre-eclampsia / Impending Eclampsia',
                              urgency: 'CRITICAL',
                              protocol: 'दक्षता चरण ४: Inj. मैग्नीशियम सल्फेट ५०% लोडिंग डोज़ (४ ग्राम IV + १० ग्राम IM) दें।',
                              facilityMatch: 'उप-जिला अस्पताल बारामती (CEmONC व ब्लड बैंक सत्यापित)',
                            });
                          } else {
                            setActiveVoicePrompt({
                              text: 'Mother in labor with severe headache, blurred vision, and BP 160/110 mmHg at 37 weeks',
                              category: 'Severe Pre-eclampsia / Impending Eclampsia',
                              urgency: 'CRITICAL',
                              protocol: 'Dakshata Step 4: Administer loading dose of Inj. Magnesium Sulfate 50% (4g IV + 10g IM). Continuous BP & fetal monitoring.',
                              facilityMatch: 'Sub-District Hospital Baramati (Verified CEmONC, OT Ready & Active Blood Bank)',
                            });
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          showcaseLang === lang
                            ? 'bg-[#0F766E] text-white shadow-xs'
                            : 'bg-white dark:bg-[#172638] text-[#64748B] hover:text-[#0F766E] border border-[#DCE7EC] dark:border-[#334155]'
                        }`}
                      >
                        {lang === 'en' ? 'EN' : lang === 'mr' ? 'मराठी' : 'हिंदी'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Input Box */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                    <span className="flex items-center gap-1 font-semibold">
                      <Mic className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" />
                      Transcribed Clinical Input
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayVoice(activeVoicePrompt.text, showcaseLang)}
                      disabled={isPlayingAudio}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingAudio ? 'Speaking...' : 'Listen Audio'}</span>
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-[#12304A] dark:text-[#F1F5F9] leading-relaxed">
                    &ldquo;{activeVoicePrompt.text}&rdquo;
                  </p>
                </div>

                {/* Quick Symptom Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Try Clinical Scenario Prompt Chips:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveVoicePrompt({
                          text: 'Postpartum hemorrhage after home birth, heavy bleeding, pulse 118 bpm, cold extremities',
                          category: 'Postpartum Hemorrhage (PPH)',
                          urgency: 'CRITICAL',
                          protocol: 'Dakshata PPH Protocol: Inj. Oxytocin 10 IU IM immediately. Bimanual uterine compression. Two large-bore IV lines with normal saline. Immediate CEmONC with blood bank required.',
                          facilityMatch: 'Sassoon General Hospital Pune (Blood Bank & Obstetric ICU)',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:border-[#0F766E] hover:text-[#0F766E] font-medium transition cursor-pointer text-left"
                    >
                      🩸 PPH &amp; Heavy Bleeding
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveVoicePrompt({
                          text: 'Newborn not breathing at birth, limp, APGAR score 3 at 1 minute, bag and mask ventilation initiated',
                          category: 'Birth Asphyxia / Neonatal Resuscitation',
                          urgency: 'CRITICAL',
                          protocol: 'NSSK Protocol: Clear airway, positive pressure ventilation (PPV) with room air. If heart rate <100 bpm continue PPV. Immediate SNCU transfer required.',
                          facilityMatch: 'District Hospital Aundh Pune (Level II SNCU & Neonatologist)',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] hover:border-[#0F766E] hover:text-[#0F766E] font-medium transition cursor-pointer text-left"
                    >
                      👶 Newborn Asphyxia (SNCU)
                    </button>
                  </div>
                </div>

                {/* Safety Guarantee Strip */}
                <div className="p-3 rounded-xl bg-[#E8F5F3]/80 dark:bg-[#203449]/70 border border-[#0F766E]/20 text-[11px] text-[#0F766E] dark:text-[#2DD4BF] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Clinical Safety Guardrail:</strong> JeevaCare does NOT automate diagnoses or prescriptions. Extracted data requires explicit clinician/ASHA confirmation before referral creation.
                  </span>
                </div>
              </div>
            </div>

            {/* AI Extraction & Matching Preview (Right Column) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#DCE7EC] dark:border-[#334155] pb-3">
                  <span className="text-xs font-bold text-[#12304A] dark:text-[#F1F5F9] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                    Structured Clinical Extraction
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">
                    {activeVoicePrompt.urgency} PRIORITY
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] block">
                      Emergency Classification:
                    </span>
                    <span className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                      {activeVoicePrompt.category}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] space-y-1">
                    <span className="text-[11px] font-bold text-[#0F766E] dark:text-[#2DD4BF] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Recommended Dakshata Action Protocol:
                    </span>
                    <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                      {activeVoicePrompt.protocol}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] space-y-1">
                    <span className="text-[11px] font-bold text-[#15803D] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Matched Facility Requirement:
                    </span>
                    <p className="text-xs font-semibold text-[#12304A] dark:text-[#F1F5F9]">
                      {activeVoicePrompt.facilityMatch}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    to="/referrals/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white text-xs font-bold shadow-md shadow-[#0F766E]/20 transition-all cursor-pointer"
                  >
                    <span>Create Rapid Referral</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to="/facilities"
                    className="text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
                  >
                    Check All 8 Pune FRUs &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section H: Emergency Care Continuity & Impact Dashboard */}
      <section className="py-16 sm:py-20 bg-[#F7FAFC] dark:bg-[#101C2C] border-b border-[#DCE7EC] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] uppercase tracking-wider">
              Transparency &amp; Governance
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
              Care Continuity Passport &amp; District Intelligence
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Every emergency transfer creates a consent-driven, tamper-evident Care Continuity record ensuring no critical clinical data is lost during handover.
            </p>
          </div>

          {/* District Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-[#0F766E] dark:text-[#2DD4BF]">
                {activeReferralsCount} Active
              </div>
              <div className="text-xs font-bold text-[#12304A] dark:text-[#F1F5F9]">
                Live Referrals En Route
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                Real-time 108 GPS &amp; pre-arrival alert active
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-[#12304A] dark:text-[#F1F5F9]">
                {verifiedFrusCount} FRUs
              </div>
              <div className="text-xs font-bold text-[#12304A] dark:text-[#F1F5F9]">
                Verified First Referral Units
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                CEmONC, Blood Storage &amp; SNCU validated
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-[#15803D]">
                {completedHandoversCount} Handover{completedHandoversCount === 1 ? '' : 's'}
              </div>
              <div className="text-xs font-bold text-[#12304A] dark:text-[#F1F5F9]">
                Completed Safe Transfers
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                Receiving physician digital sign-off verified
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-[#2563EB]">
                &lt; 24 min
              </div>
              <div className="text-xs font-bold text-[#12304A] dark:text-[#F1F5F9]">
                Median FRU Arrival Window
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                Optimized by Google Maps routing &amp; bed readiness
              </p>
            </div>
          </div>

          {/* Care Continuity Passport Visual Feature Card */}
          <div className="rounded-3xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-lg p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] text-xs font-bold">
                <FileText className="w-3.5 h-3.5" />
                <span>Patient Care Continuity Passport</span>
              </div>
              <h3 className="text-2xl font-bold text-[#12304A] dark:text-[#F1F5F9]">
                Zero Information Loss Between Rural PHC and Tertiary ICU
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                When a mother arrives at the receiving hospital, emergency doctors don&rsquo;t waste precious minutes repeating basic tests. The digital passport contains pre-referral medicines administered, blood group, vital trends, and digital consent logs.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-semibold text-[#12304A] dark:text-[#CBD5E1]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Dakshata Partograph Continuity</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Pre-referral MgSO4 / Oxytocin Log</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Google Drive Clinical Record Archival</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Offline-capable QR / Slip Print</span>
                </div>
              </div>
            </div>

            {/* Passport Mock Card Preview */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449] border border-[#0F766E]/30 dark:border-[#2DD4BF]/30 shadow-md space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#DCE7EC] dark:border-[#334155] pb-2">
                <div className="flex items-center gap-1.5 font-sans font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  <QrCode className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
                  <span>PASS-REF-2025-0482</span>
                </div>
                <span className="font-sans px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                  CONSENT VERIFIED
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-[#334155] dark:text-[#CBD5E1]">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Mother:</span>
                  <span className="font-bold">Sunita Patil, 24y (G2P1)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Blood Group:</span>
                  <span className="font-bold text-[#DC2626]">O Rh-Positive</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Pre-Referral Rx:</span>
                  <span className="font-semibold">Inj. MgSO4 4g IV + 10g IM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Vitals:</span>
                  <span>BP: 158/104 | FHR: 138 bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Destination:</span>
                  <span className="font-bold text-[#0F766E] dark:text-[#2DD4BF]">SDH Baramati (CEmONC)</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#DCE7EC] dark:border-[#334155] flex items-center justify-between text-[10px] font-sans">
                <span className="text-[#64748B]">Tamper-evident audit trail</span>
                <span className="text-[#0F766E] dark:text-[#2DD4BF] font-bold">Closed-Loop Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section I: Impact & Clinical Problem — The Three Delays */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#172638] border-b border-[#DCE7EC] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-[#0F766E] dark:text-[#2DD4BF] uppercase tracking-wider">
              Clinical Rationale
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
              {t('problem.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8]">
              {t('problem.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9]">
                {t('delay1.title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t('delay1.desc')}
              </p>
              <div className="pt-2 text-xs font-semibold text-[#0F766E] dark:text-[#2DD4BF] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
                <span>JeevaCare Solves: Real-time verified hospital capabilities &amp; bed readiness</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9]">
                {t('delay2.title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t('delay2.desc')}
              </p>
              <div className="pt-2 text-xs font-semibold text-[#0F766E] dark:text-[#2DD4BF] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
                <span>JeevaCare Solves: 108 Emergency transport dispatch with Google Maps routing</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5F3] text-[#0F766E] flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="font-bold text-base text-[#12304A] dark:text-[#F1F5F9]">
                {t('delay3.title')}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {t('delay3.desc')}
              </p>
              <div className="pt-2 text-xs font-semibold text-[#0F766E] dark:text-[#2DD4BF] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
                <span>JeevaCare Solves: Pre-arrival alerts, reserved bed, OT team &amp; blood prep</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section G: Final Call to Action */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-[#0F766E] via-[#0D635C] to-[#12304A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-teal-100 text-xs font-bold uppercase tracking-wider">
            <HeartPulse className="w-4 h-4 text-[#2DD4BF]" />
            Every Second Counts in Maternal Care
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight max-w-3xl mx-auto">
            Ready to Coordinate Maternal Emergency Referrals with Zero Delay?
          </h2>

          <p className="text-sm sm:text-base text-teal-50/90 max-w-2xl mx-auto leading-relaxed">
            Experience JeevaCare with role-specific portals for ASHA frontline workers, receiving hospital triage, 108 ambulance dispatch, and district health governance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-white text-[#0F766E] hover:bg-[#E8F5F3] font-extrabold text-sm sm:text-base shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <HeartPulse className="w-5 h-5 text-[#0F766E]" />
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold text-sm sm:text-base transition-all cursor-pointer"
            >
              <Layers className="w-5 h-5" />
              <span>Explore Dashboard</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
