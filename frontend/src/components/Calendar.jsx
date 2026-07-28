import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useHabits } from '../context/HabitContext';

export const CalendarComponent = () => {
  const { habits } = useHabits();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayIndex = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const todayStr = new Date().toISOString().slice(0, 10);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build calendar matrix
  const daysArray = [];
  for (let i = 0; i < startingDayIndex; i++) {
    daysArray.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    
    // Check habits completed on this date
    const completedForDay = habits.filter(h => h.completions.includes(dateStr));
    const completionRate = habits.length > 0 ? completedForDay.length / habits.length : 0;

    daysArray.push({
      dayNumber: day,
      dateStr,
      isToday: dateStr === todayStr,
      completedHabits: completedForDay,
      completionRate
    });
  }

  return (
    <div className="calendar-wrapper glass-panel">
      <div className="calendar-header">
        <div className="month-display">
          <h2>{monthName} <span className="year-text">{year}</span></h2>
        </div>
        <div className="calendar-controls">
          <button className="btn-icon btn-secondary" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn-icon btn-secondary" onClick={() => setCurrentDate(new Date())}>
            Today
          </button>
          <button className="btn-icon btn-secondary" onClick={nextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="calendar-weekday-header">{d}</div>
        ))}

        {daysArray.map((item, index) => {
          if (!item) {
            return <div key={`empty-${index}`} className="calendar-day empty" />;
          }

          let dayStatusClass = 'status-gray'; // Default incomplete
          if (item.isToday) {
            dayStatusClass = 'status-purple';
          } else if (item.completedHabits.length > 0) {
            dayStatusClass = 'status-blue';
          }

          return (
            <div
              key={item.dateStr}
              className={`calendar-day ${dayStatusClass}`}
              onClick={() => setSelectedDay(item)}
            >
              <span className="day-number">{item.dayNumber}</span>
              {item.completedHabits.length > 0 && (
                <div className="day-dots">
                  {item.completedHabits.slice(0, 3).map(h => (
                    <span key={h.id} className="dot" style={{ backgroundColor: h.color || '#3b82f6' }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Details Modal */}
      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Habits for {selectedDay.dateStr}</h3>
              <button className="close-btn" onClick={() => setSelectedDay(null)}>✕</button>
            </div>
            <div className="day-details-list">
              {habits.length === 0 ? (
                <p className="text-muted">No habits defined yet.</p>
              ) : (
                habits.map(h => {
                  const isDone = selectedDay.completedHabits.some(ch => ch.id === h.id);
                  return (
                    <div key={h.id} className="day-habit-item">
                      {isDone ? (
                        <CheckCircle2 size={18} color="var(--accent-green)" />
                      ) : (
                        <Circle size={18} color="var(--text-muted)" />
                      )}
                      <span className={isDone ? 'done-text' : ''}>{h.title}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .calendar-wrapper {
          padding: 1.5rem;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .month-display h2 {
          font-size: 1.35rem;
          font-weight: 800;
        }

        .year-text {
          color: var(--accent-purple);
        }

        .calendar-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }

        .calendar-weekday-header {
          text-align: center;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          padding: 0.5rem 0;
          text-transform: uppercase;
        }

        .calendar-day {
          min-height: 80px;
          border-radius: var(--radius-md);
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          padding: 0.65rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: all var(--transition-bounce);
        }

        .calendar-day:hover {
          transform: scale(1.04);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-purple);
        }

        .calendar-day.empty {
          background: transparent;
          border: none;
          cursor: default;
        }

        .day-number {
          font-size: 0.9rem;
          font-weight: 700;
        }

        /* Color Coding Rules */
        .status-purple {
          border: 2px solid var(--accent-purple);
          background: rgba(139, 92, 246, 0.12);
        }
        .status-purple .day-number {
          color: var(--accent-purple);
        }

        .status-blue {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .status-blue .day-number {
          color: var(--accent-blue);
        }

        .status-gray {
          background: var(--bg-input);
          color: var(--text-secondary);
        }

        .day-dots {
          display: flex;
          gap: 0.25rem;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .day-details-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .day-habit-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.92rem;
          padding: 0.5rem;
          background: var(--bg-input);
          border-radius: var(--radius-sm);
        }

        .done-text {
          text-decoration: line-through;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
