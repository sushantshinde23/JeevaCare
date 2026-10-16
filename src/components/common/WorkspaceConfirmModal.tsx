import React from 'react';
import { AlertTriangle, Send, FileUp, Trash2, X } from 'lucide-react';

interface WorkspaceConfirmModalProps {
  isOpen: boolean;
  title: string;
  actionType: 'send_email' | 'upload_drive' | 'delete_drive';
  targetSummary: string;
  details?: string[];
  confirmLabel?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WorkspaceConfirmModal: React.FC<WorkspaceConfirmModalProps> = ({
  isOpen,
  title,
  actionType,
  targetSummary,
  details = [],
  confirmLabel,
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (actionType) {
      case 'send_email':
        return <Send className="w-6 h-6 text-red-600" />;
      case 'upload_drive':
        return <FileUp className="w-6 h-6 text-blue-600" />;
      case 'delete_drive':
        return <Trash2 className="w-6 h-6 text-red-600" />;
    }
  };

  const defaultButtonLabel = () => {
    switch (actionType) {
      case 'send_email':
        return 'Confirm & Send Email';
      case 'upload_drive':
        return 'Confirm & Save to Drive';
      case 'delete_drive':
        return 'Confirm & Delete';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12304A]/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden p-6">
        <div className="flex items-start justify-between pb-3 border-b border-[#DCE7EC] dark:border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F7FAFC] dark:bg-[#101C2C]">{getIcon()}</div>
            <div>
              <h3 className="text-lg font-bold text-[#12304A] dark:text-[#F1F5F9]">{title}</h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Google Workspace User Confirmation</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1.5 text-[#64748B] hover:text-[#12304A] dark:hover:text-[#F1F5F9] rounded-lg hover:bg-[#DCE7EC]/50 dark:hover:bg-[#334155] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="p-3.5 bg-[#FEF3C7] dark:bg-[#78350F]/20 border border-[#FCD34D] dark:border-[#D97706]/40 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div className="text-xs text-[#92400E] dark:text-[#FDE68A] leading-relaxed">
              <strong>User Authorization Required:</strong> This action will interact with your authorized Google
              account on your behalf.
            </div>
          </div>

          <p className="text-sm text-[#334155] dark:text-[#CBD5E1] font-medium">{targetSummary}</p>

          {details.length > 0 && (
            <div className="bg-[#F7FAFC] dark:bg-[#101C2C]/70 p-3 rounded-xl border border-[#DCE7EC] dark:border-[#334155] space-y-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
              {details.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]"></span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE7EC] dark:border-[#334155]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] text-sm font-semibold text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F7FAFC] dark:hover:bg-[#101C2C] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition flex items-center gap-2 cursor-pointer ${
              actionType === 'delete_drive'
                ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                : 'bg-[#0F766E] hover:bg-[#0D635C]'
            } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? 'Processing...' : confirmLabel || defaultButtonLabel()}
          </button>
        </div>
      </div>
    </div>
  );
};
