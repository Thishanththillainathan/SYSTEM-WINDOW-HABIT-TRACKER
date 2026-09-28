import { query } from './postgres';

async function testLiveRegistration() {
  const testEmail = '25ee005@skcet.ac.in';
  
  // 1. Clean previous user record
  await query("DELETE FROM otps WHERE LOWER(email) = LOWER($1)", [testEmail]);
  await query("DELETE FROM users WHERE LOWER(email) = LOWER($1)", [testEmail]);
  console.log('[TEST SETUP] Deleted existing user from Neon PostgreSQL.');

  // 2. Call backend /api/auth/register over HTTP
  console.log('[TEST EXECUTION] Sending POST request to http://localhost:3001/api/auth/register...');
  const res = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'HunterPass123!',
      username: 'Real Email Hunter',
    }),
  });

  const data = await res.json();
  console.log('HTTP Status Code:', res.status);
  console.log('API Response Body:', data);
}

testLiveRegistration().then(() => process.exit(0)).catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
