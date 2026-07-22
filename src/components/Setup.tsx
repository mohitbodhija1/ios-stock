import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2 } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';
import { useToast } from './Toast';
import type { useSnapshot } from '../hooks/useSnapshot';

export function Setup({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const toast = useToast();
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
      toast.success('Dining area added successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add area');
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
      toast.success('Dining table added successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add table');
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
                  Open Customer Order View →
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
