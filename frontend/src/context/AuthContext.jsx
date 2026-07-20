import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const res = await api.get('/api/auth/profile');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to sync profile:', err);
        }
      } else {
        try {
          const res = await api.post('/api/auth/refresh');
          localStorage.setItem('token', res.data.token);
          const profileRes = await api.get('/api/auth/profile');
          setUser(profileRes.data);
          localStorage.setItem('user', JSON.stringify(profileRes.data));
        } catch (err) {
          console.log('No active session found.');
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    const userProfile = {
      _id: res.data._id,
      name: res.data.name,
      email: res.data.email,
      role: res.data.role,
      tenantId: res.data.tenantId
    };
    localStorage.setItem('user', JSON.stringify(userProfile));
    setUser(userProfile);
    return userProfile;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Failed to logout on server:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
