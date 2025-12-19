import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

interface Tour {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const HomePage = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  useEffect(() => {
    api.get('/tours')
      .then(res => setTours(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="body-app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo-circle">🌍</div>
          <div>
            <div className="topbar-title">Turismo VIP</div>
            <div className="topbar-subtitle">Experiencias Exclusivas</div>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
        >
          {isLoggedIn ? 'Mi Panel' : 'Ingresar'}
        </button>
      </div>

      <div className="content">
        <h1 className="title" style={{ textAlign: 'center' }}>
          Explora Nuestros Tours
        </h1>

        {loading && <p style={{ textAlign: 'center' }}>Cargando...</p>}

        <div className="cards-grid">
          {tours.map(tour => (
            <div
              key={tour.id}
              className="metric-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/tours/${tour.id}`)}
            >
              <div style={{ height: 200, position: 'relative' }}>
                <img
                  src={
                    tour.images?.[0]
                      ? `${API_URL}/uploads/${tour.images[0]}`
                      : '/placeholder.jpg'
                  }
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* CATEGORÍA */}
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: '#000',
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                >
                  {tour.category}
                </span>

                {/* PRECIO */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    fontWeight: 'bold',
                  }}
                >
                  ${tour.price}
                </span>
              </div>

              <div style={{ padding: 16 }}>
                <h3>{tour.title}</h3>
                <p>{tour.description.slice(0, 70)}...</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
