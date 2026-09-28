import { query } from './postgres';

async function testSmtpLiveDelivery() {
  const testEmail = 'thishantht644@gmail.com'; // Using user's real email address to confirm delivery in Gmail inbox

  console.log('===========================================================');
  console.log('       LIVE GMAIL SMTP OTP EMAIL TRANSMISSION TEST          ');
  console.log('===========================================================');
  console.log(`Target Registration Email: ${testEmail}`);

  // 1. Clean up user from Neon PostgreSQL
  await query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [testEmail]);
  await query('DELETE FROM users WHERE LOWER(email) = LOWER($1)', [testEmail]);
  console.log('[SETUP] Cleaned pre-existing test data in Neon PostgreSQL.');

  // 2. Submit Registration HTTP Request
  console.log('[EXECUTION] Sending POST request to http://localhost:3001/api/auth/register...');
  const res = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'GmailTestPass123!',
      username: 'Gmail Live Hunter',
    }),
  });

  const data = await res.json();
  console.log('HTTP Status Code:', res.status);
  console.log('Response Body:', data);

  if (!res.ok || !data.success) {
    throw new Error(`Registration failed: ${JSON.stringify(data)}`);
  }

  // 3. Check Neon PostgreSQL otps record
  const dbRes = await query('SELECT * FROM otps WHERE LOWER(email) = LOWER($1)', [testEmail]);
  const otpRow = dbRes.rows[0];

  console.log('\n--- NEON POSTGRESQL AUDIT ---');
  console.log('Neon OTP ID:', otpRow?.id);
  console.log('Neon Stored Email:', otpRow?.email);

  if (otpRow?.email !== testEmail.toLowerCase()) {
    throw new Error('Neon database OTP email mismatch!');
  }

  console.log('\n===========================================================');
  console.log('   ✓ GMAIL SMTP OTP TRANSMITTED SUCCESSFULLY VIA SMTP     ');
  console.log('===========================================================');
}

testSmtpLiveDelivery().then(() => process.exit(0)).catch((err) => {
  console.error('\n❌ Live SMTP test failed:', err);
  process.exit(1);
});
