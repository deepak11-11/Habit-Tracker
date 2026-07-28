import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useHabits } from '../context/HabitContext';

const CATEGORIES = ['Health', 'Fitness', 'Productivity', 'Mindfulness', 'Learning', 'General'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#06b6d4', '#ec4899', '#f59e0b', '#ef4444'];

export const AddHabitModal = ({ isOpen, onClose, habitToEdit = null }) => {
  const { addHabit, editHabit } = useHabits();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Health');
  const [color, setColor] = useState('#8b5cf6');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title || '');
      setDescription(habitToEdit.description || '');
      setCategory(habitToEdit.category || 'Health');
      setColor(habitToEdit.color || '#8b5cf6');
      setPriority(habitToEdit.priority || 'Medium');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Health');
      setColor('#8b5cf6');
      setPriority('Medium');
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (habitToEdit) {
      editHabit(habitToEdit.id, { title, description, category, color, priority });
    } else {
      addHabit({ title, description, category, color, priority });
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fadeIn">
        <div className="modal-header">
          <div className="modal-title-container">
            <Sparkles size={20} color="var(--accent-purple)" />
            <h3>{habitToEdit ? 'Edit Habit' : 'Create New Habit'}</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Habit Title *</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="e.g., Drink 3L Water, Morning Run"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea 
              className="form-textarea"
              rows={3}
              placeholder="Add details or notes about your daily goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Category</label>
              <select 
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Priority</label>
              <select 
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Card Accent Color</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {habitToEdit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-title-container {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .modal-title-container h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .close-btn:hover {
          color: var(--text-primary);
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .flex-1 {
          flex: 1;
        }

        .color-picker {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform var(--transition-bounce);
        }

        .color-swatch:hover {
          transform: scale(1.15);
        }

        .color-swatch.selected {
          border-color: #ffffff;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
          transform: scale(1.15);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  );
};
