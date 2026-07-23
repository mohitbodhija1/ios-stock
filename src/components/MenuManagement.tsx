import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Loader2, X, ImagePlus, Pencil } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { restaurantService } from '../services/restaurantService';
import { currency } from '../utils/formatters';
import { useToast } from './Toast';
import type { useSnapshot } from '../hooks/useSnapshot';
import type { MenuItem } from '../types';

export function MenuManagement({ snapshot }: { snapshot: ReturnType<typeof useSnapshot> }) {
  const toast = useToast();
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState('');
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemTax, setItemTax] = useState('0');
  const [itemCategory, setItemCategory] = useState(snapshot.categories[0]?.id || '');
  const [foodType, setFoodType] = useState<'vegetarian' | 'non_vegetarian' | 'beverage' | 'vegan'>('vegetarian');
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [selectedAreaId, setSelectedAreaId] = useState(snapshot.diningAreas[0]?.id || '');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRTableId, setSelectedQRTableId] = useState(snapshot.tables[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setItemImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setItemImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function resetItemForm() {
    setItemName('');
    setItemPrice('');
    setItemTax('0');
    setItemCategory(snapshot.categories[0]?.id || '');
    setFoodType('vegetarian');
    setItemImageFile(null);
    setItemImagePreview('');
    setEditingItemId('');
  }

  function openAddItemModal() {
    resetItemForm();
    setShowAddItemModal(true);
  }

  function openEditItemModal(item: MenuItem) {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemPrice(String(item.basePrice));
    setItemTax(String(item.taxPercentage));
    setItemCategory(item.categoryId);
    setFoodType(item.foodType);
    setItemImageFile(null);
    setItemImagePreview(item.imageUrl || '');
    setShowAddItemModal(true);
  }

  function closeItemModal() {
    setShowAddItemModal(false);
    resetItemForm();
  }

  useEffect(() => {
    if (!selectedAreaId && snapshot.diningAreas.length > 0) {
      setSelectedAreaId(snapshot.diningAreas[0].id);
    }
  }, [snapshot.diningAreas]);

  useEffect(() => {
    if (!selectedQRTableId && snapshot.tables.length > 0) {
      setSelectedQRTableId(snapshot.tables[0].id);
    }
  }, [snapshot.tables]);

  const filteredItems = snapshot.menuItems.filter((item) => {
    const matchesCategory = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await restaurantService.createMenuCategory(categoryName.trim(), snapshot.location.id, snapshot.organization.id);
      setCategoryName('');
      setShowAddCategoryModal(false);
      snapshot.refresh();
      toast.success('Menu category created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice) return;
    setIsSubmitting(true);
    try {
      const wasEditing = Boolean(editingItemId);
      let imageUrl: string | undefined;
      if (itemImageFile) {
        imageUrl = await restaurantService.uploadMenuItemImage(itemImageFile, snapshot.organization.id);
      }
      const itemPayload = {
        name: itemName.trim(),
        basePrice: Number(itemPrice),
        taxPercentage: Number(itemTax),
        foodType,
        categoryId: itemCategory || snapshot.categories[0]?.id || '',
        locationId: snapshot.location.id,
        imageUrl
      };

      if (editingItemId) {
        await restaurantService.updateMenuItem(editingItemId, itemPayload);
      } else {
        await restaurantService.createMenuItem({
          ...itemPayload,
          orgId: snapshot.organization.id
        });
      }

      closeItemModal();
      snapshot.refresh();
      toast.success(wasEditing ? 'Menu item updated successfully!' : 'Menu item added successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save item');
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

  const downloadQRCode = () => {
    const canvas = document.getElementById('menu-qr-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error('QR code element not found.');
      return;
    }
    const selectedTable = snapshot.tables.find((t) => t.id === selectedQRTableId);
    const tableNum = selectedTable ? selectedTable.tableNumber : 'general';
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${snapshot.organization.slug || 'menu'}_table_${tableNum}_qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success('QR Code downloaded successfully!');
  };

  return (
    <section className="stack menu-admin-screen">
      <div className="menu-header-bar">
        <div>
          <h1 className="menu-header-title">Menu Management</h1>
          <p className="menu-header-subtitle">Manage menu items, prices and live stock availability</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="subtle-button compact" onClick={() => setShowAddCategoryModal(true)}>
            + Category
          </button>
          <button className="subtle-button compact" onClick={() => setShowAddTableModal(true)}>
            + Table
          </button>
          <button className="subtle-button compact" onClick={() => setShowQRModal(true)}>
            Menu QR
          </button>
          <button className="primary-action compact" onClick={openAddItemModal}>
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

      {showQRModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '360px', textAlign: 'center' }}>
            <h2>Menu QR Code</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '15px' }}>
              Generate and download table-specific ordering QR codes for your customers.
            </p>
            {snapshot.tables.length === 0 ? (
              <div style={{ padding: '20px 0' }}>
                <p style={{ color: 'var(--accent)', fontWeight: 'bold' }}>No tables setup yet.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>Please add a dining table first before generating QR codes.</p>
                <div style={{ marginTop: '20px' }}>
                  <button type="button" className="primary-action wide" onClick={() => setShowQRModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="stack" style={{ gap: '15px' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label>Select Table / Area</label>
                  <select
                    value={selectedQRTableId}
                    onChange={(e) => setSelectedQRTableId(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    {snapshot.tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.displayName} ({snapshot.diningAreas.find((a) => a.id === t.diningAreaId)?.name || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <QRCodeCanvas
                    id="menu-qr-canvas"
                    value={
                      (() => {
                        const selectedTable = snapshot.tables.find((t) => t.id === selectedQRTableId) || snapshot.tables[0];
                        return selectedTable ? `${window.location.origin}/r/${snapshot.organization.slug}/table/${selectedTable.publicToken}` : '';
                      })()
                    }
                    size={180}
                    includeMargin
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px', color: 'var(--dark)' }}>
                    {snapshot.tables.find((t) => t.id === selectedQRTableId)?.displayName || 'Table'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Scan to View Menu & Order
                  </span>
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button type="button" className="subtle-button" style={{ flex: 1 }} onClick={() => setShowQRModal(false)}>
                    Close
                  </button>
                  <button type="button" className="primary-action" style={{ flex: 1 }} onClick={downloadQRCode}>
                    Download PNG
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddItemModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>{editingItemId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
            <form onSubmit={handleSaveItem}>
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
                <label>Tax Percentage (%)</label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                  value={itemTax}
                  onChange={(e) => setItemTax(e.target.value)}
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
              <div className="form-group">
                <label>Item Photo (optional)</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImagePick}
                />
                {itemImagePreview ? (
                  <div className="img-upload-preview" onClick={() => imageInputRef.current?.click()}>
                    <img src={itemImagePreview} alt="Preview" />
                    <button
                      type="button"
                      className="img-remove-btn"
                      onClick={(e) => { e.stopPropagation(); setItemImageFile(null); setItemImagePreview(''); }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="img-upload-zone" onClick={() => imageInputRef.current?.click()}>
                    <ImagePlus size={22} color="var(--muted)" />
                    <span>Click to upload food photo</span>
                    <small>JPG, PNG, WebP — max 5MB</small>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="subtle-button" onClick={closeItemModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editingItemId ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="menu-controls-row">
        <div className="search-field menu-search">
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            placeholder="Search menu items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="ghost-icon" onClick={() => setSearchQuery('')} style={{ padding: 2 }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="customer-tabs menu-category-tabs">
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
      </div>

      <div className="menu-grid-container">
        {filteredItems.length === 0 ? (
          <div className="empty-menu-state">
            <BookOpen size={36} color="var(--muted)" />
            <p>No menu items found</p>
            <small>Try selecting another category or click "+ Item" to add new items.</small>
          </div>
        ) : (
          filteredItems.map((item) => (
            <article key={item.id} className={`modern-menu-card ${!item.isAvailable ? 'out-of-stock' : ''}`}>
              <div className="menu-card-header">
                <div className="food-badge-wrapper">
                  <span className={`food-type-icon ${item.foodType}`} />
                  <span className="food-type-name">{item.foodType.replace('_', ' ')}</span>
                </div>
                <button
                  className={`stock-toggle-btn ${item.isAvailable ? 'in-stock' : 'out-stock'}`}
                  onClick={async () => {
                    await restaurantService.toggleMenuItemAvailability(item.id, !item.isAvailable);
                    snapshot.refresh();
                  }}
                  title="Click to toggle stock status"
                >
                  <span className="toggle-indicator" />
                  <span>{item.isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                </button>
              </div>

              <div className="menu-card-body">
                <h3 className="menu-card-title">{item.name}</h3>
                {item.description && <p className="menu-card-desc">{item.description}</p>}
              </div>

              <div className="menu-card-footer">
                <div className="price-tag">
                  <span className="price-val">{currency.format(item.basePrice)}</span>
                  <small className="tax-note">+{item.taxPercentage}% tax</small>
                </div>
                <div className="menu-card-footer-actions">
                  <span className="category-tag">
                    {snapshot.categories.find((c) => c.id === item.categoryId)?.name || 'General'}
                  </span>
                  <button className="menu-edit-btn" type="button" onClick={() => openEditItemModal(item)}>
                    <Pencil size={13} />
                    Edit
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function MenuItemCard({ item, action }: { item: MenuItem; action?: JSX.Element }) {
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
