import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { HeartPulse, PhoneCall, ShieldCheck, AlertTriangle } from 'lucide-react';
import { JeevaCareLogo } from './JeevaCareLogo';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  if (location.pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <footer className="bg-[#12304A] text-slate-300 border-t border-[#101C2C] text-xs">
      {/* Emergency Helpline Strip */}
      <div className="bg-[#DC2626]/20 border-b border-[#DC2626]/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex items-center gap-2 text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{t('emergency.title')}</span>
            <span className="text-slate-400 hidden sm:inline">- {t('emergency.note')}</span>
          </div>
          <div className="flex items-center gap-4 font-bold text-white">
            <a href="tel:108" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-all shadow-xs">
              <PhoneCall className="w-3.5 h-3.5" /> 108 Ambulance
            </a>
            <a href="tel:104" className="hover:text-rose-300 transition-colors">104 Health Helpline</a>
            <a href="tel:102" className="hover:text-rose-300 transition-colors">102 Janani Shishu</a>
            <a href="tel:181" className="hover:text-rose-300 transition-colors">181 Women's Helpline</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <JeevaCareLogo variant="horizontal" size="sm" showTagline={false} inverted={true} />
            <p className="text-slate-300/80 text-xs leading-relaxed">
              Closed-loop emergency referral, transport and healthcare coordination platform for maternal and neonatal survival across rural and urban India.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#2DD4BF]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dakshata &amp; CEmONC Standards Aligned</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Referral Network</h4>
            <ul className="space-y-2 text-slate-300/80">
              <li><Link to="/facilities" className="hover:text-[#2DD4BF] transition-colors">Verified First Referral Units (FRU)</Link></li>
              <li><Link to="/dashboard" className="hover:text-[#2DD4BF] transition-colors">Comprehensive Care Dashboard</Link></li>
              <li><Link to="/dashboard/health_worker" className="hover:text-[#2DD4BF] transition-colors">Frontline ASHA/ANM Portal</Link></li>
              <li><Link to="/dashboard/hospital_coordinator" className="hover:text-[#2DD4BF] transition-colors">Receiving Hospital Triage</Link></li>
              <li><Link to="/dashboard/transport_coordinator" className="hover:text-[#2DD4BF] transition-colors">108 Ambulance Dispatch</Link></li>
              <li><Link to="/dashboard/admin" className="hover:text-[#2DD4BF] transition-colors">District Analytics &amp; Bottlenecks</Link></li>
            </ul>
          </div>

          {/* Clinical Protocols */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Clinical Guidelines</h4>
            <ul className="space-y-2 text-slate-300/80">
              <li>Pritchard Protocol for Eclampsia</li>
              <li>Active Management of 3rd Stage Labor (AMTSL)</li>
              <li>Shock Index &amp; PPH Blood Match Protocols</li>
              <li>Basic &amp; Comprehensive EmONC Standards</li>
              <li>Special Newborn Care Unit (SNCU) Triage</li>
            </ul>
          </div>

          {/* Governance & Privacy */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Governance &amp; Privacy</h4>
            <ul className="space-y-2 text-slate-300/80">
              <li><span className="text-white font-medium">Data Privacy:</span> Least-privilege role separation</li>
              <li><span className="text-white font-medium">Audit Trail:</span> Immutable closed-loop timestamps</li>
              <li><span className="text-white font-medium">Synthetic Data:</span> Demo records clearly labelled</li>
              <li><span className="text-white font-medium">Coverage Notice:</span> Service availability confirmed locally</li>
            </ul>
          </div>
        </div>

        {/* Clinical Disclaimer */}
        <div className="pt-6 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-2 leading-relaxed">
          <p>
            <strong className="text-slate-200">Important Medical &amp; Operational Notice:</strong> {t('footer.disclaimer')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-slate-400">
            <span>&copy; {new Date().getFullYear()} JeevaCare. Every Mother. Every Newborn. Every Second Counts.</span>
            <div className="flex items-center gap-4">
              <span>{t('footer.privacy')}</span>
              <span>&bull;</span>
              <span>{t('footer.terms')}</span>
              <span>&bull;</span>
              <span>{t('footer.contact')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
