import Database from 'better-sqlite3';
import path from 'path';
import { pool, initPostgresDb } from './postgres';

const dbPath = path.resolve(process.cwd(), 'data', 'system_window.db');
const sqliteDb = new Database(dbPath);

export async function migrateSqliteToPostgres() {
  console.log('🔄 [MIGRATION START] Migrating SQLite data to Neon PostgreSQL...');
  await initPostgresDb();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Migrate USERS
    const users = sqliteDb.prepare('SELECT * FROM users').all() as any[];
    console.log(`Migrating ${users.length} users...`);
    for (const u of users) {
      await client.query(`
        INSERT INTO users (
          id, email, password_hash, role, status, username, title, level, xp, xp_to_next_level, rank, streak, longest_streak, points, awakening_date, stats_json, account_status, has_completed_onboarding, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          username = EXCLUDED.username,
          title = EXCLUDED.title,
          level = EXCLUDED.level,
          xp = EXCLUDED.xp,
          xp_to_next_level = EXCLUDED.xp_to_next_level,
          rank = EXCLUDED.rank,
          streak = EXCLUDED.streak,
          longest_streak = EXCLUDED.longest_streak,
          points = EXCLUDED.points,
          awakening_date = EXCLUDED.awakening_date,
          stats_json = EXCLUDED.stats_json,
          account_status = EXCLUDED.account_status,
          has_completed_onboarding = EXCLUDED.has_completed_onboarding
      `, [
        u.id, u.email, u.password_hash, u.role, u.status, u.username, u.title,
        u.level, u.xp, u.xp_to_next_level, u.rank, u.streak, u.longest_streak, u.points,
        u.awakening_date, u.stats_json, u.account_status, Boolean(u.has_completed_onboarding), u.created_at || new Date()
      ]);
    }

    // 2. Migrate OTPS
    const otps = sqliteDb.prepare('SELECT * FROM otps').all() as any[];
    console.log(`Migrating ${otps.length} OTPS...`);
    for (const o of otps) {
      await client.query(`
        INSERT INTO otps (id, email, otp_code, expires_at, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [o.id, o.email, o.otp_code, o.expires_at, o.created_at]);
    }

    // 3. Migrate HABITS
    const habits = sqliteDb.prepare('SELECT * FROM habits').all() as any[];
    console.log(`Migrating ${habits.length} habits...`);
    for (const h of habits) {
      await client.query(`
        INSERT INTO habits (
          id, user_id, name, description, category, frequency, specific_days, target, start_date, reminder_time, duration, xp_reward, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
      `, [
        h.id, h.user_id, h.name, h.description, h.category, h.frequency, h.specific_days,
        h.target, h.start_date, h.reminder_time, h.duration, h.xp_reward, Boolean(h.is_active),
        h.created_at || new Date(), h.updated_at || new Date()
      ]);
    }

    // 4. Migrate HABIT COMPLETIONS
    const habitCompletions = sqliteDb.prepare('SELECT * FROM habit_completions').all() as any[];
    console.log(`Migrating ${habitCompletions.length} habit completions...`);
    for (const hc of habitCompletions) {
      await client.query(`
        INSERT INTO habit_completions (id, user_id, habit_id, completion_date, completed, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [hc.id, hc.user_id, hc.habit_id, hc.completion_date, Boolean(hc.completed), hc.completed_at || new Date()]);
    }

    // 5. Migrate DAILY QUESTS
    const dailyQuests = sqliteDb.prepare('SELECT * FROM daily_quests').all() as any[];
    console.log(`Migrating ${dailyQuests.length} daily quests...`);
    for (const dq of dailyQuests) {
      await client.query(`
        INSERT INTO daily_quests (id, user_id, title, category, time, xp_value, completed, missed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [dq.id, dq.user_id, dq.title, dq.category, dq.time, dq.xp_value, Boolean(dq.completed), Boolean(dq.missed)]);
    }

    // 6. Migrate QUESTS
    const quests = sqliteDb.prepare('SELECT * FROM quests').all() as any[];
    console.log(`Migrating ${quests.length} quests...`);
    for (const q of quests) {
      await client.query(`
        INSERT INTO quests (id, user_id, title, description, deadline, difficulty, xp_reward, status, accepted, subtasks_json, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [q.id, q.user_id, q.title, q.description, q.deadline, q.difficulty, q.xp_reward, q.status, Boolean(q.accepted), q.subtasks_json, q.completed_at]);
    }

    // 7. Migrate SKILLS
    const skills = sqliteDb.prepare('SELECT * FROM skills').all() as any[];
    for (const s of skills) {
      await client.query(`
        INSERT INTO skills (id, user_id, name, category, mastery_percentage, rank, level, is_archived, sessions_json, checkitems_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [s.id, s.user_id, s.name, s.category, s.mastery_percentage, s.rank, s.level, Boolean(s.is_archived), s.sessions_json, s.checkitems_json]);
    }

    // 8. Migrate ACHIEVEMENTS
    const achievements = sqliteDb.prepare('SELECT * FROM achievements').all() as any[];
    for (const a of achievements) {
      await client.query(`
        INSERT INTO achievements (id, user_id, name, description, tab, icon_name, rarity, earned, earned_date, progress, max_progress)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [a.id, a.user_id, a.name, a.description, a.tab, a.icon_name, a.rarity, Boolean(a.earned), a.earned_date, a.progress, a.max_progress]);
    }

    // 9. Migrate BOSS BATTLES
    const bosses = sqliteDb.prepare('SELECT * FROM boss_battles').all() as any[];
    for (const b of bosses) {
      await client.query(`
        INSERT INTO boss_battles (id, user_id, name, title, deadline, max_hp, current_hp, reward_multiplier, xp_reward, points_reward, status, subtasks_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [b.id, b.user_id, b.name, b.title, b.deadline, b.max_hp, b.current_hp, b.reward_multiplier, b.xp_reward, b.points_reward, b.status, b.subtasks_json]);
    }

    // 10. Migrate REWARDS
    const rewards = sqliteDb.prepare('SELECT * FROM rewards').all() as any[];
    for (const r of rewards) {
      await client.query(`
        INSERT INTO rewards (id, user_id, title, cost, icon, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [r.id, r.user_id, r.title, r.cost, r.icon, r.description]);
    }

    // 11. Migrate REDEMPTIONS
    const redemptions = sqliteDb.prepare('SELECT * FROM redemptions').all() as any[];
    for (const rd of redemptions) {
      await client.query(`
        INSERT INTO redemptions (id, user_id, reward_id, reward_title, cost, redeemed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [rd.id, rd.user_id, rd.reward_id, rd.reward_title, rd.cost, rd.redeemed_at]);
    }

    // 12. Migrate SCHEDULE
    const schedule = sqliteDb.prepare('SELECT * FROM schedule').all() as any[];
    for (const sch of schedule) {
      await client.query(`
        INSERT INTO schedule (id, user_id, title, start_time, end_time, category, color, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [sch.id, sch.user_id, sch.title, sch.start_time, sch.end_time, sch.category, sch.color, sch.date]);
    }

    // 13. Migrate SCHEDULE TASKS
    const scheduleTasks = sqliteDb.prepare('SELECT * FROM schedule_tasks').all() as any[];
    for (const st of scheduleTasks) {
      await client.query(`
        INSERT INTO schedule_tasks (
          id, user_id, habit_id, title, description, task_date, start_time, end_time, duration, priority, category, reminder_time, repeat_type, repeat_days, notes, is_completed, completed_at, xp_reward, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO NOTHING
      `, [
        st.id, st.user_id, st.habit_id, st.title, st.description, st.task_date, st.start_time, st.end_time,
        st.duration, st.priority, st.category, st.reminder_time, st.repeat_type, st.repeat_days, st.notes,
        Boolean(st.is_completed), st.completed_at, st.xp_reward, st.created_at || new Date()
      ]);
    }

    // 14. Migrate USER ACTIVITY LOGS
    const logs = sqliteDb.prepare('SELECT * FROM user_activity_logs').all() as any[];
    console.log(`Migrating ${logs.length} user activity logs...`);
    for (const l of logs) {
      await client.query(`
        INSERT INTO user_activity_logs (id, user_id, action, summary, details_json, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [l.id, l.user_id, l.action, l.summary, l.details_json, l.created_at || new Date()]);
    }

    // 15. Migrate WEEKLY HABITS
    const weeklyHabits = sqliteDb.prepare('SELECT * FROM weekly_habits').all() as any[];
    for (const wh of weeklyHabits) {
      await client.query(`
        INSERT INTO weekly_habits (id, user_id, name, target, completed_count, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [wh.id, wh.user_id, wh.name, wh.target, wh.completed_count, wh.created_at || new Date()]);
    }

    // 16. Migrate MONTHLY HABITS
    const monthlyHabits = sqliteDb.prepare('SELECT * FROM monthly_habits').all() as any[];
    for (const mh of monthlyHabits) {
      await client.query(`
        INSERT INTO monthly_habits (id, user_id, name, target, completed_count, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [mh.id, mh.user_id, mh.name, mh.target, mh.completed_count, mh.created_at || new Date()]);
    }

    // 17. Migrate MONTHLY REFLECTIONS
    const monthlyReflections = sqliteDb.prepare('SELECT * FROM monthly_reflections').all() as any[];
    for (const mr of monthlyReflections) {
      await client.query(`
        INSERT INTO monthly_reflections (id, user_id, month, year, went_well, to_improve, main_goal, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [mr.id, mr.user_id, mr.month, mr.year, mr.went_well, mr.to_improve, mr.main_goal, mr.updated_at || new Date()]);
    }

    await client.query('COMMIT');
    console.log('🎉 [MIGRATION SUCCESS] All SQLite data successfully migrated to Neon PostgreSQL!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].includes('migrate_sqlite_to_postgres')) {
  migrateSqliteToPostgres().then(() => pool.end()).catch(console.error);
}
