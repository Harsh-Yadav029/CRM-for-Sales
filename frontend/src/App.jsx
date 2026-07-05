import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import LinkedInCallback from './pages/LinkedInCallback';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import Deals from './pages/Deals';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import { Loader2 } from 'lucide-react';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const titles = {
    '/': 'Sales Dashboard',
    '/leads': 'Lead Management',
    '/deals': 'Deal Pipeline',
    '/tasks': 'Task Manager',
    '/settings': 'System Settings',
    '/reports': 'Reports & Analytics'
  };
  let title = titles[location.pathname] || 'Dashboard';
  if (location.pathname.startsWith('/leads/')) title = 'Lead Profile';

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen pb-20 md:pb-0">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-outline-variant shadow-md">
        <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-1 transition-all ${isActive ? 'bg-secondary-container text-on-secondary-container rounded-full scale-95 font-semibold' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="font-label-md text-xs">Dashboard</span>
        </NavLink>
        <NavLink to="/leads" className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-1 transition-all ${isActive ? 'bg-secondary-container text-on-secondary-container rounded-full scale-95 font-semibold' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">group</span>
          <span className="font-label-md text-xs">Leads</span>
        </NavLink>
        <NavLink to="/deals" className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-1 transition-all ${isActive ? 'bg-secondary-container text-on-secondary-container rounded-full scale-95 font-semibold' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">handshake</span>
          <span className="font-label-md text-xs">Deals</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-1 transition-all ${isActive ? 'bg-secondary-container text-on-secondary-container rounded-full scale-95 font-semibold' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">bar_chart</span>
          <span className="font-label-md text-xs">Reports</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-1 transition-all ${isActive ? 'bg-secondary-container text-on-secondary-container rounded-full scale-95 font-semibold' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-md text-xs">Settings</span>
        </NavLink>
      </nav>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/login/callback" element={<LinkedInCallback />} />
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/leads" element={<ProtectedLayout><Leads /></ProtectedLayout>} />
          <Route path="/leads/:id" element={<ProtectedLayout><LeadDetails /></ProtectedLayout>} />
          <Route path="/deals" element={<ProtectedLayout><Deals /></ProtectedLayout>} />
          <Route path="/tasks" element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
          <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
