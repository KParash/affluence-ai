import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [influencer, setInfluencer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('affluence_token');
    const savedUser = localStorage.getItem('affluence_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        api.me().then(data => {
          setUser(data.user);
          setInfluencer(data.influencer);
        }).catch(() => {
          logout();
        }).finally(() => setLoading(false));
      } catch {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('affluence_token', data.token);
    localStorage.setItem('affluence_user', JSON.stringify(data.user));
    setUser(data.user);
    setInfluencer(data.influencer);
    return data;
  };

  const register = async (email, password, name, role) => {
    const data = await api.register({ email, password, name, role });
    localStorage.setItem('affluence_token', data.token);
    localStorage.setItem('affluence_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('affluence_token');
    localStorage.removeItem('affluence_user');
    setUser(null);
    setInfluencer(null);
  };

  return (
    <AuthContext.Provider value={{ user, influencer, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
