import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Loader2, X } from 'lucide-react';
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
  const [categoryName, setCategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemTax, setItemTax] = useState('5');
  const [itemCategory, setItemCategory] = useState(snapshot.categories[0]?.id || '');
  const [foodType, setFoodType] = useState<'vegetarian' | 'non_vegetarian' | 'beverage' | 'vegan'>('vegetarian');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.success('Menu item added successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  }

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
                <span className="category-tag">
                  {snapshot.categories.find((c) => c.id === item.categoryId)?.name || 'General'}
                </span>
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
