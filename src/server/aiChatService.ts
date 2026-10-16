import { GoogleGenAI } from '@google/genai';
import { Facility, Referral, TransportRequest, UserRole } from '../types/index.ts';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestOptions {
  messages: ChatMessage[];
  language?: 'en' | 'mr' | 'hi';
  userRole?: UserRole;
  userId?: string;
  facilities: Facility[];
  referrals: Referral[];
  transports: TransportRequest[];
}

export async function handleAiChatRequest(options: ChatRequestOptions): Promise<{
  success: boolean;
  reply: string;
  source: 'gemini-3.8-flash' | 'clinical-knowledge-engine';
  suggestedActions?: Array<{ label: string; action: string }>;
}> {
  const {
    messages,
    language = 'en',
    userRole = 'health_worker',
    userId,
    facilities,
    referrals,
    transports,
  } = options;

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  // 1. Compute real authorized data context
  const activeReferrals = referrals.filter(
    (r) => r.status === 'IN_TRANSIT' || r.status === 'SUBMITTED' || r.status === 'AWAITING_ACKNOWLEDGEMENT'
  );
  const awaitingAck = referrals.filter((r) => r.status === 'AWAITING_ACKNOWLEDGEMENT' || r.status === 'SUBMITTED');
  const verifiedFrus = facilities.filter((f) => f.isVerified && f.hasCEmONC);
  const bloodBankFacilities = facilities.filter((f) => f.hasBloodBank || f.hasBloodStorage);
  const sncuFacilities = facilities.filter((f) => f.hasSNCU);

  // Role-specific authorized subset
  let userReferrals = referrals;
  if (userRole === 'health_worker' && userId) {
    userReferrals = referrals.filter((r) => r.referringHealthWorkerId === userId);
  } else if (userRole === 'hospital_coordinator' && userId) {
    userReferrals = referrals.filter((r) => r.receivingFacilityId === userId);
  }

  // Facility summaries for knowledge grounding
  const facilitySummaryText = facilities
    .slice(0, 8)
    .map(
      (f) =>
        `- ${f.name} (${f.type}, ${f.tehsil}): CEmONC=${f.hasCEmONC ? 'YES' : 'NO'}, BloodBank=${
          f.hasBloodBank ? 'YES' : 'NO'
        }, SNCU=${f.hasSNCU ? 'YES' : 'NO'}, LaborBeds=${f.laborBedsAvailable}, Phone=${f.phone}`
    )
    .join('\n');

  // Real referral status lookup
  const referralSummaryText = userReferrals
    .slice(0, 5)
    .map(
      (r) =>
        `- RefID: ${r.referralCode || r.id} | Patient: ${r.patient.name} (${r.patient.age}y, ${r.patient.bloodGroup}) | Emergency: ${r.emergencyCategory} | Urgency: ${r.urgency} | Status: ${r.status} | To: ${r.receivingFacilityName}`
    )
    .join('\n');

  // Build the comprehensive Grounded System Prompt
  const systemPrompt = `
You are the official JeevaCare AI Assistant for the JeevaCare Maternal & Newborn Emergency Healthcare Platform (Govt. of Maharashtra / NHM Emergency Obstetric Network in Pune District).
The user is interacting in role: ${userRole}.
Requested Language: ${language} (en = English, mr = Marathi / मराठी, hi = Hindi / हिंदी).

PLATFORM IDENTITY & MISSION:
- Official Brand: JeevaCare
- Tagline: "Every Mother. Every Newborn. Every Moment."
- Purpose: Zero maternal and newborn delay by coordinating frontline ASHA/ANM workers, verified First Referral Units (FRUs), and 108 Emergency Ambulance transport with pre-arrival bed readiness and digital handovers.

CURRENT VERIFIED DATABASE SNAPSHOT (Ground truth - do NOT contradict this):
- Total Verified First Referral Units: ${facilities.length} (${verifiedFrus.length} with 24x7 CEmONC, ${bloodBankFacilities.length} with Blood Banks, ${sncuFacilities.length} with SNCU)
- Total System Referrals: ${referrals.length} (${activeReferrals.length} active in transit, ${awaitingAck.length} awaiting hospital acknowledgement)
- Key Facilities:
${facilitySummaryText}
- Relevant Referrals for this user:
${referralSummaryText || 'No active referral records assigned to your current session.'}

CORE CLINICAL & PLATFORM PROTOCOLS:
1. Referral Lifecycle:
   DRAFT -> SUBMITTED -> AWAITING_ACKNOWLEDGEMENT -> ACKNOWLEDGED -> ACCEPTED -> TRANSPORT_REQUESTED -> TRANSPORT_ASSIGNED -> IN_TRANSIT -> ARRIVED -> HANDOVER_COMPLETED -> CLOSED.
2. Emergency Triage (Dakshata / CEmONC):
   - Eclampsia / Severe Pre-eclampsia: Loading dose of Inj. Magnesium Sulfate 50% (4g IV + 10g IM). Continuous BP & FHR monitoring.
   - Postpartum Hemorrhage (PPH): Inj. Oxytocin 10 IU IM immediately, uterine massage, 2 large-bore IV cannulas with Ringer's Lactate. Urgent CEmONC facility with active Blood Bank required.
   - Newborn Asphyxia: NSSK protocol: immediate drying, airway clearing, bag-and-mask ventilation with room air. Transfer to SNCU/NICU.
3. Key Features of JeevaCare:
   - Dashboard: Central command center for metrics, needs attention, and feature categories.
   - Create Referral: 4-step Dakshata triage form with real-time facility matching.
   - Print Referral Slip: Formatted Dakshata handover slip accessible on referral detail page.
   - PDF Download: Clinical referral PDF generated on-demand via jsPDF.
   - Google Drive & Gmail: Export clinical slips to Google Drive and dispatch handover emails to hospital triage desks.
   - Offline Mode: ASHA workers can create drafts with zero cellular connectivity; auto-syncs when back online.
   - 108 Ambulance Dispatch: Direct integration for emergency transport.

COMMUNICATION & SAFETY RULES:
- ALWAYS respond in the requested language: ${language === 'mr' ? 'Marathi (मराठी)' : language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
- Tone: Professional, reassuring, clinically precise, compassionate, action-oriented.
- SAFETY RULE 1: Never diagnose, never prescribe medications independently, and never contradict clinical judgement. Emphasize standard protocols.
- SAFETY RULE 2: If the user describes an active emergency (e.g. heavy bleeding, convulsion, unconsciousness, infant not breathing), urge them immediately: "Call 108 Ambulance immediately or transport to the nearest CEmONC facility."
- Answer the specific question directly. If they ask about a referral or hospital, use the real database data provided above.
`;

  // 2. Attempt Google GenAI (gemini-3.8-flash)
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Format conversation turns for gemini-3.8-flash
      const conversationTurns = messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
      const fullPrompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n${conversationTurns}\n\nAssistant (${language}):`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          temperature: 0.25,
          maxOutputTokens: 600,
        },
      });

      if (response.text) {
        return {
          success: true,
          reply: response.text.trim(),
          source: 'gemini-3.8-flash',
          suggestedActions: getSuggestedActions(lastUserMessage, language),
        };
      }
    } catch (err) {
      console.warn('Gemini chat generation failed, engaging clinical knowledge engine fallback:', err);
    }
  }

  // 3. Deterministic Knowledge Engine Fallback (Zero Downtime & Grounded in DB State)
  const lowerQuery = lastUserMessage.toLowerCase();
  let fallbackReply = '';

  if (lowerQuery.includes('108') || lowerQuery.includes('ambulance') || lowerQuery.includes('रुग्णवाहिका') || lowerQuery.includes('एम्बुलेंस')) {
    if (language === 'mr') {
      fallbackReply = `१०८ रुग्णवाहिका समन्वय: JeevaCare थेट आपत्कालीन १०८ रुग्णवाहिका नियंत्रण कक्षाशी जोडलेले आहे. रुग्णाला हलवण्यापूर्वी डॅशबोर्डवरील "Dispatch 108" बटण दाबा किंवा थेट १०८ वर कॉल करा. रुग्णवाहिका निघताना ट्रान्झिट अपडेट्स सुरू होतात.`;
    } else if (language === 'hi') {
      fallbackReply = `108 एम्बुलेंस समन्वय: JeevaCare सीधे आपातकालीन 108 नियंत्रण कक्ष से जुड़ा है। मरीज को स्थानांतरित करने से पहले डैशबोर्ड पर "Dispatch 108" पर क्लिक करें या 108 पर सीधे कॉल करें।`;
    } else {
      fallbackReply = `108 Ambulance Coordination: JeevaCare coordinates directly with Maharashtra 108 EMS fleet. You can request transport directly via the Referral Tracking page or call 108. The receiving FRU is alerted with pre-arrival vitals while the vehicle is En Route.`;
    }
  } else if (
    lowerQuery.includes('referral') ||
    lowerQuery.includes('status') ||
    lowerQuery.includes('रेफरल') ||
    lowerQuery.includes('स्थिती') ||
    lowerQuery.includes('स्थिति')
  ) {
    const refCount = userReferrals.length;
    const activeCount = userReferrals.filter((r) => r.status === 'IN_TRANSIT' || r.status === 'SUBMITTED' || r.status === 'AWAITING_ACKNOWLEDGEMENT').length;
    if (language === 'mr') {
      fallbackReply = `सध्या सिस्टीममध्ये ${refCount} नोंदणीकृत संदर्भ आहेत, त्यापैकी ${activeCount} सक्रिय प्रवासात/प्रतीक्षेत आहेत. रेफरलची सविस्तर स्थिती पाहण्यासाठी डॅशबोर्डवरील 'Referral Management' किंवा 'Referral Tracking' टॅब उघडा. तेथून तुम्ही थेट प्रिंट स्लिप किंवा पीडीएफ डाउनलोड करू शकता.`;
    } else if (language === 'hi') {
      fallbackReply = `वर्तमान में सिस्टम में ${refCount} रेफरल रिकॉर्ड हैं, जिनमें से ${activeCount} सक्रिय या प्रतीक्षारत हैं। रेफरल की विस्तृत स्थिति देखने के लिए डैशबोर्ड के 'Referral Management' या 'Referral Tracking' सेक्शन पर जाएँ। वहाँ से आप सीधे प्रिंट स्लिप या पीडीएफ डाउनलोड कर सकते हैं।`;
    } else {
      fallbackReply = `Currently there are ${refCount} referral records in your active view (${activeCount} active in transit or awaiting hospital acknowledgement). You can view real-time milestone timelines, print the clinical handover slip, or export to PDF on the Referral Tracking page.`;
    }
  } else if (
    lowerQuery.includes('hospital') ||
    lowerQuery.includes('facility') ||
    lowerQuery.includes('cemonc') ||
    lowerQuery.includes('रुग्णालय') ||
    lowerQuery.includes('अस्पताल') ||
    lowerQuery.includes('रक्तपेढी')
  ) {
    if (language === 'mr') {
      fallbackReply = `पुणे जिल्ह्यात JeevaCare नेटवर्कमध्ये ${facilities.length} प्रमाणित फर्स्ट रेफरल युनिट्स (FRU) समाविष्ट आहेत. त्यापैकी ${verifiedFrus.length} रुग्णालयांमध्ये २४ तास सिझेरियन (CEmONC) सेवा, ${bloodBankFacilities.length} रक्तपेढी, आणि ${sncuFacilities.length} नवजात केअर युनिट (SNCU) उपलब्ध आहेत. उदा. उपजिल्हा रुग्णालय बारामती आणि जिल्हा रुग्णालय औंध. डॅशबोर्डवरील 'Verified Facilities' वरून तुम्ही थेट अंतर आणि गुगल मॅप्स दिशानिर्देश पाहू शकता.`;
    } else if (language === 'hi') {
      fallbackReply = `पुणे जिले में JeevaCare नेटवर्क में ${facilities.length} सत्यापित फर्स्ट रेफरल यूनिट्स (FRU) शामिल हैं। इनमें से ${verifiedFrus.length} में 24x7 CEmONC (सी-सेक्शन), ${bloodBankFacilities.length} में ब्लड बैंक और ${sncuFacilities.length} में SNCU उपलब्ध है। डॅशबोर्ड के 'Verified Facilities' सेक्शन से आप गूगल मैप्स रूट और लाइव बेड उपलब्धता देख सकते हैं।`;
    } else {
      fallbackReply = `The JeevaCare network maintains ${facilities.length} verified First Referral Units (FRUs) across Pune district. ${verifiedFrus.length} facilities provide 24x7 Comprehensive Emergency Obstetric Care (CEmONC), ${bloodBankFacilities.length} have active Blood Banks/Storage, and ${sncuFacilities.length} feature Special Newborn Care Units (SNCU). You can filter and navigate to them via the Verified Facilities page with Google Maps routing.`;
    }
  } else if (
    lowerQuery.includes('pdf') ||
    lowerQuery.includes('print') ||
    lowerQuery.includes('drive') ||
    lowerQuery.includes('gmail') ||
    lowerQuery.includes('डाउनलोड') ||
    lowerQuery.includes('प्रिंट')
  ) {
    if (language === 'mr') {
      fallbackReply = `क्लिनिकल स्लिप डाउनलोड व प्रिंट: कोणत्याही रेफरलच्या तपशील पानावर (Referral Detail Page) जा. तिथे तुम्हाला 'Download PDF' (jsPDF द्वारे तयार), 'Print Slip' (ब्राउझर प्रिंट डायलॉग), 'Save to Drive' (गुगल ड्राईव्हमध्ये सुरक्षित संचयन), आणि 'Send via Gmail' ही बटणे उपलब्ध आहेत.`;
    } else if (language === 'hi') {
      fallbackReply = `क्लीनिकल स्लिप डाउनलोड व प्रिंट: किसी भी रेफरल के डिटेल पेज पर जाएँ। वहाँ आपको 'Download PDF', 'Print Slip', 'Save to Drive', और 'Send via Gmail' के विकल्प मिलेंगे।`;
    } else {
      fallbackReply = `Clinical Document & Export: On any referral detail page (/referrals/:id), you have dedicated actions to 'Download PDF' (official Dakshata record), 'Print Slip' (clean browser print), 'Save to Drive' (secure Google Drive archival), and 'Send via Gmail'.`;
    }
  } else if (
    lowerQuery.includes('eclampsia') ||
    lowerQuery.includes('bp') ||
    lowerQuery.includes('bleeding') ||
    lowerQuery.includes('pph') ||
    lowerQuery.includes('झटके') ||
    lowerQuery.includes('रक्तस्त्राव')
  ) {
    if (language === 'mr') {
      fallbackReply = `तातडीची वैद्यकीय मार्गदर्शक तत्त्वे (दक्षता प्रोटोकॉल):
१. एक्लॅम्पसिया / तीव्र रक्तदाब (BP >= 160/110): Inj. मॅग्नेशियम सल्फेट ५०% लोडिंग डोस (४ ग्रॅम IV + १० ग्रॅम IM) त्वरित द्या.
२. प्रसूतीनंतरचा रक्तस्त्राव (PPH): Inj. ऑक्सिटोसिन १० IU IM त्वरित द्या, गर्भाशयाची मालिश करा आणि दोन मोठ्या बोर IV लाईन सुरू करा.
३. तातडीने १०८ रुग्णवाहिका बोलवा आणि CEmONC रुग्णालयाला पूर्व-सूचना पाठवा.`;
    } else if (language === 'hi') {
      fallbackReply = `आपातकालीन चिकित्सा दिशा-निर्देश (दक्षता प्रोटोकॉल):
1. एक्लम्पसिया / उच्च रक्तचाप (BP >= 160/110): Inj. मैग्नीशियम सल्फेट 50% लोडिंग डोज़ (4g IV + 10g IM) तुरंत दें।
2. प्रसवोत्तर रक्तस्राव (PPH): Inj. ऑक्सीटोसिन 10 IU IM तुरंत दें, गर्भाशय मालिश करें, और दो 16G/18G IV लाइन शुरू करें।
3. तुरंत 108 एम्बुलेंस को कॉल करें और निकटतम CEmONC अस्पताल को सूचित करें।`;
    } else {
      fallbackReply = `Standard Dakshata Emergency Protocol:
1. Eclampsia / Severe Pre-eclampsia (BP >= 160/110 mmHg): Administer loading dose of Inj. Magnesium Sulfate 50% (4g IV slowly + 10g IM divided in each buttock). Maintain airway.
2. Postpartum Hemorrhage (PPH): Administer Inj. Oxytocin 10 IU IM immediately, initiate bimanual uterine compression, secure 2 large-bore IV lines with Ringer's Lactate.
3. Dispatch 108 ALS ambulance and send pre-arrival alert to receiving CEmONC facility immediately.`;
    }
  } else {
    if (language === 'mr') {
      fallbackReply = `नमस्कार! मी JeevaCare AI सहाय्यक आहे. मी तुम्हाला संदर्भ प्रक्रिया (Referral Workflow), १०८ रुग्णवाहिका समन्वय, जवळच्या CEmONC/रक्तपेढी सुविधा, क्लिनिकल स्लिप प्रिंटिंग, आणि ऑफलाइन ड्राफ्ट सिंक करण्याबाबत मदत करू शकतो. कृपया तुमचा प्रश्न विचारा.`;
    } else if (language === 'hi') {
      fallbackReply = `नमस्ते! मैं JeevaCare AI सहायक हूँ। मैं आपको रेफरल प्रक्रिया, 108 एम्बुलेंस समन्वय, निकटतम CEmONC/ब्लड बैंक सुविधाओं, और क्लिनिकल स्लिप डाउनलोड के बारे में मार्गदर्शन दे सकता हूँ। कृपया अपना प्रश्न पूछें।`;
    } else {
      fallbackReply = `Hello! I am your JeevaCare AI Assistant. I can assist you with creating rapid emergency referrals, tracking live 108 transport, finding verified CEmONC & SNCU facilities in Pune, printing clinical referral slips, and syncing offline drafts. How can I help you today?`;
    }
  }

  return {
    success: true,
    reply: fallbackReply,
    source: 'clinical-knowledge-engine',
    suggestedActions: getSuggestedActions(lowerQuery, language),
  };
}

function getSuggestedActions(
  query: string,
  lang: 'en' | 'mr' | 'hi'
): Array<{ label: string; action: string }> {
  if (lang === 'mr') {
    return [
      { label: 'नवीन रेफरल तयार करा', action: '/dashboard?view=new-referral' },
      { label: 'प्रमाणित रुग्णालये शोधा', action: '/facilities' },
      { label: '१०८ आपत्कालीन कॉल', action: 'tel:108' },
    ];
  }
  if (lang === 'hi') {
    return [
      { label: 'नया रेफरल बनाएँ', action: '/dashboard?view=new-referral' },
      { label: 'सत्यापित अस्पताल देखें', action: '/facilities' },
      { label: '108 आपातकालीन सहायता', action: 'tel:108' },
    ];
  }
  return [
    { label: 'New Emergency Referral', action: '/dashboard?view=new-referral' },
    { label: 'Find Verified CEmONC Hospitals', action: '/facilities' },
    { label: 'Call 108 Ambulance', action: 'tel:108' },
  ];
}
