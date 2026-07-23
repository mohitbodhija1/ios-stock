import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { adminService } from '../services/adminService';
import { restaurantService } from '../services/restaurantService';
import { LogIn, UserPlus, Store, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';

interface AuthProps {
  onAuthComplete: (destination: '/admin' | '/app') => void;
  adminMode?: boolean;
}

export function AuthModal({ onAuthComplete, adminMode = false }: AuthProps) {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup' | 'pending'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        resolveDestination();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        resolveDestination();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function resolveDestination() {
    try {
      const isAdmin = await adminService.isPlatformAdmin();
      if (isAdmin || adminMode) {
        onAuthComplete('/admin');
        return;
      }

      const snapshot = await restaurantService.fetchTenantSnapshot();
      if (snapshot.organization.id) {
        onAuthComplete('/app');
        return;
      }

      const { data: memberships } = await supabase!
        .from('organization_members')
        .select('id')
        .limit(1);

      if (memberships && memberships.length > 0) {
        onAuthComplete('/app');
        return;
      }

      setMode('pending');
    } catch (err) {
      console.error(err);
      setMode('pending');
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
          setSuccessMsg('Account created successfully!');
          await resolveDestination();
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
        await resolveDestination();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
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
        {mode === 'pending' ? (
          <div className="auth-form">
            <div className="auth-header">
              <AlertCircle size={36} className="brand-icon" style={{ color: 'var(--warning, #f79009)' }} />
              <h2>Account Not Linked</h2>
              <p>
                Your account is not linked to any restaurant yet. Ask your platform administrator to
                onboard your restaurant and assign you as the owner.
              </p>
            </div>
            <button type="button" className="secondary-action wide" onClick={() => supabase?.auth.signOut()}>
              Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="auth-form">
            <div className="auth-header">
              {adminMode ? <Shield size={36} className="brand-icon" /> : <Store size={36} className="brand-icon" />}
              <h2>
                {adminMode
                  ? 'Platform Admin Sign In'
                  : mode === 'login'
                    ? 'Staff Sign In'
                    : 'Register Account'}
              </h2>
              <p>
                {adminMode
                  ? 'Sign in to onboard and manage restaurants.'
                  : 'Access your restaurant dashboard.'}
              </p>
            </div>

            {errorMsg && <div className="auth-error"><AlertCircle size={16} /> {errorMsg}</div>}
            {successMsg && <div className="auth-success"><CheckCircle size={16} /> {successMsg}</div>}

            {mode === 'signup' && !adminMode && (
              <label className="field-label">
                <span>Full Name</span>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
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
                placeholder={adminMode ? 'admin@yourdomain.com' : 'staff@restaurant.com'}
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

            {!adminMode && (
              <div className="auth-toggle">
                {mode === 'login' ? (
                  <p>
                    New staff member?{' '}
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
            )}
          </form>
        )}
      </div>
    </div>
  );
}
