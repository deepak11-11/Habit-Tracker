import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem('habitTrackerToken')
  );

  const login = (jwt) => {
    localStorage.setItem('habitTrackerToken', jwt);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem('habitTrackerToken');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
