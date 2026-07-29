import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Lock, LogOut, Check, Loader2, KeyRound } from 'lucide-react';
import api from '../utils/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Profile = () => {
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
      
      const existingUser = JSON.parse(localStorage.getItem('user')) || {};
      const updated = { ...existingUser, name: data.name, email: data.email };
      localStorage.setItem('user', JSON.stringify(updated));

      setSuccessMsg('Profile details updated successfully!');
      setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/landing';
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      {/* Header */}
      <div className="border-b border-line/60 pb-5">
        <h2 className="text-2xl font-poppins font-bold text-ink uppercase tracking-tight">MY PROFILE</h2>
      </div>

      {/* Main Profile Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar & Overview */}
        <div className="md:col-span-4 space-y-4">
          <Card variant="raised" className="p-6 bg-white text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-gold/10 blur-2xl rounded-full pointer-events-none"></div>
            
            <div className="w-20 h-20 mx-auto rounded-full border-3 border-gold bg-gold text-[#5b3e00] flex items-center justify-center font-black text-2xl shadow-md">
              {activeUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div>
              <h3 className="font-display font-extrabold text-lg text-ink">{activeUser?.name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{activeUser?.email}</p>
            </div>

            <div className="pt-3 border-t border-line flex justify-center">
              <span className="px-3 py-1 rounded-full bg-gold-soft text-gold font-mono text-[10px] font-extrabold uppercase tracking-wider border border-gold/20 flex items-center gap-1.5">
                <Shield size={12} />
                {activeUser?.role || 'Executive'}
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column: Profile Details */}
        <div className="md:col-span-8 space-y-6">
          <Card variant="raised" className="p-6 bg-white space-y-6">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-3 border-b border-line">
              Account Parameters
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value={activeUser.name || ''}
                    className="w-full rounded-btn border border-line bg-[#FAF9F6] pl-10 pr-4 py-2.5 text-xs text-ink font-bold focus:outline-none cursor-default"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    readOnly
                    value={activeUser.email || ''}
                    className="w-full rounded-btn border border-line bg-[#FAF9F6] pl-10 pr-4 py-2.5 text-xs text-ink font-bold focus:outline-none cursor-default"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1.5">User Privilege</label>
                <div className="relative">
                  <Shield size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value={(activeUser.role || 'Executive').toUpperCase()}
                    className="w-full rounded-btn border border-line bg-[#FAF9F6] pl-10 pr-4 py-2.5 text-xs text-ink font-bold focus:outline-none cursor-default"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
