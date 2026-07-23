import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { restaurantService } from '../services/restaurantService';
import { LogIn, UserPlus, Building2, Store, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AuthProps {
  onAuthComplete: () => void;
}

export function AuthModal({ onAuthComplete }: AuthProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup' | 'onboarding'>('login');
  
  // Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Onboarding Form Fields
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [locName, setLocName] = useState('Main Branch');
  const [locSlug, setLocSlug] = useState('main');
  const [city, setCity] = useState('Delhi');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkExistingOrg();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkExistingOrg();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkExistingOrg() {
    try {
      const snapshot = await restaurantService.fetchTenantSnapshot();
      // If organization exists, we're ready
      if (snapshot.organization.id) {
        onAuthComplete();
      } else {
        // Check if there is an org in Supabase
        const { data } = await supabase!.from('organizations').select('id').limit(1);
        if (data && data.length > 0) {
          onAuthComplete();
        } else {
          setMode('onboarding');
        }
      }
    } catch (err) {
      console.error(err);
      setMode('onboarding');
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured.');
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        
        if (data?.session) {
          setSuccessMsg('Account created successfully! Checking organization...');
          await checkExistingOrg();
        } else {
          setSuccessMsg('Registration successful! Please check your email to confirm your account, then sign in.');
          setMode('login');
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setSuccessMsg('Logged in successfully!');
        await checkExistingOrg();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        throw new Error('No active session found. Please sign in or confirm your email to activate your account.');
      }

      const slugifiedOrg = orgSlug || orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slugifiedLoc = locSlug || locName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      await restaurantService.createOrganizationWithOwner(
        orgName,
        slugifiedOrg,
        locName,
        slugifiedLoc,
        city
      );
      setSuccessMsg('Restaurant onboarded successfully!');
      onAuthComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create organization.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-overlay">
        <div className="auth-card flex-center">
          <Loader2 className="animate-spin" size={32} />
          <p>Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        {mode === 'onboarding' ? (
          <form onSubmit={handleOnboarding} className="auth-form">
            <div className="auth-header">
              <Building2 size={36} className="brand-icon" />
              <h2>Onboard Your Restaurant</h2>
              <p>Set up your organization and first branch in Supabase.</p>
            </div>

            {errorMsg && <div className="auth-error"><AlertCircle size={16} /> {errorMsg}</div>}
            {successMsg && <div className="auth-success"><CheckCircle size={16} /> {successMsg}</div>}

            <label className="field-label">
              <span>Restaurant / Brand Name *</span>
              <input
                type="text"
                required
                placeholder="e.g. Urban Bistro"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  if (!orgSlug) setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
              />
            </label>

            <label className="field-label">
              <span>Brand URL Slug</span>
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
                <span>Branch Location Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Dining"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                />
              </label>

              <label className="field-label">
                <span>City *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
            </div>

            <button type="submit" className="primary-action wide" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Restaurant & Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="auth-form">
            <div className="auth-header">
              <Store size={36} className="brand-icon" />
              <h2>{mode === 'login' ? 'Staff Sign In' : 'Register Manager Account'}</h2>
              <p>Access your live Supabase restaurant dashboard.</p>
            </div>

            {errorMsg && <div className="auth-error"><AlertCircle size={16} /> {errorMsg}</div>}
            {successMsg && <div className="auth-success"><CheckCircle size={16} /> {successMsg}</div>}

            {mode === 'signup' && (
              <label className="field-label">
                <span>Full Name</span>
                <input
                  type="text"
                  required
                  placeholder="Manager Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
            )}

            <label className="field-label">
              <span>Email Address</span>
              <input
                type="email"
                required
                placeholder="manager@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="field-label">
              <span>Password</span>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button type="submit" className="primary-action wide" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={18} /> Sign In
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Register Account
                </>
              )}
            </button>

            <div className="auth-toggle">
              {mode === 'login' ? (
                <p>
                  New restaurant?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="link-button">
                    Register Here
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('login')} className="link-button">
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
