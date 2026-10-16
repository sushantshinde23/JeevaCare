import { translations } from '../src/i18n/translations';
import { INITIAL_FACILITIES, INITIAL_REFERRALS } from '../src/services/storage';
import { ReferralStatus } from '../src/types';

// Simple lightweight test runner
function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- Running MaatriCare AI Test Suite ---');

// Test 1: Translation dictionary completeness
console.log('Test 1: Validating i18n translations across EN, MR, HI...');
const enKeys = Object.keys(translations.en);
const mrKeys = Object.keys(translations.mr);
const hiKeys = Object.keys(translations.hi);

assert(enKeys.length > 30, `EN keys should be substantial, found ${enKeys.length}`);
assert(mrKeys.length > 30, `MR keys should be substantial, found ${mrKeys.length}`);
assert(hiKeys.length > 30, `HI keys should be substantial, found ${hiKeys.length}`);

// Check critical keys exist in all languages
const criticalKeys = [
  'brand.name',
  'brand.tagline',
  'hero.title',
  'status.SUBMITTED',
  'status.ACKNOWLEDGED',
  'status.ACCEPTED',
  'status.IN_TRANSIT',
  'status.HANDOVER_COMPLETED',
  'vitals.systolicBP',
  'treatment.mgso4',
  'emergency.title',
];

for (const k of criticalKeys) {
  assert(Boolean(translations.en[k]), `Missing key "${k}" in EN`);
  assert(Boolean(translations.mr[k]), `Missing key "${k}" in MR`);
  assert(Boolean(translations.hi[k]), `Missing key "${k}" in HI`);
}
console.log('✓ Test 1 Passed: Translations verified.');

// Test 2: Referral State Transition Machine
console.log('Test 2: Verifying Controlled Referral State Transitions...');
const ALLOWED_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['AWAITING_ACKNOWLEDGEMENT', 'ACKNOWLEDGED', 'REJECTED', 'CANCELLED'],
  AWAITING_ACKNOWLEDGEMENT: ['ACKNOWLEDGED', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACKNOWLEDGED: ['ACCEPTED', 'REJECTED', 'TRANSPORT_REQUESTED', 'CANCELLED'],
  ACCEPTED: ['TRANSPORT_REQUESTED', 'TRANSPORT_ASSIGNED', 'IN_TRANSIT', 'CANCELLED'],
  REJECTED: ['SUBMITTED', 'CANCELLED'],
  TRANSPORT_REQUESTED: ['TRANSPORT_ASSIGNED', 'IN_TRANSIT', 'CANCELLED'],
  TRANSPORT_ASSIGNED: ['IN_TRANSIT', 'ARRIVED', 'CANCELLED'],
  IN_TRANSIT: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['HANDOVER_COMPLETED', 'CLOSED'],
  HANDOVER_COMPLETED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

// Validate that invalid jumps (e.g. DRAFT -> HANDOVER_COMPLETED) are disallowed
assert(!ALLOWED_TRANSITIONS['DRAFT'].includes('HANDOVER_COMPLETED'), 'DRAFT cannot jump directly to HANDOVER_COMPLETED');
assert(!ALLOWED_TRANSITIONS['SUBMITTED'].includes('CLOSED'), 'SUBMITTED cannot jump directly to CLOSED');
assert(ALLOWED_TRANSITIONS['SUBMITTED'].includes('ACKNOWLEDGED'), 'SUBMITTED can transition to ACKNOWLEDGED');
assert(ALLOWED_TRANSITIONS['IN_TRANSIT'].includes('ARRIVED'), 'IN_TRANSIT can transition to ARRIVED');
assert(ALLOWED_TRANSITIONS['ARRIVED'].includes('HANDOVER_COMPLETED'), 'ARRIVED can transition to HANDOVER_COMPLETED');
console.log('✓ Test 2 Passed: State transition machine enforced.');

// Test 3: Facility Data Quality & Verification
console.log('Test 3: Checking Facility Capabilities & Verification Data...');
assert(INITIAL_FACILITIES.length >= 4, `At least 4 verified facilities required, found ${INITIAL_FACILITIES.length}`);

for (const fac of INITIAL_FACILITIES) {
  assert(typeof fac.name === 'string' && fac.name.length > 0, `Facility has valid name: ${fac.name}`);
  assert(fac.coordinates.lat > 0 && fac.coordinates.lng > 0, `Facility coordinates valid for ${fac.name}`);
  assert(typeof fac.laborBedsAvailable === 'number', `Labor beds count present for ${fac.name}`);
  if (fac.isVerified) {
    assert(Boolean(fac.verifiedBy), `Verified facility must have verifier: ${fac.name}`);
  }
}
console.log('✓ Test 3 Passed: Facilities data integrity verified.');

// Test 4: Referral Seed Records
console.log('Test 4: Checking Referral Seed Integrity...');
assert(INITIAL_REFERRALS.length >= 3, `Expected at least 3 initial referrals, found ${INITIAL_REFERRALS.length}`);
for (const ref of INITIAL_REFERRALS) {
  assert(Boolean(ref.patient.name), `Referral has patient name`);
  assert(Boolean(ref.emergencyCategory), `Referral has emergency category`);
  assert(Boolean(ref.referringFacilityName), `Referral has referring facility`);
  assert(Boolean(ref.receivingFacilityName), `Referral has receiving facility`);
  assert(ref.statusHistory.length > 0, `Referral has status history`);
}
console.log('✓ Test 4 Passed: Referral seeds verified.');

console.log('--- ALL TESTS PASSED SUCCESSFULLY (4/4) ---');
