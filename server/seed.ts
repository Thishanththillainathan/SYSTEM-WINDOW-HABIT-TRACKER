import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { query, initPostgresDb, pool } from './postgres';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export async function seedAdmin() {
  await initPostgresDb();

  const adminEmail = 'thishantht644@gmail.com';
  const rawPassword = process.env.ADMIN_SEED_PASSWORD || 'Thishanth@70';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  // Check if admin user already exists
  const existingRes = await query('SELECT * FROM users WHERE email = $1', [adminEmail]);
  const existing = existingRes.rows[0];

  if (existing) {
    await query("UPDATE users SET password_hash = $1, role = 'admin', status = 'verified' WHERE email = $2", [passwordHash, adminEmail]);
    console.log(`[SEED] Admin account (${adminEmail}) updated with password and admin role.`);
    return;
  }

  const defaultStats = JSON.stringify({
    STR: 30,
    INT: 35,
    VIT: 28,
    WIS: 25,
    CHA: 22,
  });

  // Insert Admin record into Database
  await query(`
    INSERT INTO users (
      id, email, password_hash, role, status, username, title, level, xp, xp_to_next_level, rank, streak, longest_streak, points, awakening_date, stats_json, account_status, has_completed_onboarding
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
    )
  `, [
    `admin-${Date.now()}`,
    adminEmail,
    passwordHash,
    'admin',
    'verified',
    'System Admin (Thishanth)',
    'S-Rank Shadow Monarch Admin',
    30,
    0,
    5000,
    'S',
    30,
    30,
    9999,
    new Date().toISOString().split('T')[0],
    defaultStats,
    'ACTIVE',
    true
  ]);

  console.log(`[SEED SUCCESS] Seeded Admin account (${adminEmail}) with role 'admin' and verified status.`);
}

// Run if called directly
if (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))) {
  seedAdmin().then(() => pool.end()).catch(console.error);
}
