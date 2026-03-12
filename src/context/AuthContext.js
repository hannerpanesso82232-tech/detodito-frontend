import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { io } from 'socket.io-client'; 
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = () => {
            const storedUser = localStorage.getItem('usuario');
            const token = localStorage.getItem('token');
            
            if (storedUser && token) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } catch (error) {
                    console.error("Error al leer sesión:", error);
                    localStorage.removeItem('usuario');
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    // 🔥 MAGIA EN TIEMPO REAL: SI EL ADMIN EDITA TU PERFIL 🔥
    useEffect(() => {
        if (!user) return; 

        const socket = io(process.env.REACT_APP_API_URL || "http://localhost:3000");

        socket.on('usuarioEditado', (usuarioEditadoPorAdmin) => {
            // Si el ID del usuario modificado coincide con mi ID actual
            if (user.id === usuarioEditadoPorAdmin.id) {
                actualizarUsuarioLocal(usuarioEditadoPorAdmin);
                toast("Tus datos de cuenta fueron actualizados por Soporte.", { icon: '🛡️', duration: 6000 });
            }
        });

        // Si el admin decide eliminar mi cuenta mientras estoy navegando
        socket.on('usuarioEliminado', (usuarioIdEliminado) => {
            if (user.id === parseInt(usuarioIdEliminado)) {
                toast.error("Tu cuenta ha sido desactivada por el Administrador.");
                logout();
            }
        });

        return () => socket.disconnect();
    }, [user]);

    const login = async (cedula, password) => {
        try {
            const res = await API.post('/auth/login', { cedula, password });
            const { token, usuario } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('usuario', JSON.stringify(usuario));
            
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(usuario);
            
            if (usuario.rol === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/');
            }
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                mensaje: error.response?.data?.mensaje || "Error al iniciar sesión" 
            };
        }
    };

    const actualizarUsuarioLocal = (nuevosDatos) => {
        const usuarioActualizado = { ...user, ...nuevosDatos };
        setUser(usuarioActualizado); 
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado)); 
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        delete API.defaults.headers.common['Authorization'];
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, actualizarUsuarioLocal, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);