import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const HabitContext = createContext();

const apiFetch = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`/api${endpoint}`, options);
    return res;
  } catch (err1) {
    try {
      const res = await fetch(`http://localhost:5001/api${endpoint}`, options);
      return res;
    } catch (err2) {
      throw err2;
    }
  }
};

const todayStr = new Date().toISOString().slice(0, 10);

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

export const HabitProvider = ({ children }) => {
  const { user, token, logout } = useAuth();
  const [habits, setHabits] = useState([]);
  const [completedHistory, setCompletedHistory] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch initial habits from backend database on user login or switch
  useEffect(() => {
    if (!user || !user.id) {
      setHabits([]);
      setCompletedHistory([]);
      setIsInitialized(false);
      return;
    }

    let isMounted = true;

    const loadUserHabits = async () => {
      setIsInitialized(false);
      const storageKeyHabits = `ht_habits_${user.id}`;
      const storageKeyHistory = `ht_completed_history_${user.id}`;

      try {
        const res = await apiFetch('/habits', {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
            'x-user-id': user.id
          }
        });

        if (res.status === 401) {
          logout();
          return;
        }

        if (res.ok) {
          const dbHabits = await res.json();
          if (Array.isArray(dbHabits)) {
            const normalized = dbHabits.map(normalizeHabit);
            if (isMounted) {
              setHabits(normalized);

              // Reconstruct completedHistory from completions array of habits
              const historyMap = [];
              normalized.forEach(h => {
                if (Array.isArray(h.completions)) {
                  h.completions.forEach((dateStr, idx) => {
                    historyMap.push({
                      id: `ch_${h.id}_${idx}_${dateStr}`,
                      habitId: h.id,
                      title: h.title,
                      category: h.category,
                      color: h.color,
                      completedAt: dateStr
                    });
                  });
                }
              });

              setCompletedHistory(historyMap);
              try {
                localStorage.setItem(storageKeyHabits, JSON.stringify(normalized));
                localStorage.setItem(storageKeyHistory, JSON.stringify(historyMap));
              } catch (e) {}

              setIsInitialized(true);
              return;
            }
          }
        }
      } catch (err) {
        // Backend offline fallback to local cache
      }

      // Local storage fallback if backend unreachable
      try {
        const savedHabits = localStorage.getItem(storageKeyHabits) || sessionStorage.getItem(storageKeyHabits);
        if (savedHabits && isMounted) {
          const parsed = JSON.parse(savedHabits);
          setHabits(Array.isArray(parsed) ? parsed.map(normalizeHabit) : []);
        }

        const savedHistory = localStorage.getItem(storageKeyHistory) || sessionStorage.getItem(storageKeyHistory);
        if (savedHistory && isMounted) {
          const parsed = JSON.parse(savedHistory);
          setCompletedHistory(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {}

      if (isMounted) {
        setIsInitialized(true);
      }
    };

    loadUserHabits();

    return () => {
      isMounted = false;
    };
  }, [user?.id, token]);

  // Sync to Backend Database ONLY AFTER initial load completes
  useEffect(() => {
    if (!isInitialized || !user || !user.id) return;

    const storageKeyHabits = `ht_habits_${user.id}`;
    const storageKeyHistory = `ht_completed_history_${user.id}`;

    try {
      if (localStorage.getItem('ht_user')) {
        localStorage.setItem(storageKeyHabits, JSON.stringify(habits));
        localStorage.setItem(storageKeyHistory, JSON.stringify(completedHistory));
      } else {
        sessionStorage.setItem(storageKeyHabits, JSON.stringify(habits));
        sessionStorage.setItem(storageKeyHistory, JSON.stringify(completedHistory));
      }
    } catch (err) {}

    const syncApi = async () => {
      try {
        const res = await apiFetch('/habits', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || ''}`,
            'x-user-id': user.id
          },
          body: JSON.stringify(habits)
        });
        if (res.status === 401) {
          logout();
        }
      } catch (err) {}
    };

    syncApi();
  }, [habits, completedHistory, isInitialized, user?.id]);

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
