import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('vlms_user');
        const storedToken = localStorage.getItem('vlms_token');

        if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          const parsed = JSON.parse(storedUser);
          if (parsed && typeof parsed === 'object') {
            setUser(parsed);
          } else {
            localStorage.removeItem('vlms_token');
            localStorage.removeItem('vlms_user');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Session restore error:', e);
        localStorage.removeItem('vlms_token');
        localStorage.removeItem('vlms_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (userId, password, role, department, permissions) => {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, email: userId, password, role, department, permissions }),
    });

    localStorage.setItem('vlms_token', data.token);
    localStorage.setItem('vlms_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (name, email, password, role, department = 'Lab 12', mobileNumber = '') => {
    const data = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, userId: email, password, role, department, mobileNumber }),
    });

    try {
      const savedStaff = localStorage.getItem('vlms_staff_list');
      let currentStaffList = savedStaff ? JSON.parse(savedStaff) : [];
      if (!Array.isArray(currentStaffList)) currentStaffList = [];
      const newStaffObj = {
        id: data.id || data._id || 'usr-' + Date.now(),
        _id: data._id || data.id,
        name: data.name || name,
        email: data.email || email,
        userId: data.userId || email,
        password: password,
        mobileNumber: data.mobileNumber || mobileNumber,
        role: data.role || role,
        department: data.department || department,
        status: data.status || 'Active',
        permissions: ['View Reports', 'Schedule Labs']
      };
      if (!currentStaffList.some(s => (s.email && s.email.toLowerCase() === email.toLowerCase()) || (s.userId && s.userId.toLowerCase() === email.toLowerCase()))) {
        currentStaffList.unshift(newStaffObj);
        localStorage.setItem('vlms_staff_list', JSON.stringify(currentStaffList));
      }
    } catch (e) {}

    localStorage.setItem('vlms_token', data.token);
    localStorage.setItem('vlms_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('vlms_token');
    localStorage.removeItem('vlms_user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
