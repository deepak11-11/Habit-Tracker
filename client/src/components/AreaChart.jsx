import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useHabits } from '../context/HabitContext';

export const MonthlyAreaChart = () => {
  const { completedHistory } = useHabits();

  // IMMUTABLE HISTORY: Source monthly trend from completedHistory ledger
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();

  const data = Array.from({ length: 6 }).map((_, i) => {
    const idx = (currentMonthIdx - 5 + i + 12) % 12;
    const monthName = months[idx];

    let totalCompletions = 0;
    completedHistory.forEach(item => {
      const dateObj = new Date(item.completedAt);
      if (dateObj.getMonth() === idx) {
        totalCompletions++;
      }
    });

    return {
      month: monthName,
      trend: totalCompletions
    };
  });

  return (
    <div className="chart-card glass-panel">
      <div className="chart-header">
        <div>
          <h3>Monthly Habit Trend</h3>
          <p className="chart-subtitle">Long-term activity & historical completion area map</p>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-modal)', 
                borderColor: 'var(--accent-purple)', 
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              formatter={(value) => [value, 'Completed History']}
            />
            <Area 
              type="monotone" 
              dataKey="trend" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#purpleGradient)" 
              animationDuration={1200}
            />
          </AreaChart>
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
