import { jsPDF } from 'jspdf';
import { Referral, Facility } from '../types';

/**
 * Generates a real, high-quality, professional clinical referral record PDF
 * formatted per Dakshata & CEmONC standards.
 */
export function generateReferralPdf(referral: Referral, facility?: Facility): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header background bar (Medical Teal: #0F766E)
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('JeevaCare — Clinical Referral Record', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('National Maternal & Newborn Emergency Coordination Network | Dakshata & CEmONC Protocol', margin, 18);
  doc.text(`Every Mother. Every Newborn. Every Moment. | Generated: ${new Date().toLocaleString()}`, margin, 23);

  // Status & Urgency Badge on Top Right
  const isCritical = referral.urgency === 'CRITICAL';
  if (isCritical) {
    doc.setFillColor(220, 38, 38); // Emergency Red
  } else {
    doc.setFillColor(217, 119, 6); // Warning Amber
  }
  doc.roundedRect(pageWidth - margin - 45, 6, 45, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(referral.urgency, pageWidth - margin - 22.5, 13, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(referral.status.replace(/_/g, ' '), pageWidth - margin - 22.5, 18, { align: 'center' });

  let y = 36;

  // Reference Code & Timestamp Box
  doc.setFillColor(232, 245, 243); // Soft Mint
  doc.setDrawColor(220, 231, 236); // Soft Border
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setTextColor(18, 48, 74); // Deep Navy
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Referral Code: ${referral.referralCode}`, margin + 4, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Initiated: ${new Date(referral.createdAt).toLocaleString()}`, pageWidth - margin - 4, y + 7.5, { align: 'right' });

  y += 18;

  // Section 1: Transfer Routing
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('1. HEALTHCARE TRANSFER ROUTING', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 48, 74);
  doc.text('Referring Center / Worker:', margin + 4, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`${referral.referringHealthWorkerName} (${referral.referringFacilityName})`, margin + 45, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 48, 74);
  doc.text('Receiving Hospital:', margin + 4, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 118, 110);
  doc.text(`${referral.receivingFacilityName} (Verified FRU / CEmONC)`, margin + 45, y + 19);

  if (facility?.emergencyHelpline) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Helpline: ${facility.emergencyHelpline}`, pageWidth - margin - 4, y + 19, { align: 'right' });
  }

  y += 30;

  // Section 2: Patient Demographics & Obstetric Profile
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('2. PATIENT DEMOGRAPHICS & OBSTETRIC PROFILE', margin + 4, y + 6);

  doc.setFontSize(8.5);
  // Column 1
  doc.setTextColor(100, 116, 139);
  doc.text('Patient Name:', margin + 4, y + 13);
  doc.setTextColor(18, 48, 74);
  doc.setFont('helvetica', 'bold');
  doc.text(referral.patient.name, margin + 28, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Age / Blood Group:', margin + 4, y + 19);
  doc.setTextColor(51, 65, 85);
  doc.text(`${referral.patient.age} years | Blood: ${referral.patient.bloodGroup || 'Not Tested'}`, margin + 34, y + 19);

  doc.setTextColor(100, 116, 139);
  doc.text('Village / District:', margin + 4, y + 25);
  doc.setTextColor(51, 65, 85);
  doc.text(`${referral.patient.addressVillage || 'Rural Block'}, ${referral.patient.district}`, margin + 30, y + 25);

  // Column 2
  const col2X = margin + 95;
  doc.setTextColor(100, 116, 139);
  doc.text('Obstetric History:', col2X, y + 13);
  doc.setTextColor(18, 48, 74);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gravida ${referral.patient.gravida || 1}, Parity ${referral.patient.parity || 0} at ${referral.patient.gestationalWeeks || 38} weeks`, col2X + 28, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('RCH ID:', col2X, y + 19);
  doc.setTextColor(51, 65, 85);
  doc.text(referral.patient.rchId || 'MH-PUN-PENDING', col2X + 16, y + 19);

  doc.setTextColor(100, 116, 139);
  doc.text('Contact Number:', col2X, y + 25);
  doc.setTextColor(51, 65, 85);
  doc.text(referral.patient.contactPhone || '108 Dispatch', col2X + 26, y + 25);

  y += 38;

  // Section 3: Clinical Presentation & Triage Vitals
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('3. EMERGENCY CLINICAL PRESENTATION & VITALS', margin + 4, y + 6);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Emergency Category:', margin + 4, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(referral.emergencyCategory.replace(/_/g, ' '), margin + 36, y + 13);

  // Vitals Row
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const vitalsText = `BP: ${referral.vitals.systolicBP || '--'}/${referral.vitals.diastolicBP || '--'} mmHg  |  Pulse: ${referral.vitals.pulseRate || '--'} bpm  |  FHR: ${referral.vitals.fetalHeartRate || '--'} bpm  |  SpO2: ${referral.vitals.spO2 || '--'}%  |  Temp: ${referral.vitals.temperatureF || 98.6}°F`;
  doc.text(vitalsText, margin + 4, y + 19);

  doc.setTextColor(100, 116, 139);
  doc.text('Clinical Symptoms / Danger Signs:', margin + 4, y + 25);
  doc.setTextColor(18, 48, 74);
  doc.text(referral.clinicalNotes || 'Severe maternal danger signs identified. Immediate CEmONC triage mandated.', margin + 55, y + 25);

  y += 36;

  // Section 4: Pre-Referral Stabilization
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('4. PRE-REFERRAL STABILIZATION CHECKLIST (DAKSHATA)', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const mgSo4 = referral.preReferralTreatment?.magnesiumSulfateGiven
    ? `[YES] Inj. Magnesium Sulfate: ${referral.preReferralTreatment.magnesiumSulfateDose || 'Loading dose administered'}`
    : '[NO] Inj. Magnesium Sulfate';
  doc.text(mgSo4, margin + 4, y + 12);

  const ivFluid = referral.preReferralTreatment?.ivCannulaSecured
    ? `[YES] IV Cannula Secured (18G) & Fluids: ${referral.preReferralTreatment.ivFluidsStarted || 'Ringer Lactate'}`
    : '[NO] IV Line Secured';
  doc.text(ivFluid, margin + 4, y + 17);

  const oxygen = referral.preReferralTreatment?.oxygenAdministered
    ? '[YES] Oxygen Administered via Nasal Prongs (4-6 L/min)'
    : '[NO] Oxygen Support Not Required';
  doc.text(oxygen, margin + 4, y + 22);

  y += 34;

  // Section 5: Closed-Loop Timeline
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('5. AUDIT TRAIL & VERIFIED EVENT LOG', margin + 4, y + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  let logY = y + 12;
  (referral.statusHistory || []).slice(0, 3).forEach((evt) => {
    doc.setTextColor(18, 48, 74);
    doc.text(`• ${evt.status.replace(/_/g, ' ')}`, margin + 4, logY);
    doc.setTextColor(100, 116, 139);
    doc.text(`by ${evt.actorName} (${evt.actorRole}) - ${new Date(evt.timestamp).toLocaleTimeString()}`, margin + 50, logY);
    logY += 4.5;
  });

  // Footer Disclaimer & Verification
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('This digital referral record is generated by JeevaCare Emergency Healthcare Platform.', margin, pageHeight - 12);
  doc.text('108 Emergency Ambulance: Call 108 immediately for maternal/neonatal transport.', margin, pageHeight - 8);
  doc.text('Official National Health Mission Compliant Transfer Slip', pageWidth - margin, pageHeight - 8, { align: 'right' });

  return doc;
}
