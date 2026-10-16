import React from 'react';
import { ReferralStatus, TriageUrgency } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { AlertCircle, Clock, CheckCircle2, Truck, CheckCheck, XCircle } from 'lucide-react';

export const StatusBadge: React.FC<{ status: ReferralStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const { t } = useTranslation();

  const getStyle = () => {
    switch (status) {
      case 'SUBMITTED':
      case 'AWAITING_ACKNOWLEDGEMENT':
        return 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] dark:bg-[#78350F]/40 dark:text-[#FDE68A] dark:border-[#B45309]';
      case 'ACKNOWLEDGED':
        return 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE] dark:bg-[#1E3A8A]/40 dark:text-[#DBEAFE] dark:border-[#2563EB]';
      case 'ACCEPTED':
        return 'bg-[#E8F5F3] text-[#0F766E] border-[#A7F3D0] dark:bg-[#064E3B]/40 dark:text-[#A7F3D0] dark:border-[#0F766E]';
      case 'TRANSPORT_REQUESTED':
      case 'TRANSPORT_ASSIGNED':
      case 'IN_TRANSIT':
        return 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD] dark:border-[#2563EB]';
      case 'ARRIVED':
        return 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE] dark:bg-[#581C87]/40 dark:text-[#E9D5FF] dark:border-[#7E22CE]';
      case 'HANDOVER_COMPLETED':
      case 'CLOSED':
        return 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] dark:bg-[#14532D]/40 dark:text-[#BBF7D0] dark:border-[#15803D]';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5] dark:bg-[#7F1D1D]/40 dark:text-[#FECACA] dark:border-[#DC2626]';
      default:
        return 'bg-[#F7FAFC] text-[#334155] border-[#DCE7EC] dark:bg-[#203449] dark:text-[#CBD5E1] dark:border-[#334155]';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'SUBMITTED':
      case 'AWAITING_ACKNOWLEDGEMENT':
        return <Clock className="w-3.5 h-3.5 animate-pulse text-[#D97706]" />;
      case 'ACCEPTED':
      case 'ACKNOWLEDGED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" />;
      case 'IN_TRANSIT':
      case 'TRANSPORT_ASSIGNED':
        return <Truck className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'HANDOVER_COMPLETED':
      case 'CLOSED':
        return <CheckCheck className="w-3.5 h-3.5 text-[#15803D]" />;
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-[#64748B]" />;
    }
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs ${pad} ${getStyle()}`}>
      {getIcon()}
      <span>{t(`status.${status}`, status)}</span>
    </span>
  );
};

export const UrgencyBadge: React.FC<{ urgency: TriageUrgency }> = ({ urgency }) => {
  const { t } = useTranslation();

  const getStyle = () => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-[#DC2626] text-white border-[#B91C1C] dark:bg-[#DC2626] dark:border-[#991B1B] animate-pulse';
      case 'HIGH':
        return 'bg-[#D97706] text-white border-[#B45309] dark:bg-[#D97706] dark:border-[#92400E]';
      case 'MODERATE':
        return 'bg-[#2563EB] text-white border-[#1D4ED8] dark:bg-[#2563EB] dark:border-[#1E40AF]';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md shadow-xs border ${getStyle()}`}>
      <AlertCircle className="w-3 h-3" />
      {t(`urgency.${urgency}`, urgency)}
    </span>
  );
};
