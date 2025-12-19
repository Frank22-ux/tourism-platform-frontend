import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';

// URL base para imágenes (Ajustada al puerto 4000)
const API_URL = 'http://localhost:4000';

const TourDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const { data } = await api.get(`/tours/${id}`);
        setTour(data);
        // Seleccionar la primera imagen por defecto si existe
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0]);
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar el tour");
        navigate('/'); // Volver al home si falla
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="body-app" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '2rem', color: 'var(--primary)' }}>Cargando experiencia... ⏳</div>
      </div>
    );
  }

  if (!tour) return null;

  return (
    <div className="body-app">
      
      {/* 1. TOPBAR DE NAVEGACIÓN */}
      <div className="topbar">
        <div className="topbar-left">
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>⬅</span> Volver
          </button>
        </div>
        <div className="topbar-right">
          <div className="topbar-logo-circle">🌍</div>
        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="content" style={{ display: 'flex', justifyContent: 'center' }}>
        
        {/* TARJETA DE DETALLE (GLASS) */}
        <div className="glass" style={{ maxWidth: '1100px', width: '100%', padding: '0', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', md: { flexDirection: 'row' } }} className="tour-detail-grid">
            
            {/* COLUMNA IZQUIERDA: GALERÍA */}
            <div style={{ flex: 1.2, background: '#000', position: 'relative', minHeight: '400px' }}>
              {selectedImage ? (
                <img
                  src={`${API_URL}/uploads/${selectedImage}`}
                  alt={tour.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#555' }}>
                  📸
                </div>
              )}

              {/* Miniaturas */}
              {tour.images && tour.images.length > 1 && (
                <div style={{ 
                  position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', 
                  display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '12px' 
                }}>
                  {tour.images.map((img: string, idx: number) => (
                    <img 
                      key={idx}
                      src={`${API_URL}/uploads/${img}`}
                      onClick={() => setSelectedImage(img)}
                      style={{ 
                        width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer',
                        border: selectedImage === img ? '2px solid var(--primary)' : '2px solid transparent'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: INFORMACIÓN */}
            <div style={{ flex: 0.8, padding: '40px', display: 'flex', flexDirection: 'column' }}>
              
              {/* Categoría y Stock */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <span className="badge" style={{ background: 'var(--accent)', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {tour.category || 'General'}
                </span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  {tour.stock === -1 ? 'Cupos Ilimitados' : `Cupos: ${tour.stock}`}
                </span>
              </div>

              <h1 className="title" style={{ fontSize: '2.5rem', lineHeight: '1.2', marginBottom: '20px' }}>
                {tour.title}
              </h1>

              <div style={{ marginBottom: '30px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-2)' }}>
                  ${tour.price}
                </span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>/ por persona</span>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '10px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '10px' }}>
                  Acerca de la experiencia
                </h3>
                <p style={{ lineHeight: '1.8', color: 'var(--text-muted)', fontSize: '1rem' }}>
                  {tour.description}
                </p>
              </div>

              {/* Botón de Acción Fijo al final */}
              <div style={{ marginTop: '40px' }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: '15px', fontSize: '1.1rem' }}
                  onClick={() => {
                    if (isLoggedIn) {
                      navigate('/dashboard'); // O llevar a una pantalla de checkout específica
                      toast.info("Redirigiendo al panel para reservar...");
                    } else {
                      navigate('/login');
                      toast.info("Inicia sesión para reservar");
                    }
                  }}
                >
                  {isLoggedIn ? '📅 Reservar Ahora' : '🔒 Inicia Sesión para Reservar'}
                </button>
                
                {!isLoggedIn && (
                  <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No te preocupes, el registro es rápido y gratuito.
                  </p>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
      
      {/* Estilos inline para el responsive grid de este componente específico */}
      <style>{`
        .tour-detail-grid {
          display: flex;
          flex-direction: row;
          min-height: 500px;
        }
        @media (max-width: 900px) {
          .tour-detail-grid {
            flex-direction: column;
          }
        }
      `}</style>

    </div>
  );
};

export default TourDetailPage;