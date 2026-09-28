import React, { useState, useEffect } from 'react';
import { 
  ScheduleTask, 
  DailyQuestSlot, 
  UserProfile, 
  TaskPriority, 
  TaskRepeatType,
  UserHabit,
  HabitCompletion,
  WeeklyHabit,
  MonthlyHabit,
  MonthlyReflection
} from '../types';
import { soundFx } from '../utils/sound';
import { RankChallengeCard } from './RankChallengeCard';
import { rankService, RankChallengeData } from '../services/rankService';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  Repeat, 
  Link as LinkIcon,
  Flame,
  TrendingUp,
  Award,
  BookOpen,
  Edit3,
  CheckSquare,
  BarChart3,
  Check,
  X,
  Target,
  RotateCcw
} from 'lucide-react';

interface ScheduleViewProps {
  scheduleTasks: ScheduleTask[];
  setScheduleTasks: React.Dispatch<React.SetStateAction<ScheduleTask[]>>;
  dailyQuests: DailyQuestSlot[];
  setDailyQuests: React.Dispatch<React.SetStateAction<DailyQuestSlot[]>>;
  habits: UserHabit[];
  setHabits: React.Dispatch<React.SetStateAction<UserHabit[]>>;
  habitCompletions: HabitCompletion[];
  setHabitCompletions: React.Dispatch<React.SetStateAction<HabitCompletion[]>>;
  weeklyHabits: WeeklyHabit[];
  setWeeklyHabits: React.Dispatch<React.SetStateAction<WeeklyHabit[]>>;
  monthlyHabits: MonthlyHabit[];
  setMonthlyHabits: React.Dispatch<React.SetStateAction<MonthlyHabit[]>>;
  monthlyReflections: MonthlyReflection[];
  setMonthlyReflections: React.Dispatch<React.SetStateAction<MonthlyReflection[]>>;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  scheduleTasks,
  setScheduleTasks,
  dailyQuests,
  setDailyQuests,
  habits,
  setHabits,
  habitCompletions,
  setHabitCompletions,
  weeklyHabits,
  setWeeklyHabits,
  monthlyHabits,
  setMonthlyHabits,
  monthlyReflections,
  setMonthlyReflections,
  user,
  setUser,
}) => {
  // Current Month / Year Selector State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Selected Date String (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isWeeklyHabitModalOpen, setIsWeeklyHabitModalOpen] = useState(false);
  const [isMonthlyHabitModalOpen, setIsMonthlyHabitModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form Inputs - Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDate, setTaskDate] = useState(selectedDateStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [category, setCategory] = useState('Quest');
  const [linkedHabitId, setLinkedHabitId] = useState<string>('');
  const [reminderTime, setReminderTime] = useState<string>('15m before');
  const [repeatType, setRepeatType] = useState<TaskRepeatType>('NONE');
  const [notes, setNotes] = useState('');
  const [xpReward, setXpReward] = useState<number>(25);

  // Form Inputs - Daily Habit
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitCategory, setHabitCategory] = useState('General');
  const [habitFrequency, setHabitFrequency] = useState('Daily');

  // Form Inputs - Weekly / Monthly Habit
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState(3);

  // Calendar & Month Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (0 = Jan, 8 = Sep)
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Month & Year Selector Handlers
  const handlePrevMonth = () => {
    soundFx.playBlip(700);
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    soundFx.playBlip(700);
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectMonth = (mIndex: number) => {
    soundFx.playBlip(750);
    setCurrentDate(new Date(year, mIndex, 1));
  };

  const handleSelectYear = (yNum: number) => {
    soundFx.playBlip(750);
    setCurrentDate(new Date(yNum, month, 1));
  };

  const handleGoToday = () => {
    soundFx.playBlip(800);
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(todayStr);
  };

  // Generate Array of All Days in Month
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(year, month, dayNum);
    const dayNameShort = dateObj.toLocaleString('default', { weekday: 'short' }).toUpperCase();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon ...
    return { dayNum, dayNameShort, dateStr, dayOfWeek };
  });

  // Calculate Weeks dynamically (Week 1, Week 2, Week 3, Week 4, Week 5)
  const weekGroups: { weekNum: number; days: typeof daysArray }[] = [];
  let currentWeek: typeof daysArray = [];
  let weekCounter = 1;

  daysArray.forEach((day, index) => {
    currentWeek.push(day);
    if (day.dayOfWeek === 0 || index === daysArray.length - 1) { // End of week on Sunday
      weekGroups.push({ weekNum: weekCounter++, days: [...currentWeek] });
      currentWeek = [];
    }
  });

  // Habit Completion Toggle Handler
  const handleToggleHabitCompletion = (habitId: string, dateStr: string) => {
    soundFx.playBlip(950);
    const existingIndex = habitCompletions.findIndex(
      (hc) => hc.habitId === habitId && hc.completionDate === dateStr
    );

    let nextCompleted = true;
    if (existingIndex >= 0) {
      nextCompleted = !habitCompletions[existingIndex].completed;
      setHabitCompletions((prev) =>
        prev.map((hc, idx) => (idx === existingIndex ? { ...hc, completed: nextCompleted } : hc))
      );
    } else {
      const newCompletion: HabitCompletion = {
        id: `hc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        habitId,
        completionDate: dateStr,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      setHabitCompletions((prev) => [...prev, newCompletion]);
    }

    if (nextCompleted) {
      soundFx.playLevelUp();
      setUser((prev) => ({
        ...prev,
        xp: prev.xp + 15,
        points: prev.points + 5,
      }));
    }
  };

  // Helper: Check if habit is completed on date
  const isHabitCompletedOnDate = (habitId: string, dateStr: string) => {
    const record = habitCompletions.find((hc) => hc.habitId === habitId && hc.completionDate === dateStr);
    return Boolean(record?.completed);
  };

  // Task Recurrence Evaluator
  const isTaskOccurringOnDate = (task: ScheduleTask, dateStr: string) => {
    if (task.taskDate === dateStr) return true;
    if (task.repeatType === 'NONE') return false;

    const target = new Date(dateStr + 'T00:00:00');
    const start = new Date(task.taskDate + 'T00:00:00');

    if (target < start) return false;
    const dayOfWeek = target.getDay();

    if (task.repeatType === 'DAILY') return true;
    if (task.repeatType === 'WEEKDAYS') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (task.repeatType === 'WEEKENDS') return dayOfWeek === 0 || dayOfWeek === 6;
    if (task.repeatType === 'WEEKLY') return target.getDay() === start.getDay();
    if (task.repeatType === 'MONTHLY') return target.getDate() === start.getDate();

    return false;
  };

  // Tasks for Selected Date
  const selectedDateTasks = scheduleTasks
    .filter((t) => isTaskOccurringOnDate(t, selectedDateStr))
    .sort((a, b) => (a.startTime || '23:59').localeCompare(b.startTime || '23:59'));

  const completedTasksCount = selectedDateTasks.filter((t) => t.isCompleted).length;
  const totalTasksCount = selectedDateTasks.length;
  const dailyProgressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Real Calculated Month Progress Statistics
  const monthDateStrs = new Set(daysArray.map((d) => d.dateStr));
  const monthCompletions = habitCompletions.filter(
    (hc) => hc.completed && monthDateStrs.has(hc.completionDate)
  );

  const totalPossibleHabitChecks = habits.length * daysInMonth;
  const totalCompletedHabitChecks = monthCompletions.length;
  const monthlyHabitProgressPercent =
    totalPossibleHabitChecks > 0 ? Math.round((totalCompletedHabitChecks / totalPossibleHabitChecks) * 100) : 0;

  // Top Habits Ranked for Selected Month
  const topHabits = habits
    .map((h) => {
      const count = habitCompletions.filter(
        (hc) => hc.habitId === h.id && hc.completed && monthDateStrs.has(hc.completionDate)
      ).length;
      const rate = Math.round((count / daysInMonth) * 100);
      return { ...h, count, rate };
    })
    .sort((a, b) => b.rate - a.rate);

  // Current Month Reflection State
  const currentReflection = monthlyReflections.find((r) => r.month === month + 1 && r.year === year) || {
    id: `ref-${month + 1}-${year}`,
    month: month + 1,
    year,
    wentWell: '',
    toImprove: '',
    mainGoal: '',
  };

  const handleUpdateReflection = (field: 'wentWell' | 'toImprove' | 'mainGoal', val: string) => {
    const updated = { ...currentReflection, [field]: val };
    setMonthlyReflections((prev) => {
      const idx = prev.findIndex((r) => r.month === month + 1 && r.year === year);
      if (idx >= 0) {
        return prev.map((r, i) => (i === idx ? updated : r));
      }
      return [...prev, updated];
    });
  };

  // Add Habit Handlers
  const handleCreateHabit = () => {
    if (!habitName.trim()) return;
    soundFx.playLevelUp();
    const newHabit: UserHabit = {
      id: `hbt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: habitName,
      description: habitDesc,
      category: habitCategory,
      frequency: habitFrequency,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [...prev, newHabit]);
    setHabitName('');
    setHabitDesc('');
    setIsHabitModalOpen(false);
  };

  // Add Weekly Habit Handler
  const handleCreateWeeklyHabit = () => {
    if (!goalName.trim()) return;
    soundFx.playLevelUp();
    const item: WeeklyHabit = {
      id: `wh-${Date.now()}`,
      name: goalName,
      target: goalTarget,
      completedCount: 0,
    };
    setWeeklyHabits((prev) => [...prev, item]);
    setGoalName('');
    setIsWeeklyHabitModalOpen(false);
  };

  // Add Monthly Habit Handler
  const handleCreateMonthlyHabit = () => {
    if (!goalName.trim()) return;
    soundFx.playLevelUp();
    const item: MonthlyHabit = {
      id: `mh-${Date.now()}`,
      name: goalName,
      target: goalTarget,
      completedCount: 0,
    };
    setMonthlyHabits((prev) => [...prev, item]);
    setGoalName('');
    setIsMonthlyHabitModalOpen(false);
  };

  // Task Form Actions
  const handleOpenCreateTask = () => {
    soundFx.playBlip(900);
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDate(selectedDateStr);
    setStartTime('09:00');
    setEndTime('10:00');
    setPriority('MEDIUM');
    setCategory('Quest');
    setLinkedHabitId('');
    setRepeatType('NONE');
    setXpReward(25);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim()) return;
    soundFx.playLevelUp();

    if (editingTaskId) {
      setScheduleTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId
            ? {
                ...t,
                title: taskTitle,
                description: taskDesc,
                taskDate,
                startTime,
                endTime,
                priority,
                category,
                habitId: linkedHabitId || undefined,
                repeatType,
                xpReward,
              }
            : t
        )
      );
    } else {
      const newTask: ScheduleTask = {
        id: `tsk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: taskTitle,
        description: taskDesc,
        taskDate,
        startTime,
        endTime,
        priority,
        category,
        habitId: linkedHabitId || undefined,
        repeatType,
        isCompleted: false,
        xpReward,
      };
      setScheduleTasks((prev) => [...prev, newTask]);
    }
    setIsTaskModalOpen(false);
  };

  const handleToggleTask = (task: ScheduleTask) => {
    const nextState = !task.isCompleted;
    soundFx.playBlip(nextState ? 1200 : 700);

    setScheduleTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              isCompleted: nextState,
              completedAt: nextState ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    if (nextState) {
      setUser((prev) => ({
        ...prev,
        xp: prev.xp + task.xpReward,
        points: prev.points + Math.round(task.xpReward / 2),
      }));
    }
  };

  const handleDeleteTask = (id: string) => {
    soundFx.playBlip(600);
    setScheduleTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const yearsList = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROL BAR & MONTH SELECTOR */}
      <div className="system-panel p-4 sm:p-5 rounded-2xl border-white/20 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-purple-300 animate-pulse" />
            <h1 className="font-orbitron font-black text-2xl text-white tracking-wider text-glow">
              MONTHLY HABIT PLANNER
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-300 font-bold">
              SYSTEM MATRIX
            </span>
          </div>
          <p className="text-xs font-tech text-white/60">
            [MONTH → DATE → TO-DO TRACKING SYSTEM] INTERACTIVE HABIT GRID & CHRONOLOGICAL QUEST LOG
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex items-center space-x-1 bg-white/10 p-1 rounded-xl border border-white/20">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-orbitron font-bold text-sm text-white px-2 tracking-wider">
              {monthName.toUpperCase()} {year}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Dropdown */}
          <select
            value={month}
            onChange={(e) => handleSelectMonth(Number(e.target.value))}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-purple-400"
          >
            {monthsList.map((m, idx) => (
              <option key={m} value={idx} className="bg-[#0e041c]">
                {m}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={year}
            onChange={(e) => handleSelectYear(Number(e.target.value))}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-purple-400"
          >
            {yearsList.map((y) => (
              <option key={y} value={y} className="bg-[#0e041c]">
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={handleGoToday}
            className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 font-bold transition flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>TODAY</span>
          </button>
        </div>
      </div>

      {/* ACTION BUTTONS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              soundFx.playBlip(900);
              setIsHabitModalOpen(true);
            }}
            className="hex-btn px-4 py-2 bg-purple-600/80 hover:bg-purple-500 border border-purple-400/60 text-white font-orbitron font-bold text-xs tracking-wider flex items-center space-x-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ ADD HABIT</span>
          </button>

          <button
            onClick={handleOpenCreateTask}
            className="hex-btn px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs tracking-wider flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ ADD TASK</span>
          </button>

          <button
            onClick={() => {
              soundFx.playBlip(900);
              setIsWeeklyHabitModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/12 border border-white/20 text-white/80 hover:text-white transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5 text-purple-300" />
            <span>+ WEEKLY GOAL</span>
          </button>

          <button
            onClick={() => {
              soundFx.playBlip(900);
              setIsMonthlyHabitModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/12 border border-white/20 text-white/80 hover:text-white transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>+ MONTHLY GOAL</span>
          </button>
        </div>

        <div className="text-right text-white/60 text-[11px]">
          Selected: <strong className="text-white">{selectedDateStr}</strong>
        </div>
      </div>

      {/* 90-Day Rank Challenge Card */}
      <RankChallengeCard user={user} />

      {/* 2. MONTHLY HABIT TRACKER GRID */}
      <div className="system-panel p-5 rounded-2xl border-white/20 space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.15)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-purple-300" />
            <span className="font-orbitron font-bold text-sm text-white tracking-wider">
              {monthName.toUpperCase()} {year} HABITS TRACKING MATRIX
            </span>
          </div>

          <div className="text-xs font-mono text-purple-300 font-bold">
            Monthly Clearance: {monthlyHabitProgressPercent}% ({totalCompletedHabitChecks}/{totalPossibleHabitChecks})
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="system-panel p-10 rounded-xl text-center space-y-3 font-mono border-white/15 my-4">
            <Flame className="w-10 h-10 text-purple-400 mx-auto opacity-60" />
            <h3 className="font-orbitron font-bold text-lg text-white">YOUR SYSTEM IS EMPTY</h3>
            <p className="text-xs text-white/60 max-w-md mx-auto">
              No personal habits configured yet. Create your first habit to start tracking daily check-ins across {monthName}.
            </p>
            <button
              onClick={() => setIsHabitModalOpen(true)}
              className="hex-btn inline-flex items-center space-x-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 border border-purple-400 text-white font-orbitron font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.4)] transition mt-2"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ CREATE YOUR FIRST HABIT</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-3">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                {/* Week Header Row */}
                <tr className="border-b border-white/15 text-[10px] text-purple-300">
                  <th className="p-2 border-r border-white/15 w-44 min-w-[170px] bg-white/5 sticky left-0 z-10">
                    WEEKS →
                  </th>
                  {weekGroups.map((wg) => (
                    <th
                      key={`wg-${wg.weekNum}`}
                      colSpan={wg.days.length}
                      className="text-center p-1 border-r border-white/15 bg-white/5 font-bold tracking-widest text-purple-300"
                    >
                      WEEK {wg.weekNum}
                    </th>
                  ))}
                  <th className="p-2 text-center w-20 bg-white/5">PROGRESS</th>
                </tr>

                {/* Day Names & Dates Row */}
                <tr className="border-b border-white/15 text-[10px] text-white/70">
                  <th className="p-2.5 border-r border-white/15 font-orbitron font-bold text-white bg-[#0e041c] sticky left-0 z-10">
                    DAILY HABITS
                  </th>
                  {daysArray.map((day) => {
                    const isToday = day.dateStr === todayStr;
                    const isSelected = day.dateStr === selectedDateStr;
                    return (
                      <th
                        key={`hd-${day.dayNum}`}
                        onClick={() => {
                          soundFx.playBlip(750);
                          setSelectedDateStr(day.dateStr);
                        }}
                        className={`text-center p-1.5 cursor-pointer transition border-r border-white/10 min-w-[34px] ${
                          isSelected
                            ? 'bg-purple-500/30 text-white font-bold border-b-2 border-purple-400'
                            : isToday
                            ? 'bg-purple-950/60 text-purple-200 font-bold'
                            : 'hover:bg-white/10 text-white/70'
                        }`}
                      >
                        <div className="text-[9px] font-mono text-white/50">{day.dayNameShort}</div>
                        <div className={`text-xs ${isToday ? 'text-purple-300 font-black' : 'text-white'}`}>
                          {day.dayNum}
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-2 text-center text-white/60 bg-[#0e041c]">RATE</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {habits.map((habit) => {
                  const habitCompletedCount = habitCompletions.filter(
                    (hc) => hc.habitId === habit.id && hc.completed && monthDateStrs.has(hc.completionDate)
                  ).length;
                  const habitRatePercent = Math.round((habitCompletedCount / daysInMonth) * 100);

                  return (
                    <tr key={habit.id} className="hover:bg-white/5 transition">
                      {/* Habit Name Cell */}
                      <td className="p-2.5 border-r border-white/15 bg-[#0a0414] sticky left-0 z-10 font-bold text-white">
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[140px]" title={habit.name}>
                            {habit.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                            {habit.category || 'Daily'}
                          </span>
                        </div>
                      </td>

                      {/* Daily Checkbox Cells */}
                      {daysArray.map((day) => {
                        const isDone = isHabitCompletedOnDate(habit.id, day.dateStr);
                        const isSelectedDate = day.dateStr === selectedDateStr;

                        return (
                          <td
                            key={`cell-${habit.id}-${day.dayNum}`}
                            className={`text-center p-1 border-r border-white/10 ${
                              isSelectedDate ? 'bg-purple-500/10' : ''
                            }`}
                          >
                            <button
                              onClick={() => handleToggleHabitCompletion(habit.id, day.dateStr)}
                              className={`w-6 h-6 rounded flex items-center justify-center transition mx-auto border ${
                                isDone
                                  ? 'bg-purple-500/80 border-purple-300 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                                  : 'bg-white/5 border-white/20 text-transparent hover:border-white/50 hover:bg-white/10'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </td>
                        );
                      })}

                      {/* Habit Monthly Progress Rate */}
                      <td className="p-2 text-center font-bold text-purple-300 bg-[#0a0414]">
                        {habitRatePercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. DATE-WISE TO-DO LIST & PROGRESS ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Selected Date Daily Quest Log */}
        <div className="lg:col-span-7 system-panel p-5 rounded-2xl border-white/20 space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div>
              <div className="text-[10px] font-mono text-purple-300 tracking-wider">
                [DAILY QUEST LOG]
              </div>
              <h2 className="font-orbitron font-bold text-base text-white tracking-wide">
                OBJECTIVES FOR {selectedDateStr}
              </h2>
            </div>

            <button
              onClick={handleOpenCreateTask}
              className="hex-btn px-3.5 py-1.5 bg-white/12 hover:bg-white/22 border border-white/30 text-white font-orbitron font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>+ ADD TASK</span>
            </button>
          </div>

          {/* Daily Clearance Progress Bar */}
          <div className="glass-stat-box p-3.5 rounded-xl border border-white/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white/70">CLEARANCE PROGRESS:</span>
              <span className="text-purple-300 font-bold">
                {dailyProgressPercent}% ({completedTasksCount} / {totalTasksCount} COMPLETED)
              </span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/20">
              <div
                className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.7)]"
                style={{ width: `${dailyProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Tasks List */}
          {selectedDateTasks.length === 0 ? (
            <div className="glass-stat-box p-8 rounded-xl text-center space-y-2 font-mono border border-white/15">
              <CheckSquare className="w-8 h-8 text-white/30 mx-auto" />
              <div className="text-sm font-bold text-white font-orbitron">No tasks scheduled for this date</div>
              <div className="text-xs text-white/50">Your schedule for {selectedDateStr} is clear.</div>
              <button
                onClick={handleOpenCreateTask}
                className="hex-btn inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-orbitron font-bold text-xs mt-2 transition"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>+ CREATE DATE TASK</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 font-mono text-xs">
              {selectedDateTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                    task.isCompleted
                      ? 'bg-white/5 border-white/10 opacity-75'
                      : 'glass-stat-box border-white/20 hover:border-white/35 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  }`}
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="mt-0.5 text-purple-300 hover:text-purple-200 transition flex-shrink-0"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/40 hover:text-white" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-orbitron font-bold text-sm ${
                            task.isCompleted ? 'line-through text-white/50' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                          {task.priority}
                        </span>

                        {task.repeatType !== 'NONE' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center space-x-1">
                            <Repeat className="w-2.5 h-2.5" />
                            <span>{task.repeatType}</span>
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs font-rajdhani text-white/60 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50 pt-1">
                        {task.startTime && (
                          <span className="flex items-center space-x-1 text-purple-300">
                            <Clock className="w-3 h-3" />
                            <span>{task.startTime} {task.endTime ? `- ${task.endTime}` : ''}</span>
                          </span>
                        )}
                        <span className="text-amber-300 font-bold">+{task.xpReward} XP</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-rose-400/60 hover:text-rose-400 rounded hover:bg-white/10"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Weekly Habits, Monthly Habits & Top Habits */}
        <div className="lg:col-span-5 space-y-4">
          {/* WEEKLY HABITS SECTION */}
          <div className="system-panel p-5 rounded-2xl border-white/20 space-y-3">
            <div className="flex items-center justify-between border-b border-white/15 pb-2">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-purple-300" />
                <span className="font-orbitron font-bold text-xs text-white tracking-wider">
                  WEEKLY HABITS & GOALS
                </span>
              </div>
              <button
                onClick={() => setIsWeeklyHabitModalOpen(true)}
                className="text-xs font-mono text-purple-300 hover:underline"
              >
                + ADD
              </button>
            </div>

            {weeklyHabits.length === 0 ? (
              <div className="text-center font-mono text-xs text-white/50 py-4">
                No weekly goals configured yet.
              </div>
            ) : (
              <div className="space-y-2.5 font-mono text-xs">
                {weeklyHabits.map((wh) => {
                  const pct = Math.min(100, Math.round((wh.completedCount / wh.target) * 100));
                  return (
                    <div key={wh.id} className="glass-stat-box p-3 rounded-xl border border-white/15 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{wh.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-300 font-bold">
                            {wh.completedCount} / {wh.target} ({pct}%)
                          </span>
                          <button
                            onClick={() => {
                              soundFx.playBlip(900);
                              setWeeklyHabits((prev) =>
                                prev.map((w) => (w.id === wh.id ? { ...w, completedCount: w.completedCount + 1 } : w))
                              );
                            }}
                            className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/20">
                        <div
                          className="bg-purple-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MONTHLY HABITS SECTION */}
          <div className="system-panel p-5 rounded-2xl border-white/20 space-y-3">
            <div className="flex items-center justify-between border-b border-white/15 pb-2">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-300" />
                <span className="font-orbitron font-bold text-xs text-white tracking-wider">
                  MONTHLY HABITS & GOALS
                </span>
              </div>
              <button
                onClick={() => setIsMonthlyHabitModalOpen(true)}
                className="text-xs font-mono text-amber-300 hover:underline"
              >
                + ADD
              </button>
            </div>

            {monthlyHabits.length === 0 ? (
              <div className="text-center font-mono text-xs text-white/50 py-4">
                No monthly goals configured yet.
              </div>
            ) : (
              <div className="space-y-2.5 font-mono text-xs">
                {monthlyHabits.map((mh) => {
                  const pct = Math.min(100, Math.round((mh.completedCount / mh.target) * 100));
                  return (
                    <div key={mh.id} className="glass-stat-box p-3 rounded-xl border border-white/15 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{mh.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-300 font-bold">
                            {mh.completedCount} / {mh.target} ({pct}%)
                          </span>
                          <button
                            onClick={() => {
                              soundFx.playBlip(900);
                              setMonthlyHabits((prev) =>
                                prev.map((m) => (m.id === mh.id ? { ...m, completedCount: m.completedCount + 1 } : m))
                              );
                            }}
                            className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/20">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TOP HABITS RANKING */}
          <div className="system-panel p-5 rounded-2xl border-white/20 space-y-3">
            <div className="flex items-center justify-between border-b border-white/15 pb-2">
              <span className="font-orbitron font-bold text-xs text-white tracking-wider">
                TOP PERFORMING HABITS ({monthName.toUpperCase()})
              </span>
              <TrendingUp className="w-4 h-4 text-purple-300" />
            </div>

            {topHabits.length === 0 ? (
              <div className="text-center font-mono text-xs text-white/50 py-3">
                No habit completions logged this month yet.
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {topHabits.slice(0, 5).map((th, idx) => (
                  <div key={th.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white">{th.name}</span>
                    </div>
                    <span className="text-purple-300 font-bold">{th.rate}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. MONTHLY REFLECTION (SYSTEM JOURNAL) */}
      <div className="system-panel p-6 rounded-2xl border-white/20 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.15)] font-mono text-xs">
        <div className="flex items-center space-x-2 border-b border-white/15 pb-3">
          <BookOpen className="w-5 h-5 text-purple-300" />
          <h2 className="font-orbitron font-bold text-sm text-white tracking-wider">
            MONTHLY REFLECTION JOURNAL ({monthName.toUpperCase()} {year})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-white/70 font-bold">WHAT WENT WELL THIS MONTH?</label>
            <textarea
              value={currentReflection.wentWell}
              onChange={(e) => handleUpdateReflection('wentWell', e.target.value)}
              placeholder="Record victories, completed quests, and habits kept..."
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none h-24 focus:border-purple-400 font-rajdhani text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-white/70 font-bold">WHAT SHOULD I IMPROVE?</label>
            <textarea
              value={currentReflection.toImprove}
              onChange={(e) => handleUpdateReflection('toImprove', e.target.value)}
              placeholder="Identify bottlenecks, missed habits, and focus areas..."
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none h-24 focus:border-purple-400 font-rajdhani text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-white/70 font-bold">MAIN GOAL FOR NEXT MONTH?</label>
            <textarea
              value={currentReflection.mainGoal}
              onChange={(e) => handleUpdateReflection('mainGoal', e.target.value)}
              placeholder="Set S-Rank objectives for the upcoming month..."
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none h-24 focus:border-purple-400 font-rajdhani text-sm"
            />
          </div>
        </div>
      </div>

      {/* CREATE HABIT MODAL */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open font-mono text-xs">
          <div className="system-panel-glow max-w-md w-full p-6 rounded-2xl border-white/30 space-y-4 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-purple-300" />
                <h3 className="font-orbitron font-bold text-base text-white">CREATE NEW HABIT</h3>
              </div>
              <button onClick={() => setIsHabitModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-white/70 mb-1">HABIT NAME *</label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g. Morning Workout, Study DSA"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-rajdhani text-sm"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1">DESCRIPTION</label>
                <input
                  type="text"
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  placeholder="e.g. 30 mins cardio or graph algorithms"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-rajdhani text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 mb-1">CATEGORY</label>
                  <select
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="General" className="bg-[#0e041c]">General</option>
                    <option value="Fitness" className="bg-[#0e041c]">Fitness</option>
                    <option value="DSA / Code" className="bg-[#0e041c]">DSA / Code</option>
                    <option value="Reading" className="bg-[#0e041c]">Reading</option>
                    <option value="Mindfulness" className="bg-[#0e041c]">Mindfulness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">FREQUENCY</label>
                  <select
                    value={habitFrequency}
                    onChange={(e) => setHabitFrequency(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="Daily" className="bg-[#0e041c]">Daily</option>
                    <option value="Weekdays" className="bg-[#0e041c]">Weekdays</option>
                    <option value="Weekends" className="bg-[#0e041c]">Weekends</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-white/15">
                <button
                  onClick={() => setIsHabitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateHabit}
                  className="hex-btn px-5 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-400 text-white font-orbitron font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  CREATE HABIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE WEEKLY HABIT MODAL */}
      {isWeeklyHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open font-mono text-xs">
          <div className="system-panel-glow max-w-md w-full p-6 rounded-2xl border-white/30 space-y-4 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <h3 className="font-orbitron font-bold text-base text-white">ADD WEEKLY GOAL</h3>
              <button onClick={() => setIsWeeklyHabitModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-white/70 mb-1">GOAL NAME *</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Gym 3 Times, Project Planning"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-rajdhani text-sm"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1">WEEKLY TARGET COUNT</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-white/15">
                <button
                  onClick={() => setIsWeeklyHabitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWeeklyHabit}
                  className="hex-btn px-5 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-400 text-white font-orbitron font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  ADD GOAL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MONTHLY HABIT MODAL */}
      {isMonthlyHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open font-mono text-xs">
          <div className="system-panel-glow max-w-md w-full p-6 rounded-2xl border-white/30 space-y-4 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <h3 className="font-orbitron font-bold text-base text-white">ADD MONTHLY GOAL</h3>
              <button onClick={() => setIsMonthlyHabitModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-white/70 mb-1">MONTHLY GOAL NAME *</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Complete 1 Project, Read 2 Books"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-rajdhani text-sm"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1">MONTHLY TARGET COUNT</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-white/15">
                <button
                  onClick={() => setIsMonthlyHabitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMonthlyHabit}
                  className="hex-btn px-5 py-2 bg-amber-600 hover:bg-amber-500 border border-amber-400 text-white font-orbitron font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  ADD GOAL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080210]/85 backdrop-blur-md animate-window-open font-mono text-xs">
          <div className="system-panel-glow max-w-lg w-full p-6 rounded-2xl border-white/30 space-y-4 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <h3 className="font-orbitron font-bold text-base text-white">
                  {editingTaskId ? 'EDIT OBJECTIVE' : 'ADD DATE TASK'}
                </h3>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-white/70 mb-1">TASK TITLE *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Complete DSA Graph Revision"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 font-rajdhani text-sm"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1">DESCRIPTION</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Additional details or preparation requirements..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none h-16 focus:border-purple-400 font-rajdhani text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 mb-1">TASK DATE</label>
                  <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">PRIORITY</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="LOW" className="bg-[#0e041c]">LOW</option>
                    <option value="MEDIUM" className="bg-[#0e041c]">MEDIUM</option>
                    <option value="HIGH" className="bg-[#0e041c]">HIGH</option>
                    <option value="EPIC" className="bg-[#0e041c]">EPIC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 mb-1">START TIME</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">END TIME</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 mb-1">LINKED HABIT (OPTIONAL)</label>
                  <select
                    value={linkedHabitId}
                    onChange={(e) => setLinkedHabitId(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="" className="bg-[#0e041c]">-- None --</option>
                    {habits.map((h) => (
                      <option key={h.id} value={h.id} className="bg-[#0e041c]">
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">RECURRENCE</label>
                  <select
                    value={repeatType}
                    onChange={(e) => setRepeatType(e.target.value as TaskRepeatType)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="NONE" className="bg-[#0e041c]">Does not repeat</option>
                    <option value="DAILY" className="bg-[#0e041c]">Daily</option>
                    <option value="WEEKDAYS" className="bg-[#0e041c]">Weekdays (Mon-Fri)</option>
                    <option value="WEEKENDS" className="bg-[#0e041c]">Weekends (Sat-Sun)</option>
                    <option value="WEEKLY" className="bg-[#0e041c]">Weekly</option>
                    <option value="MONTHLY" className="bg-[#0e041c]">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-white/15">
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTask}
                  className="hex-btn px-5 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-400 text-white font-orbitron font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  {editingTaskId ? 'SAVE OBJECTIVE' : 'ADD TASK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
