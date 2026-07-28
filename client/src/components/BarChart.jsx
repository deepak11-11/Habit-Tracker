import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useHabits } from '../context/HabitContext';

export const WeeklyBarChart = () => {
  const { completedHistory } = useHabits();

  // IMMUTABLE HISTORY: Count completions from completedHistory ledger
  const data = Array.from({ length: 4 }).map((_, i) => {
    const weekLabel = `Week ${4 - i}`;
    let completedCount = 0;

    completedHistory.forEach(item => {
      const date = new Date(item.completedAt);
      const daysDiff = Math.floor((new Date() - date) / (1000 * 3600 * 24));
      if (daysDiff >= i * 7 && daysDiff < (i + 1) * 7) {
        completedCount++;
      }
    });

    return {
      week: weekLabel,
      completions: completedCount
    };
  }).reverse();

  return (
    <div className="chart-card glass-panel">
      <div className="chart-header">
        <div>
          <h3>Weekly Completion Overview</h3>
          <p className="chart-subtitle">Total completed history count per week</p>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-modal)', 
                borderColor: 'var(--accent-blue)', 
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              formatter={(value) => [value, 'Total Completions']}
            />
            <Bar 
              dataKey="completions" 
              fill="#3b82f6" 
              radius={[6, 6, 0, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        .chart-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .chart-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .chart-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .chart-container {
          width: 100%;
        }
      `}</style>
    </div>
  );
};
