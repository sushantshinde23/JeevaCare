import { app } from '../src/server/app.ts';
import http from 'http';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

async function run() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`Testing backend API endpoints on ${baseUrl}...`);

  // Test 1: Health
  const r1 = await fetch(`${baseUrl}/api/health`);
  assert(r1.ok, 'Health endpoint status ok');
  const d1 = await r1.json();
  assert(d1.status === 'healthy', 'Health check returns healthy');
  console.log('✓ /api/health passed');

  // Test 2: Facilities
  const r2 = await fetch(`${baseUrl}/api/facilities`);
  assert(r2.ok, 'Facilities status ok');
  const d2 = await r2.json();
  assert(Array.isArray(d2.facilities) && d2.facilities.length > 0, 'Facilities returned array');
  console.log('✓ /api/facilities passed');

  // Test 3: Referrals with query param (tests query destructuring)
  const r3 = await fetch(`${baseUrl}/api/referrals?status=IN_TRANSIT`);
  assert(r3.ok, 'Referrals query status ok');
  const d3 = await r3.json();
  assert(Array.isArray(d3.referrals), 'Referrals returned');
  console.log('✓ /api/referrals?status=IN_TRANSIT passed (query destructuring works)');

  // Test 4: Notifications with query param (tests role destructuring)
  const r4 = await fetch(`${baseUrl}/api/notifications?role=hospital_coordinator`);
  assert(r4.ok, 'Notifications query ok');
  const d4 = await r4.json();
  assert(Array.isArray(d4.notifications), 'Notifications returned');
  console.log('✓ /api/notifications?role=hospital_coordinator passed');

  // Test 5: Analytics
  const r5 = await fetch(`${baseUrl}/api/analytics`);
  assert(r5.ok, 'Analytics ok');
  const d5 = await r5.json();
  assert(d5.data && typeof d5.data.totalReferrals === 'number', 'Analytics returned metrics');
  console.log('✓ /api/analytics passed');

  server.close();
  console.log('--- ALL API TESTS PASSED SUCCESSFULLY (5/5) ---');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
