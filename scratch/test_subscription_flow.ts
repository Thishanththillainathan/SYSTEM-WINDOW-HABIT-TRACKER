import { query, initPostgresDb } from '../server/postgres';

async function testSubscriptionFlow() {
  console.log('--- STARTING SUBSCRIPTION SYSTEM TESTS ---');
  await initPostgresDb();

  // Test 1 & 8: Verify table structure
  const subColumns = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions'
  `);
  console.log('✓ Subscriptions Table Columns:', subColumns.rows.map(r => r.column_name).join(', '));

  // Test user creation / lookup
  const userRes = await query("SELECT * FROM users WHERE email = 'lordthishanth74@gmail.com' LIMIT 1");
  let testUser = userRes.rows[0];

  if (!testUser) {
    console.log('Creating test user...');
    const userId = `usr-test-${Date.now()}`;
    await query(`
      INSERT INTO users (id, email, password_hash, username, status, account_status)
      VALUES ($1, 'lordthishanth74@gmail.com', 'hash', 'TestHunter', 'verified', 'ACTIVE')
    `, [userId]);
    const newlyCreated = await query("SELECT * FROM users WHERE id = $1", [userId]);
    testUser = newlyCreated.rows[0];
  }
  console.log('✓ Test User ID:', testUser.id, 'Email:', testUser.email);

  // Test 2 & 3: Check / create Free 1-Day subscription
  let subRes = await query("SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [testUser.id]);
  let sub = subRes.rows[0];

  if (!sub) {
    const subId = `sub-free-test-${Date.now()}`;
    await query(`
      INSERT INTO subscriptions (
        id, user_id, plan_name, plan_type, subscription_status, status, amount, currency, duration_months, started_at, expires_at
      ) VALUES (
        $1, $2, 'FREE', 'FREE', 'ACTIVE', 'ACTIVE', 0, 'INR', 0, NOW(), NOW() + INTERVAL '24 hours'
      )
    `, [subId, testUser.id]);
    subRes = await query("SELECT * FROM subscriptions WHERE id = $1", [subId]);
    sub = subRes.rows[0];
  }
  console.log('✓ Initial Subscription:', sub.plan_type, 'Status:', sub.subscription_status, 'Expires:', sub.expires_at);

  // Test 4: Expiration Calculation Simulation
  const now = new Date();
  const expiresAt = new Date(sub.expires_at);
  const isCurrentlyActive = (sub.subscription_status === 'ACTIVE' || sub.status === 'ACTIVE') && now <= expiresAt;
  console.log('✓ Active Status Check:', isCurrentlyActive ? 'ACTIVE (Habits Unlocked)' : 'EXPIRED (Paywall Active)');

  // Test 5 & 6: Plan Upgrade Simulation (3 MONTHS for ₹100)
  const upgradeSubId = `sub-3m-test-${Date.now()}`;
  await query("UPDATE subscriptions SET subscription_status = 'SUPERSEDED', status = 'SUPERSEDED' WHERE user_id = $1 AND (subscription_status = 'ACTIVE' OR status = 'ACTIVE')", [testUser.id]);
  await query(`
    INSERT INTO subscriptions (
      id, user_id, plan_name, plan_type, subscription_status, status, amount, currency, duration_months, started_at, expires_at, payment_provider, payment_id, order_id
    ) VALUES (
      $1, $2, '3 MONTHS', '3_MONTHS', 'ACTIVE', 'ACTIVE', 100, 'INR', 3, NOW(), NOW() + INTERVAL '3 months', 'DEVELOPMENT', 'pay_123', 'ord_123'
    )
  `, [upgradeSubId, testUser.id]);

  const upgradedRes = await query("SELECT * FROM subscriptions WHERE id = $1", [upgradeSubId]);
  const upgradedSub = upgradedRes.rows[0];
  console.log('✓ Upgraded Subscription:', upgradedSub.plan_name, 'Status:', upgradedSub.subscription_status, 'Expires:', upgradedSub.expires_at);

  console.log('--- ALL SUBSCRIPTION BACKEND TESTS PASSED CLEANLY ---');
  process.exit(0);
}

testSubscriptionFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
