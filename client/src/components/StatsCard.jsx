import React, { useEffect, useState } from 'react';

export const StatsCard = ({ title, value, unit = '', subtitle, icon: Icon, color = 'purple', trend }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 800; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`stats-card glass-panel glass-panel-interactive border-${color}`}>
      <div className="stats-card-header">
        <div className="stats-info">
          <span className="stats-title">{title}</span>
          <div className="stats-value-container">
            <span className="stats-value">{displayValue}{unit}</span>
            {trend && (
              <span className={`trend-badge ${trend.isPositive ? 'trend-up' : 'trend-down'}`}>
                {trend.isPositive ? '+' : ''}{trend.text}
              </span>
            )}
          </div>
        </div>

        <div className={`stats-icon-bg bg-${color}`}>
          <Icon size={22} className={`icon-color-${color}`} />
        </div>
      </div>

      {subtitle && <p className="stats-subtitle">{subtitle}</p>}

      <style>{`
        .stats-card {
          padding: 1.35rem;
          position: relative;
          overflow: hidden;
        }

        .stats-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .stats-info {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .stats-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stats-value-container {
          display: flex;
          align-items: baseline;
          gap: 0.65rem;
        }

        .stats-value {
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-primary);
        }

        .trend-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-full);
        }

        .trend-up {
          background: rgba(16, 185, 129, 0.15);
          color: var(--accent-green);
        }

        .trend-down {
          background: rgba(239, 68, 68, 0.15);
          color: var(--accent-red);
        }

        .stats-subtitle {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .stats-icon-bg {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg-purple { background: rgba(139, 92, 246, 0.15); }
        .icon-color-purple { color: var(--accent-purple); }

        .bg-blue { background: rgba(59, 130, 246, 0.15); }
        .icon-color-blue { color: var(--accent-blue); }

        .bg-green { background: rgba(16, 185, 129, 0.15); }
        .icon-color-green { color: var(--accent-green); }

        .bg-cyan { background: rgba(6, 182, 212, 0.15); }
        .icon-color-cyan { color: var(--accent-cyan); }

        .bg-pink { background: rgba(236, 72, 153, 0.15); }
        .icon-color-pink { color: var(--accent-pink); }

        .bg-yellow { background: rgba(245, 158, 11, 0.15); }
        .icon-color-yellow { color: var(--accent-yellow); }
      `}</style>
    </div>
  );
};
