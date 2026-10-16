import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Referral } from '../../types';
import { gmailService, buildReferralEmailContent, GmailMessage } from '../../services/gmail';
import { driveService, DriveFileItem } from '../../services/drive';
import { WorkspaceConfirmModal } from '../common/WorkspaceConfirmModal';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import {
  Mail,
  HardDrive,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  Send,
  X,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral?: Referral | null;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose, referral }) => {
  const { user, googleUser, isGoogleConnected, connectGoogle, disconnectGoogle, firestoreConnected } = useAuth();

  const [activeTab, setActiveTab] = useState<'gmail' | 'drive' | 'drive_browser' | 'cloud_sync'>('gmail');
  const [connecting, setConnecting] = useState(false);

  // Gmail form state
  const [emailRecipient, setEmailRecipient] = useState<string>('hospital.emergency@maatricare.org');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [recentEmails, setRecentEmails] = useState<GmailMessage[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);

  // Drive state
  const [driveSaving, setDriveSaving] = useState(false);
  const [savedDriveFile, setSavedDriveFile] = useState<DriveFileItem | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Confirm Modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    actionType: 'send_email' | 'upload_drive' | 'delete_drive';
    summary: string;
    details: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    actionType: 'send_email',
    summary: '',
    details: [],
    onConfirm: () => {},
  });

  // Pre-fill email when referral changes
  useEffect(() => {
    if (referral) {
      const emailContent = buildReferralEmailContent(referral, user?.name || 'Healthcare Worker', user?.role || 'health_worker');
      setEmailSubject(emailContent.subject);
      setEmailBody(emailContent.bodyHtml);
      setEmailRecipient(`${referral.receivingFacilityName.toLowerCase().replace(/[^a-z0-9]/g, '')}@emergency.gov.in`);
    } else {
      setEmailSubject('[MaatriCare AI] Maternal Care Health Alert');
      setEmailRecipient('coordinator@nhm.gov.in');
    }
  }, [referral, user]);

  // Load emails & drive files when authenticated
  useEffect(() => {
    if (isOpen && isGoogleConnected) {
      fetchDriveFiles();
      fetchRecentEmails();
    }
  }, [isOpen, isGoogleConnected]);

  const fetchDriveFiles = async () => {
    setLoadingDriveFiles(true);
    try {
      const files = await driveService.listAppFiles();
      setDriveFiles(files);
    } finally {
      setLoadingDriveFiles(false);
    }
  };

  const fetchRecentEmails = async () => {
    setLoadingEmails(true);
    try {
      const msgs = await gmailService.listReferralEmails();
      setRecentEmails(msgs);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnecting(true);
    try {
      await connectGoogle();
    } finally {
      setConnecting(false);
    }
  };

  // Trigger Send Email with mandatory confirmation
  const initiateSendEmail = () => {
    if (!emailRecipient) return;

    setConfirmModalState({
      isOpen: true,
      title: 'Confirm Sending Email via Gmail',
      actionType: 'send_email',
      summary: `Send maternal emergency referral dispatch email to "${emailRecipient}"?`,
      details: [
        `Subject: ${emailSubject}`,
        `Sender: ${googleUser?.email || 'Authorized User'}`,
        `Patient: ${referral ? referral.patient.name : 'Emergency Alert'}`,
        'Includes vital clinical signs, triage urgency, and pre-referral medication',
      ],
      onConfirm: executeSendEmail,
    });
  };

  const executeSendEmail = async () => {
    setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
    setEmailSending(true);
    setEmailStatus(null);

    try {
      const res = await gmailService.sendEmail({
        to: emailRecipient,
        subject: emailSubject,
        bodyHtml: emailBody,
        referralId: referral?.id,
      });

      if (res.success) {
        setEmailStatus({
          success: true,
          msg: `Emergency alert email successfully sent via Gmail! (Message ID: ${res.messageId})`,
        });
        fetchRecentEmails();
      } else {
        setEmailStatus({ success: false, msg: res.error || 'Failed to send email.' });
      }
    } catch (err: any) {
      setEmailStatus({ success: false, msg: err.message || 'Error executing Gmail send.' });
    } finally {
      setEmailSending(false);
    }
  };

  // Trigger Export to Drive with mandatory confirmation
  const initiateSaveToDrive = () => {
    if (!referral) return;

    setConfirmModalState({
      isOpen: true,
      title: 'Confirm Export to Google Drive',
      actionType: 'upload_drive',
      summary: `Export clinical referral record for "${referral.patient.name}" to Google Drive?`,
      details: [
        `File: MaatriCare_Referral_${referral.referralCode}_${referral.patient.name.replace(/\s+/g, '_')}.txt`,
        'Location: Folder "MaatriCare AI - Referral Records"',
        'Content: Complete obstetric profile, danger signs, vitals, pre-referral stabilization, and AI copilot assessment',
      ],
      onConfirm: executeSaveToDrive,
    });
  };

  const executeSaveToDrive = async () => {
    if (!referral) return;
    setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
    setDriveSaving(true);
    setDriveStatus(null);

    try {
      const res = await driveService.exportReferralToDrive(referral);
      if (res.success && res.file) {
        setSavedDriveFile(res.file);
        setDriveStatus({
          success: true,
          msg: `Successfully saved "${res.file.name}" to Google Drive!`,
        });
        fetchDriveFiles();
      } else {
        setDriveStatus({ success: false, msg: res.error || 'Failed to export to Google Drive.' });
      }
    } catch (err: any) {
      setDriveStatus({ success: false, msg: err.message || 'Error uploading file.' });
    } finally {
      setDriveSaving(false);
    }
  };

  // Delete Drive file with mandatory confirmation
  const initiateDeleteFile = (file: DriveFileItem) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Confirm Deletion from Google Drive',
      actionType: 'delete_drive',
      summary: `Permanently delete file "${file.name}" from your Google Drive?`,
      details: [
        `File ID: ${file.id}`,
        `Created: ${file.createdTime ? new Date(file.createdTime).toLocaleString() : 'N/A'}`,
        'This action removes the record from Google Drive and cannot be undone.',
      ],
      onConfirm: () => executeDeleteFile(file.id),
    });
  };

  const executeDeleteFile = async (fileId: string) => {
    setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
    try {
      const res = await driveService.deleteFile(fileId);
      if (res.success) {
        setDriveFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        alert(res.error || 'Failed to delete file');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#12304A]/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#101C2C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F766E] p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-white dark:bg-[#172638] rounded-[10px] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#0F766E]" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#12304A] dark:text-[#F1F5F9] flex items-center gap-2">
                  Google Workspace &amp; Cloud Sync
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8F5F3] dark:bg-[#203449] text-[#0F766E] dark:text-[#2DD4BF] font-semibold border border-[#0F766E]/20 dark:border-[#2DD4BF]/20">
                    Active
                  </span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Gmail Emergency Alerts &bull; Google Drive Medical Records &bull; Live Firestore Database
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#64748B] hover:text-[#12304A] dark:hover:text-[#F1F5F9] rounded-lg hover:bg-[#DCE7EC]/50 dark:hover:bg-[#334155] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Account Status Bar */}
          <div className="px-6 py-3 bg-[#F7FAFC] dark:bg-[#101C2C]/70 border-b border-[#DCE7EC] dark:border-[#334155] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Google Account:</span>
              {isGoogleConnected ? (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-[#14532D]/40 text-[#15803D] dark:text-[#BBF7D0] font-medium flex items-center gap-1 border border-[#86EFAC] dark:border-[#15803D]/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                    {googleUser?.email || 'Connected'}
                  </span>
                  <button
                    onClick={disconnectGoogle}
                    className="text-[#64748B] hover:text-[#DC2626] underline text-[11px] cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[#D97706] dark:text-[#FBBF24] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Not Connected
                  </span>
                  <GoogleSignInButton
                    onClick={handleConnectGoogle}
                    isLoading={connecting}
                    label="Connect Google"
                    className="text-xs py-1 px-2.5 h-7"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Firestore:</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#93C5FD] font-medium flex items-center gap-1 border border-[#BFDBFE] dark:border-[#2563EB]/40">
                <Database className="w-3 h-3 text-[#2563EB]" />
                {firestoreConnected ? 'Live Enterprise DB' : 'Connecting'}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#DCE7EC] dark:border-[#334155] px-6 gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('gmail')}
              className={`py-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'gmail'
                  ? 'border-[#0F766E] text-[#0F766E] dark:text-[#2DD4BF]'
                  : 'border-transparent text-[#64748B] hover:text-[#12304A] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <Mail className="w-4 h-4" />
              Send Referral via Gmail
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`py-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'drive'
                  ? 'border-[#0F766E] text-[#0F766E] dark:text-[#2DD4BF]'
                  : 'border-transparent text-[#64748B] hover:text-[#12304A] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              Export to Google Drive
            </button>
            <button
              onClick={() => setActiveTab('drive_browser')}
              className={`py-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'drive_browser'
                  ? 'border-[#0F766E] text-[#0F766E] dark:text-[#2DD4BF]'
                  : 'border-transparent text-[#64748B] hover:text-[#12304A] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Drive Records ({driveFiles.length})
            </button>
            <button
              onClick={() => setActiveTab('cloud_sync')}
              className={`py-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'cloud_sync'
                  ? 'border-[#0F766E] text-[#0F766E] dark:text-[#2DD4BF]'
                  : 'border-transparent text-[#64748B] hover:text-[#12304A] dark:hover:text-[#F1F5F9]'
              }`}
            >
              <Database className="w-4 h-4" />
              Firebase Details
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {!isGoogleConnected && (activeTab === 'gmail' || activeTab === 'drive' || activeTab === 'drive_browser') && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-bold">Google Workspace Authorization Required</p>
                    <p>Connect your Google account to send emails via Gmail and save records to Google Drive.</p>
                  </div>
                </div>
                <GoogleSignInButton onClick={handleConnectGoogle} isLoading={connecting} label="Sign in" />
              </div>
            )}

            {/* TAB: GMAIL */}
            {activeTab === 'gmail' && (
              <div className="space-y-4">
                {emailStatus && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                      emailStatus.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-900 dark:text-red-200'
                    }`}
                  >
                    {emailStatus.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <span>{emailStatus.msg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Healthcare Email:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      placeholder="e.g. sassoon.emergency@gov.in, dr.deshmukh@hospital.org"
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <select
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <option value="">Quick Presets</option>
                      <option value="sassoon.cemonc.icu@gov.in">B.J. Sassoon Hospital CEmONC</option>
                      <option value="aundh.district.maternal@gov.in">District Hospital Aundh</option>
                      <option value="baramati.fru.emergency@gov.in">FRU Baramati Hospital</option>
                      <option value="108.ambulance.pilot@emri.org">108 Ambulance Dispatch Control</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Line:
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Preview (RFC 2822 HTML Format):
                  </label>
                  <div
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 max-h-56 overflow-y-auto leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: emailBody }}
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Sender: <span className="font-semibold">{googleUser?.email || 'Google User'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={initiateSendEmail}
                    disabled={!isGoogleConnected || emailSending}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" />
                    {emailSending ? 'Sending via Gmail...' : 'Send Emergency Referral Email'}
                  </button>
                </div>

                {/* Sent Communication History */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Recent Gmail Referral Logs
                    </h4>
                    <button
                      onClick={fetchRecentEmails}
                      disabled={loadingEmails || !isGoogleConnected}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingEmails ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                  </div>
                  {recentEmails.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No recent Gmail referral emails found in inbox/sent.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {recentEmails.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between"
                        >
                          <div className="truncate mr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{msg.subject}</span>
                            <span className="text-slate-400 block text-[10px]">{msg.to || msg.from}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{msg.date?.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: GOOGLE DRIVE */}
            {activeTab === 'drive' && (
              <div className="space-y-4">
                {driveStatus && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                      driveStatus.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-900 dark:text-red-200'
                    }`}
                  >
                    {driveStatus.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <span>{driveStatus.msg}</span>
                  </div>
                )}

                {referral ? (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            MaatriCare_Referral_{referral.referralCode}_{referral.patient.name.replace(/\s+/g, '_')}.txt
                          </h4>
                          <p className="text-xs text-slate-500">
                            Obstetric Record • Vitals • Stabilization • AI Clinical Summary
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                        {referral.urgency}
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <div>
                        <strong>Patient:</strong> {referral.patient.name} ({referral.patient.age} yrs, G
                        {referral.patient.gravida || 1}P{referral.patient.parity || 0})
                      </div>
                      <div>
                        <strong>Primary Emergency:</strong> {referral.emergencyCategory.replace(/_/g, ' ')}
                      </div>
                      <div>
                        <strong>Receiving Facility:</strong> {referral.receivingFacilityName}
                      </div>
                      <div>
                        <strong>Target Drive Folder:</strong> "MaatriCare AI - Referral Records"
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      {savedDriveFile?.webViewLink ? (
                        <a
                          href={savedDriveFile.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Record in Google Drive
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Ready to sync to Google Drive</span>
                      )}

                      <button
                        type="button"
                        onClick={initiateSaveToDrive}
                        disabled={!isGoogleConnected || driveSaving}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                      >
                        <HardDrive className="w-4 h-4" />
                        {driveSaving ? 'Saving to Drive...' : 'Export to Google Drive'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Select a referral from the dashboard or detail view to export its clinical record to Google Drive.
                  </div>
                )}
              </div>
            )}

            {/* TAB: BROWSE DRIVE RECORDS */}
            {activeTab === 'drive_browser' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Files in Google Drive (Folder: MaatriCare AI - Referral Records)
                  </h4>
                  <button
                    onClick={fetchDriveFiles}
                    disabled={loadingDriveFiles || !isGoogleConnected}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingDriveFiles ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {driveFiles.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs space-y-2">
                    <HardDrive className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                    <p>No referral documents exported to Google Drive yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Use the "Export to Google Drive" tab to backup patient records.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</div>
                            <div className="text-[11px] text-slate-400">
                              Uploaded: {file.createdTime ? new Date(file.createdTime).toLocaleString() : 'Recent'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View
                            </a>
                          )}
                          <button
                            onClick={() => initiateDeleteFile(file)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                            title="Delete file from Google Drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: CLOUD & FIREBASE DETAILS */}
            {activeTab === 'cloud_sync' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">
                      Firebase Firestore Enterprise Database
                    </h4>
                  </div>
                  <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
                    All emergency referrals, ambulance dispatches, facility readiness updates, and emergency
                    notifications are synchronized in real-time using Cloud Firestore with zero-trust ABAC security rules.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Project ID:</span>
                    <span className="font-semibold">project-1d0c1636-cb3f-40a4-801</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Database ID:</span>
                    <span className="font-semibold">ai-studio-maatricareai-39cb25c9-12b8-4db9-a5ab-b06f4a3b7d66</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rules Deployed:</span>
                    <span className="text-emerald-600 font-semibold">Active & Hardened (Zero-Trust ABAC)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Collections:</span>
                    <span>/referrals, /facilities, /transports, /notifications, /users</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Real-time listeners automatically update connected hospital coordinators, ASHA health workers, and
                    transport dispatchers across all devices.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      <WorkspaceConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        actionType={confirmModalState.actionType}
        targetSummary={confirmModalState.summary}
        details={confirmModalState.details}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
