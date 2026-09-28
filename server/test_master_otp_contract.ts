import { query } from './postgres';

async function testMasterOtpContract() {
  console.log('===========================================================');
  console.log('      MASTER OTP REGISTRATION RECIPIENT CONTRACT TEST       ');
  console.log('===========================================================');

  const testCases = [
    'testuser1@gmail.com',
    'testuser2@outlook.com',
    'student@college.edu',
  ];

  for (let i = 0; i < testCases.length; i++) {
    const emailInput = testCases[i];
    console.log(`\n--- [TEST ${i + 1}] Testing Registration for: ${emailInput} ---`);

    // Clean up pre-existing user & OTP records
    await query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [emailInput]);
    await query('DELETE FROM users WHERE LOWER(email) = LOWER($1)', [emailInput]);

    // 1. Submit Registration HTTP Request
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput,
        password: 'TestPassword123!',
        username: `Hunter ${i + 1}`,
      }),
    });

    const data = await res.json();
    console.log('HTTP Status Code:', res.status);
    console.log('Registration Response:', data);

    // 2. Audit Neon PostgreSQL `otps` table
    const otpDbRes = await query('SELECT * FROM otps WHERE LOWER(email) = LOWER($1)', [emailInput]);
    const otpRow = otpDbRes.rows[0];

    // 3. Audit Neon PostgreSQL `users` table
    const userDbRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [emailInput]);
    const userRow = userDbRes.rows[0];

    console.log('Neon otps email:', otpRow?.email);
    console.log('Neon users email:', userRow?.email);

    if (otpRow?.email !== emailInput.toLowerCase() || userRow?.email !== emailInput.toLowerCase()) {
      throw new Error(`TEST ${i + 1} FAILED: Neon DB stored email does not match registration input ${emailInput}!`);
    }

    console.log(`✓ TEST ${i + 1} PASSED: Exact recipient preserved in Neon DB for ${emailInput}`);
  }

  // TEST 4: Resend OTP for `student@college.edu`
  console.log('\n--- [TEST 4] Testing Resend OTP for: student@college.edu ---');
  const resendEmail = 'student@college.edu';

  // Wait 1 second so created_at is strictly older
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Clear previous OTP to allow immediate resend without 60s cooldown limit in test
  await query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [resendEmail]);

  const resendRes = await fetch('http://localhost:3001/api/auth/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: resendEmail }),
  });

  const resendData = await resendRes.json();
  console.log('Resend OTP HTTP Status:', resendRes.status);
  console.log('Resend OTP Response:', resendData);

  const resendOtpDbRes = await query('SELECT * FROM otps WHERE LOWER(email) = LOWER($1)', [resendEmail]);
  const resendOtpRow = resendOtpDbRes.rows[0];

  console.log('Resend Neon otps email:', resendOtpRow?.email);

  if (resendOtpRow?.email !== resendEmail.toLowerCase()) {
    throw new Error(`TEST 4 FAILED: Resend OTP stored email does not match ${resendEmail}!`);
  }

  console.log('✓ TEST 4 PASSED: Resend OTP recipient remains exact original email student@college.edu');

  console.log('\n===========================================================');
  console.log('      ALL 4 MASTER RECIPIENT TESTS PASSED SUCCESSFULLY     ');
  console.log('===========================================================');
}

testMasterOtpContract().then(() => process.exit(0)).catch((err) => {
  console.error('\n❌ Master contract test failed:', err);
  process.exit(1);
});
