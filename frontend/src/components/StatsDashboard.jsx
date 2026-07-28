import { computeStats } from '../utils/stats.js';

export default function StatsDashboard({ habits }) {
  const { dailyPct, monthly, yearly } = computeStats(habits);

  return (
    <div className="progress-dashboard">
      <div className="progress-card daily">
        <h3>Daily Goal</h3>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${dailyPct}%` }}
            role="progressbar"
            aria-valuenow={dailyPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span className="daily-progress-text">{dailyPct}% Completed</span>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">This Month</span>
          <div className="stat-value">{monthly}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">This Year</span>
          <div className="stat-value">{yearly}</div>
        </div>
      </div>
    </div>
  );
}
