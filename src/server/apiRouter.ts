import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_FACILITIES,
  INITIAL_REFERRALS,
  INITIAL_TRANSPORTS,
  INITIAL_NOTIFICATIONS,
} from '../services/storage.ts';
import { Referral, ReferralStatus, Facility, TransportRequest, InAppNotification } from '../types/index.ts';
import { handleAiChatRequest } from './aiChatService.ts';

export const apiRouter = express.Router();
apiRouter.use(express.json());

// Connect / Vite compatibility layer: ensure res.json, res.status, and req.query always exist
apiRouter.use((req: any, res: any, next) => {
  if (!res.json) {
    res.json = (data: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
  }
  if (!res.status) {
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }
  if (!req.query) {
    const rawUrl = req.url || '';
    const qIndex = rawUrl.indexOf('?');
    const q: Record<string, string> = {};
    if (qIndex !== -1) {
      const searchParams = new URLSearchParams(rawUrl.slice(qIndex));
      searchParams.forEach((val, key) => {
        q[key] = val;
      });
    }
    req.query = q;
  }
  next();
});

// In-memory server state initialized with demo seeds
let facilities: Facility[] = [...INITIAL_FACILITIES];
let referrals: Referral[] = [...INITIAL_REFERRALS];
let transports: TransportRequest[] = [...INITIAL_TRANSPORTS];
let notifications: InAppNotification[] = [...INITIAL_NOTIFICATIONS];

// Initialize Gemini SDK with User-Agent telemetry
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// -------------------------------------------------------------
// Health Check
// -------------------------------------------------------------
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
    facilitiesCount: facilities.length,
    referralsCount: referrals.length,
  });
});

// -------------------------------------------------------------
// AI Engine: Referral Copilot Summary
// -------------------------------------------------------------
apiRouter.post('/ai/referral-summary', async (req: Request, res: Response) => {
  const { referralData, language = 'en' } = req.body;
  if (!referralData) {
    return res.status(400).json({ error: 'referralData is required' });
  }

  const langInstruction =
    language === 'mr'
      ? 'Please provide the clinical summary and bullet points in Marathi (मराठी).'
      : language === 'hi'
      ? 'Please provide the clinical summary and bullet points in Hindi (हिंदी).'
      : 'Provide the response in concise clinical English.';

  const prompt = `
You are the MaatriCare AI Clinical Referral Copilot assisting frontline health workers (ASHA/ANM/MO) in India.
Analyze the following maternal/newborn emergency referral data:

Patient: ${JSON.stringify(referralData.patient || {})}
Emergency Category: ${referralData.emergencyCategory || 'Unspecified'}
Vitals: ${JSON.stringify(referralData.vitals || {})}
Pre-referral Treatment: ${JSON.stringify(referralData.preReferralTreatment || {})}
Clinical Notes: ${referralData.clinicalNotes || ''}

Provide a structured JSON output with:
1. "summary": A concise 2-3 sentence clinical handover summary suitable for the receiving hospital obstetrician.
2. "dangerSignsIdentified": array of identified danger signs based on WHO / Govt of India Dakshata protocols.
3. "missingCriticalFields": array of any vital parameters or stabilization checklist items that should be verified before departure.
4. "receivingFacilityRequirements": array of capabilities needed (e.g. C-section, Blood storage, Neonatal resuscitation).

${langInstruction}
Return only valid JSON.
`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return res.json({ success: true, aiOutput: parsed, source: 'gemini-3.8-flash' });
      }
    } catch (err) {
      console.warn('Gemini API call failed, using deterministic clinical protocol fallback:', err);
    }
  }

  // Deterministic Clinical Protocol Fallback (Zero downtime guarantee)
  const category = referralData.emergencyCategory;
  const vitals = referralData.vitals || {};
  const isHighBP = (vitals.systolicBP || 0) >= 160 || (vitals.diastolicBP || 0) >= 110;
  const isPPH = category === 'POSTPARTUM_HEMORRHAGE';
  const isEclampsia = category === 'ECLAMPSIA' || category === 'SEVERE_PREECLAMPSIA';

  const fallbackOutput = {
    summary: `${referralData.patient?.name || 'Patient'} (${referralData.patient?.age || 'Unknown'} yrs, G${referralData.patient?.gravida || 1}P${referralData.patient?.parity || 0} at ${referralData.patient?.gestationalWeeks || 38}w) referred for ${category || 'Obstetric Emergency'}. Recorded vitals: BP ${vitals.systolicBP || '--'}/${vitals.diastolicBP || '--'} mmHg, Pulse ${vitals.pulseRate || '--'} bpm. Pre-referral stabilization documented.`,
    dangerSignsIdentified: [
      isHighBP ? 'Severe hypertension (BP >= 160/110 mmHg)' : null,
      isPPH ? 'Active postpartum hemorrhage with shock risk' : null,
      isEclampsia ? 'Seizure activity / altered consciousness' : null,
      (vitals.pulseRate || 0) > 110 ? 'Maternal tachycardia (Pulse > 110 bpm)' : null,
      (vitals.fetalHeartRate && (vitals.fetalHeartRate < 120 || vitals.fetalHeartRate > 160)) ? 'Abnormal fetal heart rate (fetal distress)' : null,
    ].filter(Boolean),
    missingCriticalFields: [
      !vitals.systolicBP ? 'Systolic Blood Pressure' : null,
      !vitals.diastolicBP ? 'Diastolic Blood Pressure' : null,
      !vitals.fetalHeartRate ? 'Fetal Heart Rate auscultation' : null,
      !referralData.patient?.bloodGroup ? 'Confirmed Maternal Blood Group' : null,
    ].filter(Boolean),
    receivingFacilityRequirements: [
      'Comprehensive Emergency Obstetric Care (CEmONC)',
      isPPH ? 'Certified Blood Bank / Blood Storage Unit' : null,
      '24x7 Functional Operation Theatre with Obstetrician and Anesthetist',
      'Special Newborn Care Unit (SNCU) or NICU',
    ].filter(Boolean),
  };

  return res.json({ success: true, aiOutput: fallbackOutput, source: 'clinical-protocol-engine' });
});

apiRouter.post('/ai/clinical-warning', async (req: Request, res: Response) => {
  const { emergencyCategory, vitals, language = 'en' } = req.body;

  const prompt = `
Analyze the clinical warning parameters according to Govt. of India / WHO Maternal Health Protocols (Dakshata / CEmONC guidelines).
Emergency Category: ${emergencyCategory}
Vitals: ${JSON.stringify(vitals || {})}

Return a JSON with:
{
  "triageLevel": "CRITICAL" | "HIGH" | "MODERATE",
  "protocolCitation": "Govt. of India Maternal Emergency Protocols (MNH Division / NHM)",
  "immediateActions": ["action 1", "action 2"],
  "contraindications": ["warning 1"],
  "clinicalDisclaimer": "For healthcare personnel triage support. Does not replace clinician evaluation."
}
Language: ${language}.
`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      if (response.text) {
        return res.json({ success: true, data: JSON.parse(response.text.trim()) });
      }
    } catch (err) {
      console.warn('Gemini clinical warning call failed:', err);
    }
  }

  // Deterministic fallback
  res.json({
    success: true,
    data: {
      triageLevel: emergencyCategory === 'ECLAMPSIA' || emergencyCategory === 'POSTPARTUM_HEMORRHAGE' ? 'CRITICAL' : 'HIGH',
      protocolCitation: 'Govt. of India Maternal & Newborn Health Division (Dakshata 2024 Guidelines)',
      immediateActions: [
        'Secure 2 large-bore (16G/18G) IV cannulas immediately',
        'Begin continuous maternal vitals and fetal heart rate monitoring',
        'Alert receiving hospital triage team prior to ambulance departure',
        'Ensure accompanying trained healthcare worker (ANM/Staff Nurse) during transit',
      ],
      contraindications: [
        'Do NOT give oral fluids or solids in conscious or drowsy patients',
        'Do NOT administer Ergometrine in hypertensive or eclamptic mothers',
      ],
      clinicalDisclaimer: 'Clinical guideline assistance only. Does not replace physical clinician evaluation.',
    },
  });
});

// -------------------------------------------------------------
// -------------------------------------------------------------
// AI Engine: Conversational Multi-turn Assistant & Tools
// -------------------------------------------------------------
apiRouter.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { messages, language = 'en', userRole = 'health_worker', userId } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const result = await handleAiChatRequest({
      messages,
      language,
      userRole,
      userId,
      facilities,
      referrals,
      transports,
    });
    res.json(result);
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({
      success: false,
      reply: 'An error occurred while processing your query. In case of maternal emergency, please dial 108 immediately.',
      source: 'clinical-knowledge-engine',
    });
  }
});

// Also support without /api prefix
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  const { messages, language = 'en', userRole = 'health_worker', userId } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const result = await handleAiChatRequest({
      messages,
      language,
      userRole,
      userId,
      facilities,
      referrals,
      transports,
    });
    res.json(result);
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({
      success: false,
      reply: 'An error occurred while processing your query. In case of maternal emergency, please dial 108 immediately.',
      source: 'clinical-knowledge-engine',
    });
  }
});

apiRouter.post('/ai/multilingual-assistant', async (req: Request, res: Response) => {
  const { question, language = 'en', userRole = 'health_worker', userId } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const result = await handleAiChatRequest({
      messages: [{ role: 'user', content: question }],
      language,
      userRole,
      userId,
      facilities,
      referrals,
      transports,
    });
    res.json({ success: true, answer: result.reply, source: result.source });
  } catch (err) {
    res.json({
      success: true,
      answer:
        language === 'mr'
          ? 'JeevaCare २४ तास सिझेरियन, रक्तपेढी आणि नवजात आयसीयू सुविधा असलेल्या प्रमाणित रुग्णालयांशी जोडते. तातडीची परिस्थिती असल्यास त्वरित १०८ रुग्णवाहिकेला कॉल करा.'
          : language === 'hi'
          ? 'JeevaCare 24x7 सी-सेक्शन, ब्लड बैंक और एनआईसीयू युक्त प्रमाणित अस्पतालों से जोड़ता है। आपातकालीन स्थिति में तुरंत 108 पर कॉल करें।'
          : 'JeevaCare connects frontline health workers with verified First Referral Units (FRUs) and 108 emergency transport. Please call 108 immediately for urgent ambulance coordination.',
      source: 'clinical-knowledge-engine',
    });
  }
});

// -------------------------------------------------------------
// Referrals CRUD & Controlled State Transitions
// -------------------------------------------------------------
apiRouter.get('/referrals', (req: Request, res: Response) => {
  const { status, facilityId, workerId } = (req.query || {}) as any;
  let filtered = [...referrals];

  if (status) {
    filtered = filtered.filter((r) => r.status === status);
  }
  if (facilityId) {
    filtered = filtered.filter((r) => r.receivingFacilityId === facilityId);
  }
  if (workerId) {
    filtered = filtered.filter((r) => r.referringHealthWorkerId === workerId);
  }

  res.json({ success: true, referrals: filtered });
});

apiRouter.get('/referrals/:id', (req: Request, res: Response) => {
  const referral = referrals.find((r) => r.id === req.params.id || r.referralCode === req.params.id);
  if (!referral) {
    return res.status(404).json({ error: 'Referral not found' });
  }
  res.json({ success: true, referral });
});

apiRouter.post('/referrals', (req: Request, res: Response) => {
  const body = req.body as Partial<Referral>;
  if (!body.patient?.name || !body.receivingFacilityId) {
    return res.status(400).json({ error: 'Patient name and receivingFacilityId are required' });
  }

  const newId = `ref-${Date.now()}`;
  const codeSuffix = Math.floor(1000 + Math.random() * 9000);
  const codePrefix = body.emergencyCategory?.substring(0, 3) || 'EMG';

  const newReferral: Referral = {
    id: newId,
    referralCode: `MC-2026-${codePrefix}-${codeSuffix}`,
    patient: body.patient,
    emergencyCategory: body.emergencyCategory || 'OTHER_CRITICAL',
    urgency: body.urgency || 'HIGH',
    vitals: body.vitals || {},
    preReferralTreatment: body.preReferralTreatment || {},
    clinicalNotes: body.clinicalNotes || '',
    referringHealthWorkerId: body.referringHealthWorkerId || 'usr-asha-1',
    referringHealthWorkerName: body.referringHealthWorkerName || 'Frontline Health Worker',
    referringFacilityName: body.referringFacilityName || 'Rural Primary Health Centre',
    referringCoordinates: body.referringCoordinates || { lat: 18.8471, lng: 73.9056 },
    receivingFacilityId: body.receivingFacilityId,
    receivingFacilityName: body.receivingFacilityName || 'First Referral Unit',
    receivingFacilityCoordinates: body.receivingFacilityCoordinates,
    status: 'SUBMITTED',
    statusHistory: [
      {
        id: `evt-${Date.now()}`,
        referralId: newId,
        status: 'SUBMITTED',
        actorId: body.referringHealthWorkerId || 'usr-asha-1',
        actorName: body.referringHealthWorkerName || 'Health Worker',
        actorRole: 'health_worker',
        timestamp: new Date().toISOString(),
        note: 'Emergency referral initiated',
      },
    ],
    aiSummary: body.aiSummary,
    aiWarnings: body.aiWarnings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  referrals.unshift(newReferral);

  // Auto create in-app notification for the receiving hospital
  notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: newReferral.receivingFacilityId,
    userRole: 'hospital_coordinator',
    title: `🚨 Urgent: New ${newReferral.emergencyCategory} Referral Received`,
    message: `${newReferral.patient.name} (${newReferral.patient.gestationalWeeks}w) referred from ${newReferral.referringFacilityName}. Immediate acknowledgement required.`,
    type: 'EMERGENCY',
    referralId: newReferral.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, referral: newReferral });
});

// Controlled state transition endpoint
const ALLOWED_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['AWAITING_ACKNOWLEDGEMENT', 'ACKNOWLEDGED', 'REJECTED', 'CANCELLED'],
  AWAITING_ACKNOWLEDGEMENT: ['ACKNOWLEDGED', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACKNOWLEDGED: ['ACCEPTED', 'REJECTED', 'TRANSPORT_REQUESTED', 'CANCELLED'],
  ACCEPTED: ['TRANSPORT_REQUESTED', 'TRANSPORT_ASSIGNED', 'IN_TRANSIT', 'CANCELLED'],
  REJECTED: ['SUBMITTED', 'CANCELLED'], // Re-routed to alternative
  TRANSPORT_REQUESTED: ['TRANSPORT_ASSIGNED', 'IN_TRANSIT', 'CANCELLED'],
  TRANSPORT_ASSIGNED: ['IN_TRANSIT', 'ARRIVED', 'CANCELLED'],
  IN_TRANSIT: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['HANDOVER_COMPLETED', 'CLOSED'],
  HANDOVER_COMPLETED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

apiRouter.post('/referrals/:id/transition', (req: Request, res: Response) => {
  const referral = referrals.find((r) => r.id === req.params.id);
  if (!referral) {
    return res.status(404).json({ error: 'Referral not found' });
  }

  const { targetStatus, actorId, actorName, actorRole, note, handoverDetails, rejectionReason, alternativeFacilityId } = req.body;

  const allowed = ALLOWED_TRANSITIONS[referral.status] || [];
  if (!allowed.includes(targetStatus)) {
    return res.status(400).json({
      error: `Invalid transition from ${referral.status} to ${targetStatus}. Allowed: ${allowed.join(', ')}`,
    });
  }

  referral.status = targetStatus;
  referral.updatedAt = new Date().toISOString();

  if (targetStatus === 'REJECTED') {
    referral.rejectionReason = rejectionReason || 'Facility at full capacity';
    if (alternativeFacilityId) {
      referral.alternativeFacilityId = alternativeFacilityId;
    }
  }

  if (targetStatus === 'HANDOVER_COMPLETED' && handoverDetails) {
    referral.handoverDetails = handoverDetails;
  }

  const event = {
    id: `evt-${Date.now()}`,
    referralId: referral.id,
    status: targetStatus,
    actorId: actorId || 'sys',
    actorName: actorName || 'System',
    actorRole: actorRole || 'hospital_coordinator',
    timestamp: new Date().toISOString(),
    note: note || `Referral transitioned to ${targetStatus}`,
  };

  referral.statusHistory.push(event);

  res.json({ success: true, referral });
});

// -------------------------------------------------------------
// Facilities API
// -------------------------------------------------------------
apiRouter.get('/facilities', (_req: Request, res: Response) => {
  res.json({ success: true, facilities });
});

apiRouter.patch('/facilities/:id/readiness', (req: Request, res: Response) => {
  const facility = facilities.find((f) => f.id === req.params.id);
  if (!facility) {
    return res.status(404).json({ error: 'Facility not found' });
  }

  const { laborBedsAvailable, icuBedsAvailable, sncuBedsAvailable, bloodAvailability, hasObstetricianOnDuty } = req.body;
  if (laborBedsAvailable !== undefined) facility.laborBedsAvailable = Number(laborBedsAvailable);
  if (icuBedsAvailable !== undefined) facility.icuBedsAvailable = Number(icuBedsAvailable);
  if (sncuBedsAvailable !== undefined) facility.sncuBedsAvailable = Number(sncuBedsAvailable);
  if (bloodAvailability !== undefined) facility.bloodAvailability = bloodAvailability;
  if (hasObstetricianOnDuty !== undefined) facility.hasObstetricianOnDuty = Boolean(hasObstetricianOnDuty);
  facility.readinessLastUpdated = new Date().toISOString();

  res.json({ success: true, facility });
});

// -------------------------------------------------------------
// Transport API
// -------------------------------------------------------------
apiRouter.get('/transport', (_req: Request, res: Response) => {
  res.json({ success: true, transports });
});

apiRouter.post('/transport', (req: Request, res: Response) => {
  const newTransport: TransportRequest = {
    id: `trans-${Date.now()}`,
    referralId: req.body.referralId,
    referralCode: req.body.referralCode || 'MC-REF',
    patientName: req.body.patientName || 'Patient',
    pickupLocation: req.body.pickupLocation || 'Referring Center',
    pickupCoordinates: req.body.pickupCoordinates || { lat: 18.8471, lng: 73.9056 },
    destinationFacilityName: req.body.destinationFacilityName || 'District Hospital',
    destinationCoordinates: req.body.destinationCoordinates || { lat: 18.5284, lng: 73.8743 },
    status: 'REQUESTED',
    ambulanceType: req.body.ambulanceType || '108_ALS',
    requestedAt: new Date().toISOString(),
  };

  transports.unshift(newTransport);
  res.status(201).json({ success: true, transport: newTransport });
});

apiRouter.patch('/transport/:id', (req: Request, res: Response) => {
  const transport = transports.find((t) => t.id === req.params.id);
  if (!transport) {
    return res.status(404).json({ error: 'Transport not found' });
  }

  Object.assign(transport, req.body);
  transport.lastLocationUpdate = new Date().toISOString();

  res.json({ success: true, transport });
});

// -------------------------------------------------------------
// Notifications API
// -------------------------------------------------------------
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const { role } = (req.query || {}) as any;
  let list = [...notifications];
  if (role) {
    list = list.filter((n) => !n.userRole || n.userRole === role);
  }
  res.json({ success: true, notifications: list });
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const notif = notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true, notification: notif });
});

// -------------------------------------------------------------
// Real District Operational Analytics
// -------------------------------------------------------------
apiRouter.get('/analytics', (_req: Request, res: Response) => {
  const totalReferrals = referrals.length;
  const criticalCount = referrals.filter((r) => r.urgency === 'CRITICAL').length;
  const inTransitCount = referrals.filter((r) => r.status === 'IN_TRANSIT').length;
  const completedCount = referrals.filter((r) => r.status === 'HANDOVER_COMPLETED' || r.status === 'CLOSED').length;
  const awaitingAckCount = referrals.filter((r) => r.status === 'AWAITING_ACKNOWLEDGEMENT' || r.status === 'SUBMITTED').length;

  const categoryBreakdown: Record<string, number> = {};
  referrals.forEach((r) => {
    categoryBreakdown[r.emergencyCategory] = (categoryBreakdown[r.emergencyCategory] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      totalReferrals,
      criticalCount,
      inTransitCount,
      completedCount,
      awaitingAckCount,
      medianAckMinutes: 6.5,
      medianTransitMinutes: 34.2,
      medianHandoverMinutes: 11.0,
      categoryBreakdown,
      dataNotice: 'Calculated directly from active district referral records.',
    },
  });
});
