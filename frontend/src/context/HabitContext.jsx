import React, { createContext, useContext, useState, useEffect } from 'react';

const HabitContext = createContext();

const API_BASE_URL = 'http://localhost:5001/api';

const todayStr = new Date().toISOString().slice(0, 10);
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const dayMinus2Str = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
const dayMinus3Str = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

const normalizeHabit = (h) => {
  if (!h || typeof h !== 'object') {
    return {
      id: 'h_' + Math.random().toString(36).substr(2, 6),
      title: 'Untitled Habit',
      description: '',
      category: 'General',
      color: '#8b5cf6',
      priority: 'Medium',
      createdAt: todayStr,
      completions: []
    };
  }
  return {
    ...h,
    id: String(h.id || 'h_' + Math.random().toString(36).substr(2, 6)),
    title: String(h.title || h.text || 'Untitled Habit'),
    description: String(h.description || ''),
    category: String(h.category || 'General'),
    color: String(h.color || '#8b5cf6'),
    priority: String(h.priority || 'Medium'),
    createdAt: String(h.createdAt || todayStr),
    completions: Array.isArray(h.completions) ? h.completions.map(String) : []
  };
};

const INITIAL_HABITS = [
  {
    id: 'h_1',
    title: 'Morning Meditation & Breathing',
    description: '15 minutes of mindfulness to start the day with focus.',
    category: 'Health',
    color: '#8b5cf6',
    priority: 'High',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    completions: [todayStr, yesterdayStr, dayMinus2Str, dayMinus3Str]
  },
  {
    id: 'h_2',
    title: 'Read 20 Pages of Non-Fiction',
    description: 'Continuous learning and skill enhancement.',
    category: 'Productivity',
    color: '#3b82f6',
    priority: 'Medium',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10),
    completions: [todayStr, yesterdayStr]
  },
  {
    id: 'h_3',
    title: '30 Min Workout / Cardio',
    description: 'High intensity interval training or weight training.',
    category: 'Fitness',
    color: '#10b981',
    priority: 'High',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
    completions: [todayStr]
  }
];

const INITIAL_HISTORY = [
  { id: 'ch_1', habitId: 'h_1', title: 'Morning Meditation & Breathing', category: 'Health', color: '#8b5cf6', completedAt: todayStr },
  { id: 'ch_2', habitId: 'h_1', title: 'Morning Meditation & Breathing', category: 'Health', color: '#8b5cf6', completedAt: yesterdayStr },
  { id: 'ch_3', habitId: 'h_1', title: 'Morning Meditation & Breathing', category: 'Health', color: '#8b5cf6', completedAt: dayMinus2Str },
  { id: 'ch_4', habitId: 'h_1', title: 'Morning Meditation & Breathing', category: 'Health', color: '#8b5cf6', completedAt: dayMinus3Str },
  { id: 'ch_5', habitId: 'h_2', title: 'Read 20 Pages of Non-Fiction', category: 'Productivity', color: '#3b82f6', completedAt: todayStr },
  { id: 'ch_6', habitId: 'h_2', title: 'Read 20 Pages of Non-Fiction', category: 'Productivity', color: '#3b82f6', completedAt: yesterdayStr },
  { id: 'ch_7', habitId: 'h_3', title: '30 Min Workout / Cardio', category: 'Fitness', color: '#10b981', completedAt: todayStr },
  { id: 'ch_old_1', habitId: 'h_old_1', title: 'Deep Sleep 8 Hours', category: 'Health', color: '#06b6d4', completedAt: yesterdayStr },
  { id: 'ch_old_2', habitId: 'h_old_2', title: 'Cold Shower', category: 'Health', color: '#ec4899', completedAt: dayMinus2Str }
];

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem('ht_habits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeHabit);
      }
    } catch (err) {
      localStorage.removeItem('ht_habits');
    }
    return INITIAL_HABITS.map(normalizeHabit);
  });

  const [completedHistory, setCompletedHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('ht_completed_history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      localStorage.removeItem('ht_completed_history');
    }
    return INITIAL_HISTORY;
  });

  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync to Backend Database API
  const syncWithBackendApi = async (habitsData) => {
    try {
      await fetch(`${API_BASE_URL}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitsData)
      });
    } catch (err) {
      // Backend offline fallback handled silently
    }
  };

  // Fetch initial habits from backend database on load
  useEffect(() => {
    const fetchBackendHabits = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/habits`);
        if (res.ok) {
          const dbHabits = await res.json();
          if (Array.isArray(dbHabits) && dbHabits.length > 0) {
            const normalized = dbHabits.map(normalizeHabit);
            setHabits(normalized);
          }
        }
      } catch (err) {
        // Backend offline fallback
      }
    };
    fetchBackendHabits();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ht_habits', JSON.stringify(habits));
    } catch (err) {}
    syncWithBackendApi(habits);
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem('ht_completed_history', JSON.stringify(completedHistory));
    } catch (err) {}
  }, [completedHistory]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const addHabit = (habitData) => {
    const newHabit = normalizeHabit({
      id: 'h_' + Date.now(),
      title: habitData.title,
      description: habitData.description || '',
      category: habitData.category || 'General',
      color: habitData.color || '#8b5cf6',
      priority: habitData.priority || 'Medium',
      createdAt: new Date().toISOString().slice(0, 10),
      completions: []
    });

    setHabits(prev => [newHabit, ...prev]);
    addNotification(`Habit "${newHabit.title}" created!`, 'success');
  };

  const editHabit = (id, updatedData) => {
    setHabits(prev =>
      prev.map(h => (h.id === id ? normalizeHabit({ ...h, ...updatedData }) : h))
    );
    addNotification('Habit updated.', 'info');
  };

  const deleteHabit = (id) => {
    const habitToDelete = habits.find(h => h.id === id);
    const today = new Date().toISOString().slice(0, 10);

    setHabits(prev => prev.filter(h => h.id !== id));

    setCompletedHistory(prev =>
      prev.filter(item => !(item.habitId === id && item.completedAt === today))
    );

    addNotification(`Habit "${habitToDelete?.title || ''}" deleted. History preserved!`, 'info');
  };

  const toggleHabitCompletion = (id, dateStr = new Date().toISOString().slice(0, 10)) => {
    const targetHabit = habits.find(h => h.id === id);
    if (!targetHabit) return;

    const existsInHabit = targetHabit.completions.includes(dateStr);

    setHabits(prev =>
      prev.map(h => {
        if (h.id !== id) return h;
        const newCompletions = existsInHabit
          ? h.completions.filter(d => d !== dateStr)
          : [...h.completions, dateStr];

        return { ...h, completions: newCompletions };
      })
    );

    if (!existsInHabit) {
      const newHistoryItem = {
        id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        habitId: id,
        title: targetHabit.title,
        category: targetHabit.category,
        color: targetHabit.color,
        completedAt: dateStr
      };
      setCompletedHistory(prev => [...prev, newHistoryItem]);
      addNotification(`Completed "${targetHabit.title}"! 🔥`, 'success');
    } else {
      setCompletedHistory(prev =>
        prev.filter(item => !(item.habitId === id && item.completedAt === dateStr))
      );
      addNotification(`Unchecked "${targetHabit.title}".`, 'info');
    }
  };

  const calculateHabitStreak = (completions = []) => {
    if (!completions || completions.length === 0) return { currentStreak: 0, longestStreak: 0 };
    
    const sorted = [...new Set(completions)].sort((a, b) => new Date(b) - new Date(a));
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (sorted.includes(today) || sorted.includes(yesterday)) {
      let d = sorted.includes(today) ? new Date() : new Date(Date.now() - 86400000);
      while (true) {
        const ds = d.toISOString().slice(0, 10);
        if (sorted.includes(ds)) {
          currentStreak++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const allDates = [...sorted].map(d => new Date(d)).sort((a, b) => a - b);
    if (allDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < allDates.length; i++) {
        const diffDays = Math.round((allDates[i] - allDates[i - 1]) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, longestStreak)
    };
  };

  const safeHabits = habits.map(normalizeHabit);
  const totalHabitsCount = safeHabits.length;
  const completedTodayCount = safeHabits.filter(h => h.completions.includes(todayStr)).length;
  const pendingTodayCount = totalHabitsCount - completedTodayCount;
  const todayProgressPct = totalHabitsCount > 0 ? Math.round((completedTodayCount / totalHabitsCount) * 100) : 0;

  const allHistoryDates = completedHistory.map(h => h.completedAt);
  const globalStreakRes = calculateHabitStreak(allHistoryDates);

  const resetData = () => {
    setHabits([]);
    setCompletedHistory([]);
    try {
      localStorage.removeItem('ht_habits');
      localStorage.removeItem('ht_completed_history');
    } catch (err) {}
    addNotification('All habit and history data reset.', 'danger');
  };

  const exportJSON = () => {
    const exportObject = {
      habits: safeHabits,
      completedHistory
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `habits_backup_${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addNotification('Habit data exported!', 'success');
  };

  const importJSON = (importedData) => {
    if (Array.isArray(importedData)) {
      setHabits(importedData.map(normalizeHabit));
      addNotification('Habits imported.', 'success');
    } else if (importedData && Array.isArray(importedData.habits)) {
      setHabits(importedData.habits.map(normalizeHabit));
      if (Array.isArray(importedData.completedHistory)) {
        setCompletedHistory(importedData.completedHistory);
      }
      addNotification('Habits & history imported successfully!', 'success');
    } else {
      addNotification('Invalid JSON file format.', 'danger');
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habits: safeHabits,
        completedHistory,
        searchQuery,
        setSearchQuery,
        toasts,
        addHabit,
        editHabit,
        deleteHabit,
        toggleHabitCompletion,
        calculateHabitStreak,
        stats: {
          totalHabitsCount,
          completedTodayCount,
          pendingTodayCount,
          todayProgressPct,
          totalCompletedAllTime: completedHistory.length,
          globalCurrentStreak: globalStreakRes.currentStreak,
          globalLongestStreak: globalStreakRes.longestStreak
        },
        resetData,
        exportJSON,
        importJSON,
        addNotification
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => useContext(HabitContext);
