import { getAccessToken } from './firebase';
import { Referral } from '../types';

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
  referralId?: string;
}

/**
 * Encodes string to base64url for RFC 2822 Gmail API format
 */
function toBase64Url(str: string): string {
  // UTF-8 safe base64 encoding
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Creates formatted maternal emergency referral alert email body
 */
export function buildReferralEmailContent(referral: Referral, senderName: string, recipientRole: string): { subject: string; bodyHtml: string } {
  const urgencyLabel = referral.urgency === 'CRITICAL' ? '🚨 CRITICAL EMERGENCY' : referral.urgency === 'HIGH' ? '⚠️ HIGH PRIORITY' : 'ROUTINE REFERRAL';
  const subject = `[MaatriCare ${referral.urgency}] Emergency Maternal Referral: ${referral.patient.name} (${referral.referralCode})`;

  const dangerSignsHtml = referral.clinicalNotes
    ? `<li style="color: #b91c1c; font-weight: bold;">• ${referral.clinicalNotes}</li>`
    : `<li>• Emergency Category: ${referral.emergencyCategory.replace(/_/g, ' ')}</li>`;

  const preTreatHtml = Object.entries(referral.preReferralTreatment || {})
    .filter(([_, v]) => Boolean(v))
    .map(([k, v]) => `<li><strong>${k.toUpperCase()}:</strong> ${String(v)}</li>`)
    .join('') || '<li>Standard stabilization provided</li>';

  const bodyHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
  <div style="background-color: #991b1b; padding: 20px; color: #ffffff;">
    <h1 style="margin: 0; font-size: 20px;">MaatriCare AI — Maternal &amp; Newborn Emergency Referral</h1>
    <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Verified Health Network Transfer Alert | ${urgencyLabel}</p>
  </div>

  <div style="padding: 24px;">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 40%; color: #64748b;"><strong>Referral Code:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${referral.referralCode}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Patient Name &amp; Age:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${referral.patient.name}, ${referral.patient.age} yrs (G${referral.patient.gravida || 1}P${referral.patient.parity || 0})</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Gestational Age / Blood Group:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${referral.patient.gestationalWeeks || 'Term'} weeks | Blood: <strong>${referral.patient.bloodGroup || 'Pending'}</strong></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Receiving Facility:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${referral.receivingFacilityName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Referring Worker:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${referral.referringHealthWorkerName} (${referral.referringFacilityName})</td>
      </tr>
    </table>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 15px;">Primary Reason / Danger Signs:</h3>
      <p style="margin: 0 0 8px 0; color: #1e293b;"><strong>${referral.emergencyCategory.replace(/_/g, ' ')}</strong></p>
      <ul style="margin: 0; padding-left: 20px;">
        ${dangerSignsHtml}
      </ul>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 15px;">Pre-Referral Stabilization Given:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #334155;">
        ${preTreatHtml}
      </ul>
    </div>

    ${
      referral.aiSummary
        ? `
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 6px 0; color: #166534; font-size: 14px;">Clinical Assessment &amp; Next Steps:</h3>
      <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.5;">${referral.aiSummary}</p>
    </div>`
        : ''
    }

    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
      Dispatched via MaatriCare AI Emergency Maternal Care Platform by ${senderName}.<br/>
      Target Role: ${recipientRole} | Every Mother. Every Newborn. Every Second Counts.
    </p>
  </div>
</div>
`;

  return { subject, bodyHtml };
}

export const gmailService = {
  /**
   * Send an email using Gmail API
   */
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Google authentication required. Please connect your Google account.' };
    }

    try {
      const emailLines = [
        `To: ${params.to}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        params.bodyHtml,
      ];

      const emailRaw = emailLines.join('\r\n');
      const base64Url = toBase64Url(emailRaw);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: base64Url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Gmail API error: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, messageId: result.id };
    } catch (err: any) {
      console.error('Error sending email via Gmail:', err);
      return { success: false, error: err.message || 'Failed to send email' };
    }
  },

  /**
   * Search / list messages related to MaatriCare
   */
  async listReferralEmails(queryFilter = 'MaatriCare'): Promise<GmailMessage[]> {
    const token = await getAccessToken();
    if (!token) return [];

    try {
      const q = encodeURIComponent(queryFilter);
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!data.messages?.length) return [];

      // Fetch headers for each message
      const messagesWithDetails = await Promise.all(
        data.messages.slice(0, 8).map(async (msg: { id: string; threadId: string }) => {
          try {
            const detailRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };
            const detail = await detailRes.json();
            const headers: Record<string, string> = {};
            detail.payload?.headers?.forEach((h: { name: string; value: string }) => {
              headers[h.name.toLowerCase()] = h.value;
            });
            return {
              id: msg.id,
              threadId: msg.threadId,
              snippet: detail.snippet,
              subject: headers['subject'] || 'Referral Message',
              from: headers['from'] || '',
              to: headers['to'] || '',
              date: headers['date'] || '',
            };
          } catch {
            return { id: msg.id, threadId: msg.threadId };
          }
        })
      );

      return messagesWithDetails;
    } catch (err) {
      console.error('Error listing Gmail messages:', err);
      return [];
    }
  },
};
