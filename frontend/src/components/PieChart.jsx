import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useHabits } from '../context/HabitContext';

export const CategoryPieChart = () => {
  const { completedHistory } = useHabits();

  // Aggregate category counts from completedHistory ledger
  const categoryCounts = {};
  completedHistory.forEach(h => {
    const cat = h.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#06b6d4', '#ec4899', '#f59e0b'];

  const data = Object.keys(categoryCounts).map((cat, idx) => ({
    name: cat,
    value: categoryCounts[cat],
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="chart-card glass-panel">
      <div className="chart-header">
        <div>
          <h3>Category History Distribution</h3>
          <p className="chart-subtitle">Breakdown of historical completions by category</p>
        </div>
      </div>

      <div className="chart-container">
        {data.length === 0 ? (
          <div className="empty-chart">No completed history available</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1200}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-modal)', 
                  borderColor: 'var(--border-color)', 
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
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

        .empty-chart {
          height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};
