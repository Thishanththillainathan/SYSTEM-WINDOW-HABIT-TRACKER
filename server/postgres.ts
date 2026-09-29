import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000, // 5 second connection timeout
  idleTimeoutMillis: 30000,       // 30 second idle timeout
  max: 20,                         // Maximum 20 connections
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function initPostgresDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'customer',
        status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
        username VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'E-Rank Awakened',
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        xp_to_next_level INTEGER DEFAULT 1000,
        rank VARCHAR(10) DEFAULT 'E',
        streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        awakening_date VARCHAR(50),
        stats_json TEXT,
        account_status VARCHAR(50) DEFAULT 'ACTIVE',
        has_completed_onboarding BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otps (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(255),
        otp_hash VARCHAR(255) NOT NULL,
        expires_at BIGINT NOT NULL,
        failed_attempts INTEGER DEFAULT 0,
        resend_count INTEGER DEFAULT 0,
        resend_window_start BIGINT DEFAULT 0,
        created_at BIGINT NOT NULL
      );

      ALTER TABLE otps ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(255);
      ALTER TABLE otps ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;
      ALTER TABLE otps ADD COLUMN IF NOT EXISTS resend_count INTEGER DEFAULT 0;
      ALTER TABLE otps ADD COLUMN IF NOT EXISTS resend_window_start BIGINT DEFAULT 0;
      ALTER TABLE otps ALTER COLUMN otp_code DROP NOT NULL;

      CREATE TABLE IF NOT EXISTS habits (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'General',
        frequency VARCHAR(50) DEFAULT 'Daily',
        specific_days TEXT,
        target VARCHAR(255),
        start_date VARCHAR(50),
        reminder_time VARCHAR(50),
        duration INTEGER DEFAULT 30,
        xp_reward INTEGER DEFAULT 20,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS habit_completions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        habit_id VARCHAR(255) NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        completion_date VARCHAR(50) NOT NULL,
        completed BOOLEAN DEFAULT TRUE,
        completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_quests (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        time VARCHAR(50),
        xp_value INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        missed BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS quests (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        deadline VARCHAR(50),
        difficulty VARCHAR(50),
        xp_reward INTEGER DEFAULT 0,
        status VARCHAR(50),
        accepted BOOLEAN DEFAULT FALSE,
        subtasks_json TEXT,
        completed_at VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS skills (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        mastery_percentage INTEGER DEFAULT 0,
        rank VARCHAR(10) DEFAULT 'E',
        level INTEGER DEFAULT 1,
        is_archived BOOLEAN DEFAULT FALSE,
        sessions_json TEXT,
        checkitems_json TEXT
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        tab VARCHAR(50),
        icon_name VARCHAR(100),
        rarity VARCHAR(50),
        earned BOOLEAN DEFAULT FALSE,
        earned_date VARCHAR(50),
        progress INTEGER DEFAULT 0,
        max_progress INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS boss_battles (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        deadline VARCHAR(50),
        max_hp INTEGER DEFAULT 100,
        current_hp INTEGER DEFAULT 100,
        reward_multiplier DOUBLE PRECISION DEFAULT 2.0,
        xp_reward INTEGER DEFAULT 500,
        points_reward INTEGER DEFAULT 300,
        status VARCHAR(50) DEFAULT 'IN_PROGRESS',
        subtasks_json TEXT
      );

      CREATE TABLE IF NOT EXISTS rewards (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        cost INTEGER NOT NULL,
        icon VARCHAR(100),
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS redemptions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reward_id VARCHAR(255),
        reward_title VARCHAR(255),
        cost INTEGER,
        redeemed_at VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS schedule (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        start_time VARCHAR(50),
        end_time VARCHAR(50),
        category VARCHAR(100),
        color VARCHAR(50),
        date VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS schedule_tasks (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        habit_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        task_date VARCHAR(50) NOT NULL,
        start_time VARCHAR(50),
        end_time VARCHAR(50),
        duration INTEGER DEFAULT 30,
        priority VARCHAR(50) DEFAULT 'MEDIUM',
        category VARCHAR(100) DEFAULT 'Quest',
        reminder_time VARCHAR(50),
        repeat_type VARCHAR(50) DEFAULT 'NONE',
        repeat_days TEXT,
        notes TEXT,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at VARCHAR(50),
        xp_reward INTEGER DEFAULT 25,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        details_json TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS change_history (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255),
        description TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_notices (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        timestamp VARCHAR(100) NOT NULL,
        type VARCHAR(50) DEFAULT 'INFO',
        active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS weekly_habits (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        target INTEGER DEFAULT 1,
        completed_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS monthly_habits (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        target INTEGER DEFAULT 1,
        completed_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS monthly_reflections (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        went_well TEXT,
        to_improve TEXT,
        main_goal TEXT,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, month, year)
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_name VARCHAR(100) NOT NULL DEFAULT 'FREE',
        plan_type VARCHAR(50) NOT NULL DEFAULT 'FREE',
        subscription_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        amount INTEGER NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        duration_months INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
        payment_provider VARCHAR(50) DEFAULT 'DEVELOPMENT',
        payment_id VARCHAR(255),
        order_id VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'FREE';
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'ACTIVE';
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS order_id VARCHAR(255);
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PAYMENT_PENDING';
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);

      CREATE TABLE IF NOT EXISTS rank_challenges (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        current_rank VARCHAR(50) NOT NULL DEFAULT 'E',
        target_rank VARCHAR(50) NOT NULL DEFAULT 'D',
        start_date VARCHAR(50) NOT NULL,
        base_required_days INTEGER NOT NULL DEFAULT 90,
        completed_days INTEGER NOT NULL DEFAULT 0,
        missed_days INTEGER NOT NULL DEFAULT 0,
        promotion_delay_days INTEGER NOT NULL DEFAULT 0,
        adjusted_required_days INTEGER NOT NULL DEFAULT 90,
        original_promotion_date VARCHAR(50) NOT NULL,
        current_promotion_date VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rank_challenge_days (
        id VARCHAR(255) PRIMARY KEY,
        challenge_id VARCHAR(255) NOT NULL REFERENCES rank_challenges(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_date VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        completed_at TIMESTAMPTZ,
        evaluated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(challenge_id, scheduled_date)
      );

      -- Indexes for fast lookups
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
      CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, habit_id, completion_date);
      CREATE INDEX IF NOT EXISTS idx_schedule_tasks_user_date ON schedule_tasks(user_id, task_date);
      CREATE INDEX IF NOT EXISTS idx_weekly_habits_user ON weekly_habits(user_id);
      CREATE INDEX IF NOT EXISTS idx_monthly_habits_user ON monthly_habits(user_id);
      CREATE INDEX IF NOT EXISTS idx_monthly_reflections_user_month_year ON monthly_reflections(user_id, month, year);
      CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user ON user_activity_logs(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_change_history_user_date ON change_history(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_change_history_entity ON change_history(user_id, entity_type, action_type);
      CREATE INDEX IF NOT EXISTS idx_rank_challenges_user ON rank_challenges(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_rank_challenge_days_challenge ON rank_challenge_days(challenge_id, scheduled_date);
    `);

    await client.query('COMMIT');
    console.log('⚡ [NEON POSTGRESQL SCHEMAS INITIALIZED SUCCESSFULLY]');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing PostgreSQL schemas:', err);
    throw err;
  } finally {
    client.release();
  }
}
