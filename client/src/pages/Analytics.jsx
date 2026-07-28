import React from 'react';
import { Award, Flame, CheckCircle, PieChart, TrendingUp, BarChart2 } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { DailyLineChart } from '../components/LineChart';
import { WeeklyBarChart } from '../components/BarChart';
import { MonthlyAreaChart } from '../components/AreaChart';
import { CategoryPieChart } from '../components/PieChart';

export const Analytics = () => {
  const { habits, stats, calculateHabitStreak } = useHabits();

  // Find most & least completed habits
  let mostCompletedHabit = null;
  let leastCompletedHabit = null;
  let maxCompletions = -1;
  let minCompletions = Infinity;

  habits.forEach(h => {
    const count = h.completions.length;
    if (count > maxCompletions) {
      maxCompletions = count;
      mostCompletedHabit = h;
    }
    if (count < minCompletions) {
      minCompletions = count;
      leastCompletedHabit = h;
    }
  });

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Analytics & Insights</h1>
          <p className="page-subtitle">Deep dive statistics, category metrics, and trend charts</p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid-stats">
        <div className="glass-panel highlight-box border-purple">
          <Award size={24} color="var(--accent-purple)" />
          <div>
            <span className="box-label">Most Completed Habit</span>
            <h4>{mostCompletedHabit ? mostCompletedHabit.title : 'N/A'}</h4>
            <p className="box-sub">{maxCompletions > 0 ? `${maxCompletions} total completions` : 'No data yet'}</p>
          </div>
        </div>

        <div className="glass-panel highlight-box border-yellow">
          <Flame size={24} color="var(--accent-yellow)" />
          <div>
            <span className="box-label">Best Active Streak</span>
            <h4>{stats.globalCurrentStreak} Days</h4>
            <p className="box-sub">Highest active streak</p>
          </div>
        </div>

        <div className="glass-panel highlight-box border-green">
          <CheckCircle size={24} color="var(--accent-green)" />
          <div>
            <span className="box-label">Average Completion</span>
            <h4>{stats.todayProgressPct}%</h4>
            <p className="box-sub">Today's target progress</p>
          </div>
        </div>

        <div className="glass-panel highlight-box border-pink">
          <TrendingUp size={24} color="var(--accent-pink)" />
          <div>
            <span className="box-label">Needs Attention</span>
            <h4>{leastCompletedHabit && habits.length > 1 ? leastCompletedHabit.title : 'None'}</h4>
            <p className="box-sub">Lowest completed habit</p>
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid-charts">
        <DailyLineChart />
        <WeeklyBarChart />
        <MonthlyAreaChart />
        <CategoryPieChart />
      </div>

      <style>{`
        .highlight-box {
          padding: 1.35rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .box-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .highlight-box h4 {
          font-size: 1.1rem;
          font-weight: 800;
          margin: 0.15rem 0;
          color: var(--text-primary);
        }

        .box-sub {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .border-purple { border-left: 4px solid var(--accent-purple); }
        .border-yellow { border-left: 4px solid var(--accent-yellow); }
        .border-green { border-left: 4px solid var(--accent-green); }
        .border-pink { border-left: 4px solid var(--accent-pink); }
      `}</style>
    </div>
  );
};
