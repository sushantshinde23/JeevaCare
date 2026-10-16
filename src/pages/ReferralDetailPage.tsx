import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReferrals } from '../context/ReferralContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, UrgencyBadge } from '../components/common/StatusBadge';
import { WorkspaceModal } from '../components/workspace/WorkspaceModal';
import { generateReferralPdf } from '../utils/pdfGenerator';
import { driveService } from '../services/drive';
import {
  FileText,
  ArrowLeft,
  Printer,
  Download,
  ShieldCheck,
  Building2,
  Clock,
  User,
  CheckCircle2,
  HeartPulse,
  Mail,
  HardDrive,
  Database,
  Share2,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

export const ReferralDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { referrals, facilities } = useReferrals();
  const { isGoogleConnected, googleUser, firestoreConnected, connectGoogle } = useAuth();

  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [savingDrive, setSavingDrive] = useState(false);
  const [driveResult, setDriveResult] = useState<{ success: boolean; link?: string; msg?: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const referral = referrals.find((r) => r.id === id || r.referralCode === id);
  const receivingFac = facilities.find((f) => f.id === referral?.receivingFacilityId);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleDownloadPdf = async () => {
    if (!referral) return;
    setDownloadingPdf(true);
    try {
      const doc = generateReferralPdf(referral, receivingFac);
      const filename = `JeevaCare_Referral_${referral.referralCode || referral.id}.pdf`;
      doc.save(filename);
      showToast('success', `Referral PDF "${filename}" downloaded successfully!`);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      showToast('error', 'Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleSaveToDrive = async () => {
    if (!referral) return;
    if (!isGoogleConnected) {
      setWorkspaceModalOpen(true);
      return;
    }

    setSavingDrive(true);
    setDriveResult(null);
    try {
      const res = await driveService.exportReferralToDrive(referral);
      if (res.success && res.file) {
        setDriveResult({
          success: true,
          link: res.file.webViewLink,
          msg: `Saved "${res.file.name}" to Google Drive!`,
        });
        showToast('success', `Saved to Google Drive: ${res.file.name}`);
      } else {
        setDriveResult({ success: false, msg: res.error || 'Failed to save to Google Drive.' });
        showToast('error', res.error || 'Failed to save to Google Drive.');
      }
    } catch (err: any) {
      setDriveResult({ success: false, msg: err?.message || 'Error uploading file.' });
      showToast('error', err?.message || 'Error uploading file.');
    } finally {
      setSavingDrive(false);
    }
  };

  const handleSendGmail = () => {
    setWorkspaceModalOpen(true);
  };

  if (!referral) {
    return (
      <div className="min-h-screen py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold">Referral Not Found</h2>
        <Link to="/" className="text-teal-600 underline text-sm">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#101C2C] py-6 sm:py-8 px-3 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Toast Notification Banner */}
        {toastMsg && (
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 no-print ${
              toastMsg.type === 'success'
                ? 'bg-[#E8F5F3] dark:bg-[#203449] border-[#0F766E]/30 text-[#0F766E] dark:text-[#2DD4BF]'
                : 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/40 border-[#FCA5A5] text-[#DC2626] dark:text-[#F87171]'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              )}
              <span>{toastMsg.text}</span>
            </div>
            {driveResult?.link && (
              <a
                href={driveResult.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold underline hover:opacity-80"
              >
                Open in Drive <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <Link
            to={-1 as any}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F766E] dark:hover:text-[#2DD4BF]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white text-xs font-bold shadow-md shadow-[#0F766E]/20 transition-all cursor-pointer disabled:opacity-75"
              title="Download Clinical Referral Record as real PDF"
            >
              {downloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            {/* Print Slip Button */}
            <button
              type="button"
              onClick={handlePrintSlip}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638] text-[#12304A] dark:text-[#F1F5F9] text-xs font-semibold shadow-xs hover:bg-[#E8F5F3] dark:hover:bg-[#203449] transition-all cursor-pointer"
              title="Open Browser Print Dialog"
            >
              <Printer className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" />
              <span>Print Slip</span>
            </button>

            {/* Save to Drive Button */}
            <button
              type="button"
              onClick={handleSaveToDrive}
              disabled={savingDrive}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#BFDBFE] dark:border-[#2563EB]/40 bg-white dark:bg-[#172638] text-[#2563EB] dark:text-[#60A5FA] text-xs font-semibold hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A8A]/30 transition-all cursor-pointer disabled:opacity-75"
              title="Save clinical record to Google Drive"
            >
              {savingDrive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <HardDrive className="w-3.5 h-3.5" />
              )}
              <span>{savingDrive ? 'Uploading...' : 'Save to Drive'}</span>
            </button>

            {/* Send via Gmail Button */}
            <button
              type="button"
              onClick={handleSendGmail}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#FCA5A5] dark:border-[#DC2626]/40 bg-white dark:bg-[#172638] text-[#DC2626] dark:text-[#F87171] text-xs font-semibold hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/30 transition-all cursor-pointer"
              title="Email Referral details via Gmail"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send via Gmail</span>
            </button>
          </div>
        </div>

        {/* Google Workspace & Cloud Sync Quick Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FEF2F2] via-[#EFF6FF] to-[#F5F3FF] dark:from-[#7F1D1D]/20 dark:via-[#1E3A8A]/20 dark:to-[#581C87]/20 border border-[#DCE7EC] dark:border-[#334155] flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white dark:bg-[#172638] shadow-sm border border-[#DCE7EC] dark:border-[#334155]">
              <Mail className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#12304A] dark:text-[#F1F5F9] flex items-center gap-2">
                Google Workspace &amp; Firebase Realtime Sync
                {firestoreConnected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-[#14532D]/40 text-[#15803D] dark:text-[#BBF7D0] font-semibold">
                    Synced
                  </span>
                )}
              </h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {isGoogleConnected
                  ? `Connected: ${googleUser?.email} • Ready to send emergency email and export to Drive`
                  : 'Connect Gmail & Google Drive to notify hospitals and backup patient charts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWorkspaceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638] text-xs font-semibold text-[#12304A] dark:text-[#CBD5E1] hover:bg-[#E8F5F3] dark:hover:bg-[#203449] transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#0F766E]" />
              Manage Workspace Sync
            </button>
          </div>
        </div>

        {/* Slip Card (Official Medical Referral Slip) */}
        <div className="print-slip-container p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xl space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Slip Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7EC] dark:border-[#334155] print-avoid-break">
            <div>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-6 h-6 text-[#0F766E] dark:text-[#2DD4BF]" />
                <span className="font-extrabold text-lg text-[#12304A] dark:text-[#F1F5F9]">
                  JeevaCare &bull; Clinical Referral Record
                </span>
              </div>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono mt-0.5 block">
                Record ID: {referral.referralCode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={referral.status} />
              <UrgencyBadge urgency={referral.urgency} />
            </div>
          </div>

          {/* Receiving Facility Banner */}
          <div className="p-4 rounded-2xl bg-[#E8F5F3] dark:bg-[#203449] border border-[#0F766E]/20 dark:border-[#2DD4BF]/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF] shrink-0" />
              <div>
                <span className="text-[#64748B] dark:text-[#94A3B8] block">Receiving Health Facility</span>
                <span className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                  {referral.receivingFacilityName}
                </span>
                {receivingFac && (
                  <span className="text-[11px] text-[#0F766E] dark:text-[#2DD4BF] block mt-0.5">
                    {receivingFac.address} &bull; Hotline: {receivingFac.emergencyHelpline}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#E8F5F3] dark:bg-[#172638] text-[#0F766E] dark:text-[#2DD4BF] font-semibold border border-[#0F766E]/30">
              Verified First Referral Unit
            </span>
          </div>

          {/* Patient Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449]/50 text-xs border border-[#DCE7EC] dark:border-[#334155]">
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block">Patient Name</span>
              <span className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                {referral.patient.name}
              </span>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block">Age / Blood Group</span>
              <span className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                {referral.patient.age} yrs &bull; {referral.patient.bloodGroup || 'O+'}
              </span>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block">Obstetric History</span>
              <span className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9]">
                G{referral.patient.gravida}P{referral.patient.parity} at {referral.patient.gestationalWeeks}w
              </span>
            </div>
            <div>
              <span className="text-[#64748B] dark:text-[#94A3B8] block">RCH ID</span>
              <span className="font-bold text-sm text-[#12304A] dark:text-[#F1F5F9] font-mono">
                {referral.patient.rchId || 'MH-PUN-PENDING'}
              </span>
            </div>
          </div>

          {/* Clinical Presentation & Vitals */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              Emergency Presentation &amp; Triage Vitals
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638]">
                <span className="text-[#64748B] dark:text-[#94A3B8] block text-[10px]">Category</span>
                <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                  {referral.emergencyCategory.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638]">
                <span className="text-[#64748B] dark:text-[#94A3B8] block text-[10px]">Blood Pressure</span>
                <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                  {referral.vitals.systolicBP || '--'}/{referral.vitals.diastolicBP || '--'} mmHg
                </span>
              </div>
              <div className="p-3 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638]">
                <span className="text-[#64748B] dark:text-[#94A3B8] block text-[10px]">Pulse Rate</span>
                <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                  {referral.vitals.pulseRate || '--'} bpm
                </span>
              </div>
              <div className="p-3 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-white dark:bg-[#172638]">
                <span className="text-[#64748B] dark:text-[#94A3B8] block text-[10px]">Fetal Heart Rate</span>
                <span className="font-bold text-[#0F766E] dark:text-[#2DD4BF]">
                  {referral.vitals.fetalHeartRate || '--'} bpm
                </span>
              </div>
            </div>
          </div>

          {/* Pre-referral Treatments */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              Pre-Referral Stabilization Checklist
            </h4>
            <div className="p-4 rounded-2xl bg-[#F7FAFC] dark:bg-[#203449]/50 text-xs space-y-1.5 border border-[#DCE7EC] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    referral.preReferralTreatment.magnesiumSulfateGiven
                      ? 'text-[#15803D]'
                      : 'text-[#64748B]'
                  }`}
                />
                <span>
                  <strong>Inj. Magnesium Sulfate Loading Dose:</strong>{' '}
                  {referral.preReferralTreatment.magnesiumSulfateDose ||
                    (referral.preReferralTreatment.magnesiumSulfateGiven
                      ? 'Administered per Pritchard protocol'
                      : 'Not given')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    referral.preReferralTreatment.ivCannulaSecured
                      ? 'text-[#15803D]'
                      : 'text-[#64748B]'
                  }`}
                />
                <span>
                  <strong>IV Line &amp; Fluids:</strong>{' '}
                  {referral.preReferralTreatment.ivFluidsStarted || 'Ringer Lactate running'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    referral.preReferralTreatment.oxygenAdministered
                      ? 'text-[#15803D]'
                      : 'text-[#64748B]'
                  }`}
                />
                <span>
                  <strong>Oxygen Support:</strong>{' '}
                  {referral.preReferralTreatment.oxygenAdministered ? 'Administered' : 'Not required'}
                </span>
              </div>
            </div>
          </div>

          {/* Closed-Loop Audit History Timeline */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              Closed-Loop Event History &amp; Audit Trail
            </h4>
            <div className="space-y-2 border-l-2 border-[#0F766E] pl-4 ml-2 text-xs">
              {referral.statusHistory.map((evt) => (
                <div key={evt.id} className="relative pb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0F766E] absolute -left-[21px] top-1" />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#12304A] dark:text-[#F1F5F9]">
                      {evt.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#334155] dark:text-[#CBD5E1] mt-0.5">
                    Actor: <strong>{evt.actorName}</strong> ({evt.actorRole})
                  </p>
                  {evt.note && <p className="text-[#64748B] dark:text-[#94A3B8] italic mt-0.5">&ldquo;{evt.note}&rdquo;</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Google Workspace & Cloud Sync Modal */}
      <WorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        referral={referral}
      />
    </div>
  );
};
