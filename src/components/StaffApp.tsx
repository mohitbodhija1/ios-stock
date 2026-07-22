import React, { useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChefHat,
  Home,
  IndianRupee,
  LogOut,
  ReceiptText,
  RefreshCw,
  UserRound,
  Utensils,
  Building,
  Bell
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useSnapshot } from '../hooks/useSnapshot';
import { Dashboard } from './Dashboard';
import { Setup } from './Setup';
import { MenuManagement } from './MenuManagement';
import { Waiter } from './Waiter';
import { Kitchen } from './Kitchen';
import { Billing } from './Billing';
import { OrdersHistory } from './OrdersHistory';
import { Reports } from './Reports';

export function StaffApp({
  snapshot,
  userEmail,
  setUserEmail,
  setShowAuthModal
}: {
  snapshot: ReturnType<typeof useSnapshot>;
  userEmail: string | null;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
      setUserEmail(null);
      snapshot.refresh();
      navigate('/');
    } else {
      navigate('/');
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await snapshot.refresh();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <Link to="/" className="topbar-home-link" title="Brand Landing Page">
            <Utensils size={20} color="var(--purple)" />
          </Link>
        </div>

        <div className="brand-title" style={{ textAlign: 'center' }}>
          <strong>{snapshot.organization.name || 'My Restaurant'}</strong>
        </div>
        <div className="topbar-right">
          {isSupabaseConfigured && userEmail ? (
            <button
              className="topbar-signout-btn"
              onClick={handleSignOut}
              title={`Logged in as ${userEmail}. Click to Sign Out`}
              aria-label="Sign Out"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button
              className="topbar-signout-btn"
              onClick={() => setShowAuthModal(true)}
              title="Sign In / Setup"
              aria-label="Sign In"
            >
              <Building size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="screen">
        <Routes>
          <Route path="/" element={<Dashboard snapshot={snapshot} />} />
          <Route path="/setup" element={<Setup snapshot={snapshot} />} />
          <Route path="/menu" element={<MenuManagement snapshot={snapshot} />} />
          <Route path="/waiter" element={<Waiter snapshot={snapshot} />} />
          <Route path="/kitchen" element={<Kitchen snapshot={snapshot} />} />
          <Route path="/billing" element={<Billing snapshot={snapshot} />} />
          <Route path="/orders" element={<OrdersHistory snapshot={snapshot} />} />
          <Route path="/reports" element={<Reports snapshot={snapshot} />} />
        </Routes>
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        <NavItem to="/app" icon={<Home size={18} />} label="Home" />
        <NavItem to="/app/menu" icon={<BookOpen size={18} />} label="Menu" />
        <NavItem to="/app/waiter" icon={<UserRound size={18} />} label="Waiter" />
        <NavItem to="/app/kitchen" icon={<ChefHat size={18} />} label="Kitchen" />
        <NavItem to="/app/billing" icon={<IndianRupee size={18} />} label="Pay" />
        <NavItem to="/app/orders" icon={<ReceiptText size={18} />} label="Orders" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: JSX.Element; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
