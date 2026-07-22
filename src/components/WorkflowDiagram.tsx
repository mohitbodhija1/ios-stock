import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Coffee,
  CreditCard,
  ChefHat,
  Home,
  IndianRupee,
  LogIn,
  QrCode,
  ReceiptText,
  Search,
  ShoppingCart,
  Sparkles,
  UserCheck,
  UserRound,
  Utensils,
  Smartphone,
  Info,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

export function WorkflowDiagram() {
  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'customer'>('all');
  const [activeKdsTab, setActiveKdsTab] = useState<'all' | 'preparing' | 'ready'>('all');

  return (
    <div className="workflow-container">
      {/* Top Banner Header */}
      <header className="workflow-header">
        <div className="workflow-badge">
          <Sparkles size={16} />
          <span>Interactive App Architecture</span>
        </div>
        <h1 className="workflow-title">RESTAURANT APP – DAILY USE FLOW</h1>
        <p className="workflow-subtitle">Simple flow for everyday operations</p>

        <div className="workflow-filter-tabs">
          <button
            className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Workflows (Full Poster)
          </button>
          <button
            className={`filter-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            Staff Flow (Daily Use)
          </button>
          <button
            className={`filter-btn ${activeTab === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            Customer Flow (Dine-in via QR)
          </button>
        </div>
      </header>

      {/* SECTION 1: STAFF FLOW */}
      {(activeTab === 'all' || activeTab === 'staff') && (
        <section className="flow-section staff-flow-section">
          <div className="section-pill staff-pill">
            <UserCheck size={18} />
            <span>STAFF FLOW (Daily Use)</span>
          </div>

          <div className="frames-grid staff-grid">
            {/* 1. Login Frame */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num staff-num">1</span>
                <div>
                  <h3>Login</h3>
                  <p>Staff login to access the app</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen login-screen">
                  <div className="brand-logo-circle">
                    <Utensils size={28} className="text-emerald" />
                  </div>
                  <h2 className="brand-heading">Green Leaf</h2>
                  <p className="brand-subtext">Restaurant</p>

                  <div className="form-group-mock">
                    <label>Email</label>
                    <div className="input-mock">email@example.com</div>
                  </div>
                  <div className="form-group-mock">
                    <label>Password</label>
                    <div className="input-mock password-mock">•••••••• 👁️</div>
                  </div>

                  <button className="btn-mock btn-emerald">Login</button>
                  <a href="#forgot" onClick={(e) => e.preventDefault()} className="forgot-link">Forgot Password?</a>
                </div>
              </div>
            </div>

            <div className="flow-arrow hide-mobile"><ArrowRight size={24} /></div>

            {/* 2. Dashboard Frame */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num staff-num">2</span>
                <div>
                  <h3>Dashboard</h3>
                  <p>Overview of today's operations</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen dashboard-screen-mock">
                  <div className="screen-header-bar">
                    <span className="location-dropdown">Green Leaf Restaurant - Main Branch ▼</span>
                    <span className="bell-icon">🔔</span>
                  </div>

                  <div className="revenue-box">
                    <span className="label">Today's Revenue</span>
                    <div className="amount">₹18,450</div>
                    <span className="link-sub">View details ›</span>
                    <div className="mini-chart">📈</div>
                  </div>

                  <div className="stat-cards-row">
                    <div className="mini-stat">
                      <span className="stat-label">Active Orders</span>
                      <strong className="stat-val">12</strong>
                    </div>
                    <div className="mini-stat">
                      <span className="stat-label">Occupied Tables</span>
                      <strong className="stat-val">8/20</strong>
                    </div>
                  </div>

                  <div className="quick-actions-title">Quick Actions</div>
                  <div className="quick-actions-grid-mock">
                    <div className="qa-item"><div className="qa-icon icon-green"><UserRound size={16} /></div><span>Waiter</span></div>
                    <div className="qa-item"><div className="qa-icon icon-orange"><ChefHat size={16} /></div><span>Kitchen</span></div>
                    <div className="qa-item"><div className="qa-icon icon-purple"><IndianRupee size={16} /></div><span>Billing</span></div>
                    <div className="qa-item"><div className="qa-icon icon-blue"><ReceiptText size={16} /></div><span>Reports</span></div>
                  </div>

                  <div className="bottom-nav-mock">
                    <div className="nav-icon active"><Home size={14} /><span>Home</span></div>
                    <div className="nav-icon"><ReceiptText size={14} /><span>Setup</span></div>
                    <div className="nav-icon"><Coffee size={14} /><span>Menu</span></div>
                    <div className="nav-icon"><UserRound size={14} /><span>Waiter</span></div>
                    <div className="nav-icon"><IndianRupee size={14} /><span>Pay</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flow-arrow hide-mobile"><ArrowRight size={24} /></div>

            {/* 3. Waiter Frame */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num staff-num">3</span>
                <div>
                  <h3>Waiter</h3>
                  <p>Select table and add items</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen waiter-screen-mock">
                  <div className="top-nav-title">
                    <span>‹ Select Table</span>
                  </div>

                  <div className="tables-grid-mock">
                    <div className="table-chip">Table 1<small>4 Seats</small></div>
                    <div className="table-chip">Table 2<small>2 Seats</small></div>
                    <div className="table-chip">Table 4<small>2 Seats</small></div>
                    <div className="table-chip">Table 3<small>4 Seats</small></div>
                    <div className="table-chip">Table 4<small>2 Seats</small></div>
                    <div className="table-chip">Table 6<small>2 Seats</small></div>
                    <div className="table-chip active-table">Table 5<small>4 Seats</small></div>
                    <div className="table-chip">Table 7<small>4 Seats</small></div>
                    <div className="table-chip">Table 8<small>4 Seats</small></div>
                  </div>

                  <div className="table-order-header">Table 5</div>

                  <div className="mock-order-items">
                    <div className="mock-item-row">
                      <div className="img-placeholder">🥘</div>
                      <div className="item-details">
                        <strong>Paneer Tikka</strong>
                        <span>₹ 220</span>
                      </div>
                      <div className="qty-controls">- 1 +</div>
                    </div>
                    <div className="mock-item-row">
                      <div className="img-placeholder">🍲</div>
                      <div className="item-details">
                        <strong>Veg Biryani</strong>
                        <span>₹ 280</span>
                      </div>
                      <div className="qty-controls">- 1 +</div>
                    </div>
                    <div className="mock-item-row">
                      <div className="img-placeholder">🍹</div>
                      <div className="item-details">
                        <strong>Masala Lemonade</strong>
                        <span>₹ 80</span>
                      </div>
                      <div className="qty-controls">- 1 +</div>
                    </div>
                  </div>

                  <div className="order-bottom-summary">
                    <span>3 Items</span>
                    <strong>₹ 580 ›</strong>
                  </div>
                  <button className="btn-mock btn-emerald flex-btn">Send to Kitchen</button>

                  <div className="bottom-nav-mock">
                    <div className="nav-icon"><Home size={14} /><span>Home</span></div>
                    <div className="nav-icon"><ReceiptText size={14} /><span>Setup</span></div>
                    <div className="nav-icon"><Coffee size={14} /><span>Menu</span></div>
                    <div className="nav-icon active"><UserRound size={14} /><span>Waiter</span></div>
                    <div className="nav-icon"><IndianRupee size={14} /><span>Pay</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flow-arrow hide-mobile"><ArrowRight size={24} /></div>

            {/* 4. Kitchen Frame (Standard Light Theme) */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num staff-num">4</span>
                <div>
                  <h3>Kitchen</h3>
                  <p>View incoming orders and update status</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen kitchen-screen-mock light-kds">
                  <div className="screen-title-center">Kitchen Display</div>

                  <div className="kds-tabs-mock">
                    <span className={activeKdsTab === 'all' ? 'active' : ''} onClick={() => setActiveKdsTab('all')}>All (3)</span>
                    <span className={activeKdsTab === 'preparing' ? 'active' : ''} onClick={() => setActiveKdsTab('preparing')}>Preparing (2)</span>
                    <span className={activeKdsTab === 'ready' ? 'active' : ''} onClick={() => setActiveKdsTab('ready')}>Ready (1)</span>
                  </div>

                  <div className="kds-cards-container">
                    <div className="kds-card">
                      <div className="kds-card-head">
                        <div>
                          <strong>Table 5</strong> <small>#ORD-1052</small>
                          <div className="time-sub">10:42 AM</div>
                        </div>
                        <span className="status-tag tag-yellow">Placed</span>
                      </div>
                      <ul className="kds-item-list">
                        <li>1 x Paneer Tikka</li>
                        <li>1 x Veg Biryani</li>
                        <li>1 x Masala Lemonade</li>
                      </ul>
                      <div className="kds-btn-group">
                        <button className="kds-btn btn-confirm">Confirm</button>
                        <button className="kds-btn btn-reject">Reject</button>
                      </div>
                    </div>

                    <div className="kds-card">
                      <div className="kds-card-head">
                        <div>
                          <strong>Table 2</strong> <small>#ORD-1051</small>
                          <div className="time-sub">10:40 AM</div>
                        </div>
                        <span className="status-tag tag-orange">Preparing</span>
                      </div>
                      <ul className="kds-item-list">
                        <li>2 x Veg Spring Rolls</li>
                        <li>1 x Margherita Pizza</li>
                      </ul>
                      <button className="kds-btn btn-ready-action">Mark as Ready</button>
                    </div>

                    <div className="kds-card">
                      <div className="kds-card-head">
                        <div>
                          <strong>Table 1</strong> <small>#ORD-1050</small>
                          <div className="time-sub">10:35 AM</div>
                        </div>
                        <span className="status-tag tag-green">Ready</span>
                      </div>
                      <ul className="kds-item-list">
                        <li>1 x Veg Biryani</li>
                      </ul>
                      <button className="kds-btn btn-served-action">Mark as Served</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flow-arrow hide-mobile"><ArrowRight size={24} /></div>

            {/* 5. Billing / Pay Frame */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num staff-num">5</span>
                <div>
                  <h3>Billing / Pay</h3>
                  <p>Generate bill, collect payment and complete</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen billing-screen-mock">
                  <div className="search-mock-bar">
                    <Search size={14} />
                    <span>Unpaid Orders</span>
                  </div>

                  <div className="unpaid-order-item">
                    <div>
                      <strong>Table 5</strong> <small>#ORD-1052</small>
                      <div className="time-sub">10:42 AM</div>
                    </div>
                    <div className="unpaid-price">
                      <strong>₹ 580</strong>
                      <span className="unpaid-badge">Unpaid</span>
                    </div>
                  </div>

                  <div className="bill-summary-mock">
                    <div className="summary-title">Bill Summary</div>
                    <div className="summary-row"><span>Paneer Tikka</span><span>₹ 220</span></div>
                    <div className="summary-row"><span>Veg Biryani</span><span>₹ 280</span></div>
                    <div className="summary-row"><span>Masala Lemonade</span><span>₹ 80</span></div>
                    <hr className="divider-line" />
                    <div className="summary-row"><span>Subtotal</span><span>₹ 580</span></div>
                    <div className="summary-row"><span>Tax (0%)</span><span>₹ 0</span></div>
                    <div className="summary-row total-row"><strong>Total</strong><strong>₹ 580</strong></div>
                  </div>

                  <div className="payment-method-title">Payment Method</div>
                  <div className="pm-methods-row">
                    <button className="pm-chip active">Cash</button>
                    <button className="pm-chip">Card</button>
                    <button className="pm-chip">UPI</button>
                  </div>

                  <button className="btn-mock btn-emerald">Record Payment</button>
                  <button className="btn-mock btn-outline-green">✓ Mark as Completed</button>

                  <div className="bottom-nav-mock">
                    <div className="nav-icon"><Home size={14} /><span>Home</span></div>
                    <div className="nav-icon"><ReceiptText size={14} /><span>Setup</span></div>
                    <div className="nav-icon"><Coffee size={14} /><span>Menu</span></div>
                    <div className="nav-icon"><UserRound size={14} /><span>Waiter</span></div>
                    <div className="nav-icon active"><IndianRupee size={14} /><span>Pay</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* HORIZONTAL FLOW PIPELINE OVERVIEW */}
      {activeTab === 'all' && (
        <div className="flow-pipeline-bar">
          <div className="pipe-step"><LogIn size={18} /><span>Login</span></div>
          <ChevronRight size={18} className="pipe-arrow" />
          <div className="pipe-step"><Home size={18} /><span>Dashboard</span></div>
          <ChevronRight size={18} className="pipe-arrow" />
          <div className="pipe-step"><UserRound size={18} /><span>Waiter <small>(Take Order)</small></span></div>
          <ChevronRight size={18} className="pipe-arrow" />
          <div className="pipe-step"><ChefHat size={18} /><span>Kitchen <small>(Prepare)</small></span></div>
          <ChevronRight size={18} className="pipe-arrow" />
          <div className="pipe-step"><CreditCard size={18} /><span>Billing <small>(Collect Payment)</small></span></div>
          <ChevronRight size={18} className="pipe-arrow" />
          <div className="pipe-step done"><CheckCircle2 size={18} /><span>Completed <small>(Order Done)</small></span></div>
        </div>
      )}

      {/* SECTION 2: CUSTOMER FLOW */}
      {(activeTab === 'all' || activeTab === 'customer') && (
        <section className="flow-section customer-flow-section">
          <div className="section-pill customer-pill">
            <QrCode size={18} />
            <span>CUSTOMER FLOW (Dine-in via QR)</span>
          </div>

          <div className="frames-grid customer-grid">
            {/* 1. Scan QR */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num customer-num">1</span>
                <div>
                  <h3>Scan QR</h3>
                  <p>Customer scans table QR code</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar dark-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen scanner-screen-mock">
                  <div className="screen-title-bar dark">
                    <span>‹ Scan QR Code</span>
                    <Search size={14} />
                  </div>
                  <div className="camera-viewfinder">
                    <div className="qr-box">
                      <QrCode size={100} className="qr-svg-icon" />
                    </div>
                  </div>
                  <p className="scanner-instruction">Point camera at table QR code</p>
                </div>
              </div>
            </div>

            <div className="flow-arrow hide-mobile"><ArrowRight size={24} /></div>

            {/* 2. Menu */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num customer-num">2</span>
                <div>
                  <h3>Menu</h3>
                  <p>Browse menu and add items</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen customer-menu-mock">
                  <div className="screen-header-bar">
                    <span>Green Leaf Restaurant - Table 5 ▼</span>
                    <span>🔔</span>
                  </div>

                  <div className="menu-cat-pills">
                    <span className="cat-pill active">All</span>
                    <span className="cat-pill">Starters</span>
                    <span className="cat-pill">Main Course</span>
                    <span className="cat-pill">Beverages</span>
                  </div>

                  <div className="customer-menu-items">
                    <div className="c-item-card">
                      <div className="c-item-img">🥘</div>
                      <div className="c-item-info">
                        <strong>Paneer Tikka</strong>
                        <span>₹ 220</span>
                      </div>
                      <button className="add-btn">+ Add</button>
                    </div>

                    <div className="c-item-card">
                      <div className="c-item-img">🍲</div>
                      <div className="c-item-info">
                        <strong>Veg Biryani</strong>
                        <span>₹ 280</span>
                      </div>
                      <button className="add-btn">+ Add</button>
                    </div>

                    <div className="c-item-card">
                      <div className="c-item-img">🥟</div>
                      <div className="c-item-info">
                        <strong>Veg Spring Rolls</strong>
                        <span>₹ 150</span>
                      </div>
                      <button className="add-btn">+ Add</button>
                    </div>

                    <div className="c-item-card">
                      <div className="c-item-img">🍹</div>
                      <div className="c-item-info">
                        <strong>Masala Lemonade</strong>
                        <span>₹ 80</span>
                      </div>
                      <button className="add-btn">+ Add</button>
                    </div>
                  </div>

                  <div className="floating-cart-bar">
                    <span>View Cart (2)</span>
                    <strong>₹ 500 ›</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flow-arrow hide-mobile"><ArrowRight size={24} /></div>

            {/* 3. Cart */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num customer-num">3</span>
                <div>
                  <h3>Cart</h3>
                  <p>Review items and place order</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen cart-screen-mock">
                  <div className="top-nav-title">
                    <span>‹ Your Cart</span>
                  </div>

                  <div className="cart-item-list">
                    <div className="cart-row">
                      <div className="cart-thumb">🥘</div>
                      <div className="cart-desc">
                        <strong>Paneer Tikka</strong>
                        <span>₹ 220</span>
                      </div>
                      <div className="cart-qty-box">- 1 + 🗑️</div>
                    </div>

                    <div className="cart-row">
                      <div className="cart-thumb">🍲</div>
                      <div className="cart-desc">
                        <strong>Veg Biryani</strong>
                        <span>₹ 280</span>
                      </div>
                      <div className="cart-qty-box">- 1 + 🗑️</div>
                    </div>

                    <div className="cart-row">
                      <div className="cart-thumb">🍹</div>
                      <div className="cart-desc">
                        <strong>Masala Lemonade</strong>
                        <span>₹ 80</span>
                      </div>
                      <div className="cart-qty-box">- 1 + 🗑️</div>
                    </div>
                  </div>

                  <div className="cart-total-block">
                    <div className="summary-row"><span>Subtotal</span><span>₹ 580</span></div>
                    <div className="summary-row total-row"><strong>Total</strong><strong>₹ 580</strong></div>
                  </div>

                  <button className="btn-mock btn-emerald flex-btn">Place Order</button>
                </div>
              </div>
            </div>

            <div className="flow-arrow hide-mobile"><ArrowRight size={24} /></div>

            {/* 4. Order Confirmation */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num customer-num">4</span>
                <div>
                  <h3>Order Confirmation</h3>
                  <p>Order placed successfully</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen confirmation-screen-mock">
                  <div className="success-check-circle">
                    <Check size={36} />
                  </div>
                  <h2>Order Placed!</h2>
                  <p className="conf-sub">Thank you. Your order has been received.</p>

                  <div className="conf-details-card">
                    <div className="conf-row"><span>Order ID</span><strong>#ORD-1052</strong></div>
                    <div className="conf-row"><span>Table</span><strong>Table 5</strong></div>
                  </div>

                  <p className="notify-text">We will notify you when your order is ready.</p>

                  <button className="btn-mock btn-emerald flex-btn">View Order Status</button>
                </div>
              </div>
            </div>

            <div className="flow-arrow hide-mobile"><ArrowRight size={24} /></div>

            {/* 5. Order Status */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num customer-num">5</span>
                <div>
                  <h3>Order Status</h3>
                  <p>Track real-time order status</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen status-screen-mock">
                  <div className="status-order-head">
                    <h2>Order #ORD-1052</h2>
                    <p>Table 5</p>
                  </div>

                  <div className="timeline-mock">
                    <div className="tl-step done">
                      <div className="tl-icon">✓</div>
                      <div className="tl-label">Placed</div>
                      <div className="tl-time">10:42 AM</div>
                    </div>

                    <div className="tl-step done">
                      <div className="tl-icon">✓</div>
                      <div className="tl-label">Confirmed</div>
                      <div className="tl-time">10:43 AM</div>
                    </div>

                    <div className="tl-step active">
                      <div className="tl-icon">●</div>
                      <div className="tl-label">Preparing</div>
                      <div className="tl-time">10:45 AM</div>
                    </div>

                    <div className="tl-step pending">
                      <div className="tl-icon">○</div>
                      <div className="tl-label">Ready</div>
                      <div className="tl-time">--</div>
                    </div>

                    <div className="tl-step pending">
                      <div className="tl-icon">○</div>
                      <div className="tl-label">Served</div>
                      <div className="tl-time">--</div>
                    </div>
                  </div>

                  <p className="notify-text">We will notify you when your order is ready.</p>
                </div>
              </div>
            </div>

            <div className="flow-arrow hide-mobile"><ArrowRight size={24} /></div>

            {/* 6. Enjoy & Pay at Counter */}
            <div className="frame-card">
              <div className="frame-header">
                <span className="step-num customer-num">6</span>
                <div>
                  <h3>Enjoy & Pay at Counter</h3>
                  <p>Wait for service and pay at billing</p>
                </div>
              </div>
              <div className="phone-mockup">
                <div className="phone-status-bar">
                  <span>9:41</span>
                  <div className="status-icons">📶 🔋</div>
                </div>
                <div className="phone-screen enjoy-screen-mock">
                  <div className="enjoy-illustration">
                    🥗 🍹 🍲
                  </div>
                  <h2>Enjoy your meal!</h2>
                  <p className="enjoy-sub">Please pay at the billing counter.</p>
                  <div className="smiley-face">😊</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER KEY POINTS & MVP FOCUS */}
      <footer className="workflow-footer">
        <div className="footer-card key-points-card">
          <h3>Key Points</h3>
          <ul className="points-list">
            <li><Check size={16} className="text-emerald" /> No customer login required</li>
            <li><Check size={16} className="text-emerald" /> QR based table ordering</li>
            <li><Check size={16} className="text-emerald" /> Real-time updates using Supabase</li>
            <li><Check size={16} className="text-emerald" /> Focus on dine-in operations</li>
            <li><Check size={16} className="text-emerald" /> Manual payments for now</li>
          </ul>
        </div>

        <div className="footer-card mvp-focus-card">
          <h3>⭐ MVP Focus</h3>
          <ul className="points-list">
            <li>• Dine-in ordering</li>
            <li>• Manual payments</li>
            <li>• Basic reports</li>
            <li>• Fast and easy daily use</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
