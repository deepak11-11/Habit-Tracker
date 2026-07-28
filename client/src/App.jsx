import React, { useState } from 'react';
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
import { Bell } from 'lucide-react';
import './index.css';

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
  );
}
