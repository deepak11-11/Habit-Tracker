import React, { useState } from 'react';
import { 
  CheckSquare, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  Clock,
  Sparkles
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { StatsCard } from '../components/StatsCard';
import { HabitCard } from '../components/HabitCard';
import { AddHabitModal } from '../components/AddHabitModal';
import { DailyLineChart } from '../components/LineChart';
import { WeeklyBarChart } from '../components/BarChart';

export const DashboardPage = () => {
  const { habits, searchQuery, stats } = useHabits();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);

  // Filtered habits based on search input
  const filteredHabits = habits.filter(h => 
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.priority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEdit = (habit) => {
    setHabitToEdit(habit);
    setIsAddModalOpen(true);
  };

  const handleOpenAdd = () => {
    setHabitToEdit(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Track today's routines, streaks, and progress stats</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>New Habit</span>
        </button>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid-stats">
        <StatsCard 
          title="Today's Progress"
          value={stats.todayProgressPct}
          unit="%"
          subtitle={`${stats.completedTodayCount} of ${stats.totalHabitsCount} completed`}
          icon={CheckCircle2}
          color="purple"
          trend={{ isPositive: true, text: 'Active' }}
        />
        <StatsCard 
          title="Current Streak"
          value={stats.globalCurrentStreak}
          unit=" Days"
          subtitle="Keep the momentum going"
          icon={Flame}
          color="yellow"
          trend={{ isPositive: true, text: 'Streak' }}
        />
        <StatsCard 
          title="Longest Streak"
          value={stats.globalLongestStreak}
          unit=" Days"
          subtitle="All-time highest streak record"
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard 
          title="Pending Habits"
          value={stats.pendingTodayCount}
          subtitle={`${stats.totalHabitsCount} total habits registered`}
          icon={Clock}
          color="pink"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid-charts">
        <DailyLineChart />
        <WeeklyBarChart />
      </div>

      {/* Today's Habits Section */}
      <div className="section-header">
        <div className="section-title-wrapper">
          <Sparkles size={20} color="var(--accent-purple)" />
          <h2>Today's Habits Checklist</h2>
        </div>
      </div>

      {filteredHabits.length === 0 ? (
        <div className="glass-panel empty-state">
          <CheckSquare size={48} color="var(--text-muted)" />
          <h3>You don't have any habits yet</h3>
          <p>You don't have any habits yet. Create your first habit to get started.</p>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Create First Habit</span>
          </button>
        </div>
      ) : (
        <div className="habits-list-grid">
          {filteredHabits.map(habit => (
            <HabitCard key={habit.id} habit={habit} onEdit={handleOpenEdit} />
          ))}
        </div>
      )}

      {/* Modal */}
      <AddHabitModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        habitToEdit={habitToEdit}
      />

      <style>{`
        .page-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .section-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .section-title-wrapper h2 {
          font-size: 1.3rem;
          font-weight: 800;
        }

        .habits-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .empty-state {
          padding: 3.5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1rem;
        }

        .empty-state h3 {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .empty-state p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          max-width: 400px;
        }
      `}</style>
    </div>
  );
};
