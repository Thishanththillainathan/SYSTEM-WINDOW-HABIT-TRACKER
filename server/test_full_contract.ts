import { query } from './postgres';
import bcrypt from 'bcryptjs';

async function testFullContract() {
  const testEmail = '25ee005@skcet.ac.in';
  const testPassword = 'ContractPassword123!';
  const testUsername = 'Contract Verification Hunter';

  console.log('===========================================================');
  console.log('       FULL END-TO-END REGISTRATION & OTP CONTRACT TEST     ');
  console.log('===========================================================');

  // STEP 1: CLEANUP
  console.log('\n[STEP 1] Cleaning up pre-existing user records...');
  await query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [testEmail]);
  await query('DELETE FROM users WHERE LOWER(email) = LOWER($1)', [testEmail]);
  console.log('✓ Cleanup complete.');

  // STEP 2: REGISTER VIA HTTP API
  console.log('\n[STEP 2] Submitting registration request over HTTP API...');
  const regRes = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      username: testUsername,
    }),
  });

  const regData = await regRes.json();
  console.log('HTTP Status Code:', regRes.status);
  console.log('Registration Response:', regData);

  if (!regRes.ok || !regData.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  console.log('✓ Step 2 Passed: Backend accepted registration request.');

  // STEP 3: AUDIT NEON POSTGRESQL OTP RECORD
  console.log('\n[STEP 3] Auditing Neon PostgreSQL otps table...');
  const dbRes = await query('SELECT * FROM otps WHERE LOWER(email) = LOWER($1)', [testEmail]);
  const otpRecord = dbRes.rows[0];

  if (!otpRecord) {
    throw new Error('No OTP record found in Neon database!');
  }

  console.log('Neon OTP ID:', otpRecord.id);
  console.log('Neon OTP Email:', otpRecord.email);
  console.log('Neon OTP Expiry (ms):', otpRecord.expires_at);

  if (otpRecord.email.toLowerCase() !== testEmail.toLowerCase()) {
    throw new Error('Neon database OTP email mismatch!');
  }
  console.log('✓ Step 3 Passed: Neon DB email matches registration input.');

  // STEP 4: VERIFY OTP VIA HTTP API
  console.log('\n[STEP 4] Submitting OTP verification request over HTTP API...');
  const verifyRes = await fetch('http://localhost:3001/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otpCode: otpRecord.otp_code,
    }),
  });

  const verifyData = await verifyRes.json();
  console.log('HTTP Status Code:', verifyRes.status);
  console.log('Verification Response:', verifyData);

  if (!verifyRes.ok || !verifyData.success) {
    throw new Error(`OTP Verification failed: ${JSON.stringify(verifyData)}`);
  }
  console.log('✓ Step 4 Passed: Backend OTP verification succeeded.');

  // STEP 5: AUDIT USER STATUS TRANSITION IN NEON DB
  console.log('\n[STEP 5] Auditing user status in Neon PostgreSQL...');
  const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [testEmail]);
  const userRecord = userRes.rows[0];

  console.log('User ID:', userRecord?.id);
  console.log('User Email:', userRecord?.email);
  console.log('User Account Status:', userRecord?.status);

  if (userRecord?.status !== 'verified') {
    throw new Error('User status in Neon DB is not "verified"!');
  }
  console.log('✓ Step 5 Passed: User status updated to "verified" in Neon DB.');

  // STEP 6: VERIFY STANDARD LOGIN
  console.log('\n[STEP 6] Submitting login request for newly verified account...');
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  const loginData = await loginRes.json();
  console.log('HTTP Status Code:', loginRes.status);
  console.log('Login Response:', loginData);

  if (!loginRes.ok || !loginData.success || !loginData.token) {
    throw new Error(`Login failed for verified user: ${JSON.stringify(loginData)}`);
  }
  console.log('✓ Step 6 Passed: Login succeeded and JWT token issued!');

  console.log('\n===========================================================');
  console.log('       ALL 6 CONTRACT STEPS PASSED SUCCESSFULLY           ');
  console.log('===========================================================');
}

testFullContract().then(() => process.exit(0)).catch((err) => {
  console.error('\n❌ Contract test failed:', err);
  process.exit(1);
});
