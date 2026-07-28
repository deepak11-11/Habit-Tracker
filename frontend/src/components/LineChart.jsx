import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useHabits } from '../context/HabitContext';

export const DailyLineChart = () => {
  const { habits, completedHistory } = useHabits();

  // IMMUTABLE HISTORY: Compute graph points using completedHistory ledger
  const data = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    // Total history completion records for this date
    const historyCompleted = completedHistory.filter(h => h.completedAt === dateStr).length;
    const totalHabits = habits.length > 0 ? habits.length : 1;
    const rate = Math.min(100, Math.round((historyCompleted / totalHabits) * 100));

    return {
      day: dayLabel,
      rate,
      completed: historyCompleted
    };
  });

  return (
    <div className="chart-card glass-panel">
      <div className="chart-header">
        <div>
          <h3>Daily Progress Trend</h3>
          <p className="chart-subtitle">Completion rate history over the last 7 days</p>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-modal)', 
                borderColor: 'var(--accent-purple)', 
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              formatter={(value) => [`${value}%`, 'Completion Rate']}
            />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="#8b5cf6" 
              strokeWidth={3} 
              dot={{ fill: '#8b5cf6', r: 5 }} 
              activeDot={{ r: 8, fill: '#3b82f6' }}
              animationDuration={1200}
            />
          </LineChart>
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
