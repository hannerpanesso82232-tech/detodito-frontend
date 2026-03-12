import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    ShoppingBag, Heart, MapPin, User, ChevronRight, 
    Package, Calendar, Settings, Save, X, Clock, Truck, CheckCircle, ShieldCheck, Lock, MessageCircle, CalendarClock
} from 'lucide-react';
import toast from 'react-hot-toast';

// 🔥 UNIFICACIÓN DE URL PARA LA NUBE 🔥
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Motor de fechas dinámicas
const calcularFechaReal = (rutaGuardada, ciudadCliente, direccionCliente, rutasDB = [], fechaCreacionStr = null, horaLimite = "20:00") => {
    let diaRuta = rutaGuardada;
    
    if (!diaRuta || diaRuta.toUpperCase() === "A CONVENIR") {
        const textoCliente = `${ciudadCliente || ''} ${direccionCliente || ''}`.toUpperCase();
        let matchEncontrado = null;

        for (const ruta of rutasDB) {
            const palabrasClave = (ruta.ciudad || '').toUpperCase().split(',').map(c => c.trim());
            if (palabrasClave.some(palabra => palabra !== '' && textoCliente.includes(palabra))) {
                matchEncontrado = ruta.dia_ruta;
                break;
            }
        }

        if (!matchEncontrado) {
            const MAPA_RUTAS_DEFECTO = {
                "CHIGORODO": "Lunes", "CAREPA": "Lunes", "MUTATA": "Martes", "PAVARANDO": "Martes",
                "BAJIRA": "Miércoles", "PLAYA ROJA": "Miércoles", "APARTADO": "Jueves", "TURBO": "Jueves",
                "NECOCLI": "Viernes", "ARBOLETES": "Viernes"
            };
            for (const [ciudadMap, diaMap] of Object.entries(MAPA_RUTAS_DEFECTO)) {
                if (textoCliente.includes(ciudadMap)) {
                    matchEncontrado = diaMap; break;
                }
            }
        }
        diaRuta = matchEncontrado || "A CONVENIR";
    }

    if (diaRuta.toUpperCase() === "A CONVENIR") return "A coordinar con logística";

    const mapDias = { "DOMINGO": 0, "LUNES": 1, "MARTES": 2, "MIÉRCOLES": 3, "MIERCOLES": 3, "JUEVES": 4, "VIERNES": 5, "SÁBADO": 6, "SABADO": 6 };
    const diaDestino = mapDias[diaRuta.toUpperCase()];
    
    if (diaDestino === undefined) return diaRuta;

    const fechaBase = fechaCreacionStr ? new Date(fechaCreacionStr) : new Date();
    const diaActual = fechaBase.getDay(); 
    let diasFaltantes = diaDestino - diaActual;

    if (diasFaltantes < 0) diasFaltantes += 7;

    if (diasFaltantes === 0) {
        diasFaltantes += 7;
    } else if (diasFaltantes === 1) {
        const [limiteHora, limiteMinuto] = horaLimite.split(':').map(Number);
        const horaPedido = fechaBase.getHours();
        const minutoPedido = fechaBase.getMinutes();

        if (horaPedido > limiteHora || (horaPedido === limiteHora && minutoPedido >= limiteMinuto)) {
            diasFaltantes += 7;
        }
    }

    const fechaEntrega = new Date(fechaBase);
    fechaEntrega.setDate(fechaBase.getDate() + diasFaltantes);

    return fechaEntrega.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};

const Perfil = () => {
    const [seccion, setSeccion] = useState('pedidos');

    const MenuItems = [
        { id: 'pedidos', label: 'Historial de Pedidos', icon: <ShoppingBag size={18}/> },
        { id: 'datos', label: 'Mis Datos Personales', icon: <Settings size={18}/> },
        { id: 'favoritos', label: 'Mis Favoritos', icon: <Heart size={18}/> },
        { id: 'direcciones', label: 'Direcciones y Envío', icon: <MapPin size={18}/> },
    ];

    return (
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8 p-4 md:p-6 mt-10 md:mt-20 animate-in fade-in duration-500">
            {/* Sidebar del Menú */}
            <div className="w-full md:w-64 md:shrink-0 space-y-2">
                <div className="hidden md:block mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <h2 className="text-xl font-black text-blue-900 flex items-center gap-2 uppercase tracking-tighter">
                        <User size={24} /> Mi Cuenta
                    </h2>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Panel de Usuario</p>
                </div>

                <nav className="flex overflow-x-auto md:flex-col gap-2 md:gap-1 pb-2 md:pb-0 custom-scrollbar">
                    {MenuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSeccion(item.id)}
                            className={`shrink-0 md:w-full flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 ${
                                seccion === item.id 
                                ? 'bg-gray-900 text-white shadow-lg md:shadow-xl' 
                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100 md:border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-2 md:gap-3">
                                {item.icon}
                                <span className="font-bold text-xs md:text-sm uppercase tracking-tight whitespace-nowrap">{item.label}</span>
                            </div>
                            <ChevronRight size={16} className={`hidden md:block ${seccion === item.id ? 'opacity-100' : 'opacity-30'}`} />
                        </button>
                    ))}
                </nav>
            </div>

            {/* Contenido Dinámico */}
            <div className="flex-1 bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-100 min-h-[400px] md:min-h-[600px] relative">
                {seccion === 'pedidos' && <HistorialPedidos />}
                {seccion === 'datos' && <InformacionPersonal />}
                {seccion === 'favoritos' && <Favoritos />}
                {seccion === 'direcciones' && <DireccionesPagos />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTES ---

const HistorialPedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [rutasDinamicas, setRutasDinamicas] = useState([]);
    const [horaLimite, setHoraLimite] = useState('20:00');
    const [loading, setLoading] = useState(true);

    const fetchPedidosConfig = async () => {
        try {
            const [resPedidos, resRutas, resHora] = await Promise.all([
                API.get('/pedidos/mis-pedidos'),
                API.get('/pedidos/config/rutas').catch(() => ({ data: [] })),
                API.get('/pedidos/config/horalimite').catch(() => ({ data: { hora: '20:00' } }))
            ]);
            setPedidos(resPedidos.data);
            setRutasDinamicas(resRutas.data || []);
            setHoraLimite(resHora.data.hora || '20:00');
        } catch (error) {
            toast.error("No pudimos cargar tus pedidos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPedidosConfig(); }, []);

    const handleCancelarPedido = async (pedidoId) => {
        if(!window.confirm("¿Seguro que deseas cancelar?")) return;
        try {
            await API.put(`/pedidos/${pedidoId}/cancelar`);
            toast.success("Pedido cancelado");
            fetchPedidosConfig(); 
        } catch (error) {
            toast.error("No se pudo cancelar el pedido");
        }
    };

    if (loading) return <div className="p-10 text-center font-black animate-pulse text-gray-300">SINCRONIZANDO COMPRAS...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black uppercase italic text-gray-900 border-l-4 border-blue-600 pl-4">Mis Pedidos</h1>
            {pedidos.length === 0 ? (
                <div className="bg-gray-50 rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-100">
                    <ShoppingBag size={40} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Aún no has comprado nada</p>
                </div>
            ) : (
                pedidos.map((pedido) => (
                    <div key={pedido.id} className="bg-white rounded-[1.5rem] shadow-xl border border-gray-100 overflow-hidden mb-6">
                        <div className="p-3 bg-black text-white text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Est. Entrega: {calcularFechaReal(pedido.ruta, pedido.Usuario?.ciudad, pedido.direccion, rutasDinamicas, pedido.fecha, horaLimite)}
                            </span>
                        </div>
                        <div className="p-5 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase">Orden #{pedido.id}</span>
                                <h3 className="font-black text-gray-900 uppercase italic">Estado: {pedido.estado}</h3>
                            </div>
                            <span className="text-xl font-black text-blue-600">${parseFloat(pedido.total).toLocaleString()}</span>
                        </div>
                        <div className="p-5">
                            {(pedido.Detalles || []).map(d => (
                                <div key={d.id} className="flex justify-between text-xs font-bold uppercase border-b border-gray-50 py-2 last:border-0">
                                    <span>{d.cantidad}x {d.Producto?.nombre}</span>
                                    <span className="text-gray-400">${(d.cantidad * d.precioUnitario).toLocaleString()}</span>
                                </div>
                            ))}
                            {pedido.estado === 'Pendiente' && (
                                <button onClick={() => handleCancelarPedido(pedido.id)} className="mt-4 text-red-500 text-[9px] font-black uppercase w-full text-right hover:underline">Cancelar Pedido</button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const InformacionPersonal = () => {
    const { user, setUser } = useAuth();
    const [editando, setEditando] = useState(false);
    const [loading, setLoading] = useState(false);
    const [whatsappAdmin, setWhatsappAdmin] = useState('573000000000');
    const [telefono, setTelefono] = useState('');

    useEffect(() => {
        if (user) setTelefono(user.telefono || '');
        API.get('/auth/config/whatsapp').then(res => setWhatsappAdmin(res.data.whatsapp)).catch(() => {});
    }, [user]);

    const handleActualizar = async () => {
        setLoading(true);
        try {
            await API.put('/auth/perfil', { telefono });
            setUser({ ...user, telefono });
            toast.success("Teléfono actualizado");
            setEditando(false);
        } catch (err) { toast.error("Error al actualizar"); } finally { setLoading(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-2xl font-black uppercase italic">Mis Datos</h3>
                <button onClick={() => setEditando(!editando)} className="bg-gray-100 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase">{editando ? 'Cerrar' : 'Editar'}</button>
            </div>
            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Cédula de Ciudadanía</label>
                    <p className="font-black text-lg">{user?.cedula || 'N/A'}</p>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <label className="text-[9px] font-black text-blue-600 uppercase block mb-1">Teléfono Móvil</label>
                    <input 
                        disabled={!editando} 
                        className={`w-full bg-transparent font-black text-lg outline-none ${editando ? 'text-blue-600' : 'text-gray-900'}`} 
                        value={telefono} 
                        onChange={e => setTelefono(e.target.value)} 
                    />
                </div>
                {editando && (
                    <button onClick={handleActualizar} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">
                        {loading ? 'Guardando...' : 'Confirmar Cambio'}
                    </button>
                )}
                <div className="mt-8 p-6 bg-green-50 rounded-[2rem] text-center">
                    <p className="text-xs font-bold text-green-800 mb-4">¿Deseas cambiar tu dirección o nombre?</p>
                    <a href={`https://wa.me/${whatsappAdmin}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-md">
                        <MessageCircle size={16}/> Contactar Soporte
                    </a>
                </div>
            </div>
        </div>
    );
};

const Favoritos = () => {
    const [favoritos, setFavoritos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/favoritos')
            .then(res => setFavoritos(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-center font-black text-gray-300">CARGANDO FAVORITOS...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-black uppercase italic border-b pb-4">Favoritos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoritos.length === 0 && <p className="text-gray-400 font-bold uppercase text-[10px] text-center col-span-2 py-10">No tienes productos guardados</p>}
                {favoritos.map(f => (
                    <div key={f.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-black transition-all">
                        {/* 🔥 CORRECCIÓN: IMAGEN CON BASE_URL DINÁMICO 🔥 */}
                        <img 
                            src={f.imagen_url ? `${BASE_URL}${f.imagen_url}` : 'https://placehold.co/100'} 
                            alt={f.nombre} 
                            className="w-16 h-16 rounded-xl object-cover bg-white" 
                        />
                        <div className="overflow-hidden">
                            <h4 className="font-black text-[10px] uppercase truncate">{f.nombre}</h4>
                            <p className="text-blue-600 font-black text-sm">${parseFloat(f.precio || 0).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DireccionesPagos = () => {
    const [direcciones, setDirecciones] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nuevaDir, setNuevaDir] = useState({ etiqueta: '', direccion: '', ciudad: '' });

    const fetchDirs = async () => {
        try { const res = await API.get('/auth/direcciones'); setDirecciones(res.data); } catch (e) {}
    };

    useEffect(() => { fetchDirs(); }, []);

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            await API.post('/auth/direcciones', nuevaDir);
            toast.success("Dirección guardada");
            setMostrarForm(false);
            setNuevaDir({ etiqueta: '', direccion: '', ciudad: '' });
            fetchDirs();
        } catch (e) { toast.error("Error al guardar"); }
    };

    const eliminar = async (id) => {
        try {
            await API.delete(`/auth/direcciones/${id}`);
            toast.success("Dirección eliminada");
            fetchDirs();
        } catch (e) {}
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-2xl font-black uppercase italic">Direcciones</h3>
                <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">+ Nueva</button>
            </div>
            {mostrarForm && (
                <form onSubmit={handleGuardar} className="bg-gray-50 p-6 rounded-[2rem] space-y-4 animate-in zoom-in-95">
                    <input required className="w-full p-4 rounded-2xl text-xs font-bold outline-none border-none shadow-sm" placeholder="Nombre (Ej: Casa, Oficina)" value={nuevaDir.etiqueta} onChange={e => setNuevaDir({...nuevaDir, etiqueta: e.target.value})} />
                    <input required className="w-full p-4 rounded-2xl text-xs font-bold outline-none border-none shadow-sm" placeholder="Ciudad" value={nuevaDir.ciudad} onChange={e => setNuevaDir({...nuevaDir, ciudad: e.target.value})} />
                    <input required className="w-full p-4 rounded-2xl text-xs font-bold outline-none border-none shadow-sm" placeholder="Dirección completa" value={nuevaDir.direccion} onChange={e => setNuevaDir({...nuevaDir, direccion: e.target.value})} />
                    <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px]">Guardar Dirección</button>
                </form>
            )}
            <div className="grid gap-4">
                {direcciones.map(dir => (
                    <div key={dir.id} className="p-5 bg-white border border-gray-100 rounded-[1.5rem] flex justify-between items-center shadow-sm hover:border-blue-500 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><MapPin size={20}/></div>
                            <div>
                                <h4 className="font-black text-xs uppercase">{dir.etiqueta}</h4>
                                <p className="text-[10px] text-gray-500 font-bold">{dir.direccion}, {dir.ciudad}</p>
                            </div>
                        </div>
                        <button onClick={() => eliminar(dir.id)} className="text-gray-300 hover:text-red-500 p-2"><X size={20}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Perfil;