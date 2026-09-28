import { Router, Response } from 'express';
import { query } from '../postgres';
import { verifyTokenMiddleware, requireAdminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Enforce both JWT authentication & Admin Role verification
router.use(verifyTokenMiddleware);
router.use(requireAdminMiddleware);

// Get All Users for Admin Dashboard
router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usersRes = await query('SELECT id, email, username, role, status, level, rank, account_status, created_at FROM users');
    const users = usersRes.rows;

    res.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        level: u.level,
        rank: u.rank,
        role: u.role,
        plan: u.role === 'admin' ? 'System Administrator' : 'S-Rank Subscriber',
        status: u.status === 'verified' ? 'Active' : u.status,
        lastActive: 'Active now',
        mrrContribution: u.role === 'admin' ? 0.00 : 29.00,
      })),
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Grant or Revoke Access for a User
router.patch('/users/:id/access', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const { status, accountStatus } = req.body;

    await query(`
      UPDATE users SET
        status = COALESCE($1, status),
        account_status = COALESCE($2, account_status)
      WHERE id = $3
    `, [status || null, accountStatus || null, targetUserId]);

    res.json({ success: true, message: 'User access status updated.' });
  } catch (err) {
    console.error('Update access error:', err);
    res.status(500).json({ error: 'Failed to update user access.' });
  }
});

// Update User Role (Admin authorization required)
router.patch('/users/:id/role', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const { role } = req.body;

    if (role !== 'admin' && role !== 'customer') {
      res.status(400).json({ error: 'Invalid role specified. Role must be admin or customer.' });
      return;
    }

    await query('UPDATE users SET role = $1 WHERE id = $2', [role, targetUserId]);
    res.json({ success: true, message: `User role updated to ${role}.` });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// Get Aggregated Real-time Database System Statistics
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const getCount = async (sql: string, params?: any[]) => {
      const res = await query(sql, params);
      return parseInt(res.rows[0]?.count || '0', 10);
    };

    const totalUsers = await getCount('SELECT COUNT(*) as count FROM users');
    const activeUsers = await getCount("SELECT COUNT(*) as count FROM users WHERE status = 'verified' AND account_status = 'ACTIVE'");
    const totalHabits = await getCount('SELECT COUNT(*) as count FROM habits');
    const totalDailyQuests = await getCount('SELECT COUNT(*) as count FROM daily_quests');
    const totalScheduledTasks = await getCount('SELECT COUNT(*) as count FROM schedule_tasks');
    const completedTasks = await getCount('SELECT COUNT(*) as count FROM schedule_tasks WHERE is_completed = true');
    const pendingTasks = await getCount('SELECT COUNT(*) as count FROM schedule_tasks WHERE is_completed = false');
    const totalQuests = await getCount('SELECT COUNT(*) as count FROM quests');
    const completedQuests = await getCount("SELECT COUNT(*) as count FROM quests WHERE status = 'COMPLETED'");
    const totalSkills = await getCount('SELECT COUNT(*) as count FROM skills');
    const totalBosses = await getCount('SELECT COUNT(*) as count FROM boss_battles');
    const recentActivityCount = await getCount('SELECT COUNT(*) as count FROM user_activity_logs');

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalHabits: totalHabits + totalDailyQuests,
        totalScheduledTasks,
        completedTasks,
        pendingTasks,
        totalQuests,
        completedQuests,
        totalSkills,
        totalBosses,
        recentActivityCount,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin statistics.' });
  }
});

// Get Recent User Activities for Admin Dashboard
router.get('/activities', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activitiesRes = await query(`
      SELECT a.id, a.user_id, a.action, a.summary, a.created_at, u.username, u.email
      FROM user_activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `);

    res.json({
      activities: activitiesRes.rows.map((act) => ({
        id: act.id,
        userId: act.user_id,
        username: act.username || 'Hunter',
        email: act.email,
        action: act.action,
        summary: act.summary,
        createdAt: act.created_at,
      })),
    });
  } catch (err) {
    console.error('Admin activities error:', err);
    res.status(500).json({ error: 'Failed to fetch activities.' });
  }
});

// Get System Habits across users for Admin View
router.get('/habits', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habitsRes = await query(`
      SELECT h.*, u.email as user_email, u.username as user_name
      FROM habits h
      LEFT JOIN users u ON h.user_id = u.id
      ORDER BY h.created_at DESC
    `);

    res.json({ habits: habitsRes.rows });
  } catch (err) {
    console.error('Admin habits error:', err);
    res.status(500).json({ error: 'Failed to fetch habits.' });
  }
});

// Get System Tasks & Schedules across users for Admin View
router.get('/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasksRes = await query(`
      SELECT t.*, u.email as user_email, u.username as user_name
      FROM schedule_tasks t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);

    res.json({ tasks: tasksRes.rows });
  } catch (err) {
    console.error('Admin tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// Broadcast System Notice
router.post('/broadcast', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required.' });
      return;
    }

    const noticeId = `not-${Date.now()}`;
    const timestamp = new Date().toLocaleString();

    await query(`
      INSERT INTO system_notices (id, title, message, timestamp, type, active)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [noticeId, title, message, timestamp, 'INFO', true]);

    res.json({ success: true, message: 'System notice broadcasted to all users.' });
  } catch (err) {
    console.error('Admin broadcast error:', err);
    res.status(500).json({ error: 'Failed to broadcast notice.' });
  }
});

export default router;
