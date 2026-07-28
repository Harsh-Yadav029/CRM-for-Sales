import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Lock, LogOut, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const activeUser = user || JSON.parse(localStorage.getItem('user')) || {};

  const [form, setForm] = useState({
    name: activeUser.name || '',
    email: activeUser.email || '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (activeUser) {
      setForm({
        name: activeUser.name || '',
        email: activeUser.email || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (form.password && form.password !== form.confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email
      };
      if (form.password) {
        payload.password = form.password;
      }

      const { data } = await api.put('/api/auth/profile', payload);
      
      // Update local storage
      const existingUser = JSON.parse(localStorage.getItem('user')) || {};
      const updated = { ...existingUser, name: data.name, email: data.email };
      localStorage.setItem('user', JSON.stringify(updated));

      setSuccessMsg('Profile updated successfully!');
      setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    window.location.href = '/landing';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-lg rounded-2xl border border-[#e7e2d8] bg-white p-6 md:p-8 shadow-2xl text-left relative overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#e3a62f]/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full border-2 border-[#e3a62f] bg-[#e3a62f] text-[#5b3e00] flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              {activeUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1d1c16]">{activeUser?.name || 'User Profile'}</h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="px-2 py-0.5 rounded bg-[#f8f3e9] text-[#7e5700] font-mono text-[9px] font-extrabold uppercase tracking-wider border border-[#e7e2d8]">
                  {activeUser?.role || 'Executive'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{activeUser?.email}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-[#f8f3e9]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-bold flex items-center space-x-2">
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-bold">
            {errorMsg}
          </div>
        )}

        {/* Profile Update Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-[#e7e2d8] bg-[#f8f3e9]/40 pl-9 pr-4 py-2.5 text-xs text-[#1d1c16] font-bold focus:border-[#e3a62f] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-[#e7e2d8] bg-[#f8f3e9]/40 pl-9 pr-4 py-2.5 text-xs text-[#1d1c16] font-bold focus:border-[#e3a62f] focus:outline-none transition-all"
              />
            </div>
          </div>



        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
