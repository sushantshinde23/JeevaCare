export type UserRole =
  | 'patient'
  | 'health_worker'
  | 'hospital_coordinator'
  | 'transport_coordinator'
  | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  assignedFacilityId?: string;
  assignedRegion?: string;
  organization?: string;
  language?: 'en' | 'mr' | 'hi';
  theme?: 'light' | 'dark' | 'system';
  photoUrl?: string;
}

export type EmergencyCategory =
  | 'ECLAMPSIA'
  | 'SEVERE_PREECLAMPSIA'
  | 'POSTPARTUM_HEMORRHAGE'
  | 'ANTEPARTUM_HEMORRHAGE'
  | 'OBSTRUCTED_LABOR'
  | 'SEPSIS_PUERPERAL'
  | 'RUPTURED_UTERUS'
  | 'NEWBORN_ASPHYXIA'
  | 'PRETERM_LOW_BIRTH_WEIGHT'
  | 'NEONATAL_SEPSIS'
  | 'OTHER_CRITICAL';

export type TriageUrgency = 'CRITICAL' | 'HIGH' | 'MODERATE';

export type ReferralStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'AWAITING_ACKNOWLEDGEMENT'
  | 'ACKNOWLEDGED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'TRANSPORT_REQUESTED'
  | 'TRANSPORT_ASSIGNED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'HANDOVER_COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export interface VitalSigns {
  systolicBP?: number;
  diastolicBP?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  temperatureF?: number;
  fetalHeartRate?: number;
  spO2?: number;
  cervicalDilationCm?: number;
  bleedingIntensity?: 'MILD' | 'MODERATE' | 'SEVERE_HEAVY';
  consciousness?: 'ALERT' | 'DROWSY' | 'UNCONSCIOUS' | 'CONVULSING';
}

export interface PreReferralTreatment {
  magnesiumSulfateGiven?: boolean;
  magnesiumSulfateDose?: string;
  oxytocinGiven?: boolean;
  oxytocinDose?: string;
  misoprostolGiven?: boolean;
  ivCannulaSecured?: boolean;
  ivFluidsStarted?: string;
  antibioticsGiven?: boolean;
  oxygenAdministered?: boolean;
  newbornBagAndMaskVentilation?: boolean;
  warmthMaintained?: boolean;
  notes?: string;
}

export interface PatientDemographics {
  name: string;
  age: number;
  husbandOrFatherName?: string;
  contactPhone: string;
  addressVillage: string;
  tehsil?: string;
  district: string;
  gravida: number;
  parity: number;
  gestationalWeeks: number;
  bloodGroup?: string;
  rchId?: string; // Reproductive & Child Health ID
}

export interface ReferralEvent {
  id: string;
  referralId: string;
  status: ReferralStatus;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  note?: string;
  metadata?: Record<string, any>;
}

export interface Referral {
  id: string;
  referralCode: string;
  patient: PatientDemographics;
  emergencyCategory: EmergencyCategory;
  urgency: TriageUrgency;
  vitals: VitalSigns;
  preReferralTreatment: PreReferralTreatment;
  clinicalNotes: string;
  
  referringHealthWorkerId: string;
  referringHealthWorkerName: string;
  referringFacilityName: string;
  referringCoordinates?: { lat: number; lng: number };
  
  receivingFacilityId: string;
  receivingFacilityName: string;
  receivingFacilityCoordinates?: { lat: number; lng: number };
  
  status: ReferralStatus;
  statusHistory: ReferralEvent[];
  
  rejectionReason?: string;
  alternativeFacilityId?: string;
  
  transportId?: string;
  transportStatus?: TransportStatus;
  
  handoverDetails?: {
    handoverTime: string;
    receivingDoctorName: string;
    admissionWard: string;
    arrivalVitals?: VitalSigns;
    handoverNotes?: string;
  };
  
  aiSummary?: string;
  aiWarnings?: string[];
  missingFieldsWarning?: string[];
  
  createdAt: string;
  updatedAt: string;
  isOfflineDraft?: boolean;
}

export type FacilityType =
  | 'MEDICAL_COLLEGE_HOSPITAL'
  | 'DISTRICT_HOSPITAL'
  | 'SUB_DISTRICT_HOSPITAL'
  | 'FIRST_REFERRAL_UNIT'
  | 'COMMUNITY_HEALTH_CENTRE'
  | 'PRIMARY_HEALTH_CENTRE';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  district: string;
  tehsil: string;
  address: string;
  coordinates: { lat: number; lng: number };
  phone: string;
  emergencyHelpline: string;
  
  isVerified: boolean;
  verifiedBy?: string;
  verificationDate?: string;
  
  // Maternal & Newborn Capabilities
  hasCEmONC: boolean; // Comprehensive Emergency Obstetric & Newborn Care
  hasBEmONC: boolean; // Basic Emergency Obstetric & Newborn Care
  hasSNCU: boolean;   // Special Newborn Care Unit
  hasNICU: boolean;   // Neonatal Intensive Care Unit
  hasBloodBank: boolean;
  hasBloodStorage: boolean;
  has24x7OT: boolean; // Operation Theatre
  hasObstetricianOnDuty: boolean;
  hasPediatricianOnDuty: boolean;
  hasAnesthetistOnDuty: boolean;
  
  // Live Readiness
  laborBedsAvailable: number;
  icuBedsAvailable: number;
  sncuBedsAvailable: number;
  bloodAvailability: { [group: string]: boolean };
  readinessLastUpdated: string;
}

export type TransportStatus =
  | 'REQUESTED'
  | 'DISPATCHED'
  | 'EN_ROUTE_PICKUP'
  | 'PATIENT_PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED_FACILITY'
  | 'CANCELLED'
  | 'FAILED';

export interface TransportRequest {
  id: string;
  referralId: string;
  referralCode: string;
  patientName: string;
  pickupLocation: string;
  pickupCoordinates: { lat: number; lng: number };
  destinationFacilityName: string;
  destinationCoordinates: { lat: number; lng: number };
  
  status: TransportStatus;
  ambulanceType: '108_ALS' | '108_BLS' | '102_JSSK' | 'PRIVATE_EMERGENCY';
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  paramedicName?: string;
  
  currentCoordinates?: { lat: number; lng: number };
  lastLocationUpdate?: string;
  estimatedArrivalMinutes?: number;
  
  requestedAt: string;
  dispatchedAt?: string;
  pickupAt?: string;
  deliveredAt?: string;
  delayReason?: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  userRole?: UserRole;
  title: string;
  message: string;
  type: 'EMERGENCY' | 'STATUS_UPDATE' | 'ACTION_REQUIRED' | 'DELAY_ALERT' | 'INFO';
  referralId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface FollowUpTask {
  id: string;
  referralId: string;
  patientName: string;
  patientPhone: string;
  dueDate: string;
  taskType: 'PNC_DAY_3' | 'PNC_DAY_7' | 'PNC_DAY_14' | 'PNC_DAY_42' | 'NEWBORN_IMMUNIZATION' | 'BP_MONITORING';
  assignedHealthWorkerId: string;
  status: 'PENDING' | 'COMPLETED' | 'MISSED';
  notes?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'REFERRAL' | 'FACILITY' | 'TRANSPORT' | 'AUTH';
  entityId: string;
  performedByUserId: string;
  performedByName: string;
  userRole: UserRole;
  timestamp: string;
  details?: Record<string, any>;
}
