const GuideDashboard = ({ user, logout }: any) => {
  return (
    <div className="layout">
      <div className="sidebar">
        <button className="nav-btn active">📅 Mi Calendario</button>
        <button className="nav-btn">📸 Escanear QR</button>
        <button className="nav-btn">💬 Chat Grupal</button>
      </div>

      <div className="content">
        <div className="card-grid">
          <div className="metric-card">
            <div className="metric-label">Tours Asignados</div>
            <div className="metric-value">5</div>
          </div>
          <div className="metric-card" style={{borderColor: 'var(--accent-2)'}}>
            <div className="metric-label">Próximo Grupo</div>
            <div className="metric-value" style={{color: 'var(--accent-2)'}}>Mañana, 10 AM</div>
          </div>
        </div>

        <h2 className="title" style={{marginTop: '30px', fontSize: '1.4rem'}}>Gestión de Disponibilidad</h2>
        <div className="glass" style={{padding: '20px', marginTop: '10px'}}>
          <p className="subtitle">Selecciona los días que NO estarás disponible:</p>
          {/* Aquí iría un calendario en el futuro */}
          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn btn-outline">Bloquear 15 Dic</button>
            <button className="btn btn-outline">Bloquear 24 Dic</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideDashboard;