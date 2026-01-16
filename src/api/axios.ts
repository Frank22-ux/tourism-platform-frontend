import axios from 'axios';

// 1. Crear una instancia de Axios con la URL de tu Backend
const api = axios.create({
  baseURL: 'http://localhost:4000', // Apunta a tu NestJS
});

// 2. Interceptor de Peticiones (Request Interceptor)
// Antes de que salga cualquier petición, revisa si hay un token guardado y lo pega.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Buscamos en la "caja fuerte" del navegador
  
  if (token) {
    // Si hay token, lo agregamos al Header Authorization
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;