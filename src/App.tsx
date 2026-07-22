import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { useSnapshot } from './hooks/useSnapshot';
import { AuthModal } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { StaffApp } from './components/StaffApp';
import { CustomerOrder } from './components/CustomerOrder';
import { ToastProvider } from './components/Toast';

function App() {
  const navigate = useNavigate();
  const snapshot = useSnapshot();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email || null);
      });
    }
  }, []);

  return (
    <ToastProvider>
      {showAuthModal && (
        <AuthModal
          onAuthComplete={() => {
            setShowAuthModal(false);
            if (supabase) {
              supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || null));
            }
            snapshot.refresh();
            navigate('/app');
          }}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onOpenAuth={() => setShowAuthModal(true)}
              userEmail={userEmail}
              orgName={snapshot.organization.name}
            />
          }
        />
        <Route path="/r/:restaurantSlug/table/:tableToken" element={<CustomerOrder />} />
        <Route
          path="/app/*"
          element={
            <StaffApp
              snapshot={snapshot}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              setShowAuthModal={setShowAuthModal}
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
              setShowAuthModal={setShowAuthModal}
            />
          }
        />
      </Routes>
    </ToastProvider>
  );
}

export default App;
