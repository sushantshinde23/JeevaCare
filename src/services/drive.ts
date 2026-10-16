import { getAccessToken } from './firebase';
import { Referral } from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  size?: string;
}

export const driveService = {
  /**
   * Find or create the dedicated MaatriCare folder in user's Drive
   */
  async getOrCreateAppFolder(): Promise<string | null> {
    const token = await getAccessToken();
    if (!token) return null;

    try {
      const folderName = 'MaatriCare AI - Referral Records';
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
          folderName
        )}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          return searchData.files[0].id;
        }
      }

      // Create folder if not found
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      if (createRes.ok) {
        const created = await createRes.json();
        return created.id;
      }
    } catch (err) {
      console.error('Error finding/creating Drive folder:', err);
    }
    return null;
  },

  /**
   * Save a formatted clinical referral document to Google Drive
   */
  async exportReferralToDrive(
    referral: Referral
  ): Promise<{ success: boolean; file?: DriveFileItem; error?: string }> {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Google authentication required. Please connect your Google account.' };
    }

    try {
      const folderId = await this.getOrCreateAppFolder();
      const fileName = `MaatriCare_Referral_${referral.referralCode}_${referral.patient.name.replace(/\s+/g, '_')}.txt`;

      // Build clinical document content
      const content = `================================================================================
MAATRICARE AI - MATERNAL & NEWBORN EMERGENCY REFERRAL RECORD
================================================================================
Document Generated: ${new Date().toLocaleString()}
Referral Code:      ${referral.referralCode}
Status:             ${referral.status}
Urgency Tier:       ${referral.urgency}

--------------------------------------------------------------------------------
1. PATIENT DEMOGRAPHICS & OBSTETRIC PROFILE
--------------------------------------------------------------------------------
Name:               ${referral.patient.name}
Age:                ${referral.patient.age} years
Obstetric History:  Gravida: ${referral.patient.gravida || 1}, Parity: ${referral.patient.parity || 0}
Gestational Age:    ${referral.patient.gestationalWeeks || 'Term'} weeks
Blood Group:        ${referral.patient.bloodGroup || 'Not Tested'}
Contact Number:     ${referral.patient.contactPhone || 'N/A'}
Village / Address:  ${referral.patient.addressVillage || 'N/A'}, ${referral.patient.district}
Husband / Relative: ${referral.patient.husbandOrFatherName || 'Family'}

--------------------------------------------------------------------------------
2. EMERGENCY CLINICAL PRESENTATION & DANGER SIGNS
--------------------------------------------------------------------------------
Category:           ${referral.emergencyCategory.replace(/_/g, ' ')}
Clinical Notes / Danger Signs:
${referral.clinicalNotes ? `  - ${referral.clinicalNotes}` : '  - Standard referral protocol'}

Initial Vitals:
  - Blood Pressure: ${referral.vitals?.systolicBP || '—'}/${referral.vitals?.diastolicBP || '—'} mmHg
  - Pulse Rate:     ${referral.vitals?.pulseRate || '—'} bpm
  - SpO2:           ${referral.vitals?.spO2 || '—'} %
  - Temperature:    ${referral.vitals?.temperatureF || '—'} °F
  - Fetal Heart:    ${referral.vitals?.fetalHeartRate || '—'} bpm

--------------------------------------------------------------------------------
3. PRE-REFERRAL STABILIZATION & MEDICATIONS
--------------------------------------------------------------------------------
${Object.entries(referral.preReferralTreatment || {})
  .map(([k, v]) => `  ${k.toUpperCase().padEnd(20)}: ${String(v) || 'Not Administered'}`)
  .join('\n')}

Clinical Notes:
${referral.clinicalNotes || 'No additional notes recorded.'}

--------------------------------------------------------------------------------
4. TRANSFER COORDINATION & TIMELINES
--------------------------------------------------------------------------------
Referring Facility: ${referral.referringFacilityName}
Referring Worker:   ${referral.referringHealthWorkerName}
Receiving Facility: ${referral.receivingFacilityName}
Transfer Initiated: ${new Date(referral.createdAt).toLocaleString()}
${referral.statusHistory?.map((h) => `  [${new Date(h.timestamp).toLocaleTimeString()}] ${h.status}: ${h.note || ''}`).join('\n') || ''}

--------------------------------------------------------------------------------
5. AI CLINICAL COPILOT ASSESSMENT
--------------------------------------------------------------------------------
${referral.aiSummary || 'Standard clinical stabilization and referral criteria met.'}

================================================================================
Generated by MaatriCare AI Platform. Every Mother. Every Newborn. Every Second Counts.
================================================================================
`;

      const metadata: Record<string, any> = {
        name: fileName,
        mimeType: 'text/plain',
        description: `MaatriCare Emergency Referral record for ${referral.patient.name} (${referral.referralCode})`,
      };
      if (folderId) {
        metadata.parents = [folderId];
      }

      // Multipart upload
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
        content +
        closeDelim;

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime,size',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error?.message || `Drive API error ${uploadRes.status}`);
      }

      const fileData = await uploadRes.json();
      return { success: true, file: fileData };
    } catch (err: any) {
      console.error('Error uploading referral to Drive:', err);
      return { success: false, error: err.message || 'Failed to export to Google Drive' };
    }
  },

  /**
   * List files created in Google Drive by MaatriCare
   */
  async listAppFiles(): Promise<DriveFileItem[]> {
    const token = await getAccessToken();
    if (!token) return [];

    try {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=name contains 'MaatriCare' and trashed=false&fields=files(id,name,mimeType,webViewLink,createdTime,size)&orderBy=createdTime desc&pageSize=20",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) return [];
      const data = await res.json();
      return data.files || [];
    } catch (err) {
      console.error('Error listing Drive files:', err);
      return [];
    }
  },

  /**
   * Delete a file from Google Drive (Mandates confirmation before invoking)
   */
  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    const token = await getAccessToken();
    if (!token) return { success: false, error: 'Google authentication required.' };

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Delete failed');
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete file' };
    }
  },
};
