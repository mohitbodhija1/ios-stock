import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Clock, Building2, User, Phone, Mail } from 'lucide-react';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    restaurantName: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '11:00 AM',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      restaurantName: '',
      phone: '',
      email: '',
      preferredDate: '',
      preferredTime: '11:00 AM',
    });
    onClose();
  };

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {submitted ? (
          <div className="demo-success-view">
            <div className="success-icon-badge">
              <CheckCircle2 size={48} className="text-emerald" />
            </div>
            <h3 className="demo-modal-title">Demo Request Received!</h3>
            <p className="demo-modal-desc">
              Thank you <strong>{formData.name || 'there'}</strong>! Our restaurant operations specialist will contact you shortly at <strong>{formData.phone || 'your phone number'}</strong> to confirm your personalized live walkthrough.
            </p>
            <div className="demo-summary-box">
              <p><strong>Restaurant:</strong> {formData.restaurantName || 'Your Restaurant'}</p>
              <p><strong>Date & Time:</strong> {formData.preferredDate || 'Upcoming'} at {formData.preferredTime}</p>
            </div>
            <button className="dinedesk-btn primary full-width" onClick={handleReset}>
              Done
            </button>
          </div>
        ) : (
          <div className="demo-form-view">
            <div className="demo-modal-header">
              <span className="demo-tag">Live Product Tour</span>
              <h3 className="demo-modal-title">Book a Personalized Demo</h3>
              <p className="demo-modal-desc">
                See how DineDesk can streamline your kitchen, table QR ordering, and billing operations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="demo-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label><User size={14} /> Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arjun Mehta"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label><Building2 size={14} /> Restaurant Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Green Leaf Cafe"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label><Phone size={14} /> Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label><Mail size={14} /> Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="arjun@restaurant.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label><Calendar size={14} /> Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label><Clock size={14} /> Preferred Time</label>
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="dinedesk-btn primary full-width demo-submit-btn">
                Confirm Demo Request
              </button>

              <p className="demo-privacy-note">
                🔒 No commitment required. We respect your privacy.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
