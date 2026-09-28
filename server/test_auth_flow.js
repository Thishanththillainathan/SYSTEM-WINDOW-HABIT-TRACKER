import { db } from './db.js';

async function testFullFlow() {
  console.log('--- VERIFYING COMPLETE AUTH & OTP FLOW ---');

  const testEmail = `hunter_${Date.now()}@shadowguild.com`;
  const testPassword = 'MonarchPassword123!';

  // 1. Register
  console.log(`\n[1] Registering customer: ${testEmail}`);
  const regRes = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      username: 'Shadow Jin-Woo',
    }),
  });
  const regData = await regRes.json();
  console.log('Registration:', regData);

  // 2. Fetch OTP from DB
  const otpRecord = db.prepare('SELECT * FROM otps WHERE email = ?').get(testEmail);
  console.log('\n[2] Fetched OTP code from DB:', otpRecord);

  // 3. Verify OTP
  console.log('\n[3] Submitting OTP verification code');
  const verifyRes = await fetch('http://localhost:3001/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otpCode: otpRecord.otp_code,
    }),
  });
  const verifyData = await verifyRes.json();
  console.log('OTP Verification Response:', verifyData);

  // 4. Login after verification
  console.log('\n[4] Logging in as verified Customer');
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login Response:', loginData);

  console.log('\n--- VERIFICATION TEST COMPLETE ---');
}

testFullFlow().catch(console.error);
