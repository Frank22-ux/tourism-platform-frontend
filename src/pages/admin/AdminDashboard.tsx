import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import './AdminDashboard.css'; // Importamos los estilos específicos

const AdminDashboard = ({ user, logout }: any) => {
  // Agregamos 'manage-tours' a las pestañas
  const [activeTab, setActiveTab] = useState<'metrics' | 'create-tour' | 'manage-tours' | 'users'>('metrics');
  
  // Estado para la lista de tours
  const [myTours, setMyTours] = useState<any[]>([]);

  // Estado para el formulario de nuevo tour (Incluye stock e isUnlimited)
  const [newTour, setNewTour] = useState({
    title: '', description: '', price: '', lat: '', lon: '',
    stock: '', isUnlimited: false 
  });
  const [images, setImages] = useState<FileList | null>(null);

  // --- LÓGICA DE CATEGORÍAS ---
  const [categories, setCategories] = useState(['Aventura', 'Naturaleza', 'Romántico', 'Urbano', 'Playa', 'Gastronomía']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Cargar tours cuando se entra a la pestaña de gestión
  useEffect(() => {
    if (activeTab === 'manage-tours') {
      loadMyTours();
    }
  }, [activeTab]);

  const loadMyTours = async () => {
    try {
      const { data } = await api.get('/tours');
      setMyTours(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar tus tours");
    }
  };

  // Manejador para crear tour
  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTour.title || !newTour.price || !newTour.lat || !newTour.lon) {
      toast.warning("Por favor completa los campos obligatorios");
      return;
    }

    // Validar categoría
    const finalCategory = isCreatingCategory ? customCategory : selectedCategory;
    if (!finalCategory) {
      toast.warning("Debes seleccionar o crear una categoría");
      return;
    }

    // Validar Stock
    if (!newTour.isUnlimited && !newTour.stock) {
      toast.warning("Debes definir la cantidad de entradas o marcar como ilimitado");
      return;
    }

    const formData = new FormData();
    formData.append('title', newTour.title);
    formData.append('description', newTour.description);
    formData.append('price', newTour.price);
    formData.append('category', finalCategory);
    
    // Enviamos stock (si es ilimitado enviamos -1 o null según convención backend, aquí enviamos 'unlimited' como flag o el numero)
    // Nota: El backend debe estar preparado para recibir este campo.
    formData.append('stock', newTour.isUnlimited ? '-1' : newTour.stock);

    formData.append('location', JSON.stringify({
      type: 'Point',
      coordinates: [parseFloat(newTour.lon), parseFloat(newTour.lat)]
    }));

    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }

    try {
      await api.post('/tours', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('¡Tour Publicado con Éxito! 🚀');
      
      // Resetear formulario
      setNewTour({ title: '', description: '', price: '', lat: '', lon: '', stock: '', isUnlimited: false });
      setImages(null);
      setSelectedCategory('');
      setCustomCategory('');
      setIsCreatingCategory(false);
      
      // Reset visual del input file
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (err: any) {
      console.error(err);
      toast.error('Error al crear el tour');
    }
  };

  // Función para obtener ubicación actual del navegador
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      toast.info("Obteniendo coordenadas... 🛰️");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewTour(prev => ({
            ...prev,
            lat: position.coords.latitude.toString(),
            lon: position.coords.longitude.toString()
          }));
          toast.success("¡Ubicación detectada correctamente! 📍");
        },
        (error) => {
          console.error(error);
          toast.error("No se pudo obtener la ubicación. Verifica los permisos del navegador.");
        }
      );
    } else {
      toast.error("Tu navegador no soporta geolocalización.");
    }
  };

  const getTitle = () => {
    switch(activeTab) {
      case 'metrics': return 'Panel de Control';
      case 'create-tour': return 'Gestión de Catálogo';
      case 'manage-tours': return 'Mis Experiencias';
      case 'users': return 'Usuarios del Sistema';
      default: return '';
    }
  };

  return (
    <div className="admin-layout">
      
      {/* 1. SIDEBAR ADMIN */}
      <aside className="admin-sidebar">
        {/* Header Sidebar */}
        <div style={{ marginBottom: '40px', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="topbar-logo-circle" style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #f59e0b, #b45309)', fontSize: '1.5rem', boxShadow: 'none' }}>⚡</div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text)' }}>Turismo VIP</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-2)' }}>Administrador</div>
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <div style={{ padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600', marginBottom: '5px' }}>
            Gestión
          </div>

          <button onClick={() => setActiveTab('metrics')} className={`nav-btn ${activeTab === 'metrics' ? 'active' : ''}`}>
            <span style={{ fontSize: '1.3rem' }}>📊</span> <span style={{ fontWeight: '500' }}>Métricas Globales</span>
          </button>
          
          <button onClick={() => setActiveTab('create-tour')} className={`nav-btn ${activeTab === 'create-tour' ? 'active' : ''}`}>
            <span style={{ fontSize: '1.3rem' }}>➕</span> <span style={{ fontWeight: '500' }}>Publicar Tour</span>
          </button>

          <button onClick={() => setActiveTab('manage-tours')} className={`nav-btn ${activeTab === 'manage-tours' ? 'active' : ''}`}>
            <span style={{ fontSize: '1.3rem' }}>🌍</span> <span style={{ fontWeight: '500' }}>Mis Tours</span>
          </button>
          
          <button onClick={() => setActiveTab('users')} className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}>
            <span style={{ fontSize: '1.3rem' }}>👥</span> <span style={{ fontWeight: '500' }}>Usuarios</span>
          </button>
        </nav>

        {/* Footer Sidebar */}
        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
           <button onClick={logout} className="nav-btn" style={{ color: 'var(--danger)', justifyContent: 'flex-start' }}>
             <span style={{ fontSize: '1.2rem' }}>🚪</span> <span style={{ fontWeight: '600' }}>Cerrar Sesión</span>
           </button>
        </div>
      </aside>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Topbar Flotante */}
        <header style={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 40px', background: 'rgba(20, 11, 16, 0.6)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 40 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{user.name}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Online ●</div>
             </div>
             <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-soft)' }}>👤</div>
           </div>
        </header>

        <main className="content" style={{ padding: '40px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '30px' }}>
            <h2 className="title">{getTitle()}</h2>
            <p className="subtitle">Bienvenido al centro de comando.</p>
          </div>

          {/* VISTA: MÉTRICAS */}
          {activeTab === 'metrics' && (
            <div style={{ animation: 'fadeInPanel 0.4s ease-out' }}>
              <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: 'var(--success)' }}>💰</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ingresos Totales</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>$12,450</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: 'var(--accent-2)' }}>🎫</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reservas Activas</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>142</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#60a5fa' }}>👥</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Usuarios Totales</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>1,230</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA: CREAR TOUR */}
          {activeTab === 'create-tour' && (
            <div style={{ animation: 'fadeInPanel 0.4s ease-out', maxWidth: '800px' }}>
              <div className="admin-form-container">
                <h3 className="heading-2" style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Detalles de la Experiencia</h3>
                
                <form onSubmit={handleCreateTour} className="form-grid">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label className="metric-label">Título del Tour</label>
                      <input placeholder="Ej: Tour Nocturno" value={newTour.title} onChange={e => setNewTour({...newTour, title: e.target.value})} required />
                    </div>
                    <div>
                      <label className="metric-label">Precio Base ($)</label>
                      <input type="number" placeholder="0.00" value={newTour.price} onChange={e => setNewTour({...newTour, price: e.target.value})} required min="0" step="0.01" />
                    </div>
                  </div>

                  {/* CAPACIDAD Y ENTRADAS (NUEVO) */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                    <label className="metric-label" style={{ marginBottom: '10px' }}>Capacidad y Entradas</label>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input 
                          type="number" 
                          placeholder={newTour.isUnlimited ? "Sin límite" : "Ej: 20 cupos"} 
                          value={newTour.stock} 
                          onChange={e => setNewTour({...newTour, stock: e.target.value})} 
                          disabled={newTour.isUnlimited}
                          required={!newTour.isUnlimited}
                          style={{ opacity: newTour.isUnlimited ? 0.5 : 1, cursor: newTour.isUnlimited ? 'not-allowed' : 'text' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          id="unlimited" 
                          checked={newTour.isUnlimited} 
                          onChange={e => setNewTour({...newTour, isUnlimited: e.target.checked, stock: ''})}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }}
                        />
                        <label htmlFor="unlimited" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)' }}>Entradas Ilimitadas</label>
                      </div>
                    </div>
                  </div>

                  {/* SELECCIÓN DE CATEGORÍA */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                    <label className="metric-label" style={{ marginBottom: '10px' }}>Categoría</label>
                    {!isCreatingCategory ? (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                          value={selectedCategory} 
                          onChange={(e) => {
                            if (e.target.value === 'new') {
                              setIsCreatingCategory(true);
                              setSelectedCategory('');
                            } else {
                              setSelectedCategory(e.target.value);
                            }
                          }}
                          style={{ flex: 1 }}
                        >
                          <option value="">-- Seleccionar Categoría --</option>
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          <option value="new">➕ Crear Nueva...</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          placeholder="Escribe la nueva categoría..." 
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          autoFocus
                        />
                        <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsCreatingCategory(false)}>Cancelar</button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="metric-label">Descripción</label>
                    <textarea 
                      placeholder="Describe la experiencia..." 
                      className="w-full p-3 border mb-2 rounded bg-gray-800 text-white"
                      style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(148, 163, 184, 0.35)', color: 'var(--text)', borderRadius: '12px', width: '100%', minHeight: '100px' }}
                      value={newTour.description} 
                      onChange={e => setNewTour({...newTour, description: e.target.value})} 
                      required
                    />
                  </div>

                  {/* SECCIÓN DE UBICACIÓN */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <label className="metric-label" style={{ marginBottom: 0 }}>Ubicación Geográfica</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={handleGetLocation} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success)', color: 'var(--success)' }}>
                          📍 Usar mi ubicación actual
                        </button>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${newTour.lat || 40},${newTour.lon || -3}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                          🗺️ Abrir Mapa Externo
                        </a>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label className="metric-label" style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Latitud</label>
                        <input type="number" step="any" placeholder="Ej: 48.8584" value={newTour.lat} onChange={e => setNewTour({...newTour, lat: e.target.value})} required style={{ background: '#111' }} />
                      </div>
                      <div>
                        <label className="metric-label" style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Longitud</label>
                        <input type="number" step="any" placeholder="Ej: 2.2945" value={newTour.lon} onChange={e => setNewTour({...newTour, lon: e.target.value})} required style={{ background: '#111' }} />
                      </div>
                    </div>
                  </div>

                  <div className="file-upload-area">
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📸</div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Arrastra tus fotos aquí o haz clic para subir</p>
                    <input id="fileInput" type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} style={{ display: 'block', margin: '0 auto', maxWidth: '200px' }} />
                  </div>

                  <button className="btn btn-primary" style={{ marginTop: '10px', padding: '15px' }}>
                    🚀 Publicar Experiencia
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VISTA: MIS TOURS (NUEVO) */}
          {activeTab === 'manage-tours' && (
            <div style={{ animation: 'fadeInPanel 0.4s ease-out' }}>
              <div className="cards-grid">
                {myTours.map((tour: any) => (
                  <div key={tour.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0', overflow: 'hidden' }}>
                    
                    {/* Imagen Header */}
                    <div style={{ height: '140px', width: '100%', background: '#2a1b22', position: 'relative' }}>
                      {tour.images?.[0] ? (
                        <img 
                          src={`http://localhost:4000/uploads/${tour.images[0]}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>📸</div>
                      )}
                      <div className="badge-tag" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)' }}>
                        <div className="badge-dot" style={{ background: tour.isActive ? '#22c55e' : '#ef4444' }}></div> {tour.isActive ? 'Activo' : 'Pausado'}
                      </div>
                    </div>

                    <div style={{ padding: '20px', width: '100%' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px' }}>{tour.title}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <span>Precio: <b style={{ color: 'var(--accent-2)' }}>${tour.price}</b></span>
                        {/* Simulación visual de stock (El backend aún no lo guarda, pero el frontend lo muestra) */}
                        <span>Stock: <b>{tour.stock || '∞'}</b></span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '8px' }}>✏️ Editar</button>
                        <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '8px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>⏸️ Pausar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {myTours.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No has publicado ningún tour todavía.
                </div>
              )}
            </div>
          )}

          {/* VISTA: USUARIOS */}
          {activeTab === 'users' && (
            <div className="glass" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🚧</div>
              <h3>Módulo de Usuarios en Construcción</h3>
              <p className="subtitle">Próximamente podrás gestionar roles y permisos aquí.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;