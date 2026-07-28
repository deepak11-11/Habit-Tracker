import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ht_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return { ...parsed, avatar: parsed.avatar || DEFAULT_AVATAR };
    }
    return {
      id: 'u_demo',
      name: 'Habit Master',
      email: 'alex@example.com',
      avatar: DEFAULT_AVATAR,
      joinedDate: '2026-01-15'
    };
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ht_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ht_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = (email, password, rememberMe) => {
    const users = JSON.parse(localStorage.getItem('ht_registered_users') || '[]');
    let foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      foundUser = {
        id: 'u_demo',
        name: email.split('@')[0] || 'User',
        email,
        avatar: DEFAULT_AVATAR,
        joinedDate: new Date().toISOString().slice(0, 10)
      };
    }

    setUser(foundUser);
    localStorage.setItem('ht_user', JSON.stringify(foundUser));
    return { success: true };
  };

  const signup = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('ht_registered_users') || '[]');
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser = {
      id: 'u_' + Date.now(),
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      joinedDate: new Date().toISOString().slice(0, 10)
    };

    users.push({ ...newUser, password });
    localStorage.setItem('ht_registered_users', JSON.stringify(users));

    setUser(newUser);
    localStorage.setItem('ht_user', JSON.stringify(newUser));
    return { success: true };
  };

  const updateProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('ht_user', JSON.stringify(updatedUser));
  };

  const updateAvatar = (newAvatarUrl) => {
    const updatedUser = { ...user, avatar: newAvatarUrl };
    setUser(updatedUser);
    localStorage.setItem('ht_user', JSON.stringify(updatedUser));
  };

  const removeAvatar = () => {
    const updatedUser = { ...user, avatar: DEFAULT_AVATAR };
    setUser(updatedUser);
    localStorage.setItem('ht_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ht_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        theme,
        toggleTheme,
        login,
        signup,
        updateProfile,
        updateAvatar,
        removeAvatar,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
