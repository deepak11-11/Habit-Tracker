import React from 'react';
import { Flame, Check, Edit2, Trash2, RotateCcw, Tag, Flag } from 'lucide-react';
import { useHabits } from '../context/HabitContext';

export const HabitCard = ({ habit, onEdit }) => {
  const { toggleHabitCompletion, deleteHabit, calculateHabitStreak } = useHabits();
  const todayStr = new Date().toISOString().slice(0, 10);
  const isCompletedToday = habit.completions.includes(todayStr);

  const { currentStreak, longestStreak } = calculateHabitStreak(habit.completions);

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'badge-red';
      case 'medium': return 'badge-yellow';
      case 'low': return 'badge-green';
      default: return 'badge-blue';
    }
  };

  return (
    <div 
      className={`habit-card glass-panel ${isCompletedToday ? 'completed' : ''}`}
      style={{ borderLeft: `4px solid ${habit.color || '#8b5cf6'}` }}
    >
      <div className="habit-card-body">
        <div className="habit-header">
          <div className="habit-title-area">
            <div className="habit-tags">
              <span className="badge badge-purple">
                <Tag size={11} /> {habit.category}
              </span>
              <span className={`badge ${getPriorityBadgeClass(habit.priority)}`}>
                <Flag size={11} /> {habit.priority}
              </span>
            </div>
            <h3 className={`habit-title ${isCompletedToday ? 'line-through' : ''}`}>
              {habit.title}
            </h3>
            {habit.description && (
              <p className="habit-description">{habit.description}</p>
            )}
          </div>

          {/* Completion Checkbox */}
          <button 
            className={`habit-check-btn ${isCompletedToday ? 'checked' : ''}`}
            onClick={() => toggleHabitCompletion(habit.id)}
            title={isCompletedToday ? 'Undo completion' : 'Mark as completed'}
          >
            <Check size={20} className="check-icon" />
          </button>
        </div>

        <div className="habit-footer">
          <div className="streak-container">
            <div className={`streak-badge ${currentStreak > 0 ? 'active-streak' : ''}`}>
              <Flame size={16} className="flame-icon" />
              <span>{currentStreak} Day Streak</span>
            </div>
            <span className="longest-streak-text">Best: {longestStreak}d</span>
          </div>

          <div className="habit-actions">
            {isCompletedToday && (
              <button 
                className="action-btn"
                onClick={() => toggleHabitCompletion(habit.id)}
                title="Undo completion"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <button 
              className="action-btn"
              onClick={() => onEdit(habit)}
              title="Edit Habit"
            >
              <Edit2 size={15} />
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={() => deleteHabit(habit.id)}
              title="Delete Habit"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .habit-card {
          padding: 1.25rem;
          transition: all var(--transition-normal);
          position: relative;
        }

        .habit-card.completed {
          background: rgba(16, 185, 129, 0.04);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .habit-card-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .habit-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .habit-title-area {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .habit-tags {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .habit-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          transition: color var(--transition-fast);
        }

        .habit-title.line-through {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .habit-description {
          font-size: 0.83rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .habit-check-btn {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          border: 2px solid var(--border-color);
          background: var(--bg-input);
          color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-bounce);
        }

        .habit-check-btn:hover {
          border-color: var(--accent-purple);
          transform: scale(1.05);
        }

        .habit-check-btn.checked {
          background: var(--gradient-success);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
        }

        .habit-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color);
        }

        .streak-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .streak-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .streak-badge.active-streak {
          color: var(--accent-yellow);
        }

        .flame-icon {
          filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.4));
        }

        .longest-streak-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .habit-actions {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-btn:hover {
          background: var(--bg-input);
          color: var(--text-primary);
        }

        .action-btn.delete-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: var(--accent-red);
        }
      `}</style>
    </div>
  );
};
