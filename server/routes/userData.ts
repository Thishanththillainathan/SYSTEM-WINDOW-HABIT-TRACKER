import { Router, Response } from 'express';
import { query, pool } from '../postgres';
import { verifyTokenMiddleware, AuthRequest } from '../middleware/auth';
import { sendActivityEmail } from '../email';
import { logChange } from '../changeLogger';
import { evaluateAndGetRankChallenge } from '../rankProgression';

const router = Router();

// Apply JWT verification to all customer data endpoints
router.use(verifyTokenMiddleware);

// Get all User Data (Habits, Schedule, Daily Quests, Quests, Skills, Achievements, Boss Battles, Rewards, etc.)
router.get('/dashboard-data', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const [
      habitsRes,
      habitCompletionsRes,
      weeklyHabitsRes,
      monthlyHabitsRes,
      monthlyReflectionsRes,
      dailyQuestsRes,
      questsRes,
      skillsRes,
      achievementsRes,
      bossesRes,
      rewardsRes,
      redemptionsRes,
      scheduleRes,
      scheduleTasksRes,
    ] = await Promise.all([
      query('SELECT * FROM habits WHERE user_id = $1', [userId]),
      query('SELECT * FROM habit_completions WHERE user_id = $1', [userId]),
      query('SELECT * FROM weekly_habits WHERE user_id = $1', [userId]),
      query('SELECT * FROM monthly_habits WHERE user_id = $1', [userId]),
      query('SELECT * FROM monthly_reflections WHERE user_id = $1', [userId]),
      query('SELECT * FROM daily_quests WHERE user_id = $1', [userId]),
      query('SELECT * FROM quests WHERE user_id = $1', [userId]),
      query('SELECT * FROM skills WHERE user_id = $1', [userId]),
      query('SELECT * FROM achievements WHERE user_id = $1', [userId]),
      query('SELECT * FROM boss_battles WHERE user_id = $1', [userId]),
      query('SELECT * FROM rewards WHERE user_id = $1', [userId]),
      query('SELECT * FROM redemptions WHERE user_id = $1', [userId]),
      query('SELECT * FROM schedule WHERE user_id = $1', [userId]),
      query('SELECT * FROM schedule_tasks WHERE user_id = $1', [userId]),
    ]);

    res.json({
      habits: habitsRes.rows.map((h: any) => ({
        id: h.id,
        name: h.name,
        description: h.description,
        category: h.category,
        frequency: h.frequency,
        specificDays: h.specific_days ? JSON.parse(h.specific_days) : [],
        target: h.target,
        startDate: h.start_date,
        reminderTime: h.reminder_time,
        duration: h.duration,
        xpReward: h.xp_reward,
        isActive: Boolean(h.is_active),
        createdAt: h.created_at,
      })),
      habitCompletions: habitCompletionsRes.rows.map((hc: any) => ({
        id: hc.id,
        habitId: hc.habit_id,
        completionDate: hc.completion_date,
        completed: Boolean(hc.completed),
        completedAt: hc.completed_at,
      })),
      weeklyHabits: weeklyHabitsRes.rows.map((wh: any) => ({
        id: wh.id,
        name: wh.name,
        target: wh.target,
        completedCount: wh.completed_count,
        createdAt: wh.created_at,
      })),
      monthlyHabits: monthlyHabitsRes.rows.map((mh: any) => ({
        id: mh.id,
        name: mh.name,
        target: mh.target,
        completedCount: mh.completed_count,
        createdAt: mh.created_at,
      })),
      monthlyReflections: monthlyReflectionsRes.rows.map((mr: any) => ({
        id: mr.id,
        month: mr.month,
        year: mr.year,
        wentWell: mr.went_well || '',
        toImprove: mr.to_improve || '',
        mainGoal: mr.main_goal || '',
        updatedAt: mr.updated_at,
      })),
      dailyQuests: dailyQuestsRes.rows.map((q: any) => ({
        id: q.id,
        title: q.title,
        category: q.category,
        time: q.time,
        xpValue: q.xp_value,
        completed: Boolean(q.completed),
        missed: Boolean(q.missed),
      })),
      quests: questsRes.rows.map((q: any) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        deadline: q.deadline,
        difficulty: q.difficulty,
        xpReward: q.xp_reward,
        status: q.status,
        accepted: Boolean(q.accepted),
        subtasks: q.subtasks_json ? JSON.parse(q.subtasks_json) : [],
        completedAt: q.completed_at,
      })),
      skills: skillsRes.rows.map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        masteryPercentage: s.mastery_percentage,
        rank: s.rank,
        level: s.level,
        isArchived: Boolean(s.is_archived),
        sessions: s.sessions_json ? JSON.parse(s.sessions_json) : [],
        checkitems: s.checkitems_json ? JSON.parse(s.checkitems_json) : [],
      })),
      achievements: achievementsRes.rows.map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        tab: a.tab,
        iconName: a.icon_name,
        rarity: a.rarity,
        earned: Boolean(a.earned),
        earnedDate: a.earned_date,
        progress: a.progress,
        maxProgress: a.max_progress,
      })),
      bosses: bossesRes.rows.map((b: any) => ({
        id: b.id,
        name: b.name,
        title: b.title,
        deadline: b.deadline,
        maxHp: b.max_hp,
        currentHp: b.current_hp,
        rewardMultiplier: b.reward_multiplier,
        xpReward: b.xp_reward,
        pointsReward: b.points_reward,
        status: b.status,
        subtasks: b.subtasks_json ? JSON.parse(b.subtasks_json) : [],
      })),
      rewards: rewardsRes.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        cost: r.cost,
        icon: r.icon,
        description: r.description,
      })),
      redemptions: redemptionsRes.rows.map((rd: any) => ({
        id: rd.id,
        rewardId: rd.reward_id,
        rewardTitle: rd.reward_title,
        cost: rd.cost,
        redeemedAt: rd.redeemed_at,
      })),
      schedule: scheduleRes.rows.map((s: any) => ({
        id: s.id,
        title: s.title,
        startTime: s.start_time,
        endTime: s.end_time,
        category: s.category,
        color: s.color,
        date: s.date,
      })),
      scheduleTasks: scheduleTasksRes.rows.map((t: any) => ({
        id: t.id,
        habitId: t.habit_id,
        title: t.title,
        description: t.description,
        taskDate: t.task_date,
        startTime: t.start_time,
        endTime: t.end_time,
        durationMinutes: t.duration,
        priority: t.priority || 'MEDIUM',
        category: t.category || 'Quest',
        reminderTime: t.reminder_time,
        repeatType: t.repeat_type || 'NONE',
        repeatDays: t.repeat_days ? JSON.parse(t.repeat_days) : [],
        notes: t.notes,
        isCompleted: Boolean(t.is_completed),
        completedAt: t.completed_at,
        xpReward: t.xp_reward || 25,
      })),
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
});

// Sync / Update User Profile
router.put('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { username, title, level, xp, xpToNextLevel, rank, streak, longestStreak, points, stats, hasCompletedOnboarding } = req.body;

    await query(`
      UPDATE users SET
        username = COALESCE($1, username),
        title = COALESCE($2, title),
        level = COALESCE($3, level),
        xp = COALESCE($4, xp),
        xp_to_next_level = COALESCE($5, xp_to_next_level),
        rank = COALESCE($6, rank),
        streak = COALESCE($7, streak),
        longest_streak = COALESCE($8, longest_streak),
        points = COALESCE($9, points),
        stats_json = COALESCE($10, stats_json),
        has_completed_onboarding = COALESCE($11, has_completed_onboarding)
      WHERE id = $12
    `, [
      username || null,
      title || null,
      level !== undefined ? level : null,
      xp !== undefined ? xp : null,
      xpToNextLevel !== undefined ? xpToNextLevel : null,
      rank || null,
      streak !== undefined ? streak : null,
      longestStreak !== undefined ? longestStreak : null,
      points !== undefined ? points : null,
      stats ? JSON.stringify(stats) : null,
      hasCompletedOnboarding !== undefined ? (hasCompletedOnboarding ? true : false) : null,
      userId
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

// Sync User-Created Data (Daily Quests, Quests, Skills, Achievements, Boss Battles, Rewards, Redemptions, Schedule)
router.post('/sync', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const userId = req.user!.userId;
    const { 
      habits, 
      habitCompletions, 
      weeklyHabits, 
      monthlyHabits, 
      monthlyReflections, 
      dailyQuests, 
      quests, 
      skills, 
      achievements, 
      bosses, 
      rewards, 
      redemptions, 
      schedule, 
      scheduleTasks 
    } = req.body;

    await client.query('BEGIN');

    // 0a. Sync habits
    if (Array.isArray(habits)) {
      await client.query('DELETE FROM habits WHERE user_id = $1', [userId]);
      for (const h of habits) {
        await client.query(`
          INSERT INTO habits (id, user_id, name, description, category, frequency, specific_days, target, start_date, reminder_time, duration, xp_reward, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          h.id,
          userId,
          h.name,
          h.description || null,
          h.category || 'General',
          h.frequency || 'Daily',
          h.specificDays ? JSON.stringify(h.specificDays) : null,
          h.target || null,
          h.startDate || null,
          h.reminderTime || null,
          h.duration || 30,
          h.xpReward || 20,
          h.isActive === false ? false : true
        ]);
      }
    }

    // 0b. Sync habitCompletions
    if (Array.isArray(habitCompletions)) {
      await client.query('DELETE FROM habit_completions WHERE user_id = $1', [userId]);
      for (const hc of habitCompletions) {
        await client.query(`
          INSERT INTO habit_completions (id, user_id, habit_id, completion_date, completed, completed_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          hc.id,
          userId,
          hc.habitId,
          hc.completionDate,
          Boolean(hc.completed),
          hc.completedAt || new Date().toISOString()
        ]);
      }
    }

    // 0c. Sync weeklyHabits
    if (Array.isArray(weeklyHabits)) {
      await client.query('DELETE FROM weekly_habits WHERE user_id = $1', [userId]);
      for (const wh of weeklyHabits) {
        await client.query(`
          INSERT INTO weekly_habits (id, user_id, name, target, completed_count)
          VALUES ($1, $2, $3, $4, $5)
        `, [wh.id, userId, wh.name, wh.target || 1, wh.completedCount || 0]);
      }
    }

    // 0d. Sync monthlyHabits
    if (Array.isArray(monthlyHabits)) {
      await client.query('DELETE FROM monthly_habits WHERE user_id = $1', [userId]);
      for (const mh of monthlyHabits) {
        await client.query(`
          INSERT INTO monthly_habits (id, user_id, name, target, completed_count)
          VALUES ($1, $2, $3, $4, $5)
        `, [mh.id, userId, mh.name, mh.target || 1, mh.completedCount || 0]);
      }
    }

    // 0e. Sync monthlyReflections
    if (Array.isArray(monthlyReflections)) {
      for (const ref of monthlyReflections) {
        await client.query(`
          INSERT INTO monthly_reflections (id, user_id, month, year, went_well, to_improve, main_goal, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT(user_id, month, year) DO UPDATE SET
            went_well = EXCLUDED.went_well,
            to_improve = EXCLUDED.to_improve,
            main_goal = EXCLUDED.main_goal,
            updated_at = EXCLUDED.updated_at
        `, [
          ref.id,
          userId,
          ref.month,
          ref.year,
          ref.wentWell || '',
          ref.toImprove || '',
          ref.mainGoal || '',
          new Date()
        ]);
      }
    }

    // 1. Sync daily_quests
    if (Array.isArray(dailyQuests)) {
      await client.query('DELETE FROM daily_quests WHERE user_id = $1', [userId]);
      for (const dq of dailyQuests) {
        await client.query(`
          INSERT INTO daily_quests (id, user_id, title, category, time, xp_value, completed, missed)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [dq.id, userId, dq.title, dq.category || null, dq.time || null, dq.xpValue || 0, Boolean(dq.completed), Boolean(dq.missed)]);
      }
    }

    // 2. Sync quests
    if (Array.isArray(quests)) {
      await client.query('DELETE FROM quests WHERE user_id = $1', [userId]);
      for (const q of quests) {
        await client.query(`
          INSERT INTO quests (id, user_id, title, description, deadline, difficulty, xp_reward, status, accepted, subtasks_json, completed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          q.id,
          userId,
          q.title,
          q.description || null,
          q.deadline || null,
          q.difficulty || null,
          q.xpReward || 0,
          q.status || null,
          Boolean(q.accepted),
          q.subtasks ? JSON.stringify(q.subtasks) : null,
          q.completedAt || null
        ]);
      }
    }

    // 3. Sync skills
    if (Array.isArray(skills)) {
      await client.query('DELETE FROM skills WHERE user_id = $1', [userId]);
      for (const s of skills) {
        await client.query(`
          INSERT INTO skills (id, user_id, name, category, mastery_percentage, rank, level, is_archived, sessions_json, checkitems_json)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          s.id,
          userId,
          s.name,
          s.category || null,
          s.masteryPercentage || 0,
          s.rank || 'E',
          s.level || 1,
          Boolean(s.isArchived),
          s.sessions ? JSON.stringify(s.sessions) : null,
          s.checkitems ? JSON.stringify(s.checkitems) : null
        ]);
      }
    }

    // 4. Sync achievements
    if (Array.isArray(achievements)) {
      await client.query('DELETE FROM achievements WHERE user_id = $1', [userId]);
      for (const a of achievements) {
        await client.query(`
          INSERT INTO achievements (id, user_id, name, description, tab, icon_name, rarity, earned, earned_date, progress, max_progress)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          a.id,
          userId,
          a.name,
          a.description || null,
          a.tab || null,
          a.iconName || null,
          a.rarity || null,
          Boolean(a.earned),
          a.earnedDate || null,
          a.progress || 0,
          a.maxProgress || 1
        ]);
      }
    }

    // 5. Sync boss_battles
    if (Array.isArray(bosses)) {
      await client.query('DELETE FROM boss_battles WHERE user_id = $1', [userId]);
      for (const b of bosses) {
        await client.query(`
          INSERT INTO boss_battles (id, user_id, name, title, deadline, max_hp, current_hp, reward_multiplier, xp_reward, points_reward, status, subtasks_json)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          b.id,
          userId,
          b.name,
          b.title || null,
          b.deadline || null,
          b.maxHp || 100,
          b.currentHp || 100,
          b.rewardMultiplier || 1,
          b.xpReward || 0,
          b.pointsReward || 0,
          b.status || 'IN_PROGRESS',
          b.subtasks ? JSON.stringify(b.subtasks) : null
        ]);
      }
    }

    // 6. Sync rewards
    if (Array.isArray(rewards)) {
      await client.query('DELETE FROM rewards WHERE user_id = $1', [userId]);
      for (const r of rewards) {
        await client.query(`
          INSERT INTO rewards (id, user_id, title, cost, icon, description)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [r.id, userId, r.title, r.cost, r.icon || null, r.description || null]);
      }
    }

    // 7. Sync redemptions
    if (Array.isArray(redemptions)) {
      await client.query('DELETE FROM redemptions WHERE user_id = $1', [userId]);
      for (const rd of redemptions) {
        await client.query(`
          INSERT INTO redemptions (id, user_id, reward_id, reward_title, cost, redeemed_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [rd.id, userId, rd.rewardId || null, rd.rewardTitle || null, rd.cost || 0, rd.redeemedAt || null]);
      }
    }

    // 8. Sync schedule
    if (Array.isArray(schedule)) {
      await client.query('DELETE FROM schedule WHERE user_id = $1', [userId]);
      for (const sch of schedule) {
        await client.query(`
          INSERT INTO schedule (id, user_id, title, start_time, end_time, category, color, date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          sch.id,
          userId,
          sch.title,
          sch.startTime || null,
          sch.endTime || null,
          sch.category || null,
          sch.color || null,
          sch.date || null
        ]);
      }
    }

    // 9. Sync scheduleTasks (Month-Date To-Do System)
    if (Array.isArray(scheduleTasks)) {
      await client.query('DELETE FROM schedule_tasks WHERE user_id = $1', [userId]);
      for (const t of scheduleTasks) {
        await client.query(`
          INSERT INTO schedule_tasks (
            id, user_id, habit_id, title, description, task_date, start_time, end_time, duration, priority, category, reminder_time, repeat_type, repeat_days, notes, is_completed, completed_at, xp_reward
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, [
          t.id,
          userId,
          t.habitId || null,
          t.title,
          t.description || null,
          t.taskDate,
          t.startTime || null,
          t.endTime || null,
          t.durationMinutes || 30,
          t.priority || 'MEDIUM',
          t.category || 'Quest',
          t.reminderTime || null,
          t.repeatType || 'NONE',
          t.repeatDays ? JSON.stringify(t.repeatDays) : null,
          t.notes || null,
          Boolean(t.isCompleted),
          t.completedAt || null,
          t.xpReward || 25
        ]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'User data synced successfully.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Data sync error:', err);
    res.status(500).json({ error: 'Failed to sync user data.' });
  } finally {
    client.release();
  }
});

// Log Meaningful User Activity & Send Admin Email Notification
router.post('/log-activity', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { action, summary, details } = req.body;

    if (!action || !summary) {
      res.status(400).json({ error: 'Action and summary are required.' });
      return;
    }

    const userRes = await query('SELECT username, email FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    const logId = `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await query(`
      INSERT INTO user_activity_logs (id, user_id, action, summary, details_json)
      VALUES ($1, $2, $3, $4, $5)
    `, [logId, userId, action, summary, details ? JSON.stringify(details) : null]);

    // Send Server-Side Admin Activity Email Notification asynchronously
    if (user) {
      sendActivityEmail(user.email, user.username, `${action.toUpperCase()}: ${summary}`).catch(() => {});
    }

    res.json({ success: true, message: 'Activity logged successfully.' });
  } catch (err) {
    console.error('Activity logging error:', err);
    res.status(500).json({ error: 'Failed to log activity.' });
  }
});

// Explicit endpoint for recording structured change history
router.post('/record-change', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { actionType, entityType, entityId, description, oldValue, newValue } = req.body;

    if (!actionType || !entityType || !description) {
      res.status(400).json({ error: 'actionType, entityType, and description are required.' });
      return;
    }

    await logChange({
      userId,
      actionType,
      entityType,
      entityId: entityId || null,
      description,
      oldValue: oldValue || null,
      newValue: newValue || null,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Record change error:', err);
    res.status(500).json({ error: 'Failed to record change.' });
  }
});

// GET /api/user/personal-database - Isolated personal database records for current user
router.get('/personal-database', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const results = await Promise.allSettled([
      query('SELECT id, email, username, title, role, level, xp, xp_to_next_level, rank, streak, longest_streak, points, awakening_date, stats_json, account_status, created_at FROM users WHERE id = $1', [userId]),
      query('SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM schedule_tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM habit_completions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 200', [userId]),
      query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]),
      query('SELECT created_at FROM change_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]),
      query('SELECT * FROM quests WHERE user_id = $1 ORDER BY deadline DESC', [userId]),
      query('SELECT * FROM user_activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
    ]);

    const userRes = results[0].status === 'fulfilled' ? results[0].value : null;
    const habitsRes = results[1].status === 'fulfilled' ? results[1].value : null;
    const scheduleTasksRes = results[2].status === 'fulfilled' ? results[2].value : null;
    const completionsRes = results[3].status === 'fulfilled' ? results[3].value : null;
    const subRes = results[4].status === 'fulfilled' ? results[4].value : null;
    const logsRes = results[5].status === 'fulfilled' ? results[5].value : null;
    const questsRes = results[6].status === 'fulfilled' ? results[6].value : null;
    const activityLogsRes = results[7].status === 'fulfilled' ? results[7].value : null;

    const user = userRes?.rows[0] || null;

    if (!user) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    const statsObj = user.stats_json ? JSON.parse(user.stats_json) : { STR: 10, INT: 10, VIT: 10, WIS: 10, CHA: 10 };
    const latestSub = subRes?.rows[0] || null;
    const lastActivity = logsRes?.rows[0]?.created_at || user.created_at;

    const habitRows = habitsRes?.rows || [];
    const taskRows = scheduleTasksRes?.rows || [];
    const completionRows = completionsRes?.rows || [];
    const questRows = questsRes?.rows || [];
    const activityRows = activityLogsRes?.rows || [];

    const totalHabits = habitRows.length;
    const totalTasks = taskRows.length + questRows.length;
    const completedTasks = taskRows.filter((t: any) => t.is_completed).length + questRows.filter((q: any) => q.status === 'COMPLETED').length;
    const incompleteTasks = totalTasks - completedTasks;

    const sectionErrors: Record<string, boolean> = {
      profile: results[0].status === 'rejected',
      habits: results[1].status === 'rejected',
      tasks: results[2].status === 'rejected' || results[6].status === 'rejected',
      completions: results[3].status === 'rejected',
      subscription: results[4].status === 'rejected',
      changeHistory: results[5].status === 'rejected',
      userActivityLogs: results[7].status === 'rejected',
    };

    res.json({
      profile: {
        userId: user.id,
        name: user.username,
        username: user.username,
        email: user.email,
        title: user.title,
        role: user.role || 'customer',
        createdAt: user.created_at,
        updatedAt: lastActivity,
      },
      habits: habitRows.map((h: any) => ({
        id: h.id,
        userId: h.user_id,
        name: h.name,
        description: h.description,
        category: h.category,
        frequency: h.frequency,
        target: h.target,
        status: h.is_active ? 'Active' : 'Inactive',
        createdAt: h.created_at,
        updatedAt: h.updated_at,
      })),
      tasks: [
        ...taskRows.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          name: t.title,
          description: t.description,
          priority: t.priority || 'MEDIUM',
          category: t.category || 'Schedule Task',
          status: t.is_completed ? 'COMPLETED' : 'PENDING',
          dueDate: t.task_date,
          createdAt: t.created_at,
          completedAt: t.completed_at,
        })),
        ...questRows.map((q: any) => ({
          id: q.id,
          userId: q.user_id,
          name: q.title,
          description: q.description,
          priority: q.difficulty || 'MEDIUM',
          category: 'Quest',
          status: q.status || (q.accepted ? 'IN_PROGRESS' : 'PENDING'),
          dueDate: q.deadline || 'No Deadline',
          createdAt: q.completed_at || new Date().toISOString(),
          completedAt: q.completed_at,
        }))
      ],
      completions: completionRows.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        habitId: c.habit_id,
        action: c.completed ? 'COMPLETED' : 'UNCOMPLETED',
        completedAt: c.completed_at || c.completion_date,
      })),
      rpgProgress: {
        userId: user.id,
        level: user.level,
        xp: user.xp,
        totalXp: user.xp,
        currentStreak: user.streak,
        longestStreak: user.longest_streak,
        rank: user.rank,
        attributes: statsObj,
        updatedAt: lastActivity,
      },
      subscription: latestSub ? {
        id: latestSub.id,
        userId: latestSub.user_id,
        planName: latestSub.plan_name || latestSub.plan_type || 'FREE',
        planType: latestSub.plan_type || 'FREE',
        status: latestSub.subscription_status || latestSub.status || 'ACTIVE',
        amount: Number(latestSub.amount || 0),
        startedAt: latestSub.started_at,
        expiresAt: latestSub.expires_at,
        updatedAt: latestSub.updated_at,
      } : null,
      activityLogs: activityRows.map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        action: a.action,
        summary: a.summary,
        detailsJson: a.details_json,
        createdAt: a.created_at,
      })),
      overview: {
        totalHabits,
        totalTasks,
        completedTasks,
        incompleteTasks,
        currentXp: user.xp,
        currentLevel: user.level,
        currentStreak: user.streak,
        longestStreak: user.longest_streak,
        subscriptionStatus: latestSub?.subscription_status || latestSub?.status || 'No active subscription',
        accountCreated: user.created_at,
        lastUpdated: lastActivity,
      },
      sectionErrors,
      lastActivity,
    });
  } catch (err) {
    console.error('Fetch personal database error:', err);
    res.status(500).json({ error: 'Failed to fetch personal database records.' });
  }
});

// GET /api/user/user-activity-logs - Activity log entries for current user
router.get('/user-activity-logs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT * FROM user_activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [userId]
    );
    res.json({
      logs: result.rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        action: r.action,
        summary: r.summary,
        detailsJson: r.details_json,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('Fetch user activity logs error:', err);
    res.status(500).json({ error: 'Failed to fetch user activity logs.' });
  }
});

// GET /api/user/change-history - Audit log of changes for current user
router.get('/change-history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { month, date, actionType, entityType, search, limit = '100', offset = '0' } = req.query;

    let queryText = 'SELECT * FROM change_history WHERE user_id = $1';
    const params: any[] = [userId];

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      queryText += ` AND (LOWER(description) LIKE $${params.length} OR LOWER(action_type) LIKE $${params.length} OR LOWER(entity_type) LIKE $${params.length})`;
    }

    if (actionType && typeof actionType === 'string' && actionType.trim() !== 'ALL') {
      params.push(actionType.trim());
      queryText += ` AND action_type = $${params.length}`;
    }

    if (entityType && typeof entityType === 'string' && entityType.trim() !== 'ALL') {
      params.push(entityType.trim());
      queryText += ` AND entity_type = $${params.length}`;
    }

    queryText += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    
    // Fetch user changes
    const countRes = await query('SELECT * FROM change_history WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const allUserRows = countRes.rows;

    const limitNum = parseInt(String(limit), 10) || 100;
    const offsetNum = parseInt(String(offset), 10) || 0;

    let filteredRows = allUserRows;

    // Filter by Month / Date in JavaScript formatting for exact match
    if (month && typeof month === 'string' && month.trim() !== 'ALL') {
      const targetMonth = month.trim(); // e.g. "September 2026"
      filteredRows = filteredRows.filter((r: any) => {
        const d = new Date(r.created_at);
        const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const mStr = `${fullMonthNames[d.getMonth()]} ${d.getFullYear()}`;
        return mStr.toLowerCase() === targetMonth.toLowerCase();
      });
    }

    if (date && typeof date === 'string' && date.trim()) {
      const targetDate = date.trim(); // e.g. "2026-09-28" or "28 Sep 2026"
      filteredRows = filteredRows.filter((r: any) => {
        const d = new Date(r.created_at);
        const isoDate = d.toISOString().split('T')[0];
        return isoDate === targetDate || r.created_at.toString().includes(targetDate);
      });
    }

    if (actionType && typeof actionType === 'string' && actionType !== 'ALL') {
      filteredRows = filteredRows.filter((r: any) => r.action_type === actionType);
    }

    if (entityType && typeof entityType === 'string' && entityType !== 'ALL') {
      filteredRows = filteredRows.filter((r: any) => r.entity_type === entityType);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredRows = filteredRows.filter((r: any) =>
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.action_type && r.action_type.toLowerCase().includes(q)) ||
        (r.entity_type && r.entity_type.toLowerCase().includes(q))
      );
    }

    // Monthly metrics calculation for selected/current month
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    const currentMonthStr = `${fullMonthNames[now.getMonth()]} ${now.getFullYear()}`;
    const activeMonth = (month && typeof month === 'string' && month !== 'ALL') ? month : currentMonthStr;

    const monthRows = allUserRows.filter((r: any) => {
      const d = new Date(r.created_at);
      const mStr = `${fullMonthNames[d.getMonth()]} ${d.getFullYear()}`;
      return mStr.toLowerCase() === activeMonth.toLowerCase();
    });

    const monthlyStats = {
      totalChangesThisMonth: monthRows.length,
      habitsCreated: monthRows.filter((r: any) => r.action_type === 'HABIT_CREATED').length,
      habitsCompleted: monthRows.filter((r: any) => r.action_type === 'HABIT_COMPLETED').length,
      tasksCreated: monthRows.filter((r: any) => r.action_type === 'TASK_CREATED').length,
      tasksCompleted: monthRows.filter((r: any) => r.action_type === 'TASK_COMPLETED').length,
      profileChanges: monthRows.filter((r: any) => r.entity_type === 'PROFILE').length,
      otherChanges: monthRows.filter((r: any) => !['HABIT_CREATED', 'HABIT_COMPLETED', 'TASK_CREATED', 'TASK_COMPLETED'].includes(r.action_type) && r.entity_type !== 'PROFILE').length,
    };

    // Paginate slice
    const paginatedRows = filteredRows.slice(offsetNum, offsetNum + limitNum);

    const formattedLogs = paginatedRows.map((r: any) => {
      const d = new Date(r.created_at);
      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthShort = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const formattedDate = `${dayStr} ${monthShort} ${year}`; // e.g. "28 Sep 2026"
      const isoDate = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${dayStr}`;

      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`; // e.g. "09:15 AM"

      const formattedMonth = `${fullMonthNames[d.getMonth()]} ${year}`; // e.g. "September 2026"

      return {
        id: r.id,
        userId: r.user_id,
        actionType: r.action_type,
        entityType: r.entity_type,
        entityId: r.entity_id,
        description: r.description,
        oldValue: r.old_value,
        newValue: r.new_value,
        createdAt: r.created_at,
        formattedDate,
        formattedTime,
        formattedMonth,
        isoDate,
      };
    });

    res.json({
      logs: formattedLogs,
      totalCount: filteredRows.length,
      activeMonth,
      monthlyStats,
    });
  } catch (err) {
    console.error('Fetch change history error:', err);
    res.status(500).json({ error: 'Failed to fetch change history records.' });
  }
});

// GET /api/user/rank-challenge - Active 90-day rank progression challenge
router.get('/rank-challenge', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const challenge = await evaluateAndGetRankChallenge(userId);
    res.json({ challenge });
  } catch (err) {
    console.error('Fetch rank challenge error:', err);
    res.status(500).json({ error: 'Failed to fetch rank challenge.' });
  }
});

// GET /api/user/rank-challenge/history - Completed rank challenge history
router.get('/rank-challenge/history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT * FROM rank_challenges WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({
      history: result.rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        currentRank: r.current_rank,
        targetRank: r.target_rank,
        startDate: r.start_date,
        baseRequiredDays: r.base_required_days,
        completedDays: r.completed_days,
        missedDays: r.missed_days,
        promotionDelayDays: r.promotion_delay_days,
        adjustedRequiredDays: r.adjusted_required_days,
        originalPromotionDate: r.original_promotion_date,
        currentPromotionDate: r.current_promotion_date,
        status: r.status,
        completedAt: r.completed_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    console.error('Fetch rank challenge history error:', err);
    res.status(500).json({ error: 'Failed to fetch rank challenge history.' });
  }
});

export default router;
