import React, { useState, useEffect } from 'react';
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
  ScheduleTask,
  UserHabit,
  HabitCompletion,
  WeeklyHabit,
  MonthlyHabit,
  MonthlyReflection,
  SystemEconomyConfig,
  AdminUserRecord,
  SystemNotice
} from './types';
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  defaultUserProfile,
  defaultDailyQuests,
  defaultQuests,
  defaultSkills,
  defaultAchievements,
  defaultBossBattles,
  defaultRewards,
  defaultRedemptions,
  defaultSchedule,
  defaultScheduleTasks,
  defaultHabits,
  defaultHabitCompletions,
  defaultWeeklyHabits,
  defaultMonthlyHabits,
  defaultMonthlyReflections,
  defaultEconomy,
  defaultAdminUsers,
  defaultSystemNotices
} from './utils/storage';
import { Header } from './components/Header';
import { Sidebar, TabId } from './components/Sidebar';
import { SystemNoticeBanner } from './components/SystemNoticeBanner';
import { AwakeningModal } from './components/AwakeningModal';
import { StatusWindow } from './components/StatusWindow';
import { ScheduleView } from './components/ScheduleView';
import { DailyQuestsView } from './components/DailyQuestsView';
import { QuestsView } from './components/QuestsView';
import { SkillsView } from './components/SkillsView';
import { AchievementsView } from './components/AchievementsView';
import { BossBattlesView } from './components/BossBattlesView';
import { RewardsView } from './components/RewardsView';
import { DatabaseView } from './components/DatabaseView';
import { AdminPanel } from './components/AdminPanel';
import { CinematicIntro } from './components/CinematicIntro';
import { LandingPage } from './components/LandingPage';
import { SealedGateBanner } from './components/SealedGateBanner';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import {
  TermsPage,
  PrivacyPage,
  RefundPolicyPage,
  ShippingPolicyPage,
  ContactPage,
  PricingPage
} from './components/LegalPages';
import { Menu, X, Eye } from 'lucide-react';
import { soundFx } from './utils/sound';

export function App() {
  // State Initialization from LocalStorage / Backend
  const [user, setUser] = useState<UserProfile>(() =>
    loadFromStorage(STORAGE_KEYS.USER_PROFILE, defaultUserProfile)
  );
  const [dailyQuests, setDailyQuests] = useState<DailyQuestSlot[]>(() =>
    loadFromStorage(STORAGE_KEYS.DAILY_QUESTS, defaultDailyQuests)
  );
  const [quests, setQuests] = useState<Quest[]>(() =>
    loadFromStorage(STORAGE_KEYS.QUESTS, defaultQuests)
  );
  const [skills, setSkills] = useState<Skill[]>(() =>
    loadFromStorage(STORAGE_KEYS.SKILLS, defaultSkills)
  );
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    loadFromStorage(STORAGE_KEYS.ACHIEVEMENTS, defaultAchievements)
  );
  const [bosses, setBosses] = useState<BossBattle[]>(() =>
    loadFromStorage(STORAGE_KEYS.BOSS_BATTLES, defaultBossBattles)
  );
  const [rewards, setRewards] = useState<RewardItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.REWARDS, defaultRewards)
  );
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(() =>
    loadFromStorage(STORAGE_KEYS.REDEMPTIONS, defaultRedemptions)
  );
  const [schedule, setSchedule] = useState<ScheduleEvent[]>(() =>
    loadFromStorage(STORAGE_KEYS.SCHEDULE, defaultSchedule)
  );
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>(() =>
    loadFromStorage(STORAGE_KEYS.SCHEDULE_TASKS, defaultScheduleTasks)
  );
  const [habits, setHabits] = useState<UserHabit[]>(() =>
    loadFromStorage(STORAGE_KEYS.HABITS, defaultHabits)
  );
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>(() =>
    loadFromStorage(STORAGE_KEYS.HABIT_COMPLETIONS, defaultHabitCompletions)
  );
  const [weeklyHabits, setWeeklyHabits] = useState<WeeklyHabit[]>(() =>
    loadFromStorage(STORAGE_KEYS.WEEKLY_HABITS, defaultWeeklyHabits)
  );
  const [monthlyHabits, setMonthlyHabits] = useState<MonthlyHabit[]>(() =>
    loadFromStorage(STORAGE_KEYS.MONTHLY_HABITS, defaultMonthlyHabits)
  );
  const [monthlyReflections, setMonthlyReflections] = useState<MonthlyReflection[]>(() =>
    loadFromStorage(STORAGE_KEYS.MONTHLY_REFLECTIONS, defaultMonthlyReflections)
  );
  const [economy, setEconomy] = useState<SystemEconomyConfig>(() =>
    loadFromStorage(STORAGE_KEYS.ECONOMY, defaultEconomy)
  );
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.ADMIN_USERS, defaultAdminUsers)
  );
  const [notices, setNotices] = useState<SystemNotice[]>(() =>
    loadFromStorage(STORAGE_KEYS.SYSTEM_NOTICES, defaultSystemNotices)
  );

  // App UI Navigation & Auth Controls
  const [activeTab, setActiveTab] = useState<TabId>('status');
  const [isLandingOpen, setIsLandingOpen] = useState(true);
  const [isAwakeningOpen, setIsAwakeningOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'CHOOSE' | 'LOGIN' | 'REGISTER' | 'ADMIN'>('CHOOSE');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobileSidebar, setIsMobileSidebar] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<AdminUserRecord | null>(null);
  const [showIntro, setShowIntro] = useState<boolean>(
    () => !sessionStorage.getItem('system_window_intro_played')
  );
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  // Sync URL Path changes for real public legal routes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  // Check auth session on startup & load user data
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          setIsLandingOpen(false);
          if (data.user.role === 'ADMIN') {
            setActiveTab('admin');
          } else {
            setActiveTab('status');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Strict Route Protection: Prevent normal users from viewing Admin Panel
  useEffect(() => {
    if (isAuthenticated && user.role !== 'ADMIN' && activeTab === 'admin') {
      setActiveTab('status');
    }
  }, [activeTab, user.role, isAuthenticated]);

  // Fetch Dashboard Data from Server when Authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/user/dashboard-data')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setDailyQuests(data.dailyQuests || []);
            setQuests(data.quests || []);
            setSkills(data.skills || []);
            setAchievements(data.achievements || []);
            setBosses(data.bosses || []);
            setRewards(data.rewards || []);
            setRedemptions(data.redemptions || []);
            setSchedule(data.schedule || []);
            setScheduleTasks(data.scheduleTasks || []);
            setHabits(data.habits || []);
            setHabitCompletions(data.habitCompletions || []);
            setWeeklyHabits(data.weeklyHabits || []);
            setMonthlyHabits(data.monthlyHabits || []);
            setMonthlyReflections(data.monthlyReflections || []);
          }
        })
        .catch(() => {});

      if (user.role === 'ADMIN') {
        fetch('/api/admin/users')
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.users) {
              setAdminUsers(data.users);
            }
          })
          .catch(() => {});
      }
    }
  }, [isAuthenticated, user.role]);

  // Sync to LocalStorage on updates
  useEffect(() => saveToStorage(STORAGE_KEYS.USER_PROFILE, user), [user]);
  useEffect(() => saveToStorage(STORAGE_KEYS.DAILY_QUESTS, dailyQuests), [dailyQuests]);
  useEffect(() => saveToStorage(STORAGE_KEYS.QUESTS, quests), [quests]);
  useEffect(() => saveToStorage(STORAGE_KEYS.SKILLS, skills), [skills]);
  useEffect(() => saveToStorage(STORAGE_KEYS.ACHIEVEMENTS, achievements), [achievements]);
  useEffect(() => saveToStorage(STORAGE_KEYS.BOSS_BATTLES, bosses), [bosses]);
  useEffect(() => saveToStorage(STORAGE_KEYS.REWARDS, rewards), [rewards]);
  useEffect(() => saveToStorage(STORAGE_KEYS.REDEMPTIONS, redemptions), [redemptions]);
  useEffect(() => saveToStorage(STORAGE_KEYS.SCHEDULE, schedule), [schedule]);
  useEffect(() => saveToStorage(STORAGE_KEYS.SCHEDULE_TASKS, scheduleTasks), [scheduleTasks]);
  useEffect(() => saveToStorage(STORAGE_KEYS.HABITS, habits), [habits]);
  useEffect(() => saveToStorage(STORAGE_KEYS.HABIT_COMPLETIONS, habitCompletions), [habitCompletions]);
  useEffect(() => saveToStorage(STORAGE_KEYS.WEEKLY_HABITS, weeklyHabits), [weeklyHabits]);
  useEffect(() => saveToStorage(STORAGE_KEYS.MONTHLY_HABITS, monthlyHabits), [monthlyHabits]);
  useEffect(() => saveToStorage(STORAGE_KEYS.MONTHLY_REFLECTIONS, monthlyReflections), [monthlyReflections]);
  useEffect(() => saveToStorage(STORAGE_KEYS.ECONOMY, economy), [economy]);
  useEffect(() => saveToStorage(STORAGE_KEYS.ADMIN_USERS, adminUsers), [adminUsers]);
  useEffect(() => saveToStorage(STORAGE_KEYS.SYSTEM_NOTICES, notices), [notices]);

  // Sync Profile updates to Server
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      }).catch(() => {});
    }
  }, [user, isAuthenticated]);

  // Sync User Data to Server (Daily Quests, Quests, Skills, Schedule, Schedule Tasks, Habits, etc.)
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyQuests,
          quests,
          skills,
          achievements,
          bosses,
          rewards,
          redemptions,
          schedule,
          scheduleTasks,
          habits,
          habitCompletions,
          weeklyHabits,
          monthlyHabits,
          monthlyReflections,
        }),
      }).catch(() => {});
    }
  }, [isAuthenticated, dailyQuests, quests, skills, achievements, bosses, rewards, redemptions, schedule, scheduleTasks, habits, habitCompletions, weeklyHabits, monthlyHabits, monthlyReflections]);

  // Open Awakening ceremony automatically if brand new user
  useEffect(() => {
    if (isAuthenticated && !user.hasCompletedOnboarding && !showIntro) {
      setIsAwakeningOpen(true);
    }
  }, [isAuthenticated, user.hasCompletedOnboarding, showIntro]);

  const handleOpenLogin = () => {
    setAuthMode('CHOOSE');
    setIsAuthOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthMode('REGISTER');
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (authUser: UserProfile) => {
    setUser(authUser);
    setIsAuthenticated(true);
    setIsAuthOpen(false);
    setIsLandingOpen(false);
    if (authUser.role === 'ADMIN') {
      setActiveTab('admin');
    } else {
      setActiveTab('status');
    }
  };

  const handleLogout = async () => {
    soundFx.playBlip(700);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setIsLandingOpen(true);
    setUser(defaultUserProfile);
    setDailyQuests([]);
    setQuests([]);
    setSkills([]);
    setAchievements([]);
    setBosses([]);
    setRewards([]);
    setRedemptions([]);
    setSchedule([]);
    setScheduleTasks([]);
    setAdminUsers([]);
    setNotices([]);
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  };

  const handleDismissNotice = (id: string) => {
    soundFx.playBlip(600);
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, active: false } : n))
    );
  };

  const handleImpersonateUser = (record: AdminUserRecord) => {
    soundFx.playBlip(1000);
    setImpersonatedUser(record);
    setActiveTab('status');
  };

  const handleExitImpersonation = () => {
    soundFx.playBlip(900);
    setImpersonatedUser(null);
  };

  const handleReactivateSubscription = () => {
    setUser((prev) => ({
      ...prev,
      accountStatus: 'ACTIVE',
    }));
  };

  // Public Legal & Trust Pages (Reachable without authentication)
  if (currentPath === '/terms') {
    return <TermsPage onNavigateHome={navigateToHome} />;
  }
  if (currentPath === '/privacy') {
    return <PrivacyPage onNavigateHome={navigateToHome} />;
  }
  if (currentPath === '/refund-policy') {
    return <RefundPolicyPage onNavigateHome={navigateToHome} />;
  }
  if (currentPath === '/shipping-policy') {
    return <ShippingPolicyPage onNavigateHome={navigateToHome} />;
  }
  if (currentPath === '/contact') {
    return <ContactPage onNavigateHome={navigateToHome} />;
  }
  if (currentPath === '/pricing') {
    return <PricingPage onNavigateHome={navigateToHome} />;
  }

  // If intro sequence is active
  if (showIntro) {
    return (
      <CinematicIntro
        user={user}
        dailyQuests={dailyQuests}
        onComplete={() => {
          sessionStorage.setItem('system_window_intro_played', 'true');
          setShowIntro(false);
        }}
      />
    );
  }

  // If user opened Landing Page mode or is not authenticated
  if (isLandingOpen || !isAuthenticated) {
    return (
      <>
        <LandingPage
          onEnterApp={() => {
            if (isAuthenticated) {
              setIsLandingOpen(false);
            } else {
              handleOpenLogin();
            }
          }}
          onOpenLogin={handleOpenLogin}
          onOpenRegister={handleOpenRegister}
          isAuthenticated={isAuthenticated}
        />
        <Footer onNavigate={(path) => {
          window.history.pushState({}, '', path);
          setCurrentPath(path);
        }} />
        {isAuthOpen && (
          <AuthModal
            initialMode={authMode}
            onSuccess={handleAuthSuccess}
            onClose={() => setIsAuthOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="h-screen h-[100dvh] w-screen w-full bg-[#05020a] text-slate-100 flex flex-col font-exo selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Dark Purple Radial Glow & Holographic Scanlines */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,#240947_0%,#0c0418_45%,#05020a_100%)] pointer-events-none z-0" />
      <div className="fixed inset-0 scanline-bg opacity-30 pointer-events-none z-0" />

      {/* Main Header Bar */}
      <Header
        user={user}
        setUser={setUser}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onOpenAwakening={() => setIsAwakeningOpen(true)}
        onToggleLanding={() => setIsLandingOpen(true)}
        isLandingOpen={isLandingOpen}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
      />

      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden bg-white/5 backdrop-blur-md border-b border-white/15 px-4 py-2.5 flex items-center justify-between z-20">
        <button
          onClick={() => setIsMobileSidebar(!isMobileSidebar)}
          className="flex items-center space-x-2 text-xs font-mono text-white font-bold"
        >
          {isMobileSidebar ? <X className="w-5 h-5 text-purple-400" /> : <Menu className="w-5 h-5 text-purple-400" />}
          <span>SYSTEM MENU</span>
        </button>
        <span className="text-xs font-mono text-purple-300 font-bold tracking-wider">
          TAB: {activeTab.toUpperCase()}
        </span>
      </div>

      {/* Read-Only Impersonation Warning Banner */}
      {impersonatedUser && (
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-2 flex items-center justify-between text-xs font-mono text-white z-30">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-purple-300 animate-pulse" />
            <span>
              IMPERSONATION MODE: Viewing Hunter account of{' '}
              <strong className="text-white">{impersonatedUser.username}</strong> ({impersonatedUser.email})
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="px-2.5 py-1 rounded bg-white/15 border border-white/30 text-white font-bold hover:bg-white/25"
          >
            EXIT IMPERSONATION MODE
          </button>
        </div>
      )}

      {/* Main Body Layout */}
      <div className="flex-1 w-full flex z-10 relative overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={user.role}
          isMobileOpen={isMobileSidebar}
          setIsMobileOpen={setIsMobileSidebar}
        />

        {/* Section View Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto w-full h-full min-w-0">
          {/* Sealed Account Paywall State Banner */}
          {user.accountStatus === 'SEALED' && (
            <SealedGateBanner onReactivate={handleReactivateSubscription} />
          )}

          {/* Broadcast In-App System Notice Banner */}
          <SystemNoticeBanner notices={notices} onDismiss={handleDismissNotice} />

          {/* Tab Route Switching */}
          {activeTab === 'status' && (
            <StatusWindow user={user} setUser={setUser} dailyQuests={dailyQuests} />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView
              scheduleTasks={scheduleTasks}
              setScheduleTasks={setScheduleTasks}
              dailyQuests={dailyQuests}
              setDailyQuests={setDailyQuests}
              habits={habits}
              setHabits={setHabits}
              habitCompletions={habitCompletions}
              setHabitCompletions={setHabitCompletions}
              weeklyHabits={weeklyHabits}
              setWeeklyHabits={setWeeklyHabits}
              monthlyHabits={monthlyHabits}
              setMonthlyHabits={setMonthlyHabits}
              monthlyReflections={monthlyReflections}
              setMonthlyReflections={setMonthlyReflections}
              user={user}
              setUser={setUser}
            />
          )}

          {activeTab === 'daily-quests' && (
            <DailyQuestsView
              dailyQuests={dailyQuests}
              setDailyQuests={setDailyQuests}
              user={user}
              setUser={setUser}
            />
          )}

          {activeTab === 'quests' && (
            <QuestsView
              quests={quests}
              setQuests={setQuests}
              user={user}
              setUser={setUser}
            />
          )}

          {activeTab === 'skills' && (
            <SkillsView skills={skills} setSkills={setSkills} />
          )}

          {activeTab === 'achievements' && (
            <AchievementsView achievements={achievements} user={user} />
          )}

          {activeTab === 'boss-battles' && (
            <BossBattlesView
              bosses={bosses}
              setBosses={setBosses}
              user={user}
              setUser={setUser}
            />
          )}

          {activeTab === 'rewards' && (
            <RewardsView
              rewards={rewards}
              setRewards={setRewards}
              redemptions={redemptions}
              setRedemptions={setRedemptions}
              user={user}
              setUser={setUser}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseView user={user} />
          )}

          {activeTab === 'admin' && (
            <AdminPanel
              user={user}
              adminUsers={adminUsers}
              setAdminUsers={setAdminUsers}
              economy={economy}
              setEconomy={setEconomy}
              notices={notices}
              setNotices={setNotices}
              onImpersonate={handleImpersonateUser}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* System Footer on Main App Layout */}
      <Footer onNavigate={(path) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
      }} />

      {/* Authentication Modal */}
      {isAuthOpen && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {/* Awakening Ceremony Onboarding Modal */}
      {isAwakeningOpen && (
        <AwakeningModal
          user={user}
          onSave={setUser}
          onClose={() => setIsAwakeningOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
