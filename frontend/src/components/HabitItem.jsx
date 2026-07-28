function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function HabitItem({ habit, onToggle, onDelete }) {
  const today = getTodayString();
  const isCompletedToday = habit.completions.includes(today);

  return (
    <li className="habit-item">
      <div className="habit-content">
        <input
          type="checkbox"
          className="habit-checkbox"
          checked={isCompletedToday}
          onChange={() => onToggle(habit.id)}
          aria-label={`Mark "${habit.name}" as ${isCompletedToday ? 'incomplete' : 'complete'}`}
        />
        <div>
          <span className={`habit-text${isCompletedToday ? ' completed' : ''}`}>
            {habit.name}
          </span>
          <div className="habit-stats">
            <span className={`streak${habit.currentStreak > 0 ? ' hot' : ''}`}>
              🔥 {habit.currentStreak}
            </span>
            <span className="streak">
              ⭐ Best: {habit.bestStreak}
            </span>
          </div>
        </div>
      </div>

      <button
        className="delete-btn"
        onClick={() => onDelete(habit.id)}
        aria-label={`Delete habit "${habit.name}"`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </li>
  );
}
