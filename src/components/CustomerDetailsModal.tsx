import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export function CustomerDetailsModal({
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
