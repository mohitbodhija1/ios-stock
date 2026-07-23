import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  QrCode,
  ChefHat,
  ReceiptText,
  BarChart3,
  Users,
  Building,
  Smartphone,
  Play,
  Check,
  Smile,
  TrendingUp,
  Star,
  ShieldCheck,
  Zap,
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  Send,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Clock,
  Layers,
  HelpCircle,
  CheckCircle2,
  Table,
  Store,
  CreditCard
} from 'lucide-react';
import { BookDemoModal } from './BookDemoModal';

interface LandingPageProps {
  onOpenAuth: () => void;
  userEmail: string | null;
  orgName: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, userEmail, orgName }) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'starters' | 'mains' | 'beverages'>('all');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterSubscribed(false);
        setNewsletterEmail('');
      }, 4000);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="dinedesk-landing-root">
      {/* Interactive Demo Request Modal */}
      <BookDemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

      {/* Main Top Navigation */}
      <header className="dinedesk-navbar">
        <div className="dinedesk-nav-container">
          <div className="dinedesk-brand">
            <div className="brand-icon-box">
              <Utensils size={22} color="#FFFFFF" />
            </div>
            <div className="brand-text-wrap">
              <span className="brand-title">DineDesk</span>
              <span className="brand-subtitle">Restaurant Management</span>
            </div>
          </div>

          <nav className="dinedesk-nav-links">
            <a href="#home" className="nav-link active">Home</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} className="nav-link">Features</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }} className="nav-link">How It Works</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="nav-link">Pricing</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }} className="nav-link">Contact</a>
          </nav>

          <div className="dinedesk-nav-actions">
            {userEmail ? (
              <Link to="/app" className="dinedesk-user-badge">
                <Building size={14} /> {orgName || 'My Restaurant'}
              </Link>
            ) : (
              <button className="nav-btn text-btn" onClick={onOpenAuth}>
                Sign in
              </button>
            )}
            <button className="dinedesk-btn primary-green" onClick={() => setIsDemoModalOpen(true)}>
              Book a Demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="dinedesk-hero-section">
        <div className="hero-grid-container">
          {/* Left Text Content */}
          <div className="hero-content">
            <div className="hero-top-badge">
              <span>Built for Restaurants. Designed for Operations.</span>
            </div>

            <h1 className="hero-main-title">
              Run Your Restaurant <br />
              <span className="text-highlight-green">Smarter, Together.</span>
            </h1>

            <p className="hero-description">
              DineDesk is a complete restaurant management platform that helps your staff take orders, manage kitchen operations, and simplify billing — all in one place.
            </p>

            {/* Feature Highlights Pills */}
            <div className="hero-feature-tags">
              <div className="feature-pill">
                <QrCode size={16} className="pill-icon" />
                <span>QR Table Ordering</span>
              </div>
              <div className="feature-pill">
                <ChefHat size={16} className="pill-icon" />
                <span>Live Kitchen</span>
              </div>
              <div className="feature-pill">
                <ReceiptText size={16} className="pill-icon" />
                <span>Easy Billing</span>
              </div>
              <div className="feature-pill">
                <BarChart3 size={16} className="pill-icon" />
                <span>Real-time Reports</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hero-cta-group">
              <button className="dinedesk-btn hero-primary-btn" onClick={() => setIsDemoModalOpen(true)}>
                Start Free Trial
              </button>
              <button className="dinedesk-btn hero-outline-btn" onClick={() => scrollToSection('how-it-works')}>
                <Play size={14} fill="currentColor" /> See How It Works
              </button>
            </div>

            {/* Micro Guarantees */}
            <div className="hero-guarantees">
              <div className="guarantee-item">
                <Check size={16} className="text-emerald" />
                <span>No credit card required</span>
              </div>
              <div className="guarantee-item">
                <Check size={16} className="text-emerald" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>

          {/* Right Visual Mockups Composition (Laptop + Table QR Stand + Smartphone) */}
          <div className="hero-visual-stage">
            {/* Laptop / Tablet Dashboard Mockup */}
            <div className="tablet-mockup-frame">
              <div className="tablet-screen-header">
                <div className="screen-brand">
                  <Utensils size={14} color="#047857" />
                  <strong>Green Leaf Restaurant</strong>
                  <span className="screen-tag">Dashboard</span>
                </div>
                <div className="screen-user-avatar">
                  <div className="avatar-dot" />
                  <span>Manager</span>
                </div>
              </div>

              <div className="tablet-screen-body">
                {/* Mini Sidebar */}
                <div className="mock-sidebar">
                  <div className="sidebar-item active"><Utensils size={12} /> <span>Home</span></div>
                  <div className="sidebar-item"><Table size={12} /> <span>Setup</span></div>
                  <div className="sidebar-item"><Layers size={12} /> <span>Menu</span></div>
                  <div className="sidebar-item"><Users size={12} /> <span>Waiter</span></div>
                  <div className="sidebar-item"><ChefHat size={12} /> <span>Kitchen</span></div>
                  <div className="sidebar-item"><ReceiptText size={12} /> <span>Pay</span></div>
                  <div className="sidebar-item"><BarChart3 size={12} /> <span>Reports</span></div>
                </div>

                {/* Main Dashboard Content */}
                <div className="mock-main-content">
                  {/* Top Stats Row */}
                  <div className="mock-stats-row">
                    <div className="mock-stat-card">
                      <span className="stat-label">Active Orders</span>
                      <strong className="stat-num">12</strong>
                      <small className="stat-sub">View all orders</small>
                    </div>

                    <div className="mock-stat-card purple-accent">
                      <span className="stat-label">Occupied Tables</span>
                      <strong className="stat-num">8 <small>/ 20</small></strong>
                      <div className="occupancy-bar">
                        <div className="occupancy-fill" style={{ width: '40%' }} />
                      </div>
                      <span className="stat-percent">40%</span>
                    </div>

                    <div className="mock-stat-card green-accent">
                      <span className="stat-label">Today's Revenue</span>
                      <strong className="stat-num">₹ 18,450</strong>
                      <small className="stat-trend">↑ +21.5% today</small>
                      {/* Mini Line Chart SVG */}
                      <svg className="mini-chart" viewBox="0 0 100 24">
                        <path
                          d="M0 20 Q 20 18, 40 12 T 70 8 T 100 2"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Recent Orders Table */}
                  <div className="mock-orders-table">
                    <div className="table-header-row">
                      <span>Recent Orders</span>
                    </div>
                    <div className="table-row">
                      <strong>Table 5</strong>
                      <span className="order-time">10:42 AM</span>
                      <span className="order-amount">₹ 580</span>
                      <span className="status-badge preparing">Preparing</span>
                    </div>
                    <div className="table-row">
                      <strong>Table 2</strong>
                      <span className="order-time">10:40 AM</span>
                      <span className="order-amount">₹ 420</span>
                      <span className="status-badge confirmed">Confirmed</span>
                    </div>
                    <div className="table-row">
                      <strong>Table 7</strong>
                      <span className="order-time">10:35 AM</span>
                      <span className="order-amount">₹ 750</span>
                      <span className="status-badge ready">Ready</span>
                    </div>
                    <div className="table-row">
                      <strong>Table 1</strong>
                      <span className="order-time">10:30 AM</span>
                      <span className="order-amount">₹ 320</span>
                      <span className="status-badge placed">Placed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Standing Acrylic QR Tent Card */}
            <div className="qr-tent-card">
              <div className="tent-header">
                <strong>Table 5</strong>
                <span>Scan to view menu and place your order</span>
              </div>
              <div className="tent-qr-box">
                {/* SVG QR Pattern */}
                <svg viewBox="0 0 100 100" className="qr-svg-graphic">
                  <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                  {/* Position squares */}
                  <rect x="10" y="10" width="25" height="25" fill="#047857" />
                  <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="18" width="9" height="9" fill="#047857" />

                  <rect x="65" y="10" width="25" height="25" fill="#047857" />
                  <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="73" y="18" width="9" height="9" fill="#047857" />

                  <rect x="10" y="65" width="25" height="25" fill="#047857" />
                  <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="73" width="9" height="9" fill="#047857" />

                  {/* QR Data Dots */}
                  <rect x="42" y="12" width="6" height="6" fill="#047857" />
                  <rect x="52" y="18" width="6" height="6" fill="#047857" />
                  <rect x="42" y="28" width="6" height="6" fill="#047857" />
                  <rect x="12" y="42" width="6" height="6" fill="#047857" />
                  <rect x="25" y="48" width="6" height="6" fill="#047857" />
                  <rect x="42" y="45" width="8" height="8" fill="#047857" />
                  <rect x="55" y="42" width="6" height="6" fill="#047857" />
                  <rect x="75" y="45" width="8" height="8" fill="#047857" />
                  <rect x="45" y="65" width="6" height="6" fill="#047857" />
                  <rect x="62" y="70" width="6" height="6" fill="#047857" />
                  <rect x="78" y="68" width="6" height="6" fill="#047857" />
                  <rect x="50" y="82" width="8" height="8" fill="#047857" />
                  <rect x="70" y="82" width="8" height="8" fill="#047857" />
                </svg>
              </div>
              <div className="tent-base">
                <span>Thank You!</span>
              </div>
            </div>

            {/* Mobile Phone Mockup */}
            <div className="phone-mockup-frame">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="phone-app-header">
                  <div className="phone-table-badge">
                    <strong>Table 5</strong>
                    <small>Green Leaf Restaurant</small>
                  </div>
                  <div className="phone-search-icon">
                    <Search size={14} />
                  </div>
                </div>

                {/* Menu Categories */}
                <div className="phone-categories-bar">
                  <span className={`cat-pill ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</span>
                  <span className={`cat-pill ${activeTab === 'starters' ? 'active' : ''}`} onClick={() => setActiveTab('starters')}>Starters</span>
                  <span className={`cat-pill ${activeTab === 'mains' ? 'active' : ''}`} onClick={() => setActiveTab('mains')}>Main Course</span>
                  <span className={`cat-pill ${activeTab === 'beverages' ? 'active' : ''}`} onClick={() => setActiveTab('beverages')}>Beverages</span>
                </div>

                {/* Food Item Cards */}
                <div className="phone-item-list">
                  <div className="phone-item-card">
                    <div className="item-thumb spring-roll-bg" />
                    <div className="item-info">
                      <strong>Veg Spring Rolls</strong>
                      <span>₹ 120</span>
                    </div>
                    <button className="add-btn">Add</button>
                  </div>

                  <div className="phone-item-card">
                    <div className="item-thumb paneer-bg" />
                    <div className="item-info">
                      <strong>Paneer Tikka</strong>
                      <span>₹ 220</span>
                    </div>
                    <button className="add-btn">Add</button>
                  </div>

                  <div className="phone-item-card">
                    <div className="item-thumb pizza-bg" />
                    <div className="item-info">
                      <strong>Margherita Pizza</strong>
                      <span>₹ 310</span>
                    </div>
                    <button className="add-btn">Add</button>
                  </div>

                  <div className="phone-item-card">
                    <div className="item-thumb biryani-bg" />
                    <div className="item-info">
                      <strong>Veg Biryani</strong>
                      <span>₹ 260</span>
                    </div>
                    <button className="add-btn">Add</button>
                  </div>
                </div>

                {/* Floating Bottom Cart Pill */}
                <div className="phone-cart-pill">
                  <span>View Cart (2)</span>
                  <strong>₹ 340</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "Why DineDesk?" Feature Section */}
      <section id="features" className="dinedesk-section features-section">
        <div className="section-header-center">
          <span className="section-tag-green">Why DineDesk?</span>
          <h2 className="section-title-large">
            Everything You Need to Run a <br />
            Smooth Restaurant Operation
          </h2>
        </div>

        <div className="features-6-grid">
          {/* Card 1 */}
          <div className="feature-box">
            <div className="feature-icon-circle">
              <QrCode size={24} className="icon-emerald" />
            </div>
            <h3 className="feature-box-title">QR Table Ordering</h3>
            <p className="feature-box-desc">
              Let your customers scan, order, and enjoy. No app or login required.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-box">
            <div className="feature-icon-circle">
              <Users size={24} className="icon-emerald" />
            </div>
            <h3 className="feature-box-title">Waiter Friendly</h3>
            <p className="feature-box-desc">
              Fast order taking, table management and instant kitchen updates.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-box">
            <div className="feature-icon-circle">
              <ChefHat size={24} className="icon-emerald" />
            </div>
            <h3 className="feature-box-title">Kitchen Display</h3>
            <p className="feature-box-desc">
              Live orders, clear status updates, and organized kitchen workflow.
            </p>
          </div>

          {/* Card 4 */}
          <div className="feature-box">
            <div className="feature-icon-circle">
              <ReceiptText size={24} className="icon-emerald" />
            </div>
            <h3 className="feature-box-title">Billing & Payments</h3>
            <p className="feature-box-desc">
              Easy billing with Cash, Card or UPI. Mark orders as completed in one tap.
            </p>
          </div>

          {/* Card 5 */}
          <div className="feature-box">
            <div className="feature-icon-circle">
              <BarChart3 size={24} className="icon-emerald" />
            </div>
            <h3 className="feature-box-title">Business Reports</h3>
            <p className="feature-box-desc">
              Track revenue, orders, payments and more with powerful daily reports.
            </p>
          </div>

          {/* Card 6 */}
          <div className="feature-box">
            <div className="feature-icon-circle">
              <Store size={24} className="icon-emerald" />
            </div>
            <h3 className="feature-box-title">Multi-Location</h3>
            <p className="feature-box-desc">
              Manage multiple outlets and staff from a single dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* "How It Works" Section */}
      <section id="how-it-works" className="dinedesk-section workflow-section">
        <div className="section-header-center">
          <span className="section-tag-green">How It Works</span>
          <h2 className="section-title-large">Simple. Fast. Effective.</h2>
        </div>

        <div className="workflow-steps-row">
          {/* Connector Line */}
          <div className="workflow-connector-line" />

          {/* Step 1 */}
          <div className="step-item">
            <div className="step-circle-icon">
              <Store size={24} />
            </div>
            <div className="step-badge-num">1</div>
            <h4 className="step-title">Setup Restaurant</h4>
            <p className="step-desc">
              Add your restaurant, tables, menu and staff in minutes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="step-item">
            <div className="step-circle-icon">
              <QrCode size={24} />
            </div>
            <div className="step-badge-num">2</div>
            <h4 className="step-title">Scan QR Code</h4>
            <p className="step-desc">
              Customer scans the table QR and opens your menu.
            </p>
          </div>

          {/* Step 3 */}
          <div className="step-item">
            <div className="step-circle-icon">
              <Utensils size={24} />
            </div>
            <div className="step-badge-num">3</div>
            <h4 className="step-title">Place Order</h4>
            <p className="step-desc">
              Customer or waiter places the order from the menu.
            </p>
          </div>

          {/* Step 4 */}
          <div className="step-item">
            <div className="step-circle-icon">
              <ChefHat size={24} />
            </div>
            <div className="step-badge-num">4</div>
            <h4 className="step-title">Kitchen Prepares</h4>
            <p className="step-desc">
              Kitchen receives the order and updates status in real-time.
            </p>
          </div>

          {/* Step 5 */}
          <div className="step-item">
            <div className="step-circle-icon">
              <CreditCard size={24} />
            </div>
            <div className="step-badge-num">5</div>
            <h4 className="step-title">Bill & Get Paid</h4>
            <p className="step-desc">
              Generate bill, collect payment and mark order completed.
            </p>
          </div>
        </div>
      </section>

      {/* Dark Forest Green Testimonial & Social Proof Banner */}
      <section className="testimonial-social-banner">
        <div className="banner-inner-grid">
          {/* Quote Block */}
          <div className="quote-block">
            <span className="quote-mark">“</span>
            <p className="quote-text">
              DineDesk has simplified our daily operations. Our staff is more efficient and customers love the QR ordering experience.
            </p>
            <div className="quote-author">
              <strong>— Arjun Mehta</strong>
              <span>Owner, Green Leaf Restaurant</span>
            </div>
          </div>

          {/* Right Stats Block */}
          <div className="stats-block-group">
            <div className="stat-cell">
              <div className="stat-icon-wrap">
                <Smile size={26} />
              </div>
              <strong className="stat-value">500+</strong>
              <span className="stat-label">Happy Restaurants</span>
            </div>

            <div className="stat-cell">
              <div className="stat-icon-wrap">
                <TrendingUp size={26} />
              </div>
              <strong className="stat-value">50K+</strong>
              <span className="stat-label">Orders Managed Daily</span>
            </div>

            <div className="stat-cell">
              <div className="stat-icon-wrap">
                <Star size={26} />
              </div>
              <strong className="stat-value">98%</strong>
              <span className="stat-label">Customer Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA Section */}
      <section id="pricing" className="pre-footer-cta-section">
        <div className="cta-box-container">
          <div className="cta-left-col">
            <h2 className="cta-title">Ready to Transform Your Restaurant?</h2>
            <p className="cta-subtitle">
              Join hundreds of restaurant owners who are growing their business with DineDesk.
            </p>

            <div className="cta-buttons-row">
              <button className="dinedesk-btn cta-btn-solid" onClick={() => setIsDemoModalOpen(true)}>
                Start Free Trial
              </button>
              <button className="dinedesk-btn cta-btn-outline" onClick={() => setIsDemoModalOpen(true)}>
                Book a Demo
              </button>
            </div>
          </div>

          <div className="cta-right-col">
            <div className="cta-perk-item">
              <div className="perk-icon"><Smile size={20} /></div>
              <div className="perk-info">
                <strong>No Setup Fees</strong>
                <p>Start for free, upgrade when you grow.</p>
              </div>
            </div>

            <div className="cta-perk-item">
              <div className="perk-icon"><BarChart3 size={20} /></div>
              <div className="perk-info">
                <strong>Secure & Reliable</strong>
                <p>Your data is safe with enterprise-grade security.</p>
              </div>
            </div>

            <div className="cta-perk-item">
              <div className="perk-icon"><Star size={20} /></div>
              <div className="perk-info">
                <strong>Always Improving</strong>
                <p>We continuously build new features for your success.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="dinedesk-footer-root">
        <div className="footer-columns-grid">
          {/* Brand Col */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <div className="brand-icon-box small">
                <Utensils size={18} color="#FFFFFF" />
              </div>
              <span className="brand-title">DineDesk</span>
            </div>
            <p className="brand-tagline">
              All-in-one restaurant management solution for modern restaurants.
            </p>
          </div>

          {/* Product Col */}
          <div className="footer-col">
            <h5 className="footer-heading">Product</h5>
            <ul className="footer-links-list">
              <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a></li>
              <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Pricing</a></li>
              <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>What's New</a></li>
            </ul>
          </div>

          {/* Company Col */}
          <div className="footer-col">
            <h5 className="footer-heading">Company</h5>
            <ul className="footer-links-list">
              <li><a href="#home">About Us</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#home">Careers</a></li>
            </ul>
          </div>

          {/* Support Col */}
          <div className="footer-col">
            <h5 className="footer-heading">Support</h5>
            <ul className="footer-links-list">
              <li><a href="#home">Help Center</a></li>
              <li><a href="#home">Privacy Policy</a></li>
              <li><a href="#home">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Stay Connected Col */}
          <div className="footer-col newsletter-col">
            <h5 className="footer-heading">Stay Connected</h5>
            <p className="newsletter-desc">
              Get updates and tips to grow your restaurant business.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-submit-btn" title="Subscribe">
                <Send size={14} />
              </button>
            </form>
            {newsletterSubscribed && (
              <p className="newsletter-success-toast">✓ Thank you for subscribing!</p>
            )}
          </div>
        </div>

        {/* Bottom copyright & socials bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} DineDesk. All rights reserved.
          </p>
          <div className="social-links-row">
            <a href="#" className="social-icon" aria-label="Facebook"><Facebook size={16} /></a>
            <a href="#" className="social-icon" aria-label="Instagram"><Instagram size={16} /></a>
            <a href="#" className="social-icon" aria-label="Twitter"><Twitter size={16} /></a>
            <a href="#" className="social-icon" aria-label="LinkedIn"><Linkedin size={16} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};
