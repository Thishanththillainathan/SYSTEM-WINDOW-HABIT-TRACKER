import {
  UserProfile,
  DailyQuestSlot,
  Quest,
  Skill,
  Achievement,
  BossBattle,
  RewardItem,
  RewardRedemption,
  ScheduleEvent,
  SystemEconomyConfig,
  AdminUserRecord,
  SystemNotice
} from '../types';

const STORAGE_KEYS = {
  USER_PROFILE: 'system_window_user_profile',
  DAILY_QUESTS: 'system_window_daily_quests',
  QUESTS: 'system_window_quests',
  SKILLS: 'system_window_skills',
  ACHIEVEMENTS: 'system_window_achievements',
  BOSS_BATTLES: 'system_window_boss_battles',
  REWARDS: 'system_window_rewards',
  REDEMPTIONS: 'system_window_redemptions',
  SCHEDULE: 'system_window_schedule',
  SCHEDULE_TASKS: 'system_window_schedule_tasks',
  HABITS: 'system_window_habits',
  HABIT_COMPLETIONS: 'system_window_habit_completions',
  WEEKLY_HABITS: 'system_window_weekly_habits',
  MONTHLY_HABITS: 'system_window_monthly_habits',
  MONTHLY_REFLECTIONS: 'system_window_monthly_reflections',
  ECONOMY: 'system_window_economy',
  ADMIN_USERS: 'system_window_admin_users',
  SYSTEM_NOTICES: 'system_window_notices',
};

// Initial Clean Hunter Profile for New Users (0 XP, 0 Streak, 0 Points)
export const defaultUserProfile: UserProfile = {
  id: 'hunter-new',
  username: 'New Hunter',
  title: 'E-Rank Awakened',
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  rank: 'E',
  streak: 0,
  longestStreak: 0,
  points: 0,
  awakeningDate: new Date().toISOString().split('T')[0],
  stats: {
    STR: 10,
    INT: 10,
    VIT: 10,
    WIS: 10,
    CHA: 10,
  },
  role: 'USER',
  accountStatus: 'ACTIVE',
  hasCompletedOnboarding: false,
};

// Default empty arrays for brand new users
export const defaultDailyQuests: DailyQuestSlot[] = [];
export const defaultQuests: Quest[] = [];
export const defaultSkills: Skill[] = [];
export const defaultAchievements: Achievement[] = [];
export const defaultBossBattles: BossBattle[] = [];
export const defaultRewards: RewardItem[] = [];
export const defaultRedemptions: RewardRedemption[] = [];
export const defaultSchedule: ScheduleEvent[] = [];
export const defaultScheduleTasks: any[] = [];
export const defaultHabits: any[] = [];
export const defaultHabitCompletions: any[] = [];
export const defaultWeeklyHabits: any[] = [];
export const defaultMonthlyHabits: any[] = [];
export const defaultMonthlyReflections: any[] = [];

export const defaultEconomy: SystemEconomyConfig = {
  xpMultiplier: 1.0,
  defaultStreakBonus: 1.5,
  titles: {
    E: 'E-Rank Awakened',
    D: 'D-Rank Raider',
    C: 'Shadow Monarch Apprentice',
    B: 'B-Rank Vanguard',
    A: 'A-Rank Commander',
    S: 'S-Rank Shadow Monarch',
  },
  xpPerLevelBase: 1000,
};

export const defaultAdminUsers: AdminUserRecord[] = [];
export const defaultSystemNotices: SystemNotice[] = [];

// Legacy sample IDs to detect and flush from old browser LocalStorage
const LEGACY_DEFAULT_IDS = new Set([
  'dq-1', 'dq-2', 'dq-3', 'q-101', 'sk-1', 'ach-1', 'boss-1', 'rw-1', 'red-1', 'sch-1', 'usr-1', 'not-1', 'hunter-001'
]);

// Helper Functions for LocalStorage
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);

    // If loaded data contains legacy pre-populated default IDs, wipe key and return empty fallback
    if (typeof parsed === 'object' && parsed !== null) {
      if (Array.isArray(parsed) && parsed.some((item) => item?.id && LEGACY_DEFAULT_IDS.has(item.id))) {
        localStorage.removeItem(key);
        return fallback;
      }
      if (!Array.isArray(parsed) && parsed.id && LEGACY_DEFAULT_IDS.has(parsed.id)) {
        localStorage.removeItem(key);
        return fallback;
      }
    }

    return parsed as T;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Calculate Rank based on Level
export function getRankFromLevel(level: number): UserProfile['rank'] {
  if (level >= 25) return 'S';
  if (level >= 20) return 'A';
  if (level >= 15) return 'B';
  if (level >= 10) return 'C';
  if (level >= 5) return 'D';
  return 'E';
}

export { STORAGE_KEYS };
