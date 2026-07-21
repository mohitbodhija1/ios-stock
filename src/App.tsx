import { useMemo, useState } from 'react';
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
  ClipboardList,
  CreditCard,
  Home,
  IndianRupee,
  Info,
  Menu as MenuIcon,
  Minus,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Store,
  UserRound,
  Utensils,
  X
} from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';
import { restaurantService } from './services/restaurantService';
import type { DiningTable, MenuItem, Order, OrderStatus, PaymentMethod, TableStatus } from './types';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function useSnapshot() {
  const [version, setVersion] = useState(0);
  const snapshot = useMemo(() => restaurantService.getTenantSnapshot(), [version]);
  return { ...snapshot, refresh: () => setVersion((current) => current + 1) };
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="status-time">9:41</div>
        <div className="brand-title">
          <strong>{snapshot.organization.name}</strong>
          <span>{snapshot.location.name}</span>
        </div>
        <button className="ghost-icon" aria-label={isSupabaseConfigured ? 'Supabase ready' : 'Demo mode'}>
          <Bell size={18} />
          <i />
        </button>
      </header>

      <main className="screen">
        <Routes>
          <Route path="/" element={<Dashboard snapshot={snapshot} />} />
          <Route path="/setup" element={<Setup snapshot={snapshot} />} />
          <Route path="/menu" element={<MenuManagement snapshot={snapshot} />} />
          <Route path="/waiter" element={<Waiter snapshot={snapshot} />} />
          <Route path="/kitchen" element={<Kitchen snapshot={snapshot} />} />
          <Route path="/billing" element={<Billing snapshot={snapshot} />} />
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
        <Metric label="Active Orders" value={activeOrders.length.toString()} tone="warm" note="View all" />
        <Metric label="Occupied Tables" value={`${occupiedTables}/${snapshot.tables.length}`} tone="violet" note="40 %" />
      </div>

      <article className="revenue-card">
        <div>
          <span>Today's Revenue</span>
          <strong>{currency.format(revenue || 18450)}</strong>
          <small>vs Yesterday <b>+12.5%</b></small>
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

  return (
    <section className="stack">
      <div className="page-title">
        <h1>Restaurant Setup</h1>
        <Search size={19} />
      </div>
      <div className="tabs">
        {['Organization', 'Location', 'Areas', 'Tables'].map((tab) => (
          <button className={tab === 'Tables' ? 'active' : ''} key={tab}>{tab}</button>
        ))}
      </div>
      <div className="toolbar-row">
        <label>
          <span>Dining Area</span>
          <select defaultValue={snapshot.diningAreas[0]?.id}>
            {snapshot.diningAreas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}
          </select>
        </label>
        <button className="subtle-button"><Plus size={14} /> Add Area</button>
      </div>

      <div className="qr-grid">
        {snapshot.tables.map((table) => {
          const url = `${origin}/r/${snapshot.organization.slug}/table/${table.publicToken}`;
          return (
            <article className="qr-card" key={table.id}>
              <span className={`status-dot ${table.status}`} />
              <div>
                <h3>{table.displayName}</h3>
                <p>{table.capacity} Seats</p>
                <Link to={`/r/${snapshot.organization.slug}/table/${table.publicToken}`}>Open Link</Link>
              </div>
              <QRCodeSVG value={url} size={52} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MenuManagement({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(snapshot.categories[0]?.id || 'all');
  const visibleItems = snapshot.menuItems.filter((item) => selectedCategoryId === 'all' || item.categoryId === selectedCategoryId);

  return (
    <section className="stack menu-admin">
      <div className="page-title">
        <h1>Menu Management</h1>
        <button className="primary-action compact"><Plus size={16} /> Add Item</button>
      </div>
      <div className="tabs">
        <button className="active">Categories</button>
        <button>Items</button>
      </div>
      <div className="split-layout">
        <aside className="category-rail">
          <CategoryButton label="All" count={snapshot.menuItems.length} active={selectedCategoryId === 'all'} onClick={() => setSelectedCategoryId('all')} />
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
          {visibleItems.map((item) => <MenuItemCard item={item} mode="admin" key={item.id} />)}
        </div>
      </div>
    </section>
  );
}

function CategoryButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
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
      <div className={`food-thumb ${item.foodType}`} aria-hidden="true">{item.name.slice(0, 1)}</div>
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
  const [selectedTableId, setSelectedTableId] = useState(snapshot.tables[0]?.id);
  const [cart, setCart] = useState<Record<string, number>>({});
  const selectedTable = snapshot.tables.find((table) => table.id === selectedTableId);
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

  function submitOrder() {
    if (!selectedTable) return;
    const items = Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity }));
    if (!items.length) return;
    restaurantService.createOrder(selectedTable.publicToken, items, 'Waiter order');
    setCart({});
    snapshot.refresh();
  }

  return (
    <section className="stack waiter-screen">
      <div className="page-title">
        <h1>New Order</h1>
        <Search size={18} />
      </div>
      <label className="search-field">
        <Search size={16} />
        <input placeholder="Search table..." />
      </label>
      <div className="chip-row">
        <button>All</button>
        {snapshot.diningAreas.map((area, index) => <button className={index === 0 ? 'active' : ''} key={area.id}>{area.name}</button>)}
      </div>
      <div className="table-grid">
        {snapshot.tables.map((table) => (
          <TableButton table={table} selected={table.id === selectedTableId} onClick={() => setSelectedTableId(table.id)} key={table.id} />
        ))}
      </div>
      <div className="legend-row">
        <span><i className="status-dot available" /> Available</span>
        <span><i className="status-dot occupied" /> Occupied</span>
        <span><i className="status-dot cleaning" /> In Use</span>
      </div>

      <article className="order-panel">
        <div className="section-header">
          <h2>{selectedTable?.displayName || 'Table'}</h2>
          <button className="danger-button" onClick={() => setCart({})}>Clear Cart</button>
        </div>
        {snapshot.menuItems.filter((item) => item.isAvailable).slice(0, 4).map((item) => (
          <MenuItemCard
            item={item}
            key={item.id}
            action={<QuantityControl quantity={cart[item.id] || 0} onMinus={() => setQty(item.id, (cart[item.id] || 0) - 1)} onPlus={() => setQty(item.id, (cart[item.id] || 0) + 1)} />}
          />
        ))}
        <div className="bill-totals">
          <span>Total Items <b>{cartItems.reduce((sum, entry) => sum + entry.quantity, 0)}</b></span>
          <span>Total Amount <b>{currency.format(total)}</b></span>
        </div>
        <button className="primary-action wide" disabled={!cartItems.length} onClick={submitOrder}>Send to Kitchen</button>
      </article>
    </section>
  );
}

function TableButton({ table, selected, onClick }: { table: DiningTable; selected: boolean; onClick: () => void }) {
  return (
    <button className={`table-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <span className={`status-dot ${table.status}`} />
      <strong>{table.displayName}</strong>
      <small>{table.capacity} Seats</small>
      {selected && table.status === 'occupied' && <em>OCCUPIED</em>}
    </button>
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
  const kitchenOrders = snapshot.orders.filter((order) => ['placed', 'confirmed', 'preparing', 'ready'].includes(order.orderStatus));

  function nextStatus(order: Order): OrderStatus | null {
    if (order.orderStatus === 'placed') return 'confirmed';
    if (order.orderStatus === 'confirmed') return 'preparing';
    if (order.orderStatus === 'preparing') return 'ready';
    if (order.orderStatus === 'ready') return 'served';
    return null;
  }

  return (
    <section className="stack kitchen-board">
      <div className="kitchen-tabs">
        {['All', 'Placed', 'Preparing', 'Ready'].map((tab, index) => <button className={index === 0 ? 'active' : ''} key={tab}>{tab} ({index === 0 ? kitchenOrders.length : Math.max(1, index)})</button>)}
      </div>

      {kitchenOrders.map((order) => {
        const table = snapshot.tables.find((item) => item.id === order.tableId);
        const next = nextStatus(order);
        return (
          <article className="order-card" key={order.id}>
            <div className="order-card-header">
              <div>
                <h3>{table?.displayName}</h3>
                <p>#{order.orderNumber} <span>{formatTime(order.createdAt)}</span></p>
              </div>
              <span className={`order-status ${order.orderStatus}`}>{statusLabel(order.orderStatus)}</span>
            </div>
            <div className="order-lines">
              {order.items.map((item) => <p key={item.id}>{item.quantity} x {item.itemNameSnapshot}</p>)}
            </div>
            {next && (
              <div className="kitchen-actions">
                {order.orderStatus === 'placed' && (
                  <button
                    onClick={() => {
                      restaurantService.changeOrderStatus(order.id, 'confirmed');
                      snapshot.refresh();
                    }}
                  >
                    Confirm
                  </button>
                )}
                <button
                  className={next === 'ready' || order.orderStatus === 'ready' ? 'green' : 'orange'}
                  onClick={() => {
                    restaurantService.changeOrderStatus(order.id, next);
                    snapshot.refresh();
                  }}
                >
                  {next === 'served' ? 'Ready' : statusLabel(next)}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

function Billing({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const unpaidOrders = snapshot.orders.filter((order) => order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [selectedOrderId, setSelectedOrderId] = useState(unpaidOrders[0]?.id);
  const selectedOrder = unpaidOrders.find((order) => order.id === selectedOrderId) || unpaidOrders[0];
  const selectedTable = selectedOrder ? snapshot.tables.find((item) => item.id === selectedOrder.tableId) : null;

  return (
    <section className="stack billing-screen">
      <div className="page-title">
        <h1>Unpaid Orders</h1>
        <Search size={18} />
      </div>
      <div className="bill-list">
        {unpaidOrders.map((order) => {
          const table = snapshot.tables.find((item) => item.id === order.tableId);
          return (
            <button className={`bill-row ${order.id === selectedOrder?.id ? 'selected' : ''}`} onClick={() => setSelectedOrderId(order.id)} key={order.id}>
              <span><b>{table?.displayName}</b><small>#{order.orderNumber}</small></span>
              <span><b>{currency.format(order.totalAmount)}</b><small>Unpaid</small></span>
            </button>
          );
        })}
      </div>

      {selectedOrder && (
        <article className="checkout-card">
          <div className="section-header">
            <h2>{selectedTable?.displayName}</h2>
            <span>#{selectedOrder.orderNumber}</span>
          </div>
          <div className="bill-totals">
            <span>Items Total <b>{currency.format(selectedOrder.subtotal)}</b></span>
            <span>Tax ({selectedOrder.items[0]?.taxAmount ? '5%' : '0%'}) <b>{currency.format(selectedOrder.taxAmount)}</b></span>
            <span className="grand">Total <b>{currency.format(selectedOrder.totalAmount)}</b></span>
          </div>
          <h3>Payment Method</h3>
          <div className="payment-methods">
            {(['cash', 'card', 'upi'] as PaymentMethod[]).map((item) => (
              <button className={method === item ? 'active' : ''} onClick={() => setMethod(item)} key={item}>{item.toUpperCase()}</button>
            ))}
          </div>
          <button
            className="primary-action wide"
            onClick={() => {
              restaurantService.recordPayment(selectedOrder.id, method);
              snapshot.refresh();
            }}
          >
            Record Payment & Complete
          </button>
        </article>
      )}
    </section>
  );
}

function Reports({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const paidOrders = snapshot.orders.filter((order) => order.paymentStatus === 'paid');
  const revenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0) || 18450;
  const cancelled = snapshot.orders.filter((order) => order.orderStatus === 'cancelled').length || 3;
  const avgOrderValue = Math.round(revenue / Math.max(1, paidOrders.length || 32));

  return (
    <section className="stack reports-screen">
      <div className="page-title">
        <h1>Reports</h1>
        <CalendarDays size={18} />
      </div>
      <div className="filter-row">
        <select defaultValue="today"><option value="today">Today</option></select>
        <select defaultValue="may"><option value="may">May 18, 2024</option></select>
      </div>
      <div className="metric-grid two">
        <Metric label="Revenue" value={currency.format(revenue)} note="+12.5%" />
        <Metric label="Paid Orders" value={(paidOrders.length || 32).toString()} tone="violet" note="+6" />
        <Metric label="Cancelled Orders" value={cancelled.toString()} tone="red" note="+1" />
        <Metric label="Avg Order Value" value={currency.format(avgOrderValue)} tone="blue" note="+8.2%" />
      </div>
      <article className="breakdown-card">
        <h2>Payment Method Breakdown</h2>
        <div className="donut"><span>{currency.format(revenue)}<small>Total</small></span></div>
        <div className="breakdown-list">
          <span><i className="cash" /> Cash <b>50%</b></span>
          <span><i className="upi" /> UPI <b>30%</b></span>
          <span><i className="card" /> Card <b>20%</b></span>
        </div>
      </article>
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
  const cartItems = cartEntries(cart, snapshot.menuItems);
  const total = cartItems.reduce((sum, entry) => sum + entry.item.basePrice * entry.quantity, 0);
  const visibleItems = snapshot.menuItems.filter((item) => item.isAvailable && (selectedCategoryId === 'all' || item.categoryId === selectedCategoryId));

  function setQty(itemId: string, nextQty: number) {
    setCart((current) => {
      const next = { ...current };
      if (nextQty <= 0) delete next[itemId];
      else next[itemId] = nextQty;
      return next;
    });
  }

  function submit() {
    const order = restaurantService.createOrder(table.publicToken, Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity })));
    setSubmittedOrder(order);
    setCart({});
    snapshot.refresh();
  }

  return (
    <div className="customer-shell">
      {!submittedOrder && (
        <header className="customer-hero">
          <div>
            <span>{snapshot.organization.name}</span>
            <h1>{table.displayName}</h1>
          </div>
          <div className="table-art" aria-hidden="true" />
        </header>
      )}

      <main className={`screen customer-screen ${submittedOrder ? 'confirmation' : ''}`}>
        {submittedOrder ? (
          <OrderConfirmation order={submittedOrder} table={table} />
        ) : (
          <>
            <div className="customer-tabs">
              <button className={selectedCategoryId === 'all' ? 'active' : ''} onClick={() => setSelectedCategoryId('all')}>All</button>
              {snapshot.categories.map((category) => (
                <button className={selectedCategoryId === category.id ? 'active' : ''} onClick={() => setSelectedCategoryId(category.id)} key={category.id}>{category.name}</button>
              ))}
            </div>
            <div className="menu-list">
              {visibleItems.map((item) => (
                <MenuItemCard
                  item={item}
                  key={item.id}
                  action={
                    cart[item.id] ? (
                      <QuantityControl quantity={cart[item.id]} onMinus={() => setQty(item.id, cart[item.id] - 1)} onPlus={() => setQty(item.id, cart[item.id] + 1)} />
                    ) : (
                      <button className="add-button" onClick={() => setQty(item.id, 1)}>Add</button>
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
          <button className="primary-action wide" disabled={!cartItems.length} onClick={submit}>
            <span>View Cart ({cartItems.reduce((sum, entry) => sum + entry.quantity, 0)})</span>
            <b>{currency.format(total)}</b>
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
      <p>Thank you. Your order has been received.</p>
      <div className="receipt-box">
        <span>Order ID <b>#ORD-{order.orderNumber}</b></span>
        <span>Table <b>{table.displayName}</b></span>
        <span>Placed At <b>{formatTime(order.createdAt)}</b></span>
        <span>Total Items <b>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</b></span>
        <span>Total Amount <b>{currency.format(order.totalAmount)}</b></span>
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
