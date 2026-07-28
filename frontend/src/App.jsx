import React, { useState, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HabitProvider, useHabits } from './context/HabitContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { DashboardPage } from './pages/DashboardPage';
import { Habits } from './pages/Habits';
import { CalendarPage } from './pages/CalendarPage';
import { Analytics } from './pages/Analytics';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { Bell, RefreshCw } from 'lucide-react';
import './index.css';

// Global React Error Boundary to prevent dark blank screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Component Error Caught:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    this.setState({ hasError: false, error: null }, () => {
      window.location.reload();
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0f17',
          color: '#ffffff',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#8b5cf6' }}>HabitPulse Dashboard Recovery</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '480px' }}>
            Click below to clear temporary browser cache and recover application interface.
          </p>
          <button 
            onClick={this.handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={18} />
            <span>Reset & Reload App</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Toast Notifications Container
const NotificationToasts = () => {
  const { toasts } = useHabits();
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className="toast">
          <Bell size={18} color="var(--accent-purple)" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

// Protected Layout Component
const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />
      <div className="main-content">
        <Navbar 
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} 
        />
        <Outlet />
      </div>
      <NotificationToasts />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HabitProvider>
          <Router>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected SaaS App Routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </HabitProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
