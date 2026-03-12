import axios from 'axios';

const API = axios.create({
    // Usa la URL de la nube en producción, o localhost si estás desarrollando en tu PC
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

// Interceptor de PETICIÓN
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Interceptor de RESPUESTA
API.interceptors.response.use(
    (response) => response, 
    (error) => {
        const isAuthRequest = error.config.url.includes('/auth/login');

        // Si el error es 401, no es una petición de login, y no estamos ya en login
        if (error.response?.status === 401 && !isAuthRequest && !window.location.pathname.includes('/login')) {
            console.warn("Sesión expirada o no autorizada");
            
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            
            // Redirección forzada
            window.location.href = '/login?expired=true'; 
        }
        return Promise.reject(error);
    }
);

export default API;