import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import './TravelerDashboard.css';

const TravelerDashboard = ({ user, logout }: any) => {
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'settings'>('explore');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Categorías
  const DEFAULT_CATEGORIES = ['Todos', 'Aventura', 'Naturaleza', 'Romántico', 'Urbano', 'Playa', 'Gastronomía'];
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedTour, setSelectedTour] = useState<any>(null); // Para el modal

  // Perfil
  const [profileData, setProfileData] = useState({ name: user.name || '', email: user.email || '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([loadTours(), loadBookings()]);
      setLoading(false);
    };
    initData();
  }, []);

  const loadTours = async () => {
    try {
      const { data } = await api.get('/tours');
      setTours(data);

      // Extraer categorías dinámicamente
      const dbCats = data
        .map((t: any) => t.category)
        .filter(Boolean)
        .map((c: string) => c.trim().charAt(0).toUpperCase() + c.trim().slice(1).toLowerCase());
      
      setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCats])) as string[]);

    } catch (error) {
      console.error(error);
      toast.error("Error al cargar experiencias");
    }
  };

  const loadBookings = async () => {
    try {
      const { data } = await api.get('/bookings/my-bookings');
      setBookings(data);
    } catch (error) {
      console.error("No se pudieron cargar reservas");
    }
  };

  // --- FUNCIÓN PARA GENERAR Y DESCARGAR JSON (TICKET OFFLINE) ---
  const downloadTicket = (bookingData: any, tourTitle: string) => {
    const ticketData = {
      id: bookingData.id,
      tour: tourTitle,
      date: bookingData.bookingDate,
      tickets: bookingData.peopleCount,
      total: bookingData.totalPrice,
      user: user.name,
      status: 'CONFIRMED',
      offline_generated_at: new Date().toISOString(),
      note: "Presenta este archivo digital al guía para validar tu acceso."
    };

    const blob = new Blob([JSON.stringify(ticketData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TICKET-${tourTitle.replace(/\s+/g, '-').toUpperCase()}-${bookingData.id.slice(0,8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBook = async (tourId: string, title: string) => {
    try {
      // Reservamos 1 cupo para mañana
      const { data } = await api.post('/bookings', {
        tourId,
        bookingDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        peopleCount: 1 
      });
      
      toast.success(`¡Reserva exitosa! Tu ticket se está descargando... 🎟️`);
      
      // 1. Descargar Ticket
      downloadTicket(data, title);
      
      // 2. Cerrar modal y actualizar datos
      setSelectedTour(null);
      await Promise.all([loadTours(), loadBookings()]); // Recargar stock y lista
      setActiveTab('bookings');
      
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al realizar la reserva';
      toast.error(msg);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = { ...user, name: profileData.name };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    toast.success('¡Perfil actualizado correctamente! ✨');
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredTours = tours.filter(tour => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = tour.title.toLowerCase().includes(term) ||
                          tour.description.toLowerCase().includes(term);
    
    let matchesCategory = true;
    if (selectedCategory !== 'Todos') {
      const selectedLower = selectedCategory.toLowerCase().trim();
      const tourCat = tour.category ? tour.category.toLowerCase() : tour.description.toLowerCase();
      matchesCategory = tourCat.includes(selectedLower.slice(0, 4));
    }

    return matchesSearch && matchesCategory;
  });

  const totalSpent = bookings.reduce((acc, curr) => acc + Number(curr.totalPrice), 0);
  const totalTickets = bookings.reduce((acc, curr) => acc + Number(curr.peopleCount), 0);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'explore': return 'Próximas Aventuras';
      case 'bookings': return 'Historial de Viajes';
      case 'settings': return 'Ajustes del Perfil';
      default: return '';
    }
  };

  return (
    <div className="traveler-layout">
      
      {/* 1. SIDEBAR */}
      <aside className="traveler-sidebar">
        <div style={{ marginBottom: '40px', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="topbar-logo-circle" style={{ width: '45px', height: '45px', fontSize: '1.5rem', margin: 0, boxShadow: 'none' }}>🎒</div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text)' }}>Turismo VIP</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Panel de Viajero</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <div style={{ padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600', marginBottom: '5px' }}>
            Menú Principal
          </div>
          
          <button onClick={() => setActiveTab('explore')} className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`}>
            <span style={{ fontSize: '1.2rem' }}>🌍</span> <span style={{ fontWeight: '600' }}>Explorar Mundo</span>
          </button>
          
          <button onClick={() => setActiveTab('bookings')} className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}>
            <span style={{ fontSize: '1.2rem' }}>🎫</span> <span style={{ fontWeight: '600' }}>Mis Reservas</span>
          </button>

          <button onClick={() => setActiveTab('settings')} className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}>
            <span style={{ fontSize: '1.2rem' }}>⚙️</span> <span style={{ fontWeight: '600' }}>Ajustes</span>
          </button>
        </nav>

        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
           <button onClick={logout} className="nav-btn" style={{ color: 'var(--danger)', justifyContent: 'flex-start' }}>
             <span style={{ fontSize: '1.2rem' }}>🚪</span> <span style={{ fontWeight: '600' }}>Cerrar Sesión</span>
           </button>
        </div>
      </aside>

      {/* 2. CONTENIDO */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        
        <header style={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 40px', background: 'rgba(20, 11, 16, 0.6)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 40 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text)' }}>{profileData.name}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--accent-2)' }}>Viajero Verificado</div>
             </div>
             <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#1f2933', fontWeight: 'bold', overflow: 'hidden' }}>
               {avatarPreview ? <img src={avatarPreview} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : user.name.charAt(0).toUpperCase()}
             </div>
           </div>
        </header>

        <main className="content" style={{ padding: '40px' }}>
          <div style={{ marginBottom: '30px' }}>
            <h2 className="title" style={{ fontSize: '2.2rem' }}>{getPageTitle()}</h2>
          </div>

          {/* VISTA: EXPLORAR */}
          {activeTab === 'explore' && (
            <div style={{ animation: 'fadeInPanel 0.4s ease-out' }}>
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <input type="text" placeholder="🔍 Buscar destino..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '300px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-soft)', padding: '12px 20px', borderRadius: '99px', color: 'white', outline: 'none' }} />
                </div>
                <div className="category-filters">
                  {categories.map((cat) => (
                    <button key={cat} className={`category-chip ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div> Cargando catálogo...
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredTours.length > 0 ? (
                    filteredTours.map((tour) => {
                      // Lógica de Stock Visual
                      const isSoldOut = tour.stock === 0;
                      const stockLabel = tour.stock === -1 ? '∞ Ilimitado' : `${tour.stock} Cupos`;

                      return (
                        <div key={tour.id} className="metric-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: isSoldOut ? 0.6 : 1 }}>
                          <div style={{ height: '180px', position: 'relative', background: '#2a1b22' }}>
                            
                            {/* Etiqueta de Categoría */}
                            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
                              <span className="badge" style={{ background: isSoldOut ? 'var(--danger)' : 'var(--accent)', color: 'white', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px' }}>
                                {isSoldOut ? 'AGOTADO' : (tour.category || 'Sin Categoría')}
                              </span>
                            </div>

                            {tour.images && tour.images.length > 0 ? (
                              <img src={`http://localhost:4000/uploads/${tour.images[0]}`} alt={tour.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isSoldOut ? 'grayscale(100%)' : 'none' }} onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                            ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📸</div>}
                            
                            <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.8)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                              <span style={{ color: 'var(--accent-2)', fontWeight: 'bold' }}>${tour.price}</span>
                            </div>
                          </div>

                          <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '1.3rem', color: 'var(--text)', marginBottom: '5px', fontWeight: '700' }}>{tour.title}</h3>
                            <p style={{ fontSize: '0.8rem', color: isSoldOut ? 'var(--danger)' : 'var(--success)', marginBottom: '10px', fontWeight: 'bold' }}>
                               {isSoldOut ? 'No hay entradas disponibles' : `Disponibles: ${stockLabel}`}
                            </p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px', flex: 1 }}>
                              {tour.description.length > 80 ? tour.description.substring(0, 80) + '...' : tour.description}
                            </p>
                            
                            <button 
                              className={`btn ${isSoldOut ? 'btn-secondary' : 'btn-outline'}`}
                              style={{ width: '100%', marginTop: 'auto', borderColor: isSoldOut ? 'transparent' : 'var(--primary)', color: isSoldOut ? 'gray' : 'var(--primary)', cursor: isSoldOut ? 'not-allowed' : 'pointer' }}
                              onClick={() => !isSoldOut && setSelectedTour(tour)}
                              disabled={isSoldOut}
                            >
                              {isSoldOut ? 'No disponible' : 'Ver Detalles'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="glass" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                      <p style={{ color: 'var(--text-muted)' }}>No se encontraron tours.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VISTA: MIS RESERVAS */}
          {activeTab === 'bookings' && (
            <div style={{ animation: 'fadeInPanel 0.4s ease-out' }}>
              <div className="cards-grid" style={{ marginBottom: '30px' }}>
                <div className="metric-card" style={{ padding: '20px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Tickets Totales</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalTickets}</div>
                </div>
                <div className="metric-card" style={{ padding: '20px', borderColor: 'var(--accent-2)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Inversión Total</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-2)' }}>${totalSpent.toFixed(2)}</div>
                </div>
              </div>

              <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                {bookings.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '60px' }}>
                     <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
                     <h3>No tienes reservas activas</h3>
                     <button onClick={() => setActiveTab('explore')} className="btn btn-secondary" style={{ marginTop: '20px', width: 'auto' }}>Ir al Catálogo</button>
                   </div>
                ) : (
                  <div className="bookings-table-container">
                    <table style={{ width: '100%' }}>
                      <thead><tr><th>Tour</th><th>Fecha</th><th>Tickets</th><th>Total</th><th>Estado</th></tr></thead>
                      <tbody>
                        {bookings.map((b: any) => (
                          <tr key={b.id}>
                            <td style={{ fontWeight: '600' }}>{b.tour?.title || 'Tour Eliminado'}</td>
                            <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                            <td style={{textAlign: 'center'}}>{b.peopleCount}</td>
                            <td style={{ color: 'var(--accent-2)' }}>${b.totalPrice}</td>
                            <td><span className="badge badge-disponible">{b.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA: AJUSTES */}
          {activeTab === 'settings' && (
            <div className="glass" style={{ padding: '40px', maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '20px' }}>Editar Perfil</h3>
              <form onSubmit={handleUpdateProfile} className="form-grid">
                {/* Input file oculto para avatar */}
                <input type="file" accept="image/*" ref={fileInputRef} style={{display:'none'}} onChange={(e) => {
                  if (e.target.files?.[0]) setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                }} />
                
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                   <div 
                     style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#333', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--primary)' }}
                     onClick={() => fileInputRef.current?.click()}
                   >
                     {avatarPreview ? <img src={avatarPreview} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem'}}>👤</div>}
                   </div>
                </div>

                <div><label className="metric-label">Nombre</label><input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="input-field" /></div>
                <div><label className="metric-label">Email</label><input type="email" value={profileData.email} disabled style={{ opacity: 0.6 }} /></div>
                <button className="btn btn-primary" type="submit" style={{ marginTop: '20px' }}>Guardar Cambios</button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DETALLES */}
      {selectedTour && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setSelectedTour(null)}>
          <div className="glass" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '0', border: '1px solid var(--accent-2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative' }}>
               <button onClick={() => setSelectedTour(null)} style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10, width: '32px', height: '32px', borderRadius: '50%' }}>✕</button>
               {selectedTour.images?.[0] && <img src={`http://localhost:4000/uploads/${selectedTour.images[0]}`} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />}
            </div>
            
            <div style={{ padding: '30px' }}>
              <h2 className="title">{selectedTour.title}</h2>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                 <span className="badge" style={{ background: 'var(--accent)' }}>{selectedTour.category || 'General'}</span>
                 <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{selectedTour.stock === -1 ? '∞ Ilimitado' : `Quedan: ${selectedTour.stock}`}</span>
              </div>
              
              <p style={{ lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: '30px' }}>{selectedTour.description}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Precio total</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-2)' }}>${selectedTour.price}</div>
                </div>
                <button className="btn btn-primary" style={{ width: 'auto', padding: '12px 30px' }} onClick={() => handleBook(selectedTour.id, selectedTour.title)}>
                  Confirmar Reserva 🎟️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelerDashboard;