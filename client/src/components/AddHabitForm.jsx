import { useState, useRef } from 'react';

export default function AddHabitForm({ onAdd }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError('Please enter a habit name');
      inputRef.current?.focus();
      return;
    }
    setError('');

    await onAdd(trimmed);
    setValue('');
    inputRef.current?.focus();
  }

  return (
    <div className="add-habit-container">
      <form onSubmit={handleSubmit} noValidate>
        <div className="add-habit-row">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="What habit do you want to build?"
            aria-label="New habit name"
            aria-describedby={error ? 'add-habit-error' : undefined}
            aria-invalid={!!error}
          />
          <button type="submit" className="primary-btn">
            Add Habit
          </button>
        </div>
        {error && (
          <span id="add-habit-error" className="field-error" role="alert">
            {error}
          </span>
        )}
      </form>
    </div>
  );
}
