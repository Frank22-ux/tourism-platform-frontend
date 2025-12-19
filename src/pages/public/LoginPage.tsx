import { useState } from 'react';
import api from '../../api/axios'; 
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // Guardar sesión
      localStorage.setItem('token', data.access_token || data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(`¡Bienvenido, ${data.user.name}! 🚀`);

      // Forzar recarga para ir al Dashboard correcto
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Credenciales incorrectas';
      toast.error(msg);
    }
  };

  return (
    <div className="body-login">
      <div className="login-wrapper">
        <div className="glass login-card-animated" style={{ position: 'relative' }}>
          
          <Link to="/" style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            ✕ Cerrar
          </Link>

          <div className="login-header">
            <div className="logo-circle">🏨</div>
            <div>
              <h1 className="title">Bienvenido</h1>
              <p className="subtitle">Accede al panel de gestión</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div>
              <label className="metric-label">Correo Electrónico</label>
              <input type="email" placeholder="ejemplo@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="metric-label">Contraseña</label>
              <input type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '15px' }}>Iniciar Sesión</button>
          </form>

          <div className="login-footer">
            <p>¿No tienes cuenta? <Link to="/register" style={{color: 'var(--accent-2)'}}>Regístrate</Link></p>
            <p style={{marginTop: '10px'}}><Link to="/" style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>← Volver al Inicio</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;