import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, Loader2, Mail, ShieldAlert } from 'lucide-react';
// import { Link } from 'react-router-dom'; // Ya no lo necesitamos aquí
import toast from 'react-hot-toast';
import API from '../services/api';

const Login = () => {
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [emailRespaldo, setEmailRespaldo] = useState('');
    const [loading, setLoading] = useState(false);
    const [modoRecuperacion, setModoRecuperacion] = useState(false);
    
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const loadingToast = toast.loading('Verificando credenciales...');
        
        try {
            const result = await login(cedula, password);
            toast.dismiss(loadingToast);

            if (result.success) {
                toast.success('¡Ingreso exitoso!');
            } else {
                toast.error(result.mensaje || 'Cédula o contraseña incorrectas');
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('El servidor está despertando, intenta de nuevo en unos segundos');
        } finally {
            setLoading(false);
        }
    };

    const handleRecuperar = async (e) => {
        e.preventDefault();
        setLoading(true);
        const loadId = toast.loading('Verificando identidad...');

        try {
            const res = await API.post('/auth/recuperar-password', { cedula, email: emailRespaldo });
            toast.dismiss(loadId);
            
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <span className="font-bold text-gray-900">¡Tu nueva clave temporal es:</span>
                    <span className="text-xl font-black text-blue-600 bg-blue-50 p-2 rounded text-center tracking-widest">{res.data.passwordTemporal}</span>
                    <span className="text-xs text-gray-500">Cópiala, ingresa y cámbiala en tu panel.</span>
                </div>
            ), { duration: 15000 });

            setModoRecuperacion(false); 
            setPassword(res.data.passwordTemporal); 
        } catch (error) {
            toast.dismiss(loadId);
            toast.error(error.response?.data?.error || 'Datos no coinciden en nuestro sistema');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-gray-50 p-4 md:p-6 animate-fadeIn">
            <div className="bg-white p-6 sm:p-10 md:p-14 rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-md border border-gray-100 relative overflow-hidden">
                
                {modoRecuperacion && <div className="absolute top-0 left-0 w-full h-2 bg-orange-500 animate-pulse"></div>}

                <div className="text-center mb-8 md:mb-10">
                    <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
                        {modoRecuperacion ? 'Recuperar Acceso' : 'Iniciar Sesión'}
                    </h2>
                    <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mt-3 md:mt-4">
                        {modoRecuperacion ? 'Verificación de seguridad' : 'Acceso exclusivo a la plataforma'}
                    </p>
                </div>
                
                {modoRecuperacion ? (
                    <form onSubmit={handleRecuperar} className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-orange-50 p-4 rounded-xl md:rounded-2xl mb-4 flex items-start gap-3 border border-orange-100">
                            <ShieldAlert className="text-orange-500 flex-shrink-0" size={20} />
                            <p className="text-[9px] md:text-[10px] font-bold text-orange-800 uppercase tracking-widest leading-relaxed">
                                Ingresa tu cédula y el correo para enviarte una clave temporal.
                            </p>
                        </div>

                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                            <input type="text" placeholder="TU CÉDULA" className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-xs md:text-sm" value={cedula} onChange={e => setCedula(e.target.value)} required />
                        </div>

                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                            <input type="email" placeholder="CORREO REGISTRADO" className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-xs md:text-sm" value={emailRespaldo} onChange={e => setEmailRespaldo(e.target.value)} required />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white font-black py-4 md:py-5 rounded-xl md:rounded-2xl mt-2 transition-all shadow-xl hover:bg-black active:scale-95 uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Generar Nueva Clave'}
                        </button>
                        
                        <button type="button" onClick={() => setModoRecuperacion(false)} className="w-full text-gray-400 font-bold text-[9px] md:text-[10px] uppercase hover:text-black transition-colors pt-4 tracking-widest p-2">
                            Volver al Login
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-left-4">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                            <input type="text" placeholder="NÚMERO DE CÉDULA" className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold text-xs md:text-sm" value={cedula} onChange={e => setCedula(e.target.value)} required />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                            <input type="password" placeholder="CONTRASEÑA" className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold text-xs md:text-sm" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-black text-white font-black py-4 md:py-5 rounded-xl md:rounded-2xl mt-2 transition-all shadow-xl hover:bg-blue-600 active:scale-95 uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Entrar <ArrowRight size={16} /></>}
                        </button>
                    </form>
                )}

                {/* 🔥 BOTÓN DE REGISTRO ELIMINADO 🔥 */}
                {!modoRecuperacion && (
                    <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-100 text-center flex flex-col gap-3">
                        <button onClick={() => setModoRecuperacion(true)} className="text-gray-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:text-orange-500 transition-colors p-2">
                            ¿Olvidaste tu clave?
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;