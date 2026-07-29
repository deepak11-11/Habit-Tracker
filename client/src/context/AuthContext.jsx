import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const decodedJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(decodedJson);
    if (decoded && decoded.exp) {
      return decoded.exp * 1000 < Date.now();
    }
  } catch (e) {}
  return false;
};

const apiFetch = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`/api${endpoint}`, options);
    return res;
  } catch (err1) {
    try {
      const res = await fetch(`http://localhost:5001/api${endpoint}`, options);
      return res;
    } catch (err2) {
      throw err2;
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('ht_theme') || 'dark';
    } catch (err) {
      return 'dark';
    }
  });

  // Verify authentication state on startup against backend /api/auth/me
  useEffect(() => {
    const restoreSession = async () => {
      let savedUser = null;
      let savedToken = null;

      try {
        savedUser = localStorage.getItem('ht_user');
        savedToken = localStorage.getItem('ht_token');

        if (!savedToken) {
          savedUser = sessionStorage.getItem('ht_user');
          savedToken = sessionStorage.getItem('ht_token');
        }

        if (savedToken) {
          const res = await apiFetch('/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.user) {
              setUser(data.user);
              setToken(savedToken);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        // Backend offline fallback handled below
      }

      try {
        if (savedUser && savedToken && !isTokenExpired(savedToken)) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } else {
          localStorage.removeItem('ht_user');
          localStorage.removeItem('ht_token');
          sessionStorage.removeItem('ht_user');
          sessionStorage.removeItem('ht_token');
          setUser(null);
          setToken(null);
        }
      } catch (e) {
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('ht_theme', theme);
    } catch (err) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = async (email, password, rememberMe = true) => {
    let res = null;
    let data = null;
    let isServerOk = false;

    try {
      res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      data = await res.json();
      isServerOk = true;
    } catch (err) {
      isServerOk = false;
    }

    if (isServerOk && res) {
      if (!res.ok) {
        return { success: false, message: data?.error || 'Invalid email or password.' };
      }

      const { user: foundUser, token: authToken } = data;

      setUser(foundUser);
      setToken(authToken);

      try {
        let users = JSON.parse(localStorage.getItem('ht_registered_users') || '[]');
        if (!users.some(u => u.email.toLowerCase() === foundUser.email.toLowerCase())) {
          users.push({ ...foundUser, password });
          localStorage.setItem('ht_registered_users', JSON.stringify(users));
        }
      } catch (e) {}

      try {
        if (rememberMe) {
          localStorage.setItem('ht_user', JSON.stringify(foundUser));
          localStorage.setItem('ht_token', authToken);
          sessionStorage.removeItem('ht_user');
          sessionStorage.removeItem('ht_token');
        } else {
          sessionStorage.setItem('ht_user', JSON.stringify(foundUser));
          sessionStorage.setItem('ht_token', authToken);
          localStorage.removeItem('ht_user');
          localStorage.removeItem('ht_token');
        }
      } catch (err) {}

      return { success: true };
    }

    // Resilient fallback if server is unreachable
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem('ht_registered_users') || '[]');
    } catch (err) {}

    const foundUser = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      return { success: false, message: 'Invalid email or password. Account not found.' };
    }

    if (foundUser.password && foundUser.password !== password) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const authToken = 'token_' + foundUser.id;
    const userProfile = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      avatar: foundUser.avatar || DEFAULT_AVATAR,
      joinedDate: foundUser.joinedDate || new Date().toISOString().slice(0, 10)
    };

    setUser(userProfile);
    setToken(authToken);

    try {
      if (rememberMe) {
        localStorage.setItem('ht_user', JSON.stringify(userProfile));
        localStorage.setItem('ht_token', authToken);
      } else {
        sessionStorage.setItem('ht_user', JSON.stringify(userProfile));
        sessionStorage.setItem('ht_token', authToken);
      }
    } catch (err) {}

    return { success: true };
  };

  const signup = async (name, email, password) => {
    let res = null;
    let data = null;
    let isServerOk = false;

    try {
      res = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      data = await res.json();
      isServerOk = true;
    } catch (err) {
      isServerOk = false;
    }

    if (isServerOk && res) {
      if (!res.ok) {
        return { success: false, message: data?.error || 'An account with this email already exists.' };
      }

      const { user: newUser, token: authToken } = data;

      try {
        let users = JSON.parse(localStorage.getItem('ht_registered_users') || '[]');
        if (!users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
          users.push({ ...newUser, password });
          localStorage.setItem('ht_registered_users', JSON.stringify(users));
        }
        localStorage.setItem('ht_user', JSON.stringify(newUser));
        localStorage.setItem('ht_token', authToken);
      } catch (err) {}

      setUser(newUser);
      setToken(authToken);
      return { success: true };
    }

    // Resilient fallback if server is unreachable
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem('ht_registered_users') || '[]');
    } catch (err) {}

    if (users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
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
    const authToken = 'token_' + newUser.id;

    try {
      localStorage.setItem('ht_registered_users', JSON.stringify(users));
      localStorage.setItem('ht_user', JSON.stringify(newUser));
      localStorage.setItem('ht_token', authToken);
    } catch (err) {}

    setUser(newUser);
    setToken(authToken);
    return { success: true };
  };

  const updateProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    try {
      if (localStorage.getItem('ht_user')) {
        localStorage.setItem('ht_user', JSON.stringify(updatedUser));
      } else if (sessionStorage.getItem('ht_user')) {
        sessionStorage.setItem('ht_user', JSON.stringify(updatedUser));
      }
    } catch (err) {}
  };

  const updateAvatar = (newAvatarUrl) => {
    const updatedUser = { ...user, avatar: newAvatarUrl };
    setUser(updatedUser);
    try {
      if (localStorage.getItem('ht_user')) {
        localStorage.setItem('ht_user', JSON.stringify(updatedUser));
      } else if (sessionStorage.getItem('ht_user')) {
        sessionStorage.setItem('ht_user', JSON.stringify(updatedUser));
      }
    } catch (err) {}
  };

  const removeAvatar = () => {
    const updatedUser = { ...user, avatar: DEFAULT_AVATAR };
    setUser(updatedUser);
    try {
      if (localStorage.getItem('ht_user')) {
        localStorage.setItem('ht_user', JSON.stringify(updatedUser));
      } else if (sessionStorage.getItem('ht_user')) {
        sessionStorage.setItem('ht_user', JSON.stringify(updatedUser));
      }
    } catch (err) {}
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('ht_user');
      localStorage.removeItem('ht_token');
      sessionStorage.removeItem('ht_user');
      sessionStorage.removeItem('ht_token');
    } catch (err) {}
    try {
      window.history.replaceState(null, '', '/login');
    } catch (err) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
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
