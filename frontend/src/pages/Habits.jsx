import React, { useState } from 'react';
import { Plus, Filter, CheckSquare } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { HabitCard } from '../components/HabitCard';
import { AddHabitModal } from '../components/AddHabitModal';

export const Habits = () => {
  const { habits, searchQuery } = useHabits();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);

  const categories = ['All', 'Health', 'Fitness', 'Productivity', 'Mindfulness', 'Learning', 'General'];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  const filtered = habits.filter(h => {
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || h.category === selectedCategory;
    const matchesPrio = selectedPriority === 'All' || h.priority === selectedPriority;
    return matchesSearch && matchesCat && matchesPrio;
  });

  const handleEdit = (habit) => {
    setHabitToEdit(habit);
    setIsAddModalOpen(true);
  };

  const handleAdd = () => {
    setHabitToEdit(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">My Habits Manager</h1>
          <p className="page-subtitle">Manage, edit, filter, and track all your active habits</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={18} />
          <span>Add New Habit</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel filter-toolbar">
        <div className="filter-group">
          <Filter size={16} color="var(--text-muted)" />
          <span className="filter-label">Category:</span>
          <div className="filter-pills">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Priority:</span>
          <div className="filter-pills">
            {priorities.map(prio => (
              <button
                key={prio}
                className={`filter-pill ${selectedPriority === prio ? 'active' : ''}`}
                onClick={() => setSelectedPriority(prio)}
              >
                {prio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Habits Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel empty-state">
          <CheckSquare size={48} color="var(--text-muted)" />
          <h3>No matching habits</h3>
          <p>Try adjusting your category or priority filter.</p>
        </div>
      ) : (
        <div className="habits-grid">
          {filtered.map(habit => (
            <HabitCard key={habit.id} habit={habit} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <AddHabitModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        habitToEdit={habitToEdit}
      />

      <style>{`
        .filter-toolbar {
          padding: 1.25rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .filter-pills {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .filter-pill {
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-pill:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .filter-pill.active {
          background: var(--gradient-primary);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 2px 10px var(--accent-purple-glow);
        }

        .habits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }
      `}</style>
    </div>
  );
};
