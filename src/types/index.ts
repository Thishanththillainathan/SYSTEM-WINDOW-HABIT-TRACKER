export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type UserRole = 'USER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'SEALED';

export interface UserStats {
  STR: number; // Fitness
  INT: number; // Study / Code
  VIT: number; // Health
  WIS: number; // Mindfulness
  CHA: number; // Social
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  name?: string;
  title: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  rank: Rank;
  streak: number;
  longestStreak: number;
  points: number;
  awakeningDate: string;
  stats: UserStats;
  role: UserRole;
  accountStatus: AccountStatus;
  hasCompletedOnboarding: boolean;
}

export interface DailyQuestSlot {
  id: string;
  title: string;
  category: 'STR' | 'INT' | 'VIT' | 'WIS' | 'CHA';
  time?: string;
  xpValue: number;
  completed: boolean;
  missed?: boolean;
}

export type QuestStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface QuestSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  deadline: string;
  difficulty: Rank;
  xpReward: number;
  status: QuestStatus;
  subtasks: QuestSubtask[];
  linkedSkillId?: string;
  linkedBossId?: string;
  accepted: boolean;
  completedAt?: string;
}

export interface SkillPracticeSession {
  id: string;
  title: string;
  details: string;
  durationMinutes: number;
  date: string;
  completed: boolean;
}

export interface SkillCheckitem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  masteryPercentage: number;
  rank: Rank;
  level: number;
  sessions: SkillPracticeSession[];
  checkitems: SkillCheckitem[];
  isArchived: boolean;
}

export type AchievementRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type AchievementTab = 'weekly' | 'monthly';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tab: AchievementTab;
  iconName: string;
  rarity: AchievementRarity;
  earned: boolean;
  earnedDate?: string;
  progress: number;
  maxProgress: number;
}

export interface BossSubtask {
  id: string;
  title: string;
  damagePercent: number; // HP reduction when completed
  completed: boolean;
  timeAllocation?: string;
}

export interface BossBattle {
  id: string;
  name: string;
  title: string;
  deadline: string;
  maxHp: number;
  currentHp: number;
  rewardMultiplier: number;
  xpReward: number;
  pointsReward: number;
  status: 'IN_PROGRESS' | 'DEFEATED' | 'FAILED';
  subtasks: BossSubtask[];
}

export interface RewardItem {
  id: string;
  title: string;
  cost: number;
  icon: string;
  description: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  cost: number;
  redeemedAt: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: 'Quest' | 'Skill' | 'Boss Battle' | 'Daily';
  color: string;
  date: string;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EPIC';
export type TaskRepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'WEEKDAYS' | 'WEEKENDS' | 'MONTHLY';

export interface ScheduleTask {
  id: string;
  userId?: string;
  habitId?: string;
  title: string;
  description?: string;
  taskDate: string; // YYYY-MM-DD
  startTime?: string; // e.g. "06:00"
  endTime?: string; // e.g. "07:00"
  durationMinutes?: number;
  priority: TaskPriority;
  category: string;
  reminderTime?: string;
  repeatType: TaskRepeatType;
  repeatDays?: string[]; // e.g. ["MON", "WED"]
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
  xpReward: number;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  username?: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface SystemEconomyConfig {
  xpMultiplier: number;
  defaultStreakBonus: number;
  titles: Record<Rank, string>;
  xpPerLevelBase: number;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  email: string;
  role?: string;
  level: number;
  rank: Rank;
  plan: 'E-Rank Trial' | 'S-Rank Subscriber';
  status: 'Active' | 'Canceled' | 'Sealed';
  lastActive: string;
  mrrContribution: number;
  createdAt?: string;
}

export interface SystemNotice {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'EMERGENCY';
  active: boolean;
}

export interface UserHabit {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  category?: string;
  frequency?: string;
  specificDays?: string[];
  target?: string;
  startDate?: string;
  reminderTime?: string;
  duration?: number;
  xpReward?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface HabitCompletion {
  id: string;
  userId?: string;
  habitId: string;
  completionDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
}

export interface WeeklyHabit {
  id: string;
  userId?: string;
  name: string;
  target: number;
  completedCount: number;
  createdAt?: string;
}

export interface MonthlyHabit {
  id: string;
  userId?: string;
  name: string;
  target: number;
  completedCount: number;
  createdAt?: string;
}

export interface MonthlyReflection {
  id: string;
  userId?: string;
  month: number; // 1-12
  year: number;
  wentWell: string;
  toImprove: string;
  mainGoal: string;
  updatedAt?: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planName: string;
  planType: 'FREE' | '3_MONTHS' | '12_MONTHS' | string;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUPERSEDED' | string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELED' | 'SUPERSEDED' | 'FREE' | string;
  amount: number;
  currency: string;
  durationMonths: number;
  startedAt?: string;
  expiresAt?: string;
  paymentProvider?: string;
  paymentId?: string | null;
  orderId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  minutesRemaining?: number;
  secondsRemaining?: number;
  formattedCountdown?: string;
}

export interface ChangeHistoryRecord {
  id: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  formattedDate: string;
  formattedTime: string;
  formattedMonth: string;
  isoDate: string;
}

export interface ChangeHistoryMonthlyStats {
  totalChangesThisMonth: number;
  habitsCreated: number;
  habitsCompleted: number;
  tasksCreated: number;
  tasksCompleted: number;
  profileChanges: number;
  otherChanges: number;
}

export interface PersonalDatabaseData {
  profile: {
    userId: string;
    name: string;
    username: string;
    email: string;
    title: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  habits: Array<{
    id: string;
    userId: string;
    name: string;
    description?: string;
    category?: string;
    frequency?: string;
    target?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  tasks: Array<{
    id: string;
    userId: string;
    name: string;
    description?: string;
    priority: string;
    category: string;
    status: string;
    dueDate: string;
    createdAt: string;
    completedAt?: string;
  }>;
  completions: Array<{
    id: string;
    userId: string;
    habitId: string;
    action: string;
    completedAt: string;
  }>;
  rpgProgress: {
    userId: string;
    level: number;
    xp: number;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    rank: Rank;
    attributes: UserStats;
    updatedAt: string;
  };
  subscription: {
    id?: string;
    userId?: string;
    planName: string;
    planType: string;
    status: string;
    amount: number;
    startedAt?: string;
    expiresAt?: string;
    updatedAt?: string;
  };
  overview: {
    totalHabits: number;
    totalTasks: number;
    completedTasks: number;
    incompleteTasks: number;
    currentXp: number;
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
    subscriptionStatus: string;
    accountCreated: string;
    lastUpdated: string;
  };
  lastActivity: string;
}
