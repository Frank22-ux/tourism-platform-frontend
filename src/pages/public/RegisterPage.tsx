import { useState } from 'react';
import api from '../../api/axios';
import { useNavigate, Link } from 'react-router-dom';
// 1. IMPORTAR TOAST
import { toast } from 'react-toastify'; 

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', role: 'traveler'
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      
      // 2. ÉXITO ELEGANTE
      toast.success('¡Cuenta creada con éxito! Ahora inicia sesión 🚀');
      
      navigate('/login');
    } catch (error: any) {
      console.error(error);
      // 3. ERROR ELEGANTE (Muestra el mensaje exacto del backend: "Solo Gmail", etc.)
      const errorMsg = error.response?.data?.message;
      
      // Si el backend devuelve un array de errores (class-validator), los mostramos todos
      if (Array.isArray(errorMsg)) {
        errorMsg.forEach(msg => toast.error(msg));
      } else {
        toast.error(errorMsg || 'Error al registrarse');
      }
    }
  };

  return (
    // ... (El resto de tu HTML sigue igual, el cambio solo fue en handleSubmit)
    <div className="body-login">
       {/* ... código visual ... */}
       {/* Solo asegúrate de copiar el handleSubmit de arriba */}
       <div className="login-wrapper">
        <div className="glass login-card login-card-animated">
          
          <div className="login-header">
            <div className="logo-circle">✨</div>
            <div>
              <h1 className="title">Nueva Cuenta</h1>
              <p className="subtitle">Únete para reservar experiencias</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div>
              <label className="metric-label">Nombre Completo</label>
              <input name="name" placeholder="Ej: Juan Pérez" onChange={handleChange} required />
            </div>

            <div>
              <label className="metric-label">Correo Electrónico</label>
              <input name="email" type="email" placeholder="usuario@gmail.com" onChange={handleChange} required />
            </div>

            <div>
              <label className="metric-label">Contraseña (Mín. 6 caracteres)</label>
              <input name="password" type="password" placeholder="Ej: Pass123!" onChange={handleChange} required />
            </div>
            
            <div>
              <label className="metric-label">Tipo de Usuario</label>
              <select name="role" onChange={handleChange} style={{ marginTop: '5px' }}>
                <option value="traveler">🎒 Viajero (Quiero reservar)</option>
                <option value="guide">🚩 Guía (Ofrezco tours)</option>
                <option value="admin">⚡ Administrador</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '15px' }}>
              Registrarse
            </button>
          </form>

          <div className="login-footer">
            <p>¿Ya tienes cuenta? <Link to="/login" style={{color: 'var(--accent-2)'}}>Inicia Sesión</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;