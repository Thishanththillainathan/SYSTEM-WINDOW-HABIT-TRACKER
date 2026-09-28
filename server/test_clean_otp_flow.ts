import { query } from './postgres';

async function testCleanOtpFlow() {
  const testEmail = `clean_hunter_${Date.now()}@shadowguild.com`;
  console.log('===========================================================');
  console.log('            CLEAN PROVIDER-INDEPENDENT OTP TEST           ');
  console.log('===========================================================');
  console.log(`Test Registration Email: ${testEmail}`);

  // 1. Submit registration over HTTP API
  const res = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'CleanPassword123!',
      username: 'Clean Hunter',
    }),
  });

  const data = await res.json();
  console.log('\nHTTP Response Status Code:', res.status);
  console.log('API Response Body:', data);

  // 2. Audit Neon PostgreSQL otps table
  const dbRes = await query('SELECT * FROM otps WHERE LOWER(email) = LOWER($1)', [testEmail]);
  const otpRow = dbRes.rows[0];

  console.log('\n--- NEON POSTGRESQL DB AUDIT ---');
  console.log('Neon OTP Record Exists:', Boolean(otpRow));
  console.log('Neon Stored Email:', otpRow?.email);

  if (otpRow && otpRow.email === testEmail.toLowerCase()) {
    console.log('✓ SUCCESS: Neon PostgreSQL OTP generation & storage logic preserved.');
  } else {
    console.error('❌ FAIL: OTP was not stored in Neon PostgreSQL!');
    process.exit(1);
  }

  if (res.status === 500 && data.error?.includes('SMTP email provider is not configured')) {
    console.log('✓ SUCCESS: Unconfigured provider handled cleanly with transparent backend error message.');
  } else {
    console.error('❌ FAIL: Expected unconfigured provider error message!');
    process.exit(1);
  }

  console.log('===========================================================');
  console.log('                CLEAN OTP FLOW VERIFIED                    ');
  console.log('===========================================================');
}

testCleanOtpFlow().then(() => process.exit(0)).catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
