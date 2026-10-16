import React, { useState } from 'react';
import { Referral } from '../../types';
import { apiClient } from '../../services/api';
import { useTranslation } from '../../i18n/LanguageContext';
import { Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, X, RefreshCw, ArrowRight } from 'lucide-react';

interface ReferralCopilotModalProps {
  referralData: Partial<Referral>;
  isOpen: boolean;
  onClose: () => void;
  onApplySummary?: (summary: string) => void;
}

export const ReferralCopilotModal: React.FC<ReferralCopilotModalProps> = ({
  referralData,
  isOpen,
  onClose,
  onApplySummary,
}) => {
  const { language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [copilotData, setCopilotData] = useState<any>(null);
  const [sourceEngine, setSourceEngine] = useState<string>('');

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getAiReferralSummary(referralData, language);
      setCopilotData(res.aiOutput);
      setSourceEngine(res.source || 'gemini-3.8-flash');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      runAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12304A]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F766E] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-[#E8F5F3] animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                AI Clinical Referral Copilot
              </h3>
              <p className="text-xs text-[#E8F5F3]/90">
                Dakshata &amp; CEmONC Clinical Decision Support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#0F766E] animate-spin" />
              <p className="font-semibold text-[#12304A] dark:text-[#F1F5F9]">
                Analyzing maternal vitals, danger signs &amp; stabilization checklist...
              </p>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Checking against Govt. of India Maternal Emergency Protocols
              </span>
            </div>
          ) : copilotData ? (
            <>
              {/* Clinical Summary */}
              <div className="p-4 rounded-xl bg-[#E8F5F3] dark:bg-[#203449]/40 border border-[#0F766E]/20 dark:border-[#2DD4BF]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0F766E] dark:text-[#2DD4BF] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                    Structured Handover Summary
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-[#172638] text-[#64748B] dark:text-[#94A3B8] border border-[#DCE7EC] dark:border-[#334155]">
                    Engine: {sourceEngine}
                  </span>
                </div>
                <p className="text-[#334155] dark:text-[#CBD5E1] leading-relaxed font-medium">
                  {copilotData.summary}
                </p>
                {onApplySummary && (
                  <button
                    onClick={() => {
                      onApplySummary(copilotData.summary);
                      onClose();
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0D635C] text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Apply to Referral Clinical Notes <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Danger Signs */}
              {copilotData.dangerSignsIdentified?.length > 0 && (
                <div className="p-4 rounded-xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border border-[#FCA5A5] dark:border-[#DC2626]/40 space-y-2">
                  <span className="font-bold text-[#DC2626] dark:text-[#F87171] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                    Identified Maternal &amp; Neonatal Danger Signs
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#334155] dark:text-[#CBD5E1] text-xs">
                    {copilotData.dangerSignsIdentified.map((sign: string, idx: number) => (
                      <li key={idx} className="font-semibold text-[#DC2626] dark:text-[#F87171]">
                        {sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Fields Checklist */}
              {copilotData.missingCriticalFields?.length > 0 && (
                <div className="p-4 rounded-xl bg-[#FEF3C7] dark:bg-[#78350F]/20 border border-[#FCD34D] dark:border-[#D97706]/40 space-y-2">
                  <span className="font-bold text-[#92400E] dark:text-[#FDE68A] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                    Recommended Verification Before Departure
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#334155] dark:text-[#CBD5E1] text-xs">
                    {copilotData.missingCriticalFields.map((field: string, idx: number) => (
                      <li key={idx}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Receiving Facility Requirements */}
              {copilotData.receivingFacilityRequirements?.length > 0 && (
                <div className="p-4 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 border border-[#BFDBFE] dark:border-[#2563EB]/40 space-y-2">
                  <span className="font-bold text-[#1E40AF] dark:text-[#93C5FD] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                    Required Receiving Facility Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {copilotData.receivingFacilityRequirements.map((req: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-[#172638] border border-[#BFDBFE] dark:border-[#2563EB]/40 font-semibold text-[#2563EB] dark:text-[#60A5FA] text-xs"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-[#64748B] dark:text-[#94A3B8]">
              Unable to generate copilot analysis. Please proceed with standard clinical referral.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F7FAFC] dark:bg-[#101C2C] border-t border-[#DCE7EC] dark:border-[#334155] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
            Clinical guidance only &bull; Does not replace physical physician examination
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#DCE7EC] hover:bg-[#CBD5E1] dark:bg-[#334155] dark:hover:bg-[#475569] font-semibold text-[#12304A] dark:text-[#F1F5F9] cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
