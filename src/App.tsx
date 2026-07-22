import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChefHat,
  Eye,
  EyeOff,
  Home,
  IndianRupee,
  LogOut,
  Minus,
  Plus,
  PlusCircle,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  UserRound,
  Utensils,
  X,
  Loader2,
  Building,
  Phone,
  Calendar
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { restaurantService } from './services/restaurantService';
import { AuthModal } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import type { DiningTable, MenuItem, Order, OrderStatus, PaymentMethod } from './types';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function useSnapshot() {
  const [snapshot, setSnapshot] = useState(restaurantService.getTenantSnapshot());
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const fresh = await restaurantService.fetchTenantSnapshot();
      setSnapshot({ ...fresh });
    } catch (err) {
      console.error('Error refreshing tenant snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const unsubscribe = restaurantService.subscribeToOrders(() => {
      refresh();
    });
    return () => unsubscribe();
  }, []);

  return { ...snapshot, loading, refresh };
}

function App() {
  const snapshot = useSnapshot();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email || null);
      });
    }
  }, []);

  return (
    <>
      {showAuthModal && (
        <AuthModal
          onAuthComplete={() => {
            setShowAuthModal(false);
            if (supabase) {
              supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || null));
            }
            snapshot.refresh();
          }}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onOpenAuth={() => setShowAuthModal(true)}
              userEmail={userEmail}
              orgName={snapshot.organization.name}
            />
          }
        />
        <Route path="/r/:restaurantSlug/table/:tableToken" element={<CustomerOrder />} />
        <Route
          path="/app/*"
          element={
            <StaffApp
              snapshot={snapshot}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              setShowAuthModal={setShowAuthModal}
            />
          }
        />
        <Route
          path="/*"
          element={
            <StaffApp
              snapshot={snapshot}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              setShowAuthModal={setShowAuthModal}
            />
          }
        />
      </Routes>
    </>
  );
}

function StaffApp({
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
      setUserEmail(null);
      snapshot.refresh();
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/" className="topbar-home-link" title="Brand Landing Page">
            <Utensils size={18} />
          </Link>
          <button
            className="refresh-btn-topbar"
            onClick={handleRefresh}
            disabled={isRefreshing || snapshot.loading}
            title="Click to refresh live restaurant data"
          >
            <RefreshCw size={14} className={isRefreshing || snapshot.loading ? 'animate-spin' : ''} />
            <span className="hide-mobile">Refresh</span>
          </button>
        </div>
        <div className="brand-title">
          <strong>{snapshot.organization.name}</strong>
          <span>{snapshot.location.name} ({snapshot.location.city})</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isSupabaseConfigured ? (
            userEmail ? (
              <button
                className="subtle-button compact"
                onClick={handleSignOut}
                title={`Logged in as ${userEmail}. Click to sign out.`}
              >
                <LogOut size={14} />
                <span className="hide-mobile">Sign Out</span>
              </button>
            ) : (
              <button className="primary-action compact" onClick={() => setShowAuthModal(true)}>
                <Building size={14} />
                <span>Sign In / Setup</span>
              </button>
            )
          ) : (
            <button className="ghost-icon" title="Supabase Not Configured">
              <Bell size={18} />
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
        <NavItem to="/app/setup" icon={<Settings size={18} />} label="Setup" />
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

function Dashboard({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [showRevenue, setShowRevenue] = useState(true);
  const activeOrders = snapshot.orders.filter((order) => !['completed', 'cancelled'].includes(order.orderStatus));
  const occupiedTables = snapshot.tables.filter((table) => table.status === 'occupied').length;
  const paidOrders = snapshot.orders.filter((order) => order.paymentStatus === 'paid');
  const revenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <section className="stack dashboard-screen">
      <div className="metric-grid two">
        <Metric label="Active Orders" value={activeOrders.length.toString()} tone="warm" note="In kitchen/dining" />
        <Metric label="Occupied Tables" value={`${occupiedTables}/${snapshot.tables.length}`} tone="violet" note={`${Math.round((occupiedTables / Math.max(1, snapshot.tables.length)) * 100)}% Occupancy`} />
      </div>

      <article className="revenue-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Today's Live Revenue</span>
            <button
              className="eye-toggle-btn"
              onClick={() => setShowRevenue(!showRevenue)}
              title={showRevenue ? 'Hide Revenue' : 'Show Revenue'}
            >
              {showRevenue ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
          <strong>{showRevenue ? currency.format(revenue) : '₹ ••••••'}</strong>
          <small>Total Paid Orders: <b>{paidOrders.length}</b></small>
        </div>
        <div className="sparkline" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </article>

      <div className="section-header">
        <h2>Quick Actions</h2>
      </div>
      <div className="quick-actions-grid">
        <Link className="quick-action-card" to="/app/waiter">
          <div className="action-icon emerald"><PlusCircle size={22} /></div>
          <div>
            <strong>+ New Table Order</strong>
            <span>Create order for dining table</span>
          </div>
        </Link>

        <Link className="quick-action-card" to="/app/kitchen">
          <div className="action-icon amber"><ChefHat size={22} /></div>
          <div>
            <strong>Kitchen Board (KDS)</strong>
            <span>Manage active preparation</span>
          </div>
        </Link>

        <Link className="quick-action-card" to="/app/billing">
          <div className="action-icon purple"><IndianRupee size={22} /></div>
          <div>
            <strong>Collect Payment</strong>
            <span>Process cash, UPI & cards</span>
          </div>
        </Link>

        <Link className="quick-action-card" to="/app/menu">
          <div className="action-icon blue"><BookOpen size={22} /></div>
          <div>
            <strong>Manage Menu</strong>
            <span>Update items & prices</span>
          </div>
        </Link>

        <Link className="quick-action-card" to="/app/setup">
          <div className="action-icon rose"><QrCode size={22} /></div>
          <div>
            <strong>Table QR Codes</strong>
            <span>Configure & print dining QRs</span>
          </div>
        </Link>

        <Link className="quick-action-card" to="/app/reports">
          <div className="action-icon indigo"><BarChart3 size={22} /></div>
          <div>
            <strong>Sales Analytics</strong>
            <span>View reports & performance</span>
          </div>
        </Link>
      </div>
    </section>
  );
}

function Metric({ label, value, tone, note }: { label: string; value: string; tone?: string; note?: string }) {
  return (
    <article className={`metric-card ${tone || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function Setup({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const origin = window.location.origin;
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [selectedAreaId, setSelectedAreaId] = useState(snapshot.diningAreas[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedAreaId && snapshot.diningAreas.length > 0) {
      setSelectedAreaId(snapshot.diningAreas[0].id);
    }
  }, [snapshot.diningAreas]);

  async function handleAddArea(e: React.FormEvent) {
    e.preventDefault();
    if (!areaName.trim()) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createDiningArea(areaName.trim(), snapshot.location.id, snapshot.organization.id);
      setAreaName('');
      setShowAddAreaModal(false);
      snapshot.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add area');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    if (!tableNumber.trim()) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createDiningTable(
        tableNumber.trim(),
        tableName.trim(),
        capacity,
        selectedAreaId || null,
        snapshot.location.id,
        snapshot.organization.id
      );
      setTableNumber('');
      setTableName('');
      setShowAddTableModal(false);
      snapshot.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add table');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="stack setup-screen">
      <div className="page-title">
        <h1>Table & Area Setup</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="subtle-button compact" onClick={() => setShowAddAreaModal(true)}>
            + Add Area
          </button>
          <button className="primary-action compact" onClick={() => setShowAddTableModal(true)}>
            + Add Table
          </button>
        </div>
      </div>

      {showAddAreaModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Add Dining Area</h2>
            <form onSubmit={handleAddArea}>
              <div className="form-group">
                <label>Area Name (e.g. Main Hall, Terrace, VIP)</label>
                <input
                  type="text"
                  placeholder="Area Name"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="subtle-button" onClick={() => setShowAddAreaModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTableModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Add Dining Table</h2>
            <form onSubmit={handleAddTable}>
              <div className="form-group">
                <label>Table Number (e.g. T-01, B-05)</label>
                <input
                  type="text"
                  placeholder="T-01"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Table 1"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dining Area</label>
                <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}>
                  {snapshot.diningAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="subtle-button" onClick={() => setShowAddTableModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="section-header">
        <h2>Table QR Codes ({snapshot.tables.length})</h2>
      </div>

      <div className="qr-grid">
        {snapshot.tables.map((table) => {
          const qrUrl = `${origin}/r/${snapshot.organization.slug}/table/${table.publicToken}`;
          return (
            <article className="qr-card" key={table.id}>
              <div className="qr-box">
                <QRCodeSVG value={qrUrl} size={140} includeMargin />
              </div>
              <div className="qr-info">
                <strong>{table.displayName}</strong>
                <small>{table.capacity} Seats • {snapshot.diningAreas.find((a) => a.id === table.diningAreaId)?.name || 'General'}</small>
                <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="qr-link">
                  Open Customer Order View &rarr;
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MenuManagement({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemTax, setItemTax] = useState('5');
  const [itemCategory, setItemCategory] = useState(snapshot.categories[0]?.id || '');
  const [foodType, setFoodType] = useState<'vegetarian' | 'non_vegetarian' | 'beverage' | 'vegan'>('vegetarian');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = snapshot.menuItems.filter(
    (item) => selectedCategoryId === 'all' || item.categoryId === selectedCategoryId
  );

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createMenuCategory(categoryName.trim(), snapshot.location.id, snapshot.organization.id);
      setCategoryName('');
      setShowAddCategoryModal(false);
      snapshot.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createMenuItem({
        name: itemName.trim(),
        basePrice: Number(itemPrice),
        taxPercentage: Number(itemTax),
        foodType,
        categoryId: itemCategory || snapshot.categories[0]?.id || '',
        locationId: snapshot.location.id,
        orgId: snapshot.organization.id
      });
      setItemName('');
      setItemPrice('');
      setShowAddItemModal(false);
      snapshot.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="stack menu-admin">
      <div className="page-title">
        <h1>Menu Management</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="subtle-button compact" onClick={() => setShowAddCategoryModal(true)}>
            + Category
          </button>
          <button className="primary-action compact" onClick={() => setShowAddItemModal(true)}>
            + Item
          </button>
        </div>
      </div>

      {showAddCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Add Menu Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  placeholder="Starters, Main Course, Drinks..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="subtle-button" onClick={() => setShowAddCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddItemModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Add Menu Item</h2>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  placeholder="Butter Paneer, Cold Coffee..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Base Price (₹)</label>
                <input
                  type="number"
                  placeholder="250"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                  {snapshot.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Food Type</label>
                <select value={foodType} onChange={(e) => setFoodType(e.target.value as any)}>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non_vegetarian">Non-Vegetarian</option>
                  <option value="beverage">Beverage</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="subtle-button" onClick={() => setShowAddItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="customer-tabs">
        <button
          className={selectedCategoryId === 'all' ? 'active' : ''}
          onClick={() => setSelectedCategoryId('all')}
        >
          All ({snapshot.menuItems.length})
        </button>
        {snapshot.categories.map((cat) => (
          <button
            key={cat.id}
            className={selectedCategoryId === cat.id ? 'active' : ''}
            onClick={() => setSelectedCategoryId(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="menu-list">
        {filteredItems.map((item) => (
          <MenuItemCard
            item={item}
            key={item.id}
            action={
              <button
                className={`subtle-button compact ${item.isAvailable ? '' : 'danger-button'}`}
                onClick={async () => {
                  await restaurantService.toggleMenuItemAvailability(item.id, !item.isAvailable);
                  snapshot.refresh();
                }}
              >
                {item.isAvailable ? 'Available' : 'Out of Stock'}
              </button>
            }
          />
        ))}
      </div>
    </section>
  );
}

function MenuItemCard({ item, action }: { item: MenuItem; action?: JSX.Element }) {
  return (
    <article className={`item-card ${!item.isAvailable ? 'unavailable' : ''}`}>
      <div className="item-details">
        <div className="item-type">
          <span className={`dot ${item.foodType}`} />
          <span>{item.foodType.replace('_', ' ')}</span>
        </div>
        <h3>{item.name}</h3>
        {item.description && <p>{item.description}</p>}
        <strong>{currency.format(item.basePrice)}</strong>
      </div>
      {action}
    </article>
  );
}

function CustomerDetailsModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  title = 'Customer Order Details'
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string, birthdate: string) => void;
  isSubmitting: boolean;
  title?: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }
    setError('');
    onSubmit(name.trim(), phone.trim(), birthdate.trim());
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '420px',
          width: '92%',
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)' }}>{title}</h2>
          <button type="button" className="ghost-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text)' }}>
              Customer Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text)' }}>
              Phone Number <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(Optional)</small>
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="e.g. +91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text)' }}>
              Date of Birth <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(Optional)</small>
            </label>
            <input
              type="date"
              className="input-field"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="subtle-button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="primary-action" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Waiter({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [selectedTableId, setSelectedTableId] = useState(snapshot.tables[0]?.id || '');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const selectedTable = snapshot.tables.find((table) => table.id === selectedTableId) || snapshot.tables[0];
  const cartItems = cartEntries(cart, snapshot.menuItems);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.basePrice * entry.quantity, 0);

  function setQty(itemId: string, nextQty: number) {
    setCart((current) => {
      const next = { ...current };
      if (nextQty <= 0) delete next[itemId];
      else next[itemId] = nextQty;
      return next;
    });
  }

  async function handleConfirmOrder(customerName: string, customerPhone: string, customerBirthdate: string) {
    if (!selectedTable) return;
    const items = Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity }));
    if (!items.length) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createOrder(
        selectedTable.publicToken,
        items,
        customerName,
        customerPhone,
        customerBirthdate
      );
      setCart({});
      setShowDetailsModal(false);
      await snapshot.refresh();
      alert('Order sent to kitchen!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="stack waiter-screen">
      <CustomerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSubmit={handleConfirmOrder}
        isSubmitting={isSubmitting}
        title={`Table Order - ${selectedTable?.displayName || 'Guest'}`}
      />

      <div className="page-title">
        <h1>Waiter Table Order</h1>
      </div>
      <div className="table-grid">
        {snapshot.tables.map((table) => (
          <button
            className={`table-card ${table.id === selectedTableId ? 'selected' : ''}`}
            onClick={() => setSelectedTableId(table.id)}
            key={table.id}
          >
            <span className={`status-dot ${table.status}`} />
            <strong>{table.displayName}</strong>
            <small>{table.capacity} Seats</small>
            {table.status === 'occupied' && <em>OCCUPIED</em>}
          </button>
        ))}
      </div>
      <div className="legend-row">
        <span><i className="status-dot available" /> Available</span>
        <span><i className="status-dot occupied" /> Occupied</span>
        <span><i className="status-dot cleaning" /> Cleaning</span>
      </div>

      <article className="order-panel">
        <div className="section-header">
          <h2>{selectedTable?.displayName || 'Select Table'}</h2>
          <button className="danger-button" onClick={() => setCart({})}>
            Clear Cart
          </button>
        </div>
        {snapshot.menuItems.filter((item) => item.isAvailable).slice(0, 6).map((item) => (
          <MenuItemCard
            item={item}
            key={item.id}
            action={
              <QuantityControl
                quantity={cart[item.id] || 0}
                onMinus={() => setQty(item.id, (cart[item.id] || 0) - 1)}
                onPlus={() => setQty(item.id, (cart[item.id] || 0) + 1)}
              />
            }
          />
        ))}
        <div className="bill-totals">
          <span>
            Total Items <b>{cartItems.reduce((sum, entry) => sum + entry.quantity, 0)}</b>
          </span>
          <span>
            Total Amount <b>{currency.format(total)}</b>
          </span>
        </div>
        <button
          className="primary-action wide"
          disabled={!cartItems.length || isSubmitting}
          onClick={() => setShowDetailsModal(true)}
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Send to Kitchen'}
        </button>
      </article>
    </section>
  );
}

function QuantityControl({ quantity, onMinus, onPlus }: { quantity: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="quantity-control">
      <button onClick={onMinus} aria-label="Decrease quantity"><Minus size={14} /></button>
      <strong>{quantity || 0}</strong>
      <button onClick={onPlus} aria-label="Increase quantity"><Plus size={14} /></button>
    </div>
  );
}

function Kitchen({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const kitchenOrders = snapshot.orders.filter((order) =>
    ['placed', 'confirmed', 'preparing', 'ready'].includes(order.orderStatus)
  );

  function nextStatus(order: Order): OrderStatus | null {
    if (order.orderStatus === 'placed') return 'confirmed';
    if (order.orderStatus === 'confirmed') return 'preparing';
    if (order.orderStatus === 'preparing') return 'ready';
    if (order.orderStatus === 'ready') return 'served';
    return null;
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    try {
      await restaurantService.changeOrderStatus(orderId, status);
      snapshot.refresh();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  }

  return (
    <section className="stack kitchen-board">
      <div className="page-title">
        <h1>Kitchen Display System (Realtime)</h1>
      </div>

      {kitchenOrders.length === 0 ? (
        <div className="flex-center" style={{ padding: '40px 0', color: 'var(--muted)', textAlign: 'center' }}>
          <ChefHat size={48} />
          <p style={{ marginTop: '12px' }}>No active kitchen orders at the moment.</p>
        </div>
      ) : (
        <div className="orders-list stack" style={{ gap: '12px' }}>
          {kitchenOrders.map((order) => {
            const table = snapshot.tables.find((item) => item.id === order.tableId);
            const next = nextStatus(order);
            return (
              <article className="order-card" key={order.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                      {table?.displayName || 'Guest Order'}{' '}
                      <small style={{ color: 'var(--muted)', fontWeight: 400 }}>
                        ({order.customerName || 'Guest'})
                      </small>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                      #{order.orderNumber} • <span>{formatTime(order.createdAt)}</span>
                    </p>
                  </div>
                  <span className={`order-status ${order.orderStatus}`}>{statusLabel(order.orderStatus)}</span>
                </div>

                {(order.customerPhone || order.customerBirthdate) && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                    {order.customerPhone && <span><Phone size={12} /> {order.customerPhone}</span>}
                    {order.customerBirthdate && <span><Calendar size={12} /> DOB: {order.customerBirthdate}</span>}
                  </div>
                )}

                <div className="order-lines" style={{ margin: '12px 0', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.88rem' }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                      <span style={{ fontWeight: 600 }}>{item.quantity} x {item.itemNameSnapshot}</span>
                      {item.notes && <small style={{ color: 'var(--muted)' }}>({item.notes})</small>}
                    </div>
                  ))}
                </div>
                {next && (
                  <div className="kitchen-actions" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {order.orderStatus === 'placed' && (
                      <button className="subtle-button compact" onClick={() => handleStatusChange(order.id, 'confirmed')}>
                        Confirm
                      </button>
                    )}
                    <button
                      className={`primary-action compact ${next === 'ready' || order.orderStatus === 'ready' ? 'green' : ''}`}
                      onClick={() => handleStatusChange(order.id, next)}
                    >
                      {next === 'served' ? 'Ready & Served' : statusLabel(next)}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Billing({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const unpaidOrders = snapshot.orders.filter(
    (order) => order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled'
  );
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [selectedOrderId, setSelectedOrderId] = useState(unpaidOrders[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedOrderId && unpaidOrders.length > 0) {
      setSelectedOrderId(unpaidOrders[0].id);
    }
  }, [unpaidOrders]);

  const selectedOrder = unpaidOrders.find((order) => order.id === selectedOrderId) || unpaidOrders[0];
  const selectedTable = selectedOrder ? snapshot.tables.find((item) => item.id === selectedOrder.tableId) : null;

  async function handlePayment() {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      await restaurantService.recordPayment(selectedOrder.id, method);
      snapshot.refresh();
      alert('Payment recorded successfully!');
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="stack billing-screen">
      <div className="page-title">
        <h1>Unpaid Orders</h1>
      </div>
      <div className="bill-list">
        {unpaidOrders.length === 0 ? (
          <p style={{ color: 'var(--muted)', padding: '16px' }}>No pending unpaid orders.</p>
        ) : (
          unpaidOrders.map((order) => {
            const table = snapshot.tables.find((item) => item.id === order.tableId);
            return (
              <button
                className={`bill-row ${order.id === selectedOrder?.id ? 'selected' : ''}`}
                onClick={() => setSelectedOrderId(order.id)}
                key={order.id}
              >
                <span>
                  <b>{table?.displayName || 'Table'}</b>
                  <small>#{order.orderNumber} • {order.customerName || 'Guest'}</small>
                </span>
                <span>
                  <b>{currency.format(order.totalAmount)}</b>
                  <small>Unpaid</small>
                </span>
              </button>
            );
          })
        )}
      </div>

      {selectedOrder && (
        <article className="checkout-card">
          <div className="section-header">
            <h2>{selectedTable?.displayName || 'Bill Summary'}</h2>
            <span>#{selectedOrder.orderNumber}</span>
          </div>
          <div className="bill-totals">
            <span>
              Items Total <b>{currency.format(selectedOrder.subtotal)}</b>
            </span>
            <span>
              Tax <b>{currency.format(selectedOrder.taxAmount)}</b>
            </span>
            <span className="grand">
              Total <b>{currency.format(selectedOrder.totalAmount)}</b>
            </span>
          </div>
          <h3>Payment Method</h3>
          <div className="payment-methods">
            {(['cash', 'card', 'upi'] as PaymentMethod[]).map((item) => (
              <button className={method === item ? 'active' : ''} onClick={() => setMethod(item)} key={item}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="primary-action wide" disabled={isSubmitting} onClick={handlePayment}>
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Record Payment & Complete'}
          </button>
        </article>
      )}
    </section>
  );
}

function Reports({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [showRevenue, setShowRevenue] = useState(true);
  const paidOrders = snapshot.orders.filter((order) => order.paymentStatus === 'paid');
  const revenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const cancelled = snapshot.orders.filter((order) => order.orderStatus === 'cancelled').length;
  const avgOrderValue = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0;

  return (
    <section className="stack reports-screen">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Sales & Analytics</h1>
        <button
          className="eye-toggle-btn"
          onClick={() => setShowRevenue(!showRevenue)}
          title={showRevenue ? 'Hide Revenue' : 'Show Revenue'}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          {showRevenue ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{showRevenue ? 'Hide Revenue' : 'Show Revenue'}</span>
        </button>
      </div>
      <div className="metric-grid two">
        <Metric label="Total Live Revenue" value={showRevenue ? currency.format(revenue) : '₹ ••••••'} tone="warm" />
        <Metric label="Completed Paid Orders" value={paidOrders.length.toString()} tone="violet" />
        <Metric label="Cancelled Orders" value={cancelled.toString()} tone="red" />
        <Metric label="Avg Order Value" value={showRevenue ? currency.format(avgOrderValue) : '₹ ••••••'} tone="blue" />
      </div>
    </section>
  );
}

function CustomerOrder() {
  const { tableToken } = useParams();
  const snapshot = useSnapshot();
  const table = snapshot.tables.find((item) => item.publicToken === tableToken) || snapshot.tables[0];
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const cartItems = cartEntries(cart, snapshot.menuItems);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.basePrice * entry.quantity, 0);
  const visibleItems = snapshot.menuItems.filter(
    (item) => item.isAvailable && (selectedCategoryId === 'all' || item.categoryId === selectedCategoryId)
  );

  function setQty(itemId: string, nextQty: number) {
    setCart((current) => {
      const next = { ...current };
      if (nextQty <= 0) delete next[itemId];
      else next[itemId] = nextQty;
      return next;
    });
  }

  async function handleConfirmCustomerOrder(name: string, phone: string, birthdate: string) {
    if (!table) return;
    setIsSubmitting(true);
    try {
      const order = await restaurantService.createOrder(
        table.publicToken,
        Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity })),
        name,
        phone,
        birthdate
      );
      setSubmittedOrder(order);
      setCart({});
      setShowDetailsModal(false);
      snapshot.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="customer-shell">
      <CustomerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSubmit={handleConfirmCustomerOrder}
        isSubmitting={isSubmitting}
        title="Your Table Order Details"
      />

      {!submittedOrder && (
        <header className="customer-hero">
          <div>
            <span>{snapshot.organization.name}</span>
            <h1>{table?.displayName || 'Table Order'}</h1>
          </div>
        </header>
      )}

      <main className={`screen customer-screen ${submittedOrder ? 'confirmation' : ''}`}>
        {submittedOrder ? (
          <OrderConfirmation order={submittedOrder} table={table} />
        ) : (
          <>
            <div className="customer-tabs">
              <button
                className={selectedCategoryId === 'all' ? 'active' : ''}
                onClick={() => setSelectedCategoryId('all')}
              >
                All
              </button>
              {snapshot.categories.map((category) => (
                <button
                  className={selectedCategoryId === category.id ? 'active' : ''}
                  onClick={() => setSelectedCategoryId(category.id)}
                  key={category.id}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="menu-list">
              {visibleItems.map((item) => (
                <MenuItemCard
                  item={item}
                  key={item.id}
                  action={
                    cart[item.id] ? (
                      <QuantityControl
                        quantity={cart[item.id]}
                        onMinus={() => setQty(item.id, cart[item.id] - 1)}
                        onPlus={() => setQty(item.id, cart[item.id] + 1)}
                      />
                    ) : (
                      <button className="add-button" onClick={() => setQty(item.id, 1)}>
                        Add
                      </button>
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </main>

      {!submittedOrder && (
        <footer className="cart-bar">
          <button
            className="primary-action wide"
            disabled={!cartItems.length || isSubmitting}
            onClick={() => setShowDetailsModal(true)}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <span>Place Order ({cartItems.reduce((sum, entry) => sum + entry.quantity, 0)})</span>
                <b>{currency.format(total)}</b>
              </>
            )}
          </button>
        </footer>
      )}
    </div>
  );
}

function OrderConfirmation({ order, table }: { order: Order; table: DiningTable }) {
  const steps: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready', 'served'];

  return (
    <article className="success-panel">
      <CheckCircle2 size={58} />
      <h1>Order Placed!</h1>
      <p>Thank you. Your order has been received by the kitchen.</p>
      <div className="receipt-box">
        <span>
          Order ID <b>#ORD-{order.orderNumber}</b>
        </span>
        <span>
          Table <b>{table?.displayName}</b>
        </span>
        <span>
          Customer <b>{order.customerName || 'Guest'}</b>
        </span>
        {order.customerPhone && (
          <span>
            Phone <b>{order.customerPhone}</b>
          </span>
        )}
        <span>
          Placed At <b>{formatTime(order.createdAt)}</b>
        </span>
        <span>
          Total Items <b>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</b>
        </span>
        <span>
          Total Amount <b>{currency.format(order.totalAmount)}</b>
        </span>
      </div>
      <div className="status-track">
        <h2>Order Status</h2>
        {steps.map((step) => (
          <div className={`status-step ${step === order.orderStatus ? 'active' : ''}`} key={step}>
            <i>{step === order.orderStatus ? <Check size={11} /> : null}</i>
            <span>{statusLabel(step)}</span>
            {step === order.orderStatus && <small>{formatTime(order.createdAt)}</small>}
          </div>
        ))}
      </div>
    </article>
  );
}

function OrdersHistory({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

  const pastOrders = snapshot.orders.filter((order) => {
    if (statusFilter === 'completed') return order.orderStatus === 'completed' || order.paymentStatus === 'paid';
    if (statusFilter === 'cancelled') return order.orderStatus === 'cancelled';
    return true;
  });

  const filteredOrders = pastOrders.filter((order) => {
    const table = snapshot.tables.find((t) => t.id === order.tableId);
    const searchLower = searchQuery.trim().toLowerCase();
    if (!searchLower) return true;

    const orderNumStr = order.orderNumber.toString();
    const orderIdStr = `ord-${order.orderNumber}`.toLowerCase();
    const customerStr = (order.customerName || '').toLowerCase();
    const phoneStr = (order.customerPhone || '').toLowerCase();
    const tableNameStr = (table?.displayName || '').toLowerCase();
    const itemsMatch = order.items.some((item) => item.itemNameSnapshot.toLowerCase().includes(searchLower));

    return (
      orderNumStr.includes(searchLower) ||
      orderIdStr.includes(searchLower) ||
      customerStr.includes(searchLower) ||
      phoneStr.includes(searchLower) ||
      tableNameStr.includes(searchLower) ||
      itemsMatch
    );
  });

  return (
    <section className="stack orders-screen">
      {selectedOrderForReceipt && (
        <ReceiptModal
          order={selectedOrderForReceipt}
          snapshot={snapshot}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}

      <div className="page-title">
        <h1>Order History</h1>
        <ReceiptText size={20} />
      </div>

      <div className="toolbar-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
        <label className="search-field" style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <Search size={16} style={{ color: 'var(--muted)' }} />
          <input
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.88rem' }}
            placeholder="Search Order #, Customer, Phone, Dish Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="ghost-icon" onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </label>
        <div className="chip-row">
          <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
            All ({snapshot.orders.length})
          </button>
          <button
            className={statusFilter === 'completed' ? 'active' : ''}
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({snapshot.orders.filter((o) => o.paymentStatus === 'paid' || o.orderStatus === 'completed').length})
          </button>
          <button
            className={statusFilter === 'cancelled' ? 'active' : ''}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled ({snapshot.orders.filter((o) => o.orderStatus === 'cancelled').length})
          </button>
        </div>
      </div>

      <div className="orders-list stack" style={{ gap: '12px' }}>
        {filteredOrders.length === 0 ? (
          <div className="flex-center" style={{ padding: '40px 0', color: 'var(--muted)', textAlign: 'center' }}>
            <ReceiptText size={48} />
            <p style={{ marginTop: '12px' }}>No past orders found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const table = snapshot.tables.find((t) => t.id === order.tableId);
            const payment = snapshot.payments.find((p) => p.orderId === order.id);
            const payMethod = payment?.paymentMethod || 'cash';

            return (
              <article className="order-card" key={order.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{table?.displayName || 'Table'} <small style={{ color: 'var(--muted)', fontWeight: 400 }}>({order.customerName || 'Guest'})</small></h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                      #{order.orderNumber} • {new Date(order.createdAt).toLocaleString()}
                    </p>
                    {(order.customerPhone || order.customerBirthdate) && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {order.customerPhone && <span>Phone: {order.customerPhone} </span>}
                        {order.customerBirthdate && <span>• DOB: {order.customerBirthdate}</span>}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`order-status ${order.orderStatus}`}>{statusLabel(order.orderStatus)}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px', background: '#e0e7ff', color: '#3730a3', textTransform: 'uppercase', fontWeight: 700 }}>
                      {payMethod}
                    </span>
                  </div>
                </div>

                <div className="order-lines" style={{ margin: '12px 0', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                      <span>{item.quantity} x {item.itemNameSnapshot}</span>
                      <b>{currency.format(item.totalAmount)}</b>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Total Amount: </span>
                    <strong style={{ fontSize: '1.05rem' }}>{currency.format(order.totalAmount)}</strong>
                  </div>
                  <button
                    className="subtle-button compact"
                    onClick={() => setSelectedOrderForReceipt(order)}
                    style={{ gap: '6px' }}
                  >
                    <Printer size={14} /> View / Print Receipt
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function ReceiptModal({
  order,
  snapshot,
  onClose
}: {
  order: Order;
  snapshot: ReturnType<typeof useSnapshot>;
  onClose: () => void;
}) {
  const table = snapshot.tables.find((t) => t.id === order.tableId);
  const payment = snapshot.payments.find((p) => p.orderId === order.id);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="modal-overlay no-print-overlay">
      <div className="receipt-modal-card">
        <div className="printable-receipt">
          <div className="receipt-header-brand">
            <h2>{snapshot.organization.name}</h2>
            <p>{snapshot.location.name} • {snapshot.location.city}</p>
            <p style={{ fontSize: '0.72rem', marginTop: '4px', fontWeight: 700 }}>TAX INVOICE / RECEIPT</p>
          </div>

          <div className="receipt-meta-row">
            <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
            <span>Time: {formatTime(order.createdAt)}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Order #: {order.orderNumber}</span>
            <span>Table: {table?.displayName || 'N/A'}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Customer: {order.customerName || 'Guest'}</span>
          </div>
          {order.customerPhone && (
            <div className="receipt-meta-row">
              <span>Phone: {order.customerPhone}</span>
            </div>
          )}

          <div className="receipt-table-header">
            <span>Item</span>
            <span>Qty</span>
            <span>Amt</span>
          </div>

          {order.items.map((item) => (
            <div className="receipt-table-row" key={item.id}>
              <span>{item.itemNameSnapshot}</span>
              <span>{item.quantity}</span>
              <span>{currency.format(item.totalAmount)}</span>
            </div>
          ))}

          <div className="receipt-divider" />

          <div className="receipt-totals-row">
            <span>Subtotal</span>
            <span>{currency.format(order.subtotal)}</span>
          </div>
          <div className="receipt-totals-row">
            <span>Tax (5% GST)</span>
            <span>{currency.format(order.taxAmount)}</span>
          </div>
          <div className="receipt-totals-row grand-total">
            <span>TOTAL</span>
            <span>{currency.format(order.totalAmount)}</span>
          </div>

          <div className="receipt-meta-row" style={{ marginTop: '10px' }}>
            <span>Payment Mode:</span>
            <b>{(payment?.paymentMethod || 'CASH').toUpperCase()}</b>
          </div>

          <div className="receipt-footer-msg">
            <p>Thank you for dining with us!</p>
            <p>Please visit again.</p>
          </div>
        </div>

        <div className="form-row no-print" style={{ marginTop: '16px' }}>
          <button type="button" className="subtle-button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary-action" onClick={handlePrint} style={{ gap: '6px' }}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function cartEntries(cart: Record<string, number>, menuItems: MenuItem[]) {
  return Object.entries(cart)
    .map(([itemId, quantity]) => ({ item: menuItems.find((menuItem) => menuItem.id === itemId), quantity }))
    .filter((entry): entry is { item: MenuItem; quantity: number } => Boolean(entry.item));
}

function statusLabel(status: OrderStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default App;
