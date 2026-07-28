import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Award, 
  User, 
  Settings as SettingsIcon, 
  LogOut,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const { stats } = useHabits();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Habits', icon: CheckSquare, path: '/habits', badge: stats.totalHabitsCount },
    { label: 'Calendar', icon: CalendarIcon, path: '/calendar' },
    { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'Settings', icon: SettingsIcon, path: '/settings' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for Mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 49
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div className="brand-text">
              <span className="brand-title gradient-text">HabitPulse</span>
              <span className="brand-subtitle">PRO DASHBOARD</span>
            </div>
          </div>
          {isOpen && (
            <button className="mobile-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-nav">
          <div className="nav-group-label">MAIN MENU</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={19} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="sidebar-footer">
          <div className="user-profile-mini">
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
              alt={user?.name || "User Avatar"} 
              className="user-avatar-mini"
            />
            <div className="user-info-mini">
              <div className="user-name-mini">{user?.name || 'Habit Master'}</div>
              <div className="user-email-mini">{user?.email || 'user@example.com'}</div>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          z-index: 50;
          transition: transform var(--transition-normal);
        }

        .sidebar-header {
          padding: 1.5rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px var(--accent-purple-glow);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-weight: 800;
          font-size: 1.2rem;
          line-height: 1.1;
        }

        .brand-subtitle {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }

        .mobile-close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .sidebar-nav {
          padding: 1.25rem 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex: 1;
          overflow-y: auto;
        }

        .nav-group-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          padding: 0.5rem 0.75rem 0.25rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.7rem 0.9rem;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all var(--transition-fast);
        }

        .nav-link:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .nav-link.active {
          background: var(--gradient-primary);
          color: #ffffff;
          box-shadow: 0 4px 15px var(--accent-purple-glow);
        }

        .nav-badge {
          margin-left: auto;
          background: rgba(255, 255, 255, 0.2);
          color: inherit;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .sidebar-footer {
          padding: 1.25rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-profile-mini {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar-mini {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          object-fit: cover;
          border: 2px solid var(--accent-purple);
        }

        .user-info-mini {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-name-mini {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .user-email-mini {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .btn-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.6rem;
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-red);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-logout:hover {
          background: var(--accent-red);
          color: #ffffff;
        }

        @media (max-width: 900px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: var(--shadow-lg);
          }
          .sidebar-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};
