import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Shield,
  Store,
  UserPlus,
  Utensils
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { adminService } from '../services/adminService';
import type { AdminOrganization, AdminUser } from '../types';

function UserSelect({
  users,
  value,
  onChange,
  required = false,
  placeholder = 'Select a user',
  excludeUserIds = []
}: {
  users: AdminUser[];
  value: string;
  onChange: (userId: string) => void;
  required?: boolean;
  placeholder?: string;
  excludeUserIds?: string[];
}) {
  const availableUsers = users.filter((user) => !excludeUserIds.includes(user.userId));

  return (
    <select
      className="admin-user-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      <option value="">{placeholder}</option>
      {availableUsers.map((user) => (
        <option key={user.userId} value={user.userId}>
          {adminService.formatUserLabel(user)}
        </option>
      ))}
    </select>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function AdminApp({
  userEmail,
  setUserEmail,
  setShowAuthModal
}: {
  userEmail: string | null;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showOnboardForm, setShowOnboardForm] = useState(false);
  const [assigningOrgId, setAssigningOrgId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [locName, setLocName] = useState('Main Branch');
  const [locSlug, setLocSlug] = useState('main');
  const [city, setCity] = useState('Delhi');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');

  const loadData = useCallback(async () => {
    setErrorMsg('');
    try {
      if (!isSupabaseConfigured || !supabase) {
        setIsAdmin(localStorage.getItem('demo_platform_admin') === 'true');
        setOrganizations([]);
        setUsers([]);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const admin = await adminService.isPlatformAdmin();
      setIsAdmin(admin);

      if (admin) {
        const [orgs, allUsers] = await Promise.all([
          adminService.fetchAllOrganizations(),
          adminService.fetchAllUsers()
        ]);
        setOrganizations(orgs);
        setUsers(allUsers);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, userEmail]);

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
      setUserEmail(null);
      navigate('/');
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadData();
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const slugifiedOrg = orgSlug || slugify(orgName);
      const slugifiedLoc = locSlug || slugify(locName);

      const selectedOwner = users.find((user) => user.userId === ownerUserId);

      const result = await adminService.onboardRestaurant({
        orgName,
        orgSlug: slugifiedOrg,
        locationName: locName,
        locationSlug: slugifiedLoc,
        city,
        ownerUserId: ownerUserId || undefined,
        orgEmail: orgEmail || undefined,
        orgPhone: orgPhone || undefined
      });

      if (result.ownerAssigned) {
        setSuccessMsg(
          `Restaurant "${orgName}" created and ${selectedOwner ? adminService.formatUserLabel(selectedOwner) : 'owner'} assigned successfully.`
        );
      } else if (ownerUserId) {
        setSuccessMsg(`Restaurant "${orgName}" created, but the selected owner could not be assigned.`);
      } else {
        setSuccessMsg(`Restaurant "${orgName}" created. Assign an owner when ready.`);
      }

      setShowOnboardForm(false);
      setOrgName('');
      setOrgSlug('');
      setLocName('Main Branch');
      setLocSlug('main');
      setCity('Delhi');
      setOwnerUserId('');
      setOrgEmail('');
      setOrgPhone('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to onboard restaurant.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssignOwner(e: React.FormEvent) {
    e.preventDefault();
    if (!assigningOrgId) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const selectedUser = users.find((user) => user.userId === assignUserId);
      if (!selectedUser) {
        throw new Error('Please select a user.');
      }

      await adminService.assignOwnerByUserId(assigningOrgId, assignUserId);
      setSuccessMsg(`${adminService.formatUserLabel(selectedUser)} assigned as owner successfully.`);
      setAssigningOrgId(null);
      setAssignUserId('');
      await loadData();
    } catch (err: any) {
      const message = err.message?.includes('owner_already_assigned')
        ? 'This user is already an owner of this restaurant.'
        : err.message?.includes('owner_user_not_found')
        ? 'Selected user no longer exists.'
        : err.message || 'Failed to assign owner.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-shell flex-center">
        <Loader2 className="animate-spin" size={32} />
        <p>Loading admin portal...</p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="admin-shell">
        <div className="admin-access-card">
          <Shield size={40} className="brand-icon" />
          <h1>Platform Admin</h1>
          <p>Sign in with your platform administrator account to manage restaurants.</p>
          <button className="primary-action wide" onClick={() => setShowAuthModal(true)}>
            Sign In
          </button>
          <Link to="/" className="admin-back-link">Back to home</Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-shell">
        <div className="admin-access-card">
          <AlertCircle size={40} color="var(--danger)" />
          <h1>Access Denied</h1>
          <p>
            <strong>{userEmail}</strong> is not a platform administrator.
          </p>
          <p className="muted-text">
            Restaurant staff should use the{' '}
            <button type="button" className="link-button" onClick={() => navigate('/app')}>
              staff dashboard
            </button>
            .
          </p>
          <button className="secondary-action wide" onClick={handleSignOut}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const userById = Object.fromEntries(users.map((user) => [user.userId, user]));

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <Link to="/" className="topbar-home-link" title="Home">
            <Utensils size={20} color="var(--purple)" />
          </Link>
          <div>
            <strong>Platform Admin</strong>
            <small>{userEmail}</small>
          </div>
        </div>
        <div className="admin-topbar-actions">
          <button
            className="icon-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button className="icon-btn" onClick={handleSignOut} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-hero">
          <div>
            <h1>Restaurant Onboarding</h1>
            <p>Create and manage restaurant organizations on the platform.</p>
          </div>
          <button className="primary-action" onClick={() => setShowOnboardForm(true)}>
            <Plus size={18} /> Onboard Restaurant
          </button>
        </div>

        <div className="admin-stats-row">
          <article className="admin-stat-card">
            <Store size={20} />
            <div>
              <strong>{organizations.length}</strong>
              <span>Total Restaurants</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <Building2 size={20} />
            <div>
              <strong>{organizations.reduce((sum, org) => sum + org.owners.length, 0)}</strong>
              <span>Total Owners</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <AlertCircle size={20} />
            <div>
              <strong>{organizations.filter((o) => o.owners.length === 0).length}</strong>
              <span>Without Owners</span>
            </div>
          </article>
        </div>

        {errorMsg && (
          <div className="auth-error admin-banner">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="auth-success admin-banner">
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <section className="admin-table-section">
          <h2>All Restaurants</h2>
          {organizations.length === 0 ? (
            <div className="admin-empty-state">
              <Building2 size={32} />
              <p>No restaurants onboarded yet.</p>
              <button className="primary-action" onClick={() => setShowOnboardForm(true)}>
                Onboard First Restaurant
              </button>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Branch</th>
                    <th>Owners</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => {
                    const location = org.locations[0];
                    return (
                      <tr key={org.id}>
                        <td>
                          <strong>{org.name}</strong>
                          <small>/{org.slug}</small>
                        </td>
                        <td>
                          {location ? (
                            <>
                              {location.name}
                              {location.city ? ` · ${location.city}` : ''}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {org.owners.length > 0 ? (
                            <ul className="admin-owner-list">
                              {org.owners.map((owner) => (
                                <li key={owner.userId}>
                                  {userById[owner.userId]
                                    ? adminService.formatUserLabel(userById[owner.userId])
                                    : owner.fullName || 'Owner assigned'}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="admin-pending-badge">No owners</span>
                          )}
                        </td>
                        <td>
                          <span className={`admin-status-badge ${org.status}`}>{org.status}</span>
                        </td>
                        <td>
                          <button
                            className="link-button"
                            onClick={() => {
                              setAssigningOrgId(org.id);
                              setAssignUserId('');
                              setErrorMsg('');
                              setSuccessMsg('');
                            }}
                          >
                            <UserPlus size={14} /> Add Owner
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showOnboardForm && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowOnboardForm(false)}>
          <div className="modal-card admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleOnboard} className="auth-form">
              <div className="auth-header">
                <Building2 size={36} className="brand-icon" />
                <h2>Onboard New Restaurant</h2>
                <p>Create organization, first branch, and optionally assign an owner.</p>
              </div>

              <label className="field-label">
                <span>Restaurant / Brand Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urban Bistro"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (!orgSlug) setOrgSlug(slugify(e.target.value));
                  }}
                />
              </label>

              <label className="field-label">
                <span>Brand URL Slug *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. urban-bistro"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                />
              </label>

              <div className="form-row">
                <label className="field-label">
                  <span>Branch Name *</span>
                  <input
                    type="text"
                    required
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  <span>City *</span>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </label>
              </div>

              <label className="field-label">
                <span>Assign Owner</span>
                <UserSelect
                  users={users}
                  value={ownerUserId}
                  onChange={setOwnerUserId}
                  placeholder="Select owner (optional)"
                />
                <small className="field-hint">
                  Choose a registered user to link as the restaurant owner.
                </small>
              </label>

              <div className="form-row">
                <label className="field-label">
                  <span>Contact Email</span>
                  <input
                    type="email"
                    placeholder="contact@restaurant.com"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  <span>Contact Phone</span>
                  <input
                    type="tel"
                    placeholder="+91 ..."
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                  />
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => setShowOnboardForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assigningOrgId && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setAssigningOrgId(null)}>
          <div className="modal-card admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAssignOwner} className="auth-form">
              <div className="auth-header">
                <UserPlus size={36} className="brand-icon" />
                <h2>Add Owner</h2>
                <p>Add another registered user as a restaurant owner.</p>
              </div>

              <label className="field-label">
                <span>Select Owner *</span>
                <UserSelect
                  users={users}
                  value={assignUserId}
                  onChange={setAssignUserId}
                  required
                  placeholder="Select a user"
                  excludeUserIds={
                    assigningOrgId
                      ? organizations.find((org) => org.id === assigningOrgId)?.owners.map((owner) => owner.userId) || []
                      : []
                  }
                />
                {users.length === 0 && (
                  <small className="field-hint">No registered users found. Ask the owner to sign up first.</small>
                )}
                {assigningOrgId && users.length > 0 && (
                  <small className="field-hint">
                    Users already assigned as owners are hidden from this list.
                  </small>
                )}
              </label>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => setAssigningOrgId(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Add Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}