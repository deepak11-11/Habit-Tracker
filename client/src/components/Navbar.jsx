import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  User, 
  Settings as SettingsIcon, 
  LogOut, 
  Edit3,
  ChevronDown 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';

export const Navbar = ({ onOpenMobileSidebar }) => {
  const { user, theme, toggleTheme, logout } = useAuth();
  const { searchQuery, setSearchQuery, toasts } = useHabits();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const navigate = useNavigate();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="mobile-menu-btn" onClick={onOpenMobileSidebar}>
          <Menu size={22} />
        </button>

        <div className="search-bar-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search habits by name, category, or priority..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="navbar-right">
        {/* Today's Date Badge */}
        <div className="date-badge">
          <CalendarIcon size={15} color="var(--accent-purple)" />
          <span>{formattedDate}</span>
        </div>

        {/* Theme Toggle */}
        <button 
          className="icon-btn" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun size={20} color="#f59e0b" />
          ) : (
            <Moon size={20} color="#8b5cf6" />
          )}
        </button>

        {/* Notifications */}
        <div className="notification-dropdown-container" ref={notifMenuRef}>
          <button 
            className="icon-btn notification-btn" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            title="Notifications"
          >
            <Bell size={20} />
            {toasts.length > 0 && <span className="notification-dot" />}
          </button>

          {showNotifications && (
            <div className="notifications-popover glass-panel animate-fadeIn">
              <div className="notifications-header">
                <h4>Recent Notifications</h4>
                <span className="badge badge-purple">{toasts.length} New</span>
              </div>
              <div className="notifications-list">
                {toasts.length === 0 ? (
                  <div className="empty-notifications">
                    <CheckCircle2 size={24} color="var(--text-muted)" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  toasts.map(toast => (
                    <div key={toast.id} className="notification-item">
                      <div className="notification-indicator" />
                      <span>{toast.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown Popover */}
        <div className="profile-dropdown-container" ref={profileMenuRef}>
          <button 
            className="navbar-user-btn" 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            title="Account Profile Menu"
          >
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
              alt={user?.name || "Profile Avatar"} 
              className="navbar-avatar"
            />
            <div className="user-text-nav">
              <span className="user-name-nav">{user?.name || 'Habit Master'}</span>
            </div>
            <ChevronDown size={14} className={`dropdown-arrow ${showProfileMenu ? 'open' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="profile-popover glass-panel animate-fadeIn">
              <div className="profile-popover-header">
                <img 
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                  alt={user?.name}
                  className="popover-avatar"
                />
                <div className="popover-user-info">
                  <span className="popover-name">{user?.name}</span>
                  <span className="popover-email">{user?.email}</span>
                </div>
              </div>

              <div className="popover-menu-list">
                <button 
                  className="popover-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile');
                  }}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>

                <button 
                  className="popover-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile?edit=true');
                  }}
                >
                  <Edit3 size={16} />
                  <span>Edit Profile</span>
                </button>

                <button 
                  className="popover-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                >
                  <SettingsIcon size={16} />
                  <span>Settings</span>
                </button>

                <div className="popover-divider" />

                <button className="popover-menu-item logout-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          height: 70px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(10px);
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          max-width: 500px;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.25rem;
        }

        .search-bar-container {
          position: relative;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 0.55rem 1rem 0.55rem 2.4rem;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          color: var(--text-primary);
          font-size: 0.88rem;
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent-purple);
          box-shadow: 0 0 0 3px var(--accent-purple-glow);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .date-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .icon-btn:hover {
          background: var(--bg-card-hover);
          transform: translateY(-1px);
        }

        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 9px;
          height: 9px;
          background: var(--accent-pink);
          border-radius: 50%;
          border: 2px solid var(--bg-secondary);
        }

        .notification-dropdown-container, .profile-dropdown-container {
          position: relative;
        }

        .notifications-popover {
          position: absolute;
          right: 0;
          top: 50px;
          width: 320px;
          background: var(--bg-modal);
          border-radius: var(--radius-md);
          padding: 1rem;
          box-shadow: var(--shadow-lg);
          z-index: 100;
        }

        .notifications-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .notifications-header h4 {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 250px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.82rem;
          color: var(--text-secondary);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          background: var(--bg-input);
        }

        .notification-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-purple);
          flex-shrink: 0;
        }

        .empty-notifications {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* Profile Dropdown Styling */
        .navbar-user-btn {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.25rem 0.5rem 0.25rem 0.25rem;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .navbar-user-btn:hover {
          border-color: var(--accent-purple);
          box-shadow: 0 0 12px var(--accent-purple-glow);
        }

        .navbar-avatar {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-full);
          object-fit: cover;
          border: 2px solid var(--accent-purple);
        }

        .user-text-nav {
          display: flex;
          flex-direction: column;
        }

        .user-name-nav {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .dropdown-arrow {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .profile-popover {
          position: absolute;
          right: 0;
          top: 50px;
          width: 240px;
          background: var(--bg-modal);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          box-shadow: var(--shadow-lg);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .profile-popover-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: var(--bg-input);
          border-radius: var(--radius-sm);
        }

        .popover-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          object-fit: cover;
          border: 2px solid var(--accent-purple);
        }

        .popover-user-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .popover-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .popover-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .popover-menu-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .popover-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
        }

        .popover-menu-item:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .popover-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.25rem 0;
        }

        .logout-item {
          color: var(--accent-red);
        }

        .logout-item:hover {
          background: rgba(239, 68, 68, 0.15);
          color: var(--accent-red);
        }

        @media (max-width: 900px) {
          .mobile-menu-btn {
            display: block;
          }
          .date-badge, .user-text-nav {
            display: none;
          }
          .navbar {
            padding: 0 1rem;
          }
        }
      `}</style>
    </header>
  );
};
