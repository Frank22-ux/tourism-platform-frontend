import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

// --- NUEVO: IMPORTS PARA EL MAPA (LEAFLET) ---
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para el icono de marcador de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- COMPONENTE INTERNO: MARCADOR CLICKEABLE ---
const LocationMarker = ({ position, setPosition }: any) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position.lat !== 0 ? (
    <Marker position={[position.lat, position.lon]} />
  ) : null;
};

// --- COMPONENTE INTERNO: SELECTOR DE GUÍA CON BÚSQUEDA ---
const GuideSelector = ({ guides, selectedGuideId, onSelect }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Si ya hay un guía seleccionado, buscamos sus datos para mostrarlo
  const selectedGuide = guides.find((g: any) => g.id === selectedGuideId);

  // Filtramos la lista basándonos en lo que el usuario escribe
  const filteredGuides = guides.filter((g: any) => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <label className="metric-label" style={{ marginBottom: '10px' }}>Guía Responsable</label>
      
      {selectedGuide ? (
        // VISTA CUANDO YA SELECCIONASTE UNO (Tarjeta Resumen)
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          border: '1px solid var(--success)', 
          borderRadius: '8px', 
          padding: '10px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
              {selectedGuide.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{selectedGuide.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedGuide.email}</div>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => onSelect('')} // Limpiar selección
            className="btn-outline" 
            style={{ padding: '4px 8px', fontSize: '0.7rem', width: 'auto', color: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            Cambiar
          </button>
        </div>
      ) : (
        // VISTA DEL BUSCADOR (Input + Lista)
        <>
          <div 
            onClick={() => setIsOpen(true)}
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid var(--border-soft)', 
              borderRadius: '8px', 
              padding: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'text' 
            }}
          >
            <span style={{ marginRight: '8px' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar guía por nombre o correo..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                width: '100%', 
                color: 'white', 
                outline: 'none', 
                padding: 0 
              }}
            />
          </div>

          {/* LISTA DESPLEGABLE */}
          {isOpen && (
            <div style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              width: '100%', 
              maxHeight: '200px', 
              overflowY: 'auto', 
              background: '#1a1a1a', 
              border: '1px solid var(--border-soft)', 
              borderRadius: '8px', 
              zIndex: 100, 
              marginTop: '5px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
              {filteredGuides.length > 0 ? (
                filteredGuides.map((guide: any) => (
                  <div 
                    key={guide.id}
                    onClick={() => {
                      onSelect(guide.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{ 
                      padding: '10px', 
                      borderBottom: '1px solid rgba(255,255,255,0.05)', 
                      cursor: 'pointer', 
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{guide.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{guide.email}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No se encontraron guías.
                </div>
              )}
            </div>
          )}
          {/* Overlay invisible para cerrar al hacer clic fuera */}
          {isOpen && (
            <div 
              style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
              onClick={() => setIsOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
};


// --- 1. COMPONENTE TARJETA (CARRUSEL + MODO PAPELERA) ---
const TourCard = ({ tour, onEdit, onToggleStatus, onDelete, onView, isArchived, onRestore }: any) => {
  const [imgIndex, setImgIndex] = useState(0);
  const images = tour.images && tour.images.length > 0 ? tour.images : [];
  const currentImage = images[imgIndex];

  const nextImg = (e: any) => {
    e.stopPropagation();
    if (images.length > 1) setImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e: any) => {
    e.stopPropagation();
    if (images.length > 1) setImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', opacity: isArchived ? 0.6 : (tour.isActive ? 1 : 0.7), border: isArchived ? '1px solid #444' : (tour.isActive ? '1px solid rgba(255,255,255,0.1)' : '1px dashed #666'), transform: tour.isActive ? 'none' : 'scale(0.98)' }}>
      
      {/* HEADER IMAGEN */}
      <div style={{ height: '160px', width: '100%', background: '#2a1b22', position: 'relative' }}>
        {currentImage ? (
          <img 
            src={`http://localhost:4000/uploads/${currentImage}`} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isArchived ? 'grayscale(100%)' : (tour.isActive ? 'none' : 'grayscale(100%)'), transition: '0.3s' }} 
            alt={tour.title}
          />
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📸</div>
        )}

        {/* BADGE DE ESTADO */}
        <div className="badge-tag" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)' }}>
          {isArchived ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fca5a5', fontWeight: 'bold', fontSize: '0.7rem' }}>
               <div className="badge-dot" style={{ background: '#ef4444' }}></div> ELIMINADO
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: tour.isActive ? '#bbf7d0' : '#fecaca', fontSize: '0.7rem' }}>
               <div className="badge-dot" style={{ background: tour.isActive ? '#22c55e' : '#ef4444' }}></div> {tour.isActive ? 'Activo' : 'Pausado'}
            </div>
          )}
        </div>

        {/* CONTROLES CARRUSEL */}
        {images.length > 1 && (
          <>
            <button onClick={prevImg} style={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>‹</button>
            <button onClick={nextImg} style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>›</button>
            <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', color: 'white' }}>{imgIndex + 1} / {images.length}</div>
          </>
        )}
      </div>

      {/* BODY INFO */}
      <div style={{ padding: '20px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px', color: isArchived ? 'var(--text-muted)' : 'var(--text)' }}>{tour.title}</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <span>Precio: <b style={{ color: isArchived ? 'gray' : 'var(--accent-2)' }}>${tour.price}</b></span>
          <span>Stock: <b>{tour.stock === -1 ? '∞' : tour.stock}</b></span>
        </div>
        
        {/* BOTONERA */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          {/* Botón Ver Detalles (Común) */}
          <button title="Ver Detalles" onClick={() => onView(tour)} className="btn btn-secondary" style={{ width:'36px', padding: 0, display:'flex', alignItems:'center', justifyContent:'center' }}>👁️</button>
          
          {isArchived ? (
             <button onClick={() => onRestore(tour.id)} className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
               <span>♻️</span> Restaurar Tour
             </button>
          ) : (
             <>
               <button onClick={() => onEdit(tour)} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}>✏️ Editar</button>
               <button onClick={() => onToggleStatus(tour.id, tour.isActive)} className="btn" style={{ flex: 1, fontSize: '0.8rem', padding: '8px', background: tour.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: tour.isActive ? '#fecaca' : '#bbf7d0', border: `1px solid ${tour.isActive ? 'var(--danger)' : 'var(--success)'}` }}>
                 {tour.isActive ? '⏸️' : '▶️'}
               </button>
               <button title="Eliminar" onClick={() => onDelete(tour.id)} className="btn btn-outline" style={{ width:'36px', padding: 0, borderColor: 'var(--danger)', color: 'var(--danger)', display:'flex', alignItems:'center', justifyContent:'center' }}>🗑️</button>
             </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const AdminDashboard = ({ user, logout }: any) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'create-tour' | 'manage-tours' | 'archived-tours' | 'users'>('metrics');
  
  const [myTours, setMyTours] = useState<any[]>([]);
  const [archivedTours, setArchivedTours] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [guidesList, setGuidesList] = useState<any[]>([]); // Lista de guías disponibles
  const [selectedTour, setSelectedTour] = useState<any>(null);

  // Formulario Tour
  const [newTour, setNewTour] = useState({
    title: '', description: '', price: '', 
    lat: '0', lon: '0', // Inicializamos en 0
    stock: '', isUnlimited: false, guideId: '',
    // FECHAS DEL TOUR
    startDate: '', endDate: '', 
    // ESTADOS PARA HOSPEDAJE Y EXTRAS
    hasLodging: false, lodgingDays: '', lodgingNights: '', lodgingRooms: '', 
    hasTransport: false, transportType: 'roundtrip', hasFood: false 
  });
  
  const [newImages, setNewImages] = useState<File[]>([]); 
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState(['Aventura', 'Naturaleza', 'Romántico', 'Urbano', 'Playa', 'Gastronomía']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Formulario Guía
  const [newGuide, setNewGuide] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    if (activeTab === 'manage-tours') loadMyTours();
    if (activeTab === 'archived-tours') loadArchivedTours();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'create-tour') loadGuides();
  }, [activeTab]);

  const loadMyTours = async () => { try { const { data } = await api.get('/tours'); setMyTours(data); } catch { toast.error("Error al cargar tours"); } };
  const loadArchivedTours = async () => { try { const { data } = await api.get('/tours/archived'); setArchivedTours(data); } catch { toast.error("Error al cargar papelera"); } };
  const loadUsers = async () => { try { const { data } = await api.get('/users'); setUsersList(data); } catch { toast.error("Error al cargar usuarios"); } };
  const loadGuides = async () => { try { const { data } = await api.get('/users/guides'); setGuidesList(data); } catch { toast.error("Error al cargar guías"); } };

  // --- MÉTODOS DE IMÁGENES ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      if (newImages.length + selectedFiles.length + existingImages.length > 15) { toast.warning("Límite de 15 imágenes."); return; }
      setNewImages(prev => [...prev, ...selectedFiles]);
      e.target.value = ''; 
    }
  };
  const removeNewImage = (index: number) => setNewImages(prev => prev.filter((_, i) => i !== index));
  const removeExistingImage = (imgName: string) => setExistingImages(prev => prev.filter(img => img !== imgName));

  // --- MÉTODOS DE GESTIÓN TOUR ---
  const handleEditClick = (tour: any) => {
    setEditingId(tour.id);
    setNewTour({
      title: tour.title, description: tour.description, price: tour.price,
      lat: tour.location?.coordinates[1] || 0, lon: tour.location?.coordinates[0] || 0,
      stock: tour.stock === -1 ? '' : tour.stock, isUnlimited: tour.stock === -1,
      guideId: tour.guide?.id || '',
      startDate: tour.startDate || tour.date || '',
      endDate: tour.endDate || '',
      // Mapeo de datos (asegura compatibilidad)
      hasLodging: tour.hasLodging || false,
      lodgingDays: tour.lodgingDays || '',
      lodgingNights: tour.lodgingNights || '',
      lodgingRooms: tour.lodgingRooms || '',
      hasTransport: tour.hasTransport || false, 
      transportType: tour.transportType || 'roundtrip', 
      hasFood: tour.hasFood || false
    });
    setSelectedCategory(tour.category || '');
    setExistingImages(tour.images || []);
    setNewImages([]);
    setActiveTab('create-tour');
    window.scrollTo(0, 0);
    toast.info(`Editando: ${tour.title}`);
  };

  const handleToggleStatus = async (tourId: string, currentStatus: boolean) => {
    try { await api.patch(`/tours/${tourId}`, { isActive: !currentStatus }); toast.success(`Estado actualizado`); loadMyTours(); } catch { toast.error("Error al cambiar estado"); }
  };

  const handleDelete = async (tourId: string) => {
    if (window.confirm("¿Mover a papelera?")) {
      try { await api.delete(`/tours/${tourId}`); toast.success("Tour movido a la papelera"); loadMyTours(); } catch { toast.error("Error al eliminar"); }
    }
  };

  const handleRestore = async (tourId: string) => {
    if (window.confirm("¿Restaurar tour?")) {
      try { await api.patch(`/tours/${tourId}/restore`); toast.success("¡Tour restaurado!"); loadArchivedTours(); } catch { toast.error("Error al restaurar"); }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("¿Eliminar usuario permanentemente?")) {
      try { await api.delete(`/users/${userId}`); toast.success("Usuario eliminado"); loadUsers(); } catch { toast.error("Error al eliminar usuario"); }
    }
  };

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/users/guides', newGuide); toast.success(`Guía ${newGuide.name} creado`); setNewGuide({ name: '', email: '', password: '' }); loadUsers(); } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleCancelEdit = () => { setEditingId(null); resetForm(); toast.info("Edición cancelada"); };

  const resetForm = () => {
    setNewTour({ 
      title: '', description: '', price: '', lat: '', lon: '', stock: '', isUnlimited: false, guideId: '',
      startDate: '', endDate: '',
      hasLodging: false, lodgingDays: '', lodgingNights: '', lodgingRooms: '', hasTransport: false, transportType: 'roundtrip', hasFood: false 
    });
    setNewImages([]); setExistingImages([]); setSelectedCategory(''); setCustomCategory(''); setIsCreatingCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTour.title || !newTour.price) { toast.warning("Faltan campos obligatorios"); return; }
    const finalCategory = isCreatingCategory ? customCategory : selectedCategory;
    if (!finalCategory) { toast.warning("Selecciona categoría"); return; }
    if (!newTour.guideId) { toast.warning("Selecciona un guía responsable"); return; }
    if (!newTour.startDate) { toast.warning("Selecciona una fecha de inicio"); return; }

    const formData = new FormData();
    formData.append('title', newTour.title); formData.append('description', newTour.description); formData.append('price', newTour.price.toString());
    formData.append('category', finalCategory); formData.append('stock', newTour.isUnlimited ? '-1' : newTour.stock.toString());
    formData.append('guideId', newTour.guideId);
    formData.append('startDate', newTour.startDate);
    if (newTour.endDate) formData.append('endDate', newTour.endDate);
    
    const lat = newTour.lat ? parseFloat(newTour.lat.toString()) : 0;
    const lon = newTour.lon ? parseFloat(newTour.lon.toString()) : 0;
    formData.append('location', JSON.stringify({ type: 'Point', coordinates: [lon, lat] }));

    // Agregar datos de hospedaje al FormData
    formData.append('hasLodging', String(newTour.hasLodging));
    if (newTour.hasLodging) {
      formData.append('lodgingDays', newTour.lodgingDays.toString());
      formData.append('lodgingNights', newTour.lodgingNights.toString());
      formData.append('lodgingRooms', newTour.lodgingRooms.toString());
      formData.append('hasTransport', String(newTour.hasTransport)); 
      if (newTour.hasTransport) {
          formData.append('transportType', newTour.transportType);
      }
      formData.append('hasFood', String(newTour.hasFood));
    }

    if (newImages.length > 0) newImages.forEach((file) => formData.append('images', file));
    if (editingId && existingImages.length > 0) formData.append('existingImages', JSON.stringify(existingImages));
    else if (editingId && existingImages.length === 0 && newImages.length === 0) formData.append('existingImages', JSON.stringify([]));

    try {
      if (editingId) { await api.patch(`/tours/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('¡Actualizado!'); setEditingId(null); setActiveTab('manage-tours'); } 
      else { await api.post('/tours', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('¡Publicado!'); }
      resetForm();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  // Función para actualizar coordenadas desde el mapa
  const setMapCoordinates = (lat: number, lon: number) => {
      setNewTour(prev => ({ ...prev, lat: lat.toString(), lon: lon.toString() }));
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      toast.info("Obteniendo GPS...");
      navigator.geolocation.getCurrentPosition(
        (position) => { setMapCoordinates(position.coords.latitude, position.coords.longitude); toast.success("¡Ubicación encontrada!"); },
        () => toast.error("Error GPS")
      );
    }
  };

  const getTitle = () => {
    switch(activeTab) {
      case 'metrics': return 'Panel de Control';
      case 'create-tour': return 'Gestión de Catálogo';
      case 'manage-tours': return 'Mis Experiencias';
      case 'archived-tours': return 'Papelera de Reciclaje';
      case 'users': return 'Gestión de Personal y Usuarios';
      default: return '';
    }
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div style={{ marginBottom: '40px', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="topbar-logo-circle" style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #f59e0b, #b45309)', fontSize: '1.5rem', boxShadow: 'none' }}>⚡</div>
          <div><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text)' }}>Turismo VIP</div><div style={{ fontSize: '0.8rem', color: 'var(--accent-2)' }}>Administrador</div></div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <button onClick={() => setActiveTab('metrics')} className={`nav-btn ${activeTab === 'metrics' ? 'active' : ''}`}><span style={{ fontSize: '1.3rem' }}>📊</span> Métricas</button>
          <button onClick={() => { setActiveTab('create-tour'); setEditingId(null); resetForm(); }} className={`nav-btn ${activeTab === 'create-tour' ? 'active' : ''}`}><span style={{ fontSize: '1.3rem' }}>{editingId ? '✏️' : '➕'}</span> Publicar Tour</button>
          <button onClick={() => setActiveTab('manage-tours')} className={`nav-btn ${activeTab === 'manage-tours' ? 'active' : ''}`}><span style={{ fontSize: '1.3rem' }}>🌍</span> Mis Tours</button>
          <button onClick={() => setActiveTab('archived-tours')} className={`nav-btn ${activeTab === 'archived-tours' ? 'active' : ''}`}><span style={{ fontSize: '1.3rem' }}>🗑️</span> Papelera</button>
          <button onClick={() => setActiveTab('users')} className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}><span style={{ fontSize: '1.3rem' }}>👥</span> Usuarios</button>
        </nav>
        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
           <button onClick={logout} className="nav-btn" style={{ color: 'var(--danger)', justifyContent: 'flex-start' }}><span style={{ fontSize: '1.2rem' }}>🚪</span> Cerrar Sesión</button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 40px', background: 'rgba(20, 11, 16, 0.6)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 40 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{user.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Online ●</div></div>
             <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-soft)' }}>👤</div>
           </div>
        </header>

        <main className="content" style={{ padding: '40px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '30px' }}><h2 className="title">{getTitle()}</h2></div>

          {activeTab === 'metrics' && (
            <div style={{ animation: 'fadeInPanel 0.4s ease-out' }}>
              <div className="cards-grid">
                <div className="stat-card"><div className="stat-icon" style={{ color: 'var(--success)' }}>💰</div><div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ingresos Totales</div><div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>$12,450</div></div></div>
                <div className="stat-card"><div className="stat-icon" style={{ color: 'var(--accent-2)' }}>🎫</div><div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reservas Activas</div><div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>142</div></div></div>
                <div className="stat-card"><div className="stat-icon" style={{ color: '#60a5fa' }}>👥</div><div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Usuarios Totales</div><div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{usersList.length}</div></div></div>
              </div>
            </div>
          )}

          {activeTab === 'create-tour' && (
            <div style={{ animation: 'fadeInPanel 0.4s ease-out', maxWidth: '900px' }}>
              <div className="admin-form-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h3 className="heading-2" style={{ fontSize: '1.4rem', margin: 0 }}>{editingId ? '✏️ Editando Experiencia' : '✨ Nueva Experiencia'}</h3>
                   {editingId && <button onClick={handleCancelEdit} className="btn-outline" style={{ width: 'auto', padding: '5px 15px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cancelar</button>}
                </div>
                
                <form onSubmit={handleSubmit} className="form-grid">
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                    <div><label className="metric-label">Título</label><input placeholder="Ej: Tour Nocturno" value={newTour.title} onChange={e => setNewTour({...newTour, title: e.target.value})} required /></div>
                    <div><label className="metric-label">Precio ($)</label><input type="number" placeholder="0.00" value={newTour.price} onChange={e => setNewTour({...newTour, price: e.target.value})} required min="0" step="0.01" /></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label className="metric-label">Fecha de Inicio</label>
                      <input 
                        type="date" 
                        value={newTour.startDate} 
                        onChange={e => setNewTour({...newTour, startDate: e.target.value})} 
                        required 
                        min={new Date().toISOString().split('T')[0]} 
                      />
                    </div>
                    <div>
                      <label className="metric-label">Fecha de Fin (Opcional)</label>
                      <input 
                        type="date" 
                        value={newTour.endDate} 
                        onChange={e => setNewTour({...newTour, endDate: e.target.value})} 
                        min={newTour.startDate || new Date().toISOString().split('T')[0]} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                     <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                      <label className="metric-label" style={{ marginBottom: '10px' }}>Capacidad</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}><input type="number" placeholder={newTour.isUnlimited ? "∞" : "Ej: 20"} value={newTour.stock} onChange={e => setNewTour({...newTour, stock: e.target.value})} disabled={newTour.isUnlimited} required={!newTour.isUnlimited} style={{ opacity: newTour.isUnlimited ? 0.5 : 1 }} /></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><input type="checkbox" id="unlimited" checked={newTour.isUnlimited} onChange={e => setNewTour({...newTour, isUnlimited: e.target.checked, stock: ''})} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} /><label htmlFor="unlimited" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>Ilimitado</label></div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                      <label className="metric-label" style={{ marginBottom: '10px' }}>Categoría</label>
                      {!isCreatingCategory ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <select value={selectedCategory} onChange={(e) => e.target.value === 'new' ? (setIsCreatingCategory(true), setSelectedCategory('')) : setSelectedCategory(e.target.value)} style={{ flex: 1 }}>
                            <option value="">-- Seleccionar --</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="new">➕ Nueva...</option>
                          </select>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input type="text" placeholder="Categoría..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} autoFocus />
                          <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsCreatingCategory(false)}>X</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SELECCIÓN DE GUÍA (NUEVO) */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                    <GuideSelector 
                      guides={guidesList} 
                      selectedGuideId={newTour.guideId} 
                      onSelect={(id: string) => setNewTour({ ...newTour, guideId: id })} 
                    />
                  </div>

                  {/* OPCIONES DE HOSPEDAJE (NUEVO) */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: newTour.hasLodging ? '15px' : '0' }}>
                      <input 
                        type="checkbox" 
                        id="hasLodging" 
                        checked={newTour.hasLodging} 
                        onChange={e => setNewTour({...newTour, hasLodging: e.target.checked})} 
                        style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }} 
                      />
                      <label htmlFor="hasLodging" style={{ cursor: 'pointer', fontSize: '1rem', color: 'var(--text)', fontWeight: '500' }}>
                        Incluye Hospedaje
                      </label>
                    </div>

                    {newTour.hasLodging && (
                      <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                        {/* Dias y Noches */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                          <div>
                            <label className="metric-label">Días</label>
                            <input type="number" placeholder="Ej: 3" value={newTour.lodgingDays} onChange={e => setNewTour({...newTour, lodgingDays: e.target.value})} min="1" />
                          </div>
                          <div>
                            <label className="metric-label">Noches</label>
                            <input type="number" placeholder="Ej: 2" value={newTour.lodgingNights} onChange={e => setNewTour({...newTour, lodgingNights: e.target.value})} min="0" />
                          </div>
                          <div>
                            <label className="metric-label">Habitaciones</label>
                            <input type="number" placeholder="Ej: 5" value={newTour.lodgingRooms} onChange={e => setNewTour({...newTour, lodgingRooms: e.target.value})} min="1" />
                          </div>
                        </div>
                        
                        {/* Extras */}
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="checkbox" 
                              id="hasTransport" 
                              checked={newTour.hasTransport} 
                              onChange={e => setNewTour({...newTour, hasTransport: e.target.checked})} 
                              style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} 
                            />
                            <label htmlFor="hasTransport" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Transporte</label>
                            {newTour.hasTransport && (
                               <select 
                                 value={newTour.transportType}
                                 onChange={e => setNewTour({...newTour, transportType: e.target.value})}
                                 style={{ padding: '5px 10px', borderRadius: '5px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555', fontSize: '0.8rem', marginLeft: '5px' }}
                               >
                                 <option value="roundtrip">Ida y Vuelta</option>
                                 <option value="pickup">Solo Ida (Recogida)</option>
                                 <option value="dropoff">Solo Retorno</option>
                               </select>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="checkbox" 
                              id="hasFood" 
                              checked={newTour.hasFood} 
                              onChange={e => setNewTour({...newTour, hasFood: e.target.checked})} 
                              style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} 
                            />
                            <label htmlFor="hasFood" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Alimentación Incluida</label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div><label className="metric-label">Descripción</label><textarea placeholder="Detalles..." className="w-full p-3 border mb-2 rounded bg-gray-800 text-white" style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(148, 163, 184, 0.35)', color: 'var(--text)', borderRadius: '12px', width: '100%', minHeight: '100px' }} value={newTour.description} onChange={e => setNewTour({...newTour, description: e.target.value})} required /></div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label className="metric-label" style={{ marginBottom: 0 }}>Ubicación</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={handleGetLocation} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--success)', borderColor: 'var(--success)' }}>📍 GPS Actual</button>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${newTour.lat || 40},${newTour.lon || -3}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>🗺️ Mapa</a>
                      </div>
                    </div>
                    
                    {/* MAPA INTERACTIVO */}
                    <div style={{ height: '300px', width: '100%', marginBottom: '15px', borderRadius: '10px', overflow: 'hidden' }}>
                      <MapContainer 
                        center={[newTour.lat ? Number(newTour.lat) : 40, newTour.lon ? Number(newTour.lon) : -3]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker 
                          position={{ lat: Number(newTour.lat), lon: Number(newTour.lon) }} 
                          setPosition={(lat: number, lon: number) => setMapCoordinates(lat, lon)}
                        />
                      </MapContainer>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <input type="number" step="any" placeholder="Latitud" value={newTour.lat} onChange={e => setNewTour({...newTour, lat: e.target.value})} required />
                      <input type="number" step="any" placeholder="Longitud" value={newTour.lon} onChange={e => setNewTour({...newTour, lon: e.target.value})} required />
                    </div>
                  </div>

                  <div className="file-upload-area" style={{ textAlign: 'left', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <label className="metric-label" style={{fontSize: '1rem', color: 'var(--text)', margin:0}}>📸 Galería Multimedia</label>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ width: 'auto', fontSize: '0.8rem' }}>+ Agregar</button>
                    </div>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                      {editingId && existingImages.map((img, i) => (
                        <div key={`exist-${i}`} style={{ position: 'relative', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--accent)' }}>
                          <img src={`http://localhost:4000/uploads/${img}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeExistingImage(img)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                          <div style={{position:'absolute', bottom:0, width:'100%', background:'rgba(0,0,0,0.6)', fontSize:'0.6rem', textAlign:'center', color:'white'}}>Actual</div>
                        </div>
                      ))}
                      {newImages.map((file, i) => (
                        <div key={`new-${i}`} style={{ position: 'relative', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--success)' }}>
                          <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeNewImage(i)} style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                          <div style={{position:'absolute', bottom:0, width:'100%', background:'var(--success)', fontSize:'0.6rem', textAlign:'center', color:'black'}}>Nueva</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '20px', padding: '15px', fontSize: '1.1rem' }}>{editingId ? '💾 Guardar Cambios' : '🚀 Publicar'}</button>
                </form>
              </div>
            </div>
          )}

          {/* VISTA: MIS TOURS */}
          {activeTab === 'manage-tours' && (
            <div style={{ animation: 'fadeInPanel 0.4s ease-out' }}>
              <h2 className="title">Mis Experiencias Activas</h2>
              <div className="cards-grid">
                {myTours.map((tour: any) => (
                  <TourCard key={tour.id} tour={tour} onEdit={handleEditClick} onToggleStatus={handleToggleStatus} onDelete={handleDelete} onView={setSelectedTour} />
                ))}
              </div>
              {myTours.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No has publicado ningún tour todavía.</div>}
            </div>
          )}

          {/* VISTA: PAPELERA */}
          {activeTab === 'archived-tours' && (
            <div style={{ animation: 'fadeInPanel 0.4s ease-out' }}>
              <h2 className="title" style={{ color: 'var(--danger)' }}>🗑️ Papelera de Reciclaje</h2>
              <div className="cards-grid">
                {archivedTours.map((tour: any) => (
                  <TourCard key={tour.id} tour={tour} isArchived={true} onView={setSelectedTour} onRestore={handleRestore} />
                ))}
              </div>
              {archivedTours.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Papelera vacía.</div>}
            </div>
          )}

          {/* VISTA: USUARIOS (NUEVO FORMULARIO DE GUÍAS) */}
          {activeTab === 'users' && (
             <div style={{ animation: 'fadeInPanel 0.4s ease-out' }}>
               <h2 className="title">Gestión de Personal</h2>
               <div className="glass" style={{ marginBottom: '30px', padding: '30px' }}>
                 <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--accent-2)' }}>Registrar Nuevo Guía</h3>
                 <form onSubmit={handleCreateGuide} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                    <div><label className="metric-label">Nombre</label><input placeholder="Ej: Pedro Guía" value={newGuide.name} onChange={e => setNewGuide({...newGuide, name: e.target.value})} required /></div>
                    <div><label className="metric-label">Correo</label><input type="email" placeholder="guia@email.com" value={newGuide.email} onChange={e => setNewGuide({...newGuide, email: e.target.value})} required /></div>
                    <div><label className="metric-label">Contraseña</label><input type="password" placeholder="******" value={newGuide.password} onChange={e => setNewGuide({...newGuide, password: e.target.value})} required /></div>
                    <button className="btn btn-primary" style={{ height: '45px' }}>+ Crear Guía</button>
                 </form>
               </div>
               <div className="table-wrapper">
                 <table>
                   <thead><tr><th>Avatar</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead>
                   <tbody>
                     {usersList.map((u: any) => (
                       <tr key={u.id}>
                         <td><div style={{ width: '35px', height: '35px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>{u.name?.charAt(0).toUpperCase()}</div></td>
                         <td style={{ fontWeight: '500' }}>{u.name}</td>
                         <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                         <td>
                           <span className="badge" style={{ 
                             background: u.role === 'admin' ? 'rgba(234, 179, 8, 0.2)' : u.role === 'guide' ? 'rgba(147, 51, 234, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                             color: u.role === 'admin' ? '#fde68a' : u.role === 'guide' ? '#e9d5ff' : '#bbf7d0'
                           }}>
                             {u.role.toUpperCase()}
                           </span>
                         </td>
                         <td><button onClick={() => handleDeleteUser(u.id)} className="btn-table" style={{ background: 'rgba(239,68,68,0.2)', color: '#fecaca', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>🗑️</button></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

        </main>
      </div>

      {/* MODAL DETALLES */}
      {selectedTour && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }} onClick={() => setSelectedTour(null)}>
          <div className="glass" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '0', border: '1px solid var(--accent-2)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedTour(null)} style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10, width: '32px', height: '32px', borderRadius: '50%' }}>✕</button>
            <div style={{ height: '300px', background: '#000', display: 'flex', overflowX: 'auto' }}>
              {selectedTour.images?.length > 0 ? selectedTour.images.map((img: string, i: number) => <img key={i} src={`http://localhost:4000/uploads/${img}`} style={{ minWidth: '100%', height: '100%', objectFit: 'cover' }} />) : <div style={{width:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>📸</div>}
            </div>
            <div style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                 <div><h2 className="title">{selectedTour.title}</h2><span className="badge" style={{background:'var(--accent)'}}>{selectedTour.category}</span></div>
                 <div style={{ fontSize: '2rem', color: 'var(--accent-2)' }}>${selectedTour.price}</div>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>{selectedTour.description}</p>
              
              {/* Información de Hospedaje en Modal */}
              {(selectedTour.hasLodging || selectedTour.lodgingDays) && (
                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-soft)', marginBottom: '25px' }}>
                    <h4 style={{ color: 'var(--accent-2)', marginBottom: '10px', fontSize: '0.9rem', textTransform: 'uppercase' }}>🏠 Detalle de Hospedaje</h4>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                       <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Duración:</span><div style={{ fontWeight: 'bold' }}>{selectedTour.lodgingDays || 0} Días / {selectedTour.lodgingNights || 0} Noches</div></div>
                       {selectedTour.lodgingRooms && <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Habitaciones:</span><div style={{ fontWeight: 'bold' }}>{selectedTour.lodgingRooms}</div></div>}
                       {selectedTour.hasTransport && <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Transporte:</span><div style={{ fontWeight: 'bold' }}>{selectedTour.transportType === 'roundtrip' ? 'Ida y Vuelta' : selectedTour.transportType}</div></div>}
                    </div>
                 </div>
              )}

              {/* Guía en Modal */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{fontSize:'1.5rem'}}>👤</div>
                  <div>
                      <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Guía Asignado</div>
                      <div style={{fontWeight:'bold'}}>{selectedTour.guide ? selectedTour.guide.name : 'No asignado'}</div>
                  </div>
              </div>

              {/* MAPA VISUALIZACIÓN */}
              {selectedTour.location && (
                 <div style={{ height: '200px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-soft)', marginBottom: '20px' }}>
                    <MapContainer 
                        center={[selectedTour.location.coordinates[1], selectedTour.location.coordinates[0]]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                        dragging={false} 
                        scrollWheelZoom={false}
                        attributionControl={false}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[selectedTour.location.coordinates[1], selectedTour.location.coordinates[0]]} />
                    </MapContainer>
                 </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                 <button className="btn btn-secondary" onClick={() => setSelectedTour(null)}>Cerrar Vista Previa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;