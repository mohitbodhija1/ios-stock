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
  Home,
  IndianRupee,
  LogOut,
  Minus,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  Settings,
  UserRound,
  Utensils,
  X,
  Loader2,
  Building
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { restaurantService } from './services/restaurantService';
import { AuthModal } from './components/Auth';
import type { DiningTable, MenuItem, Order, OrderStatus, PaymentMethod } from './types';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function useSnapshot() {
  const [snapshot, setSnapshot] = useState(restaurantService.getTenantSnapshot());
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const fresh = await restaurantService.fetchTenantSnapshot();
    setSnapshot({ ...fresh });
    setLoading(false);
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
  return (
    <Routes>
      <Route path="/r/:restaurantSlug/table/:tableToken" element={<CustomerOrder />} />
      <Route path="/*" element={<StaffApp />} />
    </Routes>
  );
}

function StaffApp() {
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

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
      setUserEmail(null);
      snapshot.refresh();
    }
  }

  return (
    <div className="app-shell">
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

      <header className="topbar">
        <div className="status-time">
          {snapshot.loading ? <Loader2 size={14} className="animate-spin" /> : 'LIVE'}
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
        <NavItem to="/" icon={<Home size={18} />} label="Home" />
        <NavItem to="/setup" icon={<Settings size={18} />} label="Setup" />
        <NavItem to="/menu" icon={<BookOpen size={18} />} label="Menu" />
        <NavItem to="/waiter" icon={<UserRound size={18} />} label="Waiter" />
        <NavItem to="/kitchen" icon={<ChefHat size={18} />} label="Kitchen" />
        <NavItem to="/billing" icon={<IndianRupee size={18} />} label="Pay" />
        <NavItem to="/orders" icon={<ReceiptText size={18} />} label="Orders" />
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
          <span>Today's Live Revenue</span>
          <strong>{currency.format(revenue)}</strong>
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
        <h2>Quick Links</h2>
      </div>
      <div className="quick-grid">
        <QuickLink to="/setup" icon={<Settings size={24} />} label="Setup" />
        <QuickLink to="/menu" icon={<BookOpen size={24} />} label="Menu" />
        <QuickLink to="/waiter" icon={<UserRound size={24} />} label="Waiter" />
        <QuickLink to="/kitchen" icon={<ChefHat size={24} />} label="Kitchen" />
        <QuickLink to="/billing" icon={<IndianRupee size={24} />} label="Billing / Pay" />
        <QuickLink to="/orders" icon={<ReceiptText size={24} />} label="Order History" />
        <QuickLink to="/reports" icon={<BarChart3 size={24} />} label="Reports" />
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

function QuickLink({ to, icon, label }: { to: string; icon: JSX.Element; label: string }) {
  return (
    <Link className="quick-link" to={to}>
      {icon}
      <span>{label}</span>
    </Link>
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
        tableName.trim() || `Table ${tableNumber}`,
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
    <section className="stack">
      <div className="page-title">
        <h1>Restaurant Setup</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="subtle-button compact" onClick={() => setShowAddAreaModal(true)}>
            <Plus size={14} /> Add Area
          </button>
          <button className="primary-action compact" onClick={() => setShowAddTableModal(true)}>
            <Plus size={14} /> Add Table
          </button>
        </div>
      </div>

      <div className="toolbar-row">
        <label>
          <span>Filter Dining Area</span>
          <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}>
            <option value="">All Areas</option>
            {snapshot.diningAreas.map((area) => (
              <option value={area.id} key={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="qr-grid">
        {snapshot.tables
          .filter((t) => !selectedAreaId || t.diningAreaId === selectedAreaId)
          .map((table) => {
            const url = `${origin}/r/${snapshot.organization.slug}/table/${table.publicToken}`;
            return (
              <article className="qr-card" key={table.id}>
                <span className={`status-dot ${table.status}`} />
                <div>
                  <h3>{table.displayName}</h3>
                  <p>{table.capacity} Seats ({table.status})</p>
                  <Link to={`/r/${snapshot.organization.slug}/table/${table.publicToken}`} target="_blank">
                    Open QR Link
                  </Link>
                </div>
                <QRCodeSVG value={url} size={56} />
              </article>
            );
          })}
      </div>

      {showAddAreaModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="auth-header">
              <h2>Add Dining Area</h2>
              <p>Create a section in your restaurant (e.g. Rooftop, Main Dining, Bar).</p>
            </div>
            <form onSubmit={handleAddArea} className="auth-form">
              <label className="field-label">
                <span>Area Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rooftop Terrace"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                />
              </label>
              <div className="form-row">
                <button type="button" className="subtle-button" onClick={() => setShowAddAreaModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Save Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTableModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="auth-header">
              <h2>Add Dining Table</h2>
              <p>Add a physical table with seating capacity.</p>
            </div>
            <form onSubmit={handleAddTable} className="auth-form">
              <div className="form-row">
                <label className="field-label">
                  <span>Table Number / Code *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T-1"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </label>

                <label className="field-label">
                  <span>Seating Capacity</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                  />
                </label>
              </div>

              <label className="field-label">
                <span>Display Name</span>
                <input
                  type="text"
                  placeholder="e.g. Table 1 (Window Side)"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
              </label>

              <label className="field-label">
                <span>Dining Area</span>
                <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {snapshot.diningAreas.map((area) => (
                    <option value={area.id} key={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-row">
                <button type="button" className="subtle-button" onClick={() => setShowAddTableModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function MenuManagement({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Category Form
  const [catName, setCatName] = useState('');

  // Item Form
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [basePrice, setBasePrice] = useState(250);
  const [taxPercentage, setTaxPercentage] = useState(5);
  const [foodType, setFoodType] = useState<'vegetarian' | 'non_vegetarian' | 'beverage' | 'vegan'>('vegetarian');
  const [itemCategoryId, setItemCategoryId] = useState(snapshot.categories[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!itemCategoryId && snapshot.categories.length > 0) {
      setItemCategoryId(snapshot.categories[0].id);
    }
  }, [snapshot.categories]);

  const visibleItems = snapshot.menuItems.filter(
    (item) => selectedCategoryId === 'all' || item.categoryId === selectedCategoryId
  );

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createMenuCategory(catName.trim(), snapshot.location.id, snapshot.organization.id);
      setCatName('');
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
    if (!itemName.trim() || !itemCategoryId) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createMenuItem({
        name: itemName.trim(),
        description: itemDesc.trim(),
        basePrice,
        taxPercentage,
        foodType,
        categoryId: itemCategoryId,
        locationId: snapshot.location.id,
        orgId: snapshot.organization.id
      });
      setItemName('');
      setItemDesc('');
      setShowAddItemModal(false);
      snapshot.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleAvailability(item: MenuItem) {
    try {
      await restaurantService.toggleMenuItemAvailability(item.id, !item.isAvailable);
      snapshot.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update item availability');
    }
  }

  return (
    <section className="stack menu-admin">
      <div className="page-title">
        <h1>Menu Management</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="subtle-button compact" onClick={() => setShowAddCategoryModal(true)}>
            <Plus size={14} /> Add Category
          </button>
          <button className="primary-action compact" onClick={() => setShowAddItemModal(true)}>
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="split-layout">
        <aside className="category-rail">
          <CategoryButton
            label="All"
            count={snapshot.menuItems.length}
            active={selectedCategoryId === 'all'}
            onClick={() => setSelectedCategoryId('all')}
          />
          {snapshot.categories.map((category) => (
            <CategoryButton
              label={category.name}
              count={snapshot.menuItems.filter((item) => item.categoryId === category.id).length}
              active={selectedCategoryId === category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              key={category.id}
            />
          ))}
        </aside>
        <div className="menu-list">
          {visibleItems.map((item) => (
            <article className={`menu-card admin ${!item.isAvailable ? 'muted' : ''}`} key={item.id}>
              <div className={`food-thumb ${item.foodType}`} aria-hidden="true">
                {item.name.slice(0, 1)}
              </div>
              <div className="menu-copy">
                <h4>{item.name}</h4>
                <p>{item.description || 'No description'}</p>
                <span>{currency.format(item.basePrice)}</span>
              </div>
              <div className="item-meta">
                <button
                  className={`availability-badge ${item.isAvailable ? 'available' : 'off'}`}
                  onClick={() => toggleAvailability(item)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: item.isAvailable ? '#dcfce7' : '#f3f4f6',
                    color: item.isAvailable ? '#15803d' : '#6b7280',
                    border: 'none'
                  }}
                >
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {showAddCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="auth-header">
              <h2>Add Menu Category</h2>
              <p>e.g. Starters, Mains, Desserts, Beverages</p>
            </div>
            <form onSubmit={handleAddCategory} className="auth-form">
              <label className="field-label">
                <span>Category Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Desserts"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </label>
              <div className="form-row">
                <button type="button" className="subtle-button" onClick={() => setShowAddCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddItemModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="auth-header">
              <h2>Add Menu Item</h2>
              <p>Add a dish or beverage to your menu.</p>
            </div>
            <form onSubmit={handleAddItem} className="auth-form">
              <label className="field-label">
                <span>Category</span>
                <select value={itemCategoryId} onChange={(e) => setItemCategoryId(e.target.value)}>
                  {snapshot.categories.map((cat) => (
                    <option value={cat.id} key={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                <span>Item Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Butter Chicken"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </label>

              <label className="field-label">
                <span>Description</span>
                <input
                  type="text"
                  placeholder="e.g. Rich creamy tomato gravy with tender chicken"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                />
              </label>

              <div className="form-row">
                <label className="field-label">
                  <span>Price (INR) *</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                  />
                </label>

                <label className="field-label">
                  <span>Tax (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={28}
                    required
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(Number(e.target.value))}
                  />
                </label>
              </div>

              <label className="field-label">
                <span>Food Classification</span>
                <select value={foodType} onChange={(e) => setFoodType(e.target.value as any)}>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non_vegetarian">Non-Vegetarian</option>
                  <option value="beverage">Beverage</option>
                  <option value="vegan">Vegan</option>
                </select>
              </label>

              <div className="form-row">
                <button type="button" className="subtle-button" onClick={() => setShowAddItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function CategoryButton({
  label,
  count,
  active,
  onClick
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`category-button ${active ? 'active' : ''}`} onClick={onClick}>
      <span>{label}</span>
      <b>{count}</b>
    </button>
  );
}

function MenuItemCard({ item, action, mode = 'default' }: { item: MenuItem; action?: JSX.Element; mode?: 'default' | 'admin' }) {
  return (
    <article className={`menu-card ${mode} ${!item.isAvailable ? 'muted' : ''}`}>
      <div className={`food-thumb ${item.foodType}`} aria-hidden="true">
        {item.name.slice(0, 1)}
      </div>
      <div className="menu-copy">
        <h4>{item.name}</h4>
        {mode !== 'admin' && <p>{item.description}</p>}
        <span>{currency.format(item.basePrice)}</span>
      </div>
      {action || (
        <div className="item-meta">
          <span className="veg-mark" />
          <b className="availability">{item.isAvailable ? 'Available' : 'Off'}</b>
        </div>
      )}
    </article>
  );
}

function Waiter({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [selectedTableId, setSelectedTableId] = useState(snapshot.tables[0]?.id || '');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedTableId && snapshot.tables.length > 0) {
      setSelectedTableId(snapshot.tables[0].id);
    }
  }, [snapshot.tables]);

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

  async function submitOrder() {
    if (!selectedTable) return;
    const items = Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity }));
    if (!items.length) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createOrder(selectedTable.publicToken, items, 'Waiter Order');
      setCart({});
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
          onClick={submitOrder}
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
        <div className="flex-center" style={{ padding: '40px 0', color: 'var(--muted)' }}>
          <ChefHat size={48} />
          <p>No active kitchen orders at the moment.</p>
        </div>
      ) : (
        kitchenOrders.map((order) => {
          const table = snapshot.tables.find((item) => item.id === order.tableId);
          const next = nextStatus(order);
          return (
            <article className="order-card" key={order.id}>
              <div className="order-card-header">
                <div>
                  <h3>{table?.displayName || 'Guest Order'}</h3>
                  <p>
                    #{order.orderNumber} <span>{formatTime(order.createdAt)}</span>
                  </p>
                </div>
                <span className={`order-status ${order.orderStatus}`}>{statusLabel(order.orderStatus)}</span>
              </div>
              <div className="order-lines">
                {order.items.map((item) => (
                  <p key={item.id}>
                    {item.quantity} x {item.itemNameSnapshot}
                  </p>
                ))}
              </div>
              {next && (
                <div className="kitchen-actions">
                  {order.orderStatus === 'placed' && (
                    <button onClick={() => handleStatusChange(order.id, 'confirmed')}>Confirm</button>
                  )}
                  <button
                    className={next === 'ready' || order.orderStatus === 'ready' ? 'green' : 'orange'}
                    onClick={() => handleStatusChange(order.id, next)}
                  >
                    {next === 'served' ? 'Ready' : statusLabel(next)}
                  </button>
                </div>
              )}
            </article>
          );
        })
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
                  <small>#{order.orderNumber}</small>
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
  const paidOrders = snapshot.orders.filter((order) => order.paymentStatus === 'paid');
  const revenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const cancelled = snapshot.orders.filter((order) => order.orderStatus === 'cancelled').length;
  const avgOrderValue = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0;

  return (
    <section className="stack reports-screen">
      <div className="page-title">
        <h1>Sales & Analytics</h1>
        <CalendarDays size={18} />
      </div>
      <div className="metric-grid two">
        <Metric label="Total Live Revenue" value={currency.format(revenue)} tone="warm" />
        <Metric label="Completed Paid Orders" value={paidOrders.length.toString()} tone="violet" />
        <Metric label="Cancelled Orders" value={cancelled.toString()} tone="red" />
        <Metric label="Avg Order Value" value={currency.format(avgOrderValue)} tone="blue" />
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

  async function submit() {
    if (!table) return;
    setIsSubmitting(true);
    try {
      const order = await restaurantService.createOrder(
        table.publicToken,
        Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity }))
      );
      setSubmittedOrder(order);
      setCart({});
      snapshot.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="customer-shell">
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
          <button className="primary-action wide" disabled={!cartItems.length || isSubmitting} onClick={submit}>
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
    const searchLower = searchQuery.toLowerCase();
    const orderNumStr = order.orderNumber.toString();
    const customerStr = (order.customerName || '').toLowerCase();
    const tableNameStr = (table?.displayName || '').toLowerCase();

    return (
      orderNumStr.includes(searchLower) ||
      customerStr.includes(searchLower) ||
      tableNameStr.includes(searchLower)
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
        <label className="search-field" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={16} />
          <input
            placeholder="Search Order #, Customer, Table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
          <div className="flex-center" style={{ padding: '40px 0', color: 'var(--muted)' }}>
            <ReceiptText size={48} />
            <p>No past orders found.</p>
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
                    <Printer size={14} /> View / Reprint Receipt
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

