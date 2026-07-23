import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { useSnapshot } from './hooks/useSnapshot';
import { AuthModal } from './components/Auth';
import { AdminApp } from './components/AdminApp';
import { LandingPage } from './components/LandingPage';
import { StaffApp } from './components/StaffApp';
import { CustomerOrder } from './components/CustomerOrder';
import { ToastProvider } from './components/Toast';

type AuthDestination = '/admin' | '/app';

function App() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminAuthMode, setAdminAuthMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const snapshot = useSnapshot({
    enabled: !isSupabaseConfigured || Boolean(userEmail)
  });

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email || null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email || null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  function openAuth(options?: { admin?: boolean }) {
    setAdminAuthMode(Boolean(options?.admin));
    setShowAuthModal(true);
  }

  function handleAuthComplete(destination: AuthDestination) {
    setShowAuthModal(false);
    setAdminAuthMode(false);
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || null));
    }
    if (destination === '/app') {
      snapshot.refresh();
    }
    navigate(destination);
  }

  return (
    <ToastProvider>
      {showAuthModal && (
        <AuthModal
          adminMode={adminAuthMode}
          onAuthComplete={handleAuthComplete}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onOpenAuth={() => openAuth()}
              onOpenAdminAuth={() => openAuth({ admin: true })}
              userEmail={userEmail}
              orgName={snapshot.organization.name}
            />
          }
        />
        <Route path="/r/:restaurantSlug/table/:tableToken" element={<CustomerOrder />} />
        <Route
          path="/admin/*"
          element={
            <AdminApp
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              setShowAuthModal={() => openAuth({ admin: true })}
            />
          }
        />
        <Route
          path="/app/*"
          element={
            <StaffApp
              snapshot={snapshot}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              setShowAuthModal={() => openAuth()}
            />
          }
        />
        <Route
          path="/*"
          element={
            <StaffApp
              snapshot={snapshot}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              setShowAuthModal={() => openAuth()}
            />
          }
        />
      </Routes>
    </ToastProvider>
  );
}

export default App;
