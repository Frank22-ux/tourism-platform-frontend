import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Público
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import TourDetailPage from './pages/public/TourDetailPage';

// Privado
import AdminDashboard from './pages/admin/AdminDashboard';
import TravelerDashboard from './pages/traveler/TravelerDashboard';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const DashboardGuard = () => {
    if (loading) return <div>Cargando...</div>;
    if (!user) return <Navigate to="/login" replace />;

    if (user.role === 'admin') {
      return <AdminDashboard user={user} logout={logout} />;
    }

    return <TravelerDashboard user={user} logout={logout} />;
  };

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" theme="dark" />

      <Routes>
        {/* Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tours/:id" element={<TourDetailPage />} />

        {/* Privada */}
        <Route path="/dashboard" element={<DashboardGuard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
