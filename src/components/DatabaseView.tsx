import React, { useState, useEffect } from 'react';
import { UserProfile, PersonalDatabaseData, ChangeHistoryRecord } from '../types';
import { databaseService } from '../services/databaseService';
import { soundFx } from '../utils/sound';
import { RankChallengeCard } from './RankChallengeCard';
import {
  Database,
  RefreshCw,
  User,
  CheckSquare,
  Clock,
  CheckCircle2,
  BarChart2,
  Zap,
  Gem,
  History,
  Search,
  Activity,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';

interface DatabaseViewProps {
  user: UserProfile;
}

type DatabaseTab =
  | 'all'
  | 'overview'
  | 'habits'
  | 'tasks'
  | 'completions'
  | 'rpg'
  | 'subscription'
  | 'change-history'
  | 'activity-logs';

interface SectionState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<DatabaseTab>('all');
  const [globalLoading, setGlobalLoading] = useState(true);

  // Section States for Independent Error Boundaries
  const [profileState, setProfileState] = useState<SectionState<PersonalDatabaseData['profile']>>({
    data: null,
    loading: true,
    error: null,
  });

  const [habitsState, setHabitsState] = useState<SectionState<PersonalDatabaseData['habits']>>({
    data: null,
    loading: true,
    error: null,
  });

  const [tasksState, setTasksState] = useState<SectionState<PersonalDatabaseData['tasks']>>({
    data: null,
    loading: true,
    error: null,
  });

  const [completionsState, setCompletionsState] = useState<SectionState<PersonalDatabaseData['completions']>>({
    data: null,
    loading: true,
    error: null,
  });

  const [rpgState, setRpgState] = useState<SectionState<PersonalDatabaseData['rpgProgress']>>({
    data: null,
    loading: true,
    error: null,
  });

  const [subState, setSubState] = useState<SectionState<PersonalDatabaseData['subscription']>>({
    data: null,
    loading: true,
    error: null,
  });

  const [overviewState, setOverviewState] = useState<SectionState<PersonalDatabaseData['overview']>>({
    data: null,
    loading: true,
    error: null,
  });

  const [historyState, setHistoryState] = useState<SectionState<{
    logs: ChangeHistoryRecord[];
    monthlyStats: any;
    totalCount: number;
  }>>({
    data: null,
    loading: true,
    error: null,
  });

  const [activityLogsState, setActivityLogsState] = useState<SectionState<Array<{
    id: string;
    userId: string;
    action: string;
    summary: string;
    detailsJson?: string;
    createdAt: string;
  }>>>({
    data: null,
    loading: true,
    error: null,
  });

  // Change History Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatShortDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // 1. Fetch Main Personal Database
  const loadDatabaseData = async () => {
    setGlobalLoading(true);

    console.log('[Database] Current user:', user.username || user.name);
    console.log('[Database] User ID:', user.id || (user as any).userId);
    console.log('[Database] Loading profile...');
    console.log('[Database] Loading habits...');
    console.log('[Database] Loading completions...');
    console.log('[Database] Loading quests & tasks...');
    console.log('[Database] Loading rpg progress...');
    console.log('[Database] Loading subscription...');
    console.log('[Database] Loading change history...');
    console.log('[Database] Loading activity logs...');

    try {
      const data = await databaseService.fetchPersonalDatabase();

      if (data) {
        setProfileState({ data: data.profile, loading: false, error: null });
        setHabitsState({ data: data.habits || [], loading: false, error: null });
        setTasksState({ data: data.tasks || [], loading: false, error: null });
        setCompletionsState({ data: data.completions || [], loading: false, error: null });
        setRpgState({ data: data.rpgProgress, loading: false, error: null });
        setSubState({ data: data.subscription, loading: false, error: null });
        setOverviewState({ data: data.overview, loading: false, error: null });
      } else {
        const err = 'Failed to retrieve database payload from server.';
        console.error('[Database] Failed to load personal database:', err);
        setProfileState(prev => ({ ...prev, loading: false, error: err }));
        setHabitsState(prev => ({ ...prev, loading: false, error: err }));
        setTasksState(prev => ({ ...prev, loading: false, error: err }));
        setCompletionsState(prev => ({ ...prev, loading: false, error: err }));
        setRpgState(prev => ({ ...prev, loading: false, error: err }));
        setSubState(prev => ({ ...prev, loading: false, error: err }));
        setOverviewState(prev => ({ ...prev, loading: false, error: err }));
      }
    } catch (err: any) {
      console.error('[Database] Personal Database fetch exception:', err);
      const errMsg = err?.message || 'Error fetching database records.';
      setProfileState({ data: null, loading: false, error: errMsg });
      setHabitsState({ data: null, loading: false, error: errMsg });
      setTasksState({ data: null, loading: false, error: errMsg });
      setCompletionsState({ data: null, loading: false, error: errMsg });
      setRpgState({ data: null, loading: false, error: errMsg });
      setSubState({ data: null, loading: false, error: errMsg });
      setOverviewState({ data: null, loading: false, error: errMsg });
    } finally {
      setGlobalLoading(false);
    }
  };

  // 2. Fetch Change History Section
  const loadChangeHistory = async () => {
    setHistoryState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await databaseService.fetchChangeHistory({
        month: selectedMonth !== 'ALL' ? selectedMonth : undefined,
        date: selectedDate || undefined,
        actionType: actionFilter !== 'ALL' ? actionFilter : undefined,
        entityType: entityFilter !== 'ALL' ? entityFilter : undefined,
        search: searchQuery || undefined,
      });

      if (res) {
        setHistoryState({
          data: {
            logs: res.logs,
            monthlyStats: res.monthlyStats,
            totalCount: res.totalCount,
          },
          loading: false,
          error: null,
        });
      } else {
        const err = 'Failed to load change history audit logs.';
        console.error('[Database] Failed to load change history:', err);
        setHistoryState({ data: null, loading: false, error: err });
      }
    } catch (err: any) {
      console.error('[Database] Failed to load change history:', err);
      setHistoryState({ data: null, loading: false, error: err?.message || 'Failed to load change history.' });
    }
  };

  // 3. Fetch User Activity Logs Section
  const loadActivityLogs = async () => {
    setActivityLogsState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const logs = await databaseService.fetchUserActivityLogs();
      if (logs) {
        setActivityLogsState({ data: logs, loading: false, error: null });
      } else {
        const err = 'Failed to load user activity logs.';
        console.error('[Database] Failed to load activity logs:', err);
        setActivityLogsState({ data: null, loading: false, error: err });
      }
    } catch (err: any) {
      console.error('[Database] Failed to load activity logs:', err);
      setActivityLogsState({ data: null, loading: false, error: err?.message || 'Failed to load activity logs.' });
    }
  };

  useEffect(() => {
    loadDatabaseData();
    loadChangeHistory();
    loadActivityLogs();
  }, []);

  useEffect(() => {
    loadChangeHistory();
  }, [selectedMonth, selectedDate, actionFilter, entityFilter, searchQuery]);

  // Section Error Container Component
  const renderSectionError = (message: string, onRetry: () => void) => (
    <div className="p-6 rounded-xl border border-red-500/30 bg-red-950/20 backdrop-blur-md space-y-3 font-mono text-xs">
      <div className="flex items-center space-x-2 text-red-400 font-bold">
        <AlertTriangle className="w-4 h-4" />
        <span>Unable to load this section.</span>
      </div>
      <p className="text-white/60 text-[11px]">{message}</p>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-300 flex items-center space-x-2 font-mono text-xs transition"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Retry Section</span>
      </button>
    </div>
  );

  const navItems: { id: DatabaseTab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Sections', icon: Layers },
    { id: 'overview', label: 'User Overview', icon: User },
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'tasks', label: 'Tasks / Quests', icon: Clock },
    { id: 'completions', label: 'Completions', icon: CheckCircle2 },
    { id: 'rpg', label: 'RPG Progress', icon: Zap },
    { id: 'subscription', label: 'Subscription', icon: Gem },
    { id: 'change-history', label: 'Change History', icon: History },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
  ];

  // Derive stats for completions section
  const habitCompletionsList = completionsState.data || [];
  const totalCompletions = habitCompletionsList.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const completedTodayCount = habitCompletionsList.filter(
    c => c.completedAt && c.completedAt.toString().includes(todayStr)
  ).length;
  const latestCompletionDate = habitCompletionsList.length > 0 ? habitCompletionsList[0].completedAt : null;

  // Derive stats for tasks/quests section
  const tasksList = tasksState.data || [];
  const totalQuests = tasksList.length;
  const completedQuestsCount = tasksList.filter(t => t.status === 'COMPLETED').length;
  const pendingQuestsCount = totalQuests - completedQuestsCount;
  const latestQuestItem = tasksList.length > 0 ? tasksList[0] : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn">
      {/* Top Header Section */}
      <div className="system-panel p-5 sm:p-6 rounded-2xl border-white/20 bg-[#0a0412]/85 backdrop-blur-xl space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border-2 border-purple-400/50 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Database className="w-6 h-6 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h1 className="font-orbitron font-bold text-2xl text-white tracking-wider flex items-center space-x-3">
                <span>DATABASE</span>
                <span className={`text-xs font-mono px-2.5 py-0.5 rounded border ${
                  globalLoading
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse'
                    : 'bg-purple-500/30 text-purple-300 border-purple-400/40'
                }`}>
                  {globalLoading ? 'INITIALIZING DATABASE...' : 'DATABASE ONLINE'}
                </span>
              </h1>
              <p className="text-xs font-mono text-purple-300/80 mt-0.5">
                Personal Data Center • Authoritative Neon PostgreSQL Database
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playBlip(900);
              loadDatabaseData();
              loadChangeHistory();
              loadActivityLogs();
            }}
            disabled={globalLoading}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-xs font-mono text-white flex items-center space-x-2 transition shadow-[0_0_15px_rgba(168,85,247,0.2)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${globalLoading ? 'animate-spin text-purple-300' : ''}`} />
            <span>REFRESH DATABASE</span>
          </button>
        </div>

        {/* Quick Tabs Bar */}
        <div className="pt-2 flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-white/10">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundFx.playBlip(1000);
                  setActiveTab(item.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center space-x-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-500/30 border border-purple-400/60 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-purple-300' : 'text-white/50'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 1: USER OVERVIEW */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'overview') && (
        <div className="system-panel p-6 rounded-2xl border-white/20 bg-white/5 space-y-4 font-mono text-xs animate-fadeIn">
          <div className="border-b border-white/15 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white tracking-wide flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-300" />
                <span>USER OVERVIEW</span>
              </h2>
              <p className="text-white/50 text-[11px]">Authenticated User Profile & Data Center Record</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
              AUTHENTICATED
            </span>
          </div>

          {profileState.error ? (
            renderSectionError(profileState.error, loadDatabaseData)
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">User / Name</span>
                <span className="font-bold text-white text-base">
                  {profileState.data?.username || profileState.data?.name || user.username || user.name || 'N/A'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">Email</span>
                <span className="font-bold text-purple-300 text-sm">
                  {profileState.data?.email || user.email || 'N/A'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">User ID</span>
                <span className="font-mono text-white/80 text-xs truncate block">
                  {profileState.data?.userId || user.id || (user as any).userId || 'N/A'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">Account Created</span>
                <span className="font-bold text-white text-sm">
                  {formatDate(profileState.data?.createdAt || user.awakeningDate)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">Last Activity</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatDate(profileState.data?.updatedAt || overviewState.data?.lastUpdated)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">Subscription Status</span>
                <span className="font-bold text-amber-300 text-sm">
                  {subState.data?.status || overviewState.data?.subscriptionStatus || 'No active subscription'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 2: HABITS */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'habits') && (
        <div className="system-panel p-6 rounded-2xl border-white/20 bg-white/5 space-y-4 font-mono text-xs animate-fadeIn">
          <div className="border-b border-white/15 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white tracking-wide flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-purple-300" />
                <span>HABITS</span>
              </h2>
              <p className="text-white/50 text-[11px]">User habit records from habits table</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold">
              {habitsState.data?.length ?? 0} Habits
            </span>
          </div>

          {habitsState.error ? (
            renderSectionError(habitsState.error, loadDatabaseData)
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/15 text-white/50 text-[11px]">
                    <th className="p-3">HABIT</th>
                    <th className="p-3">CATEGORY</th>
                    <th className="p-3">FREQUENCY</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">CREATED</th>
                    <th className="p-3">UPDATED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/90">
                  {habitsState.data && habitsState.data.length > 0 ? (
                    habitsState.data.map((h) => (
                      <tr key={h.id} className="hover:bg-white/5 transition">
                        <td className="p-3 font-bold text-white">{h.name}</td>
                        <td className="p-3 text-purple-300">{h.category || 'General'}</td>
                        <td className="p-3 text-white/70">{h.frequency || 'Daily'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              h.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                : 'bg-white/10 text-white/50 border-white/20'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="p-3 text-white/50">{formatShortDate(h.createdAt)}</td>
                        <td className="p-3 text-white/50">{formatShortDate(h.updatedAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-white/40">
                        No habit records found for current user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 3: COMPLETIONS */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'completions') && (
        <div className="system-panel p-6 rounded-2xl border-white/20 bg-white/5 space-y-4 font-mono text-xs animate-fadeIn">
          <div className="border-b border-white/15 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white tracking-wide flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>COMPLETIONS</span>
              </h2>
              <p className="text-white/50 text-[11px]">Records from habit_completions table</p>
            </div>
          </div>

          {completionsState.error ? (
            renderSectionError(completionsState.error, loadDatabaseData)
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Total Completions</span>
                  <span className="font-orbitron font-bold text-2xl text-purple-300">{totalCompletions}</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Completed Today</span>
                  <span className="font-orbitron font-bold text-2xl text-emerald-400">{completedTodayCount}</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Current Streak</span>
                  <span className="font-orbitron font-bold text-2xl text-amber-400">
                    {rpgState.data?.currentStreak ?? user.streak ?? 0} D
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Latest Completion</span>
                  <span className="font-bold text-white text-xs block truncate">
                    {formatDate(latestCompletionDate || undefined)}
                  </span>
                </div>
              </div>

              {/* Completions Log Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/15 text-white/50 text-[11px]">
                      <th className="p-3">COMPLETION ID</th>
                      <th className="p-3">HABIT ID</th>
                      <th className="p-3">ACTION</th>
                      <th className="p-3">COMPLETED AT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/90">
                    {habitCompletionsList.length > 0 ? (
                      habitCompletionsList.slice(0, 10).map((c) => (
                        <tr key={c.id} className="hover:bg-white/5 transition">
                          <td className="p-3 text-white/50 font-mono text-[11px] truncate max-w-[150px]">{c.id}</td>
                          <td className="p-3 text-purple-300 font-mono text-[11px] truncate max-w-[150px]">{c.habitId}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                              {c.action}
                            </span>
                          </td>
                          <td className="p-3 text-white/70">{formatDate(c.completedAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-white/40">
                          No completions logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 4: TASKS / QUESTS */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'tasks') && (
        <div className="system-panel p-6 rounded-2xl border-white/20 bg-white/5 space-y-4 font-mono text-xs animate-fadeIn">
          <div className="border-b border-white/15 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white tracking-wide flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-300" />
                <span>TASKS / QUESTS</span>
              </h2>
              <p className="text-white/50 text-[11px]">Records from schedule_tasks, quests, and daily_quests tables</p>
            </div>
          </div>

          {tasksState.error ? (
            renderSectionError(tasksState.error, loadDatabaseData)
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Total Quests</span>
                  <span className="font-orbitron font-bold text-2xl text-purple-300">{totalQuests}</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Completed</span>
                  <span className="font-orbitron font-bold text-2xl text-emerald-400">{completedQuestsCount}</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Pending</span>
                  <span className="font-orbitron font-bold text-2xl text-amber-400">{pendingQuestsCount}</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Latest Quest</span>
                  <span className="font-bold text-white text-xs block truncate">
                    {latestQuestItem ? latestQuestItem.name : 'None'}
                  </span>
                </div>
              </div>

              {/* Tasks & Quests Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/15 text-white/50 text-[11px]">
                      <th className="p-3">QUEST / TASK NAME</th>
                      <th className="p-3">CATEGORY</th>
                      <th className="p-3">PRIORITY</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">DUE DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/90">
                    {tasksList.length > 0 ? (
                      tasksList.map((t) => (
                        <tr key={t.id} className="hover:bg-white/5 transition">
                          <td className="p-3 font-bold text-white">{t.name}</td>
                          <td className="p-3 text-purple-300">{t.category}</td>
                          <td className="p-3 text-amber-400 font-bold">{t.priority}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                t.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 text-white/70">{t.dueDate}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-white/40">
                          No tasks or quests found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 5: RPG PROGRESS */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'rpg') && (
        <div className="system-panel p-6 rounded-2xl border-white/20 bg-white/5 space-y-4 font-mono text-xs animate-fadeIn">
          <div className="border-b border-white/15 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white tracking-wide flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-300" />
                <span>RPG PROGRESS</span>
              </h2>
              <p className="text-white/50 text-[11px]">Real attributes retrieved from users database table</p>
            </div>
          </div>

          {rpgState.error ? (
            renderSectionError(rpgState.error, loadDatabaseData)
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Level</span>
                  <span className="font-orbitron font-bold text-3xl text-white">
                    LVL {rpgState.data?.level ?? user.level ?? 1}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Rank</span>
                  <span className="font-orbitron font-bold text-3xl text-purple-300">
                    {rpgState.data?.rank || user.rank || 'E'}-RANK
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">XP</span>
                  <span className="font-orbitron font-bold text-3xl text-emerald-400">
                    {rpgState.data?.xp ?? user.xp ?? 0} PTS
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-white/50 text-[10px] block uppercase">Streak</span>
                  <span className="font-orbitron font-bold text-3xl text-amber-400">
                    {rpgState.data?.currentStreak ?? user.streak ?? 0} D
                  </span>
                </div>
              </div>

              {/* 90-Day Rank Progression Challenge Card */}
              <RankChallengeCard user={user} />

              {/* RPG Stat Attributes Grid */}
              <div className="pt-2">
                <span className="text-white/50 text-[11px] block uppercase mb-2">HUNTER STAT ATTRIBUTES</span>
                <div className="grid grid-cols-5 gap-3 text-center">
                  {Object.entries(rpgState.data?.attributes || user.stats || { STR: 10, INT: 10, VIT: 10, WIS: 10, CHA: 10 }).map(([statKey, val]) => (
                    <div key={statKey} className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/30 space-y-0.5">
                      <span className="text-purple-300 font-bold block text-xs">{statKey}</span>
                      <span className="font-orbitron font-bold text-white text-lg">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 6: SUBSCRIPTION */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'subscription') && (
        <div className="system-panel p-6 rounded-2xl border-white/20 bg-white/5 space-y-4 font-mono text-xs animate-fadeIn">
          <div className="border-b border-white/15 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white tracking-wide flex items-center space-x-2">
                <Gem className="w-5 h-5 text-purple-300" />
                <span>SUBSCRIPTION</span>
              </h2>
              <p className="text-white/50 text-[11px]">Records from subscriptions database table</p>
            </div>
          </div>

          {subState.error ? (
            renderSectionError(subState.error, loadDatabaseData)
          ) : subState.data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">Current Plan</span>
                <span className="font-orbitron font-bold text-xl text-white">{subState.data.planName || subState.data.planType}</span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">Status</span>
                <span className={`font-orbitron font-bold text-xl ${
                  subState.data.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {subState.data.status}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">Started At</span>
                <span className="font-bold text-purple-300 text-sm">{formatDate(subState.data.startedAt)}</span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-white/50 text-[10px] block uppercase">Expires At</span>
                <span className="font-bold text-amber-400 text-sm">{formatDate(subState.data.expiresAt)}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-white/50">
              No active subscription record found for current user.
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 7: CHANGE HISTORY */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'change-history') && (
        <div className="system-panel p-6 rounded-2xl border-white/20 bg-white/5 space-y-5 font-mono text-xs animate-fadeIn">
          <div className="border-b border-white/15 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white tracking-wide flex items-center space-x-2">
                <History className="w-5 h-5 text-purple-300" />
                <span>CHANGE HISTORY</span>
              </h2>
              <p className="text-white/50 text-[11px]">Audit log of user action events from change_history table</p>
            </div>

            {/* Month Filter Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-white/50 text-[11px]">MONTH:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-[#0a0412] border border-white/20 text-white rounded-lg px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-purple-400"
              >
                <option value="ALL">All Months</option>
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="December 2026">December 2026</option>
              </select>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit logs..."
                className="w-full bg-[#0a0412] border border-white/20 text-white pl-9 pr-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#0a0412] border border-white/20 text-white px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full bg-[#0a0412] border border-white/20 text-white px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-purple-400"
              >
                <option value="ALL">All Actions</option>
                <option value="HABIT_CREATED">HABIT_CREATED</option>
                <option value="HABIT_COMPLETED">HABIT_COMPLETED</option>
                <option value="TASK_CREATED">TASK_CREATED</option>
                <option value="TASK_COMPLETED">TASK_COMPLETED</option>
                <option value="PROFILE_UPDATED">PROFILE_UPDATED</option>
                <option value="SUBSCRIPTION_STARTED">SUBSCRIPTION_STARTED</option>
              </select>
            </div>

            <div>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full bg-[#0a0412] border border-white/20 text-white px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-purple-400"
              >
                <option value="ALL">All Entities</option>
                <option value="HABIT">HABIT</option>
                <option value="TASK">TASK</option>
                <option value="PROFILE">PROFILE</option>
                <option value="RPG">RPG</option>
                <option value="SUBSCRIPTION">SUBSCRIPTION</option>
              </select>
            </div>
          </div>

          {historyState.error ? (
            renderSectionError(historyState.error, loadChangeHistory)
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/15 text-white/50 text-[11px]">
                    <th className="p-3">DATE</th>
                    <th className="p-3">TIME</th>
                    <th className="p-3">MONTH</th>
                    <th className="p-3">ACTION</th>
                    <th className="p-3">DETAILS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/90">
                  {historyState.loading ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-purple-300">
                        Loading change history logs...
                      </td>
                    </tr>
                  ) : historyState.data?.logs && historyState.data.logs.length > 0 ? (
                    historyState.data.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition">
                        <td className="p-3 font-mono font-bold text-white">{log.formattedDate}</td>
                        <td className="p-3 font-mono text-purple-300">{log.formattedTime}</td>
                        <td className="p-3 font-mono text-white/70">{log.formattedMonth}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="p-3 text-white/90">{log.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-white/40">
                        No activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 8: USER ACTIVITY LOGS */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'activity-logs') && (
        <div className="system-panel p-6 rounded-2xl border-white/20 bg-white/5 space-y-4 font-mono text-xs animate-fadeIn">
          <div className="border-b border-white/15 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white tracking-wide flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>USER ACTIVITY LOG</span>
              </h2>
              <p className="text-white/50 text-[11px]">System events from user_activity_logs table</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold">
              {activityLogsState.data?.length ?? 0} Logs
            </span>
          </div>

          {activityLogsState.error ? (
            renderSectionError(activityLogsState.error, loadActivityLogs)
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/15 text-white/50 text-[11px]">
                    <th className="p-3">TIMESTAMP</th>
                    <th className="p-3">ACTION</th>
                    <th className="p-3">SUMMARY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/90">
                  {activityLogsState.data && activityLogsState.data.length > 0 ? (
                    activityLogsState.data.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition">
                        <td className="p-3 font-mono text-purple-300 text-[11px]">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="p-3 font-bold text-white">{log.action}</td>
                        <td className="p-3 text-white/80">{log.summary}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-white/40">
                        No user activity logs recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseView;
