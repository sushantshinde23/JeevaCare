import React, { useState } from 'react';
import { useReferrals } from '../../context/ReferralContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, offlineDraftCount, syncOffline } = useReferrals();
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncOffline();
      setSyncMsg(`Successfully synced ${res.synced} referral(s)!`);
      setTimeout(() => setSyncMsg(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && offlineDraftCount === 0 && !syncMsg) {
    return null;
  }

  return (
    <div className={`px-4 py-2 text-xs md:text-sm font-medium transition-colors ${
      !isOnline
        ? 'bg-[#D97706] text-white'
        : syncMsg
        ? 'bg-[#15803D] text-white'
        : 'bg-[#0F766E] text-white'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
              <span>{t('offline.warning')}</span>
            </>
          ) : syncMsg ? (
            <>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{syncMsg}</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 shrink-0 text-[#2DD4BF]" />
              <span>{offlineDraftCount} {t('offline.syncCount')}</span>
            </>
          )}
        </div>

        {isOnline && offlineDraftCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#0F766E] text-xs font-bold rounded-md shadow-xs hover:bg-[#E8F5F3] disabled:opacity-75 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : t('btn.syncOffline')}
          </button>
        )}
      </div>
    </div>
  );
};
