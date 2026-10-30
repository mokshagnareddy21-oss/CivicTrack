import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function runValidationTests() {
  console.log('================================================================');
  console.log('    CIVICTRACK RESOLUTION & REJECTION VALIDATION TEST SUITE     ');
  console.log('================================================================\n');

  // 1. Authenticate Admin
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'mokshagnareddy21@gmail.com';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'moksha@2007';
  
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  console.log(`✓ Admin logged in: ${loginData.user.email} (${loginData.user.role})`);

  // 2. Fetch complaint CT-2026-OS5WY416
  const listRes = await fetch(`${BASE_URL}/api/complaints`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  const targetComplaint = (listData.complaints || []).find(c => c.trackingId === 'CT-2026-OS5WY416') || listData.complaints[0];
  if (!targetComplaint) {
    throw new Error('No target complaint found.');
  }
  console.log(`✓ Target complaint: ${targetComplaint.trackingId} (ID: ${targetComplaint._id})`);

  // Ensure initial state is "In Progress"
  console.log('\n[Setup] Transitioning complaint to "In Progress" as baseline state...');
  const initRes = await fetch(`${BASE_URL}/api/complaints/${targetComplaint._id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      status: 'In Progress',
      note: 'Setting baseline status for resolution validation test',
    }),
  });
  const initData = await initRes.json();
  console.log(`Baseline Status: ${initData.complaint?.status} (Resolution Note: "${initData.complaint?.resolutionNote || ''}")`);

  const results = [];

  // Helper to check DB state
  async function getDbStatus() {
    const r = await fetch(`${BASE_URL}/api/complaints/${targetComplaint._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    return d.complaint;
  }

  // Helper for test case
  async function testCase(name, payload, expectedCode, expectedDbStatus) {
    console.log(`\n--- ${name} ---`);
    console.log(`Payload: ${JSON.stringify(payload)}`);
    const res = await fetch(`${BASE_URL}/api/complaints/${targetComplaint._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    console.log(`Response HTTP Status: ${res.status} (Expected: ${expectedCode})`);
    console.log(`Response Message: "${body.message}"`);

    const currentDb = await getDbStatus();
    console.log(`Database Current Status: "${currentDb.status}" (Expected: "${expectedDbStatus}")`);

    const httpMatches = res.status === expectedCode;
    const dbMatches = currentDb.status === expectedDbStatus;
    const passed = httpMatches && dbMatches;

    results.push({ name, passed, status: res.status, dbStatus: currentDb.status });
    console.log(`Result: ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
    if (!passed) {
      throw new Error(`Test failed: ${name}`);
    }
  }

  // TEST 1: Missing resolutionNote
  await testCase(
    '1. Transition to Resolved with missing resolutionNote',
    { status: 'Resolved' },
    400,
    'In Progress'
  );

  // TEST 2: Null resolutionNote
  await testCase(
    '2. Transition to Resolved with null resolutionNote',
    { status: 'Resolved', resolutionNote: null },
    400,
    'In Progress'
  );

  // TEST 3: Empty string resolutionNote
  await testCase(
    '3. Transition to Resolved with empty string resolutionNote',
    { status: 'Resolved', resolutionNote: '' },
    400,
    'In Progress'
  );

  // TEST 4: Whitespace-only resolutionNote
  await testCase(
    '4. Transition to Resolved with whitespace-only resolutionNote',
    { status: 'Resolved', resolutionNote: '     ' },
    400,
    'In Progress'
  );

  // TEST 5: Short resolutionNote (< 5 chars)
  await testCase(
    '5. Transition to Resolved with short resolutionNote ("done", 4 chars)',
    { status: 'Resolved', resolutionNote: 'done' },
    400,
    'In Progress'
  );

  // TEST 6: Missing rejectionReason
  await testCase(
    '6. Transition to Rejected with missing rejectionReason',
    { status: 'Rejected' },
    400,
    'In Progress'
  );

  // TEST 7: Empty rejectionReason
  await testCase(
    '7. Transition to Rejected with empty rejectionReason',
    { status: 'Rejected', rejectionReason: '' },
    400,
    'In Progress'
  );

  // TEST 8: Whitespace-only rejectionReason
  await testCase(
    '8. Transition to Rejected with whitespace-only rejectionReason',
    { status: 'Rejected', rejectionReason: '    ' },
    400,
    'In Progress'
  );

  // TEST 9: Short rejectionReason (< 5 chars)
  await testCase(
    '9. Transition to Rejected with short rejectionReason ("no", 2 chars)',
    { status: 'Rejected', rejectionReason: 'no' },
    400,
    'In Progress'
  );

  // TEST 10: Valid resolution note (>= 5 chars)
  const validNote = 'Replaced damaged flange and pressure valve; tested at 4.2 bar with zero leakage.';
  await testCase(
    '10. Valid transition to Resolved with complete resolution note (>= 5 chars)',
    { status: 'Resolved', resolutionNote: validNote },
    200,
    'Resolved'
  );

  // Verify resolution details in DB
  const resolvedDb = await getDbStatus();
  if (resolvedDb.resolutionNote !== validNote || !resolvedDb.resolvedAt) {
    throw new Error('Resolution note or resolvedAt timestamp was not properly persisted in MongoDB Atlas!');
  }
  console.log(`✓ Verified MongoDB Atlas persistence: resolutionNote="${resolvedDb.resolutionNote}", resolvedAt="${resolvedDb.resolvedAt}"`);

  // TEST 11: Valid transition back to In Progress (verify stale notes are cleared)
  await testCase(
    '11. Valid transition back to In Progress (stale note cleared)',
    { status: 'In Progress', note: 'Reopened for post-repair ground inspection' },
    200,
    'In Progress'
  );
  const reopenedDb = await getDbStatus();
  if (reopenedDb.resolutionNote !== '' || reopenedDb.resolvedAt) {
    throw new Error('Stale resolutionNote was not cleared upon moving back to In Progress!');
  }
  console.log(`✓ Verified stale resolution data properly wiped on reopening (resolutionNote="${reopenedDb.resolutionNote}")`);

  // TEST 12: Valid transition to Rejected with complete reason (>= 5 chars)
  const validReason = 'Duplicate grievance; consolidated under Master Case CT-2026-WTR892.';
  await testCase(
    '12. Valid transition to Rejected with complete reason (>= 5 chars)',
    { status: 'Rejected', rejectionReason: validReason },
    200,
    'Rejected'
  );
  const rejectedDb = await getDbStatus();
  if (rejectedDb.rejectionReason !== validReason) {
    throw new Error('Rejection reason was not properly persisted in MongoDB Atlas!');
  }
  console.log(`✓ Verified MongoDB Atlas persistence: rejectionReason="${rejectedDb.rejectionReason}"`);

  // Return complaint to Resolved with clean note for normal operation
  await testCase(
    '13. Final status set to Resolved with official resolution summary',
    {
      status: 'Resolved',
      resolutionNote: 'All pipeline repairs verified by municipal engineering team. Leakage completely stopped.',
    },
    200,
    'Resolved'
  );

  console.log('\n================================================================');
  console.log('              ALL 13 VALIDATION TESTS PASSED ✓                 ');
  console.log('================================================================');
  for (const r of results) {
    console.log(`- ${r.name}: Status ${r.status}, DB: ${r.dbStatus} -> PASSED`);
  }
  console.log('================================================================\n');
}

runValidationTests().catch((err) => {
  console.error('\n❌ VALIDATION TEST SUITE ERROR:', err);
  process.exit(1);
});
