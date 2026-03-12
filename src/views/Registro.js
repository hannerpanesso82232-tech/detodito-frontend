import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { User, Mail, Lock, Phone, Calendar, UserPlus, Loader2, MapPin, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    fecha_nacimiento: '',
    direccion: '', // 🔥 Campo añadido
    ciudad: '',    // 🔥 Campo añadido para facilitar el cálculo de rutas en Urabá
    rol: 'CLIENTE'
  });
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Iniciamos el toast de carga
    const loadingToast = toast.loading('Creando tu perfil...');
    
    try {
      // 1. Limpiamos la fecha si está vacía para evitar errores en la DB
      const payload = {
        ...formData,
        fecha_nacimiento: formData.fecha_nacimiento || null
      };

      // Enviamos la petición al backend
      await API.post('/auth/registro', payload);
      
      // Si tiene éxito, transformamos el toast anterior
      toast.success("¡Cuenta creada! Ya puedes iniciar sesión.", { id: loadingToast });
      
      // Pequeño delay para que el usuario vea el éxito antes de redirigir
      setTimeout(() => navigate('/login'), 1500);
      
    } catch (err) {
      // Manejamos el error transformando el toast de carga en uno de error
      const errorMsg = err.response?.data?.mensaje || err.response?.data?.error || "Error al registrar usuario";
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-6 animate-in fade-in duration-500">
      <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl w-full max-w-xl border border-gray-100 mt-10">
        <div className="text-center mb-10">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
              Join <br/> The Club
            </h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-4">
              Crea tu identidad de cliente
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="relative group md:col-span-2">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                <input 
                    type="text" 
                    name="nombre" 
                    placeholder="NOMBRE COMPLETO" 
                    value={formData.nombre}
                    className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold text-sm" 
                    onChange={handleChange} 
                    required 
                />
              </div>

              {/* Teléfono */}
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                <input 
                  type="tel" 
                  name="telefono" 
                  placeholder="TELÉFONO" 
                  value={formData.telefono}
                  className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold text-sm" 
                  onChange={handleChange} 
                />
              </div>

              {/* Fecha de Nacimiento */}
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                <input 
                  type="date" 
                  name="fecha_nacimiento" 
                  value={formData.fecha_nacimiento}
                  className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold text-sm text-gray-500 focus:text-black" 
                  onChange={handleChange} 
                />
              </div>

              {/* 🔥 NUEVO: Ciudad */}
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                <input 
                  type="text" 
                  name="ciudad" 
                  placeholder="CIUDAD (Ej: Carepa)" 
                  value={formData.ciudad}
                  className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold text-sm" 
                  onChange={handleChange} 
                  required
                />
              </div>

              {/* 🔥 NUEVO: Dirección */}
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                <input 
                  type="text" 
                  name="direccion" 
                  placeholder="DIRECCIÓN PRINCIPAL" 
                  value={formData.direccion}
                  className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold text-sm" 
                  onChange={handleChange} 
                  required
                />
              </div>
          </div>
          
          {/* Email */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
            <input 
                type="email" 
                name="email" 
                placeholder="CORREO ELECTRÓNICO" 
                value={formData.email}
                className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold text-sm" 
                onChange={handleChange} 
                required 
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
            <input 
                type="password" 
                name="password" 
                placeholder="CONTRASEÑA (MÍN. 6 CARACTERES)" 
                value={formData.password}
                minLength="6"
                className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold text-sm" 
                onChange={handleChange} 
                required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-black text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:bg-gray-400 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <><UserPlus size={18}/> Crear mi Cuenta</>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
          ¿Ya eres parte de la comunidad? 
          <Link to="/login" className="text-black border-b-2 border-black pb-0.5 ml-1 hover:text-blue-600 hover:border-blue-600 transition-all">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Registro;