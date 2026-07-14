import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import {
  Home,
  BarChart3,
  Users,
  UserCircle,
  Building2,
  Briefcase,
  TrendingUp,
  FileText,
  Megaphone,
  CheckSquare,
  CalendarDays,
  Phone,
  Mail,
  Share2,
  CreditCard,
  Code2,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  MoreHorizontal,
  FolderClosed,
  Layers,
  LogOut
} from 'lucide-react';

/* ───────────────────────────────────────────────
   Collapsible group sub-items configuration
   ─────────────────────────────────────────────── */
const SALES_ITEMS = [
  { label: 'Leads',      to: '/leads',     icon: Users },
  { label: 'Contacts',   to: '/contacts',  icon: UserCircle },
  { label: 'Accounts',   to: '/accounts',  icon: Building2 },
  { label: 'Deals',      to: '/deals',     icon: Briefcase },
  { label: 'Forecasts',  to: '/reports',   icon: TrendingUp },
  { label: 'Documents',  to: '/quotes',    icon: FileText },
  { label: 'Campaigns',  to: '/products',  icon: Megaphone },
];

const ACTIVITIES_ITEMS = [
  { label: 'Tasks',    to: '/activities?type=task',    icon: CheckSquare },
  { label: 'Meetings', to: '/activities?type=meeting', icon: CalendarDays },
  { label: 'Calls',    to: '/activities?type=call',    icon: Phone },
];

const INTEGRATIONS_ITEMS = [
  { label: 'SalesInbox', to: '/settings', icon: Mail },
  { label: 'Social',     to: '/settings', icon: Share2 },
];

/* ───────────────────────────────────────────────
   Sidebar Component
   ─────────────────────────────────────────────── */
const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Collapsible group state
  const [expandedGroups, setExpandedGroups] = useState({
    sales: true,
    activities: false,
    integrations: false,
  });

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  /* ── Active-route style helpers (reusing existing treatment) ── */
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const linkBase =
    'flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 relative select-none';
  const linkActive = 'bg-white/10 text-white font-bold';
  const linkIdle = 'text-white/45 hover:text-white/90 hover:bg-white/5';
  const activeBarClass =
    'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4 before:bg-gold before:rounded-r-full';

  const initials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  /* ────────────────── COLLAPSED (icon-only) MODE ────────────────── */
  if (collapsed) {
    return (
      <aside className="bg-ink fixed inset-y-0 left-0 flex flex-col z-20 w-[68px] border-r border-white/5 shadow-md transition-all duration-300">
        {/* Brand mark */}
        <div className="h-16 flex items-center justify-center border-b border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center shadow-md">
            <img src="/1.png" alt="WTP" className="w-full h-full object-cover rounded-lg" />
          </div>
        </div>

        {/* Icon-only nav */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-4 overflow-y-auto custom-scroll">
          {/* Primary nav */}
          <NavLink to="/" end title="Home"
            className={({ isActive: a }) =>
              `p-2.5 rounded-lg transition-all ${a ? 'bg-gold/15 text-gold' : 'text-white/40 hover:text-white hover:bg-white/5'}`
            }
          >
            <Home size={18} />
          </NavLink>
          <NavLink to="/reports" title="Reports"
            className={({ isActive: a }) =>
              `p-2.5 rounded-lg transition-all ${a ? 'bg-teal-500/15 text-teal-400' : 'text-white/40 hover:text-white hover:bg-white/5'}`
            }
          >
            <BarChart3 size={18} />
          </NavLink>

          <div className="w-8 border-t border-white/8 my-2" />

          {/* Folder icons for groups */}
          <button onClick={() => { setCollapsed(false); setExpandedGroups(p => ({ ...p, sales: true })); }} title="Sales"
            className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <FolderClosed size={18} />
          </button>
          <button onClick={() => { setCollapsed(false); setExpandedGroups(p => ({ ...p, activities: true })); }} title="Activities"
            className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <CheckSquare size={18} />
          </button>
          <button onClick={() => { setCollapsed(false); setExpandedGroups(p => ({ ...p, integrations: true })); }} title="Integrations"
            className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <Share2 size={18} />
          </button>
        </nav>

        {/* Expand toggle at bottom */}
        <div className="p-3 border-t border-white/5 flex justify-center shrink-0">
          <button onClick={() => setCollapsed(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Expand sidebar">
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
    );
  }

  /* ────────────────── EXPANDED MODE ────────────────── */
  return (
    <aside className="bg-ink fixed inset-y-0 left-0 flex flex-col z-20 w-60 border-r border-white/5 shadow-md transition-all duration-300">

      {/* ── 1. Workspace Switcher ── */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-gold flex items-center justify-center shadow shrink-0">
            <img src="/1.png" alt="WTP" className="w-full h-full object-cover rounded-md" />
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[11px] font-bold text-white truncate">Walk The Plan</span>
            <ChevronDown size={12} className="text-white/40 shrink-0" />
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded text-white/30 hover:text-white hover:bg-white/5 transition-all hidden md:block"
          title="Collapse sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto custom-scroll">

        {/* ── 2. Primary Nav (2 items only) ── */}
        <div className="px-3 pt-3 pb-1 space-y-0.5">
          <NavLink to="/" end
            className={({ isActive: a }) =>
              `${linkBase} ${a ? linkActive + ' ' + activeBarClass : linkIdle}`
            }
          >
            <span className="w-6 h-6 rounded-md bg-gold/15 flex items-center justify-center shrink-0">
              <Home size={14} className="text-gold" />
            </span>
            <span>Home</span>
          </NavLink>

          <NavLink to="/reports"
            className={({ isActive: a }) =>
              `${linkBase} ${a ? linkActive + ' ' + activeBarClass : linkIdle}`
            }
          >
            <span className="w-6 h-6 rounded-md bg-teal-500/15 flex items-center justify-center shrink-0">
              <BarChart3 size={14} className="text-teal-400" />
            </span>
            <span>Reports</span>
          </NavLink>
        </div>

        {/* ── 3. Divider ── */}
        <div className="mx-4 my-2 border-t border-white/8" />

        {/* ── 4. Team / Org Switcher ── */}
        <div className="px-3 mb-2">
          <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer group">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-gold text-ink flex items-center justify-center text-[10px] font-bold shrink-0 font-display">
                {initials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white truncate leading-tight">{user?.name?.split(' ')[0] || 'Team'}'s Org</p>
              </div>
              <ChevronDown size={11} className="text-white/30 shrink-0" />
            </div>
            <button className="p-1 rounded text-white/20 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* ── 5. Search Bar (wired to existing GlobalSearch) ── */}
        <div className="px-3 mb-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 text-white/40 hover:text-white/60 transition-all text-left"
          >
            <Search size={14} className="shrink-0" />
            <span className="text-[11px] font-medium">Search…</span>
            <span className="ml-auto text-[9px] font-mono text-white/20 border border-white/10 rounded px-1 py-0.5">⌘K</span>
          </button>
        </div>

        {/* ── 6. Highlighted Smart View — Workqueue ── */}
        <div className="px-3 mb-3">
          <NavLink to="/activities?type=task"
            className={() => {
              const currentFull = location.pathname + location.search;
              const isWorkqueueActive = currentFull === '/activities?type=task' || location.pathname === '/tasks';
              return `flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-[11px] font-bold ${
                isWorkqueueActive
                  ? 'bg-gold/15 text-gold border border-gold/20'
                  : 'bg-gold/8 text-gold/80 border border-gold/10 hover:bg-gold/12 hover:text-gold'
              }`;
            }}
          >
            <Layers size={14} className="shrink-0" />
            <span>Workqueue</span>
          </NavLink>
        </div>

        {/* ── 7. Collapsible Groups ── */}
        <div className="px-3 space-y-1">

          {/* ─── Sales Group ─── */}
          <CollapsibleGroup
            label="Sales"
            expanded={expandedGroups.sales}
            onToggle={() => toggleGroup('sales')}
            items={SALES_ITEMS}
            location={location}
            linkBase={linkBase}
            linkActive={linkActive}
            linkIdle={linkIdle}
            activeBarClass={activeBarClass}
          />

          {/* ─── Activities Group ─── */}
          <CollapsibleGroup
            label="Activities"
            expanded={expandedGroups.activities}
            onToggle={() => toggleGroup('activities')}
            items={ACTIVITIES_ITEMS}
            location={location}
            linkBase={linkBase}
            linkActive={linkActive}
            linkIdle={linkIdle}
            activeBarClass={activeBarClass}
          />

          {/* ─── Integrations Group ─── */}
          <CollapsibleGroup
            label="Integrations"
            expanded={expandedGroups.integrations}
            onToggle={() => toggleGroup('integrations')}
            items={INTEGRATIONS_ITEMS}
            location={location}
            linkBase={linkBase}
            linkActive={linkActive}
            linkIdle={linkIdle}
            activeBarClass={activeBarClass}
          />
        </div>
      </div>

      {/* ── 8. Bottom-pinned Utility Section ── */}
      <div className="border-t border-white/5 px-3 py-3 shrink-0 space-y-0.5">
        <button
          onClick={logout}
          className={`${linkBase} text-red-400/60 hover:text-red-400 hover:bg-red-500/5 w-full`}
        >
          <LogOut size={14} className="shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* GlobalSearch overlay — wired to the existing component */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </aside>
  );
};

/* ───────────────────────────────────────────────
   Reusable Collapsible Group Sub-component
   ─────────────────────────────────────────────── */
const CollapsibleGroup = ({
  label,
  expanded,
  onToggle,
  items,
  location,
  linkBase,
  linkActive,
  linkIdle,
  activeBarClass,
}) => {
  return (
    <div>
      {/* Group header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/5 transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <FolderClosed size={14} className="text-gold/50 shrink-0" />
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="p-0.5 rounded text-white/20 hover:text-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
            title={`Add to ${label}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Plus size={13} />
          </span>
          <ChevronRight
            size={13}
            className={`text-white/30 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {/* Sub-items */}
      {expanded && (
        <div className="ml-3 pl-3 border-l border-white/8 space-y-0.5 mt-0.5 mb-1">
          {items.map(({ label: itemLabel, to, icon: Icon }) => {
            const currentFull = location.pathname + location.search;
            const active = to.includes('?') 
              ? currentFull === to 
              : location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));
            return (
              <NavLink
                key={itemLabel}
                to={to}
                className={`${linkBase} py-1.5 ${active ? linkActive + ' ' + activeBarClass : linkIdle}`}
              >
                <Icon size={14} className="shrink-0 text-white/30" />
                <span>{itemLabel}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
export { Sidebar };
