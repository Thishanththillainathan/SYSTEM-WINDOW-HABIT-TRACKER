import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_BASE = process.env.TEST_API_URL || 'http://localhost:3001';

async function runAuthSuite() {
  console.log(`\n🧪 [RUNNING SYSTEM WINDOW AUTH & HEALTH TEST SUITE]`);
  console.log(`➜ Target Server: ${API_BASE}\n`);

  let passCount = 0;
  let failCount = 0;

  async function testStep(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passCount++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err?.message || err);
      failCount++;
    }
  }

  // 1. Health check
  await testStep('GET /health returns status online', async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'online') throw new Error(`Unexpected status: ${data.status}`);
  });

  // 2. Registration Diagnostics
  await testStep('GET /api/diagnostics/registration returns valid report', async () => {
    const res = await fetch(`${API_BASE}/api/diagnostics/registration`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.api || !data.database || !data.smtp) throw new Error(`Invalid diagnostics schema: ${JSON.stringify(data)}`);
  });

  // 3. OPTIONS Preflight CORS
  await testStep('OPTIONS /api/auth/register supports CORS preflight', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://system-window.vercel.app',
        'Access-Control-Request-Method': 'POST',
      },
    });
    if (res.status !== 200 && res.status !== 204) throw new Error(`HTTP ${res.status}`);
    const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
    if (allowOrigin !== 'https://system-window.vercel.app' && allowOrigin !== '*') {
      throw new Error(`Invalid Access-Control-Allow-Origin: ${allowOrigin}`);
    }
  });

  // 4. Invalid Email Registration (400)
  await testStep('POST /api/auth/register invalid email returns 400 JSON', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email', password: 'password123', username: 'Tester' }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const data = await res.json();
    if (!data.error && !data.message) throw new Error('Expected JSON error message in response');
  });

  // 5. Short Password Registration (400)
  await testStep('POST /api/auth/register short password returns 400 JSON', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testuser@example.com', password: '123', username: 'Tester' }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 6. Logged out /api/auth/me (401)
  await testStep('GET /api/auth/me logged out returns 401 JSON', async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const data = await res.json();
    if (data.success !== false || !data.error) throw new Error(`Expected JSON error response schema`);
  });

  // 7. Wrong OTP Verification (400)
  await testStep('POST /api/auth/verify-otp wrong OTP returns 400 JSON', async () => {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com', otpCode: '000000' }),
    });
    if (res.status !== 400 && res.status !== 404) throw new Error(`Expected 400/404, got ${res.status}`);
    const data = await res.json();
    if (!data.error && !data.message) throw new Error('Expected JSON error response');
  });

  console.log(`\n📊 [TEST SUITE SUMMARY]`);
  console.log(`➜ Passed: ${passCount}`);
  console.log(`➜ Failed: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runAuthSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
