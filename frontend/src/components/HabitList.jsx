import HabitItem from './HabitItem.jsx';

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function applyFilter(habits, filter) {
  const today = getTodayString();
  if (filter === 'pending') {
    return habits.filter((h) => !h.completions.includes(today));
  }
  if (filter === 'completed') {
    return habits.filter((h) => h.completions.includes(today));
  }
  return habits; // 'all'
}

export default function HabitList({ habits, filter, onToggle, onDelete }) {
  // No habits at all — prompt to add first habit
  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
        <h2>Start Building Habits</h2>
        <p>Add your first habit above to begin your journey.</p>
      </div>
    );
  }

  const visible = applyFilter(habits, filter);

  // Habits exist but none match the current filter
  if (visible.length === 0) {
    const messages = {
      pending: 'No pending habits — great work today! 🎉',
      completed: 'No habits completed yet today. Keep going!',
    };
    return (
      <div className="empty-state">
        <p>{messages[filter] ?? 'No habits match this filter.'}</p>
      </div>
    );
  }

  return (
    <ul className="habit-list" aria-label="Habit list">
      {visible.map((habit) => (
        <HabitItem
          key={habit.id}
          habit={habit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
