import React, { useState } from 'react';
import { useReferrals } from '../context/ReferralContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Facility } from '../types';
import { EmergencyMap } from '../components/maps/EmergencyMap';
import {
  Building2,
  ShieldCheck,
  Search,
  Filter,
  Phone,
  ExternalLink,
  Bed,
  Droplet,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Baby,
} from 'lucide-react';

export const FacilitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const { facilities } = useReferrals();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCEmONC, setFilterCEmONC] = useState(false);
  const [filterBloodBank, setFilterBloodBank] = useState(false);
  const [filterSNCU, setFilterSNCU] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(facilities[0] || null);

  const filteredFacilities = facilities.filter((fac) => {
    if (filterCEmONC && !fac.hasCEmONC) return false;
    if (filterBloodBank && !fac.hasBloodBank) return false;
    if (filterSNCU && !fac.hasSNCU) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = fac.name.toLowerCase().includes(q);
      const matchDistrict = fac.district.toLowerCase().includes(q);
      const matchTehsil = fac.tehsil.toLowerCase().includes(q);
      const matchType = fac.type.toLowerCase().includes(q);
      return matchName || matchDistrict || matchTehsil || matchType;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#101C2C] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-[#0F766E] dark:text-[#2DD4BF]" />
              {t('facilities.title')}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
              {t('facilities.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-[#E8F5F3] dark:bg-[#203449] border border-[#0F766E]/20 dark:border-[#2DD4BF]/30 text-[#0F766E] dark:text-[#2DD4BF] text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0F766E] dark:text-[#2DD4BF]" />
              {facilities.filter((f) => f.isVerified).length} DHS Verified
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by hospital name, tehsil (e.g. Khed, Shirur, Baramati), or district..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-xs sm:text-sm text-[#12304A] dark:text-[#CBD5E1] placeholder-[#64748B] focus:ring-2 focus:ring-[#0F766E] outline-none"
              />
            </div>

            {/* Capability Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterCEmONC(!filterCEmONC)}
                className={`px-3 py-2 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterCEmONC
                    ? 'bg-[#0F766E] text-white border-[#0D635C] shadow-xs'
                    : 'bg-[#F7FAFC] dark:bg-[#203449] text-[#334155] dark:text-[#CBD5E1] border-[#DCE7EC] dark:border-[#334155] hover:bg-[#E8F5F3]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                CEmONC (C-Section)
              </button>

              <button
                type="button"
                onClick={() => setFilterBloodBank(!filterBloodBank)}
                className={`px-3 py-2 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterBloodBank
                    ? 'bg-[#DC2626] text-white border-[#B91C1C] shadow-xs'
                    : 'bg-[#F7FAFC] dark:bg-[#203449] text-[#334155] dark:text-[#CBD5E1] border-[#DCE7EC] dark:border-[#334155] hover:bg-[#E8F5F3]'
                }`}
              >
                <Droplet className="w-3.5 h-3.5" />
                Blood Bank / Storage
              </button>

              <button
                type="button"
                onClick={() => setFilterSNCU(!filterSNCU)}
                className={`px-3 py-2 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterSNCU
                    ? 'bg-[#2563EB] text-white border-[#1D4ED8] shadow-xs'
                    : 'bg-[#F7FAFC] dark:bg-[#203449] text-[#334155] dark:text-[#CBD5E1] border-[#DCE7EC] dark:border-[#334155] hover:bg-[#E8F5F3]'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                SNCU / NICU
              </button>
            </div>
          </div>
        </div>

        {/* Map & List Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Facilities List (5 cols) */}
          <div className="lg:col-span-5 space-y-4 max-h-[680px] overflow-y-auto pr-1">
            <div className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Matching Hospitals ({filteredFacilities.length})
            </div>

            {filteredFacilities.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8]">
                No facilities matching selected criteria.
              </div>
            ) : (
              filteredFacilities.map((fac) => {
                const isSelected = selectedFacility?.id === fac.id;
                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac)}
                    className={`p-5 rounded-2xl bg-white dark:bg-[#172638] border transition-all cursor-pointer shadow-xs space-y-3 ${
                      isSelected
                        ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 dark:border-[#2DD4BF]'
                        : 'border-[#DCE7EC] dark:border-[#334155] hover:border-[#0F766E]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9] leading-snug">
                          {fac.name}
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                          {fac.tehsil}, {fac.district}
                        </p>
                      </div>
                      {fac.isVerified && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5F3] text-[#0F766E] dark:bg-[#203449] dark:text-[#2DD4BF]">
                          <ShieldCheck className="w-3 h-3 text-[#0F766E] dark:text-[#2DD4BF]" /> Verified
                        </span>
                      )}
                    </div>

                    {/* Capabilities Tags */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {fac.hasCEmONC ? (
                        <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#BBF7D0] font-bold">
                          CEmONC (C-Section)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#F7FAFC] text-[#64748B] dark:bg-[#203449] dark:text-[#94A3B8]">
                          BEmONC Only
                        </span>
                      )}
                      {fac.hasBloodBank && (
                        <span className="px-2 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] dark:bg-[#7F1D1D]/40 dark:text-[#FECACA] font-bold flex items-center gap-0.5">
                          <Droplet className="w-2.5 h-2.5" /> Blood Bank
                        </span>
                      )}
                      {fac.hasSNCU && (
                        <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E3A8A]/40 dark:text-[#BFDBFE] font-bold">
                          SNCU Ready
                        </span>
                      )}
                    </div>

                    {/* Live Bed Count */}
                    <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[#F7FAFC] dark:bg-[#203449]/60 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Labor Beds</span>
                        <span className="font-extrabold text-[#0F766E] dark:text-[#2DD4BF]">
                          {fac.laborBedsAvailable}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">ICU Beds</span>
                        <span className="font-extrabold text-[#12304A] dark:text-[#F1F5F9]">
                          {fac.icuBedsAvailable}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">SNCU Beds</span>
                        <span className="font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
                          {fac.sncuBedsAvailable}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#DCE7EC] dark:border-[#334155] text-xs">
                      <a
                        href={`tel:${fac.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" /> {fac.phone}
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${fac.coordinates.lat},${fac.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Google Maps
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive Google Map (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Interactive Emergency Geography
            </div>
            <div className="sticky top-20">
              <EmergencyMap
                facilities={filteredFacilities}
                selectedFacilityId={selectedFacility?.id}
                onSelectFacility={(fac) => setSelectedFacility(fac)}
                height="620px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
