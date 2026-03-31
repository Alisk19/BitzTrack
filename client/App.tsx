import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import RawMaterials from './pages/RawMaterials';
import PersonalExpenses from './pages/PersonalExpenses';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import Bills from './pages/Bills';
import PageTransition from './components/PageTransition';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Wrapper Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-background-base flex items-center justify-center text-primary font-bold animate-pulse">Loading BitzTrack...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" state={{ showLogin: true }} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    // Only redirect to landing on the exact root path IF it's the very first hit, to ensure "Dare to Start" is seen initially
    if (location.pathname === '/' && !sessionStorage.getItem('hasVisitedLanding')) {
      sessionStorage.setItem('hasVisitedLanding', 'true');
    }
  }, []);

  return (
    <div className="bg-background-base font-display text-foreground-muted min-h-screen flex flex-col">
      {(!isLanding) && <Navbar />}
      <main className="flex-1 bg-background-base">
        <Routes>
          <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><PageTransition><Orders /></PageTransition></ProtectedRoute>} />
          <Route path="/bills" element={<ProtectedRoute><PageTransition><Bills /></PageTransition></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><PageTransition><Customers /></PageTransition></ProtectedRoute>} />
          <Route path="/raw-materials" element={<ProtectedRoute><PageTransition><RawMaterials /></PageTransition></ProtectedRoute>} />
          <Route path="/personal-expenses" element={<ProtectedRoute><PageTransition><PersonalExpenses /></PageTransition></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;