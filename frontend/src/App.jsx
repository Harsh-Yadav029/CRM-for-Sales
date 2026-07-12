import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LinkedInCallback from './pages/LinkedInCallback';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import Deals from './pages/Deals';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Accounts from './pages/Accounts';
import Contacts from './pages/Contacts';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import Invoices from './pages/Invoices';
import DeveloperPortal from './pages/DeveloperPortal';
import Billing from './pages/Billing';
import BillingCallback from './pages/BillingCallback';
import { Loader2 } from 'lucide-react';
import BottomNav from './components/BottomNav';
import RealtimeNotificationToast from './components/RealtimeNotificationToast';

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
    '/reports': 'Reports & Analytics',
    '/accounts': 'Accounts & Companies',
    '/contacts': 'Contacts Directory',
    '/products': 'Product Catalog',
    '/quotes': 'Quotes & Proposals',
    '/invoices': 'Invoice Ledger',
    '/developer-portal': 'Developer Portal',
    '/billing': 'Subscription Billing'
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

      {/* Realtime push alert system */}
      <RealtimeNotificationToast />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login/callback" element={<LinkedInCallback />} />
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/leads" element={<ProtectedLayout><Leads /></ProtectedLayout>} />
          <Route path="/leads/:id" element={<ProtectedLayout><LeadDetails /></ProtectedLayout>} />
          <Route path="/deals" element={<ProtectedLayout><Deals /></ProtectedLayout>} />
          <Route path="/tasks" element={<ProtectedLayout><Tasks /></ProtectedLayout>} />
          <Route path="/accounts" element={<ProtectedLayout><Accounts /></ProtectedLayout>} />
          <Route path="/contacts" element={<ProtectedLayout><Contacts /></ProtectedLayout>} />
          <Route path="/products" element={<ProtectedLayout><Products /></ProtectedLayout>} />
          <Route path="/quotes" element={<ProtectedLayout><Quotes /></ProtectedLayout>} />
          <Route path="/invoices" element={<ProtectedLayout><Invoices /></ProtectedLayout>} />
          <Route path="/developer-portal" element={<ProtectedLayout><DeveloperPortal /></ProtectedLayout>} />
          <Route path="/billing" element={<ProtectedLayout><Billing /></ProtectedLayout>} />
          <Route path="/billing/callback" element={<BillingCallback />} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
          <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
