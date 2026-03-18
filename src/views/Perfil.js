import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; 
import { 
    ShoppingBag, Heart, MapPin, User, ChevronRight, 
    Package, Calendar, Settings, Save, X, Clock, Truck, CheckCircle, ShieldCheck, 
    Lock, MessageCircle, CalendarClock, Wallet, Banknote, History, ShoppingCart
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatearImagen = (url) => {
    if (!url) return 'https://placehold.co/150';
    let urlLimpia = url.replace(/http:\/\/localhost:(3000|5000)/g, '');
    if (urlLimpia.startsWith('https://') || (urlLimpia.startsWith('http://') && !urlLimpia.includes('localhost'))) {
        return urlLimpia;
    }
    const base = process.env.REACT_APP_API_URL || "http://localhost:3000";
    return `${base}${urlLimpia.startsWith('/') ? '' : '/'}${urlLimpia}`;
};

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
    if (diasFaltantes === 0) diasFaltantes += 7;
    else if (diasFaltantes === 1) {
        const [limiteHora, limiteMinuto] = horaLimite.split(':').map(Number);
        if (fechaBase.getHours() > limiteHora || (fechaBase.getHours() === limiteHora && fechaBase.getMinutes() >= limiteMinuto)) {
            diasFaltantes += 7;
        }
    }

    const fechaEntrega = new Date(fechaBase);
    fechaEntrega.setDate(fechaBase.getDate() + diasFaltantes);
    return fechaEntrega.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};

const formatCurrency = (valor) => Number(valor || 0).toLocaleString('es-CO');

const Perfil = () => {
    const [seccion, setSeccion] = useState('pedidos');

    const MenuItems = [
        { id: 'pedidos', label: 'Historial de Pedidos', icon: <ShoppingBag size={18}/> },
        { id: 'cartera', label: 'Mi Cartera (Crédito)', icon: <Wallet size={18}/> }, 
        { id: 'datos', label: 'Mis Datos Personales', icon: <Settings size={18}/> },
        { id: 'favoritos', label: 'Mis Favoritos', icon: <Heart size={18}/> },
        { id: 'direcciones', label: 'Direcciones y Envío', icon: <MapPin size={18}/> },
    ];

    return (
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8 p-4 md:p-6 mt-10 md:mt-20 animate-in fade-in duration-500">
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
                                ? 'bg-gray-900 text-white shadow-lg md:shadow-xl md:translate-x-2' 
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

            <div className="flex-1 bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-100 min-h-[400px] md:min-h-[600px] relative overflow-hidden">
                {seccion === 'pedidos' && <HistorialPedidos />}
                {seccion === 'cartera' && <MiCartera />} 
                {seccion === 'datos' && <InformacionPersonal />}
                {seccion === 'favoritos' && <Favoritos />}
                {seccion === 'direcciones' && <DireccionesPagos />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTES ---

const MiCartera = () => {
    const [infoCredito, setInfoCredito] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 🔥 ESTADO PARA LAS PESTAÑAS INTERNAS DE CARTERA 🔥
    const [tabCartera, setTabCartera] = useState('deudas'); // 'deudas' | 'pagos'

    useEffect(() => {
        const fetchCredito = async () => {
            try {
                // Forzamos el envío del token por si falla el interceptor global
                const token = localStorage.getItem('token');
                const res = await API.get('/creditos/mi-cartera', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                setInfoCredito(res.data);
            } catch (error) {
                console.error("Error cargando cartera:", error.response?.data || error.message);
                toast.error(error.response?.data?.error || "No pudimos cargar tu información de crédito.");
            } finally {
                setLoading(false);
            }
        };
        fetchCredito();
    }, []);

    if (loading) return <div className="p-10 text-center font-black animate-pulse uppercase tracking-[0.2em] text-gray-300 text-xs">Cargando estado de cuenta...</div>;
    if (!infoCredito) return <div className="p-10 text-center font-black uppercase text-gray-400 text-xs">Ocurrió un error al cargar los datos.</div>;

    const cupoDisponible = infoCredito.limite_credito > 0 ? (infoCredito.limite_credito - infoCredito.deuda_total) : 0;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="border-l-4 md:border-l-8 border-orange-500 pl-4 md:pl-6 mb-6 md:mb-8">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-gray-900">Mi Cartera</h1>
                <p className="text-gray-400 text-[9px] md:text-xs font-bold tracking-[0.2em] uppercase mt-1">Gestión de cupo y pagos</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl md:rounded-3xl">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 flex items-center gap-1.5"><ShieldCheck size={12}/> Cupo Aprobado</p>
                    <h3 className="text-xl md:text-2xl font-black italic text-gray-900">${formatCurrency(infoCredito.limite_credito)}</h3>
                    <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase mt-1">Plazo: {infoCredito.dias_credito} días</p>
                </div>
                
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl md:rounded-3xl">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-orange-600 tracking-widest mb-1 flex items-center gap-1.5"><Banknote size={12}/> Deuda Actual</p>
                    <h3 className="text-xl md:text-2xl font-black italic text-orange-600">${formatCurrency(infoCredito.deuda_total)}</h3>
                    {infoCredito.deuda_total > 0 && <p className="text-[8px] md:text-[9px] text-orange-500 font-bold uppercase mt-1">Pagar a tiempo evita mora</p>}
                </div>

                <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl md:rounded-3xl shadow-sm">
                    <p className="text-[9px] md:text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1 flex items-center gap-1.5"><Wallet size={12}/> Cupo Disponible</p>
                    <h3 className="text-xl md:text-2xl font-black italic text-blue-600">${formatCurrency(cupoDisponible > 0 ? cupoDisponible : 0)}</h3>
                </div>
            </div>

            <div className="mt-8">
                {/* Navegación Interna */}
                <div className="flex gap-4 border-b border-gray-200 mb-6">
                    <button 
                        onClick={() => setTabCartera('deudas')} 
                        className={`pb-3 font-black uppercase text-[10px] md:text-xs tracking-widest transition-colors ${tabCartera === 'deudas' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Mis Deudas
                    </button>
                    <button 
                        onClick={() => setTabCartera('pagos')} 
                        className={`pb-3 font-black uppercase text-[10px] md:text-xs tracking-widest transition-colors ${tabCartera === 'pagos' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Historial de Pagos
                    </button>
                </div>

                {/* Vistas Dinámicas */}
                {tabCartera === 'deudas' ? (
                    <div className="space-y-4">
                        {(!infoCredito.historial_creditos || infoCredito.historial_creditos.length === 0) ? (
                            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                                <p className="text-gray-400 font-bold uppercase text-[10px]">No tienes créditos registrados.</p>
                            </div>
                        ) : (
                            infoCredito.historial_creditos.map(cred => (
                                <div key={cred.id} className={`p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl md:rounded-3xl border transition-all ${cred.estado === 'VIGENTE' ? 'bg-white shadow-sm border-gray-200 hover:border-orange-300' : 'bg-green-50/50 border-green-100 hover:border-green-300'}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[8px] md:text-[9px] font-black uppercase px-2 py-1 rounded-md text-white ${cred.estado === 'VIGENTE' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                                {cred.estado}
                                            </span>
                                            <span className="text-[9px] md:text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                                                {new Date(cred.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="font-black text-gray-900 text-sm md:text-base leading-tight uppercase">{cred.descripcion}</p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Valor Original: ${formatCurrency(cred.monto_total)}</p>
                                        <p className={`font-black italic text-lg md:text-xl mt-1 ${cred.estado === 'VIGENTE' ? 'text-orange-600' : 'text-green-600'}`}>
                                            {cred.estado === 'VIGENTE' ? `Saldo: $${formatCurrency(cred.saldo)}` : 'Saldado'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(!infoCredito.historial_pagos || infoCredito.historial_pagos.length === 0) ? (
                            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                                <p className="text-gray-400 font-bold uppercase text-[10px]">Aún no has realizado abonos o pagos.</p>
                            </div>
                        ) : (
                            infoCredito.historial_pagos.map(pago => (
                                <div key={pago.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-green-200 transition-colors gap-3">
                                    <div className="flex items-start sm:items-center gap-4">
                                        <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center shrink-0">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 text-xs md:text-sm uppercase tracking-tight line-clamp-1">{pago.credito_descripcion}</p>
                                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-widest">
                                                {new Date(pago.fecha).toLocaleDateString()} {pago.nota && `• ${pago.nota}`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-black italic text-green-600 text-lg md:text-xl sm:text-right shrink-0">
                                        +${formatCurrency(pago.monto)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

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

    useEffect(() => {
        fetchPedidosConfig();
    }, []);

    const handleCancelarPedido = async (pedidoId) => {
        if(!window.confirm("¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer y los productos regresarán a la tienda.")) return;
        
        try {
            await API.put(`/pedidos/${pedidoId}/cancelar`);
            toast.success("Pedido cancelado exitosamente");
            fetchPedidosConfig(); 
        } catch (error) {
            toast.error(error.response?.data?.error || "Error al cancelar el pedido");
        }
    };

    const getStatusIcon = (estado) => {
        switch (estado) {
            case 'Pendiente': return <Clock className="text-amber-500" size={24} />;
            case 'Enviado': return <Truck className="text-blue-500" size={24} />;
            case 'Entregado': return <CheckCircle className="text-green-500" size={24} />;
            case 'Cancelado': return <X className="text-red-500" size={24} />;
            default: return <Package className="text-gray-500" size={24} />;
        }
    };

    if (loading) return <div className="p-10 md:p-20 text-center font-black animate-pulse uppercase tracking-[0.2em] text-gray-300 text-xs md:text-sm">Sincronizando tus compras...</div>;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="border-l-4 md:border-l-8 border-blue-600 pl-4 md:pl-6 mb-6 md:mb-8">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-gray-900">Mis Pedidos</h1>
                <p className="text-gray-400 text-[9px] md:text-xs font-bold tracking-[0.2em] uppercase mt-1">Rastreo de envíos y facturación</p>
            </div>

            {pedidos.length === 0 ? (
                <div className="bg-gray-50 rounded-[2rem] md:rounded-[3rem] p-12 md:p-24 text-center border-2 md:border-4 border-dashed border-gray-100">
                    <ShoppingBag size={60} className="mx-auto text-gray-200 mb-4 md:mb-6" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] md:text-xs">Aún no tienes pedidos registrados</p>
                </div>
            ) : (
                <div className="space-y-6 md:space-y-8">
                    {pedidos.map((pedido) => {
                        const fechaEstimadaLlegada = calcularFechaReal(pedido.ruta, pedido.Usuario?.ciudad, pedido.direccion, rutasDinamicas, pedido.fecha || pedido.createdAt, horaLimite);

                        return (
                            <div key={pedido.id} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-lg md:shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden group hover:border-blue-400 transition-all duration-500">
                                
                                {pedido.estado !== 'Cancelado' && (
                                    <div className={`p-3 md:p-4 flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3 ${pedido.estado === 'Entregado' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                                        {pedido.estado === 'Entregado' ? (
                                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14}/> PEDIDO ENTREGADO</span>
                                        ) : (
                                            <>
                                                <CalendarClock size={16} className="animate-pulse hidden sm:block" />
                                                <div className="text-center sm:text-left">
                                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-80 block sm:inline">Llegada Estimada: </span>
                                                    <span className="text-xs md:text-sm font-black capitalize ml-0 sm:ml-2">{fechaEstimadaLlegada}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                                {pedido.estado === 'Cancelado' && (
                                    <div className="p-3 md:p-4 flex items-center justify-center gap-2 bg-red-600 text-white">
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2"><X size={14}/> PEDIDO CANCELADO</span>
                                    </div>
                                )}

                                <div className="p-5 md:p-8 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6 border-b border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-3xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:rotate-6 transition-transform">
                                            {getStatusIcon(pedido.estado)}
                                        </div>
                                        <div>
                                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Orden #{pedido.id}</span>
                                            <h3 className="text-base md:text-xl font-black text-gray-900 uppercase italic leading-tight">Estado: {pedido.estado}</h3>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-0 border-gray-200 pt-3 sm:pt-0">
                                        <div className="flex items-center sm:justify-end gap-1.5 md:gap-2 text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">
                                            <Calendar size={10} /> {new Date(pedido.fecha || pedido.createdAt).toLocaleDateString()}
                                        </div>
                                        <span className="text-2xl md:text-3xl font-black text-gray-900 italic">${parseFloat(pedido.total).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="p-5 md:p-8 space-y-3 md:space-y-4">
                                    {(pedido.Detalles || []).map((detalle) => (
                                        <div key={detalle.id} className="flex items-center justify-between group/item border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3 md:gap-4 pr-4">
                                                <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-100 rounded-lg md:rounded-xl flex items-center justify-center text-gray-900 font-black text-[10px] md:text-xs shrink-0">
                                                    {detalle.cantidad}x
                                                </div>
                                                <div>
                                                    <p className="font-black text-xs md:text-sm text-gray-800 uppercase italic tracking-tight line-clamp-2">{detalle.Producto?.nombre || 'Item'}</p>
                                                    <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">C/U: ${parseFloat(detalle.precioUnitario).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-gray-400 text-xs md:text-sm italic shrink-0">${(detalle.cantidad * detalle.precioUnitario).toLocaleString()}</span>
                                        </div>
                                    ))}

                                    {pedido.estado === 'Pendiente' && (
                                        <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-gray-100 flex justify-end">
                                            <button 
                                                onClick={() => handleCancelarPedido(pedido.id)}
                                                className="w-full sm:w-auto bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest px-4 md:px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <X size={14} /> Cancelar Mi Pedido
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const InformacionPersonal = () => {
    const { user, setUser } = useAuth();
    const [editando, setEditando] = useState(false);
    const [loading, setLoading] = useState(false);
    const [whatsappAdmin, setWhatsappAdmin] = useState('573000000000');
    const [formData, setFormData] = useState({ telefono: '' });

    useEffect(() => {
        if (user) setFormData({ telefono: user.telefono || '' });
        API.get('/auth/config/whatsapp')
           .then(res => setWhatsappAdmin(res.data.whatsapp))
           .catch(err => console.error("Error al cargar whatsapp"));
    }, [user]);

    const handleActualizar = async () => {
        setLoading(true);
        try {
            const res = await API.put('/auth/perfil', { telefono: formData.telefono });
            const datosParaSesion = res.data?.usuario ? res.data.usuario : { ...user, telefono: formData.telefono };
            if (typeof setUser === 'function') {
                setUser(datosParaSesion);
                toast.success("¡Teléfono actualizado con éxito!");
            } else {
                toast.success("¡Teléfono actualizado con éxito!");
                setTimeout(() => window.location.reload(), 1500);
            }
            setEditando(false);
        } catch (err) { toast.error("Error al actualizar perfil"); } finally { setLoading(false); }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="border-b pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter">Mis Datos</h3>
                    <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Información de tu cuenta</p>
                </div>
                {!editando ? (
                    <button onClick={() => setEditando(true)} className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 md:py-2 rounded-xl font-black text-[10px] md:text-xs uppercase hover:bg-blue-600 transition-all shadow-lg active:scale-95">Modificar Teléfono</button>
                ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => {setEditando(false); setFormData({telefono: user?.telefono || ''})}} className="flex-1 sm:flex-none flex justify-center bg-gray-100 text-gray-500 px-4 py-3 md:py-2 rounded-xl font-black text-xs uppercase hover:bg-gray-200"><X size={16} /></button>
                        <button onClick={handleActualizar} disabled={loading} className="flex-[3] sm:flex-none justify-center bg-green-500 text-white px-6 py-3 md:py-2 rounded-xl font-black text-[10px] md:text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-green-600"><Save size={14} /> Guardar</button>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Documento de Identidad (CC)</label>
                    <p className="font-black text-gray-900 text-base md:text-lg">{user?.cedula || 'No registrada'}</p>
                </div>
                <div className="bg-green-100 text-green-600 p-2 md:p-3 rounded-xl md:rounded-2xl"><ShieldCheck size={20} className="md:w-6 md:h-6"/></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5 md:space-y-2 col-span-1 md:col-span-2 bg-blue-50/30 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-blue-100">
                    <label className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 md:ml-2 flex items-center gap-2">Teléfono de Contacto</label>
                    <input 
                        type="text" 
                        disabled={!editando} 
                        className={`w-full p-3 md:p-4 rounded-xl md:rounded-2xl border outline-none font-bold text-sm md:text-lg transition-all ${editando ? 'border-blue-500 bg-white focus:ring-4 focus:ring-blue-100 text-black' : 'border-transparent bg-transparent text-gray-700'}`} 
                        value={formData.telefono} 
                        onChange={e => setFormData({...formData, telefono: e.target.value})} 
                        placeholder="Tu número celular"
                    />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2 mt-2 md:mt-4 border-t border-gray-100 pt-4 md:pt-6">
                    <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-4 flex items-center gap-1.5"><Lock size={10} /> Datos asignados por Administración</p>
                </div>

                <div className="space-y-1.5 md:space-y-2 col-span-1 md:col-span-2">
                    <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 md:ml-2">Nombre Completo</label>
                    <div className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl border border-transparent bg-gray-50 font-bold text-gray-500 cursor-not-allowed text-xs md:text-base">{user?.nombre || 'N/A'}</div>
                </div>
                
                <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 md:ml-2">Ciudad / Zona</label>
                    <div className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl border border-transparent bg-gray-50 font-bold text-gray-500 cursor-not-allowed text-xs md:text-base">{user?.ciudad || 'No especificada'}</div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 md:ml-2">Dirección Principal</label>
                    <div className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl border border-transparent bg-gray-50 font-bold text-gray-500 cursor-not-allowed truncate text-xs md:text-base">{user?.direccion || 'Sin dirección registrada'}</div>
                </div>
                
                <div className="col-span-1 md:col-span-2 mt-4 md:mt-6 p-5 md:p-6 bg-green-50 rounded-2xl md:rounded-3xl border border-green-100 text-center flex flex-col items-center justify-center">
                    <p className="text-[10px] md:text-xs text-green-800 font-bold mb-3 md:mb-4">¿Necesitas modificar tu nombre, ciudad o dirección?</p>
                    <a 
                        href={`https://wa.me/${whatsappAdmin}?text=Hola,%20soy%20${user?.nombre}%20(CC:%20${user?.cedula})%20y%20necesito%20actualizar%20mis%20datos%20en%20el%20sistema.`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#25D366] text-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-green-600 transition-colors shadow-lg active:scale-95"
                    >
                        <MessageCircle size={16} /> Soporte (WhatsApp)
                    </a>
                </div>
            </div>
        </div>
    );
};

const Favoritos = () => {
    const [favoritos, setFavoritos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 🔥 IMPORTAMOS EL HOOK DEL CARRITO 🔥
    const { addToCart } = useCart();

    useEffect(() => {
        const cargarFavoritos = async () => {
            try { const res = await API.get('/favoritos'); setFavoritos(res.data); } 
            catch (err) { console.error(err); } finally { setLoading(false); }
        };
        cargarFavoritos();
    }, []);

    // 🔥 FUNCIÓN PARA AÑADIR AL CARRITO 🔥
    const handleAgregarAlCarrito = (producto) => {
        addToCart({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen_url: producto.imagen_url,
            Categoria: producto.Categoria || { nombre: 'General' },
            cantidad: 1
        });
        toast.success("¡Añadido al carrito!", { icon: '🛒' });
    };

    if (loading) return <div className="p-10 md:p-20 text-center font-black text-gray-300 animate-pulse uppercase text-xs md:text-sm">Cargando...</div>;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="border-b pb-4"><h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Mis Favoritos</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {favoritos.length === 0 && <p className="col-span-1 sm:col-span-2 text-gray-400 text-[10px] md:text-xs font-bold py-10 text-center">No tienes favoritos guardados.</p>}
                {favoritos.map(f => (
                    <div key={f.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-2xl md:rounded-3xl border border-gray-100 hover:border-black transition-colors">
                        <img 
                            src={formatearImagen(f.imagen_url)} 
                            alt={f.nombre} 
                            className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl object-cover shrink-0" 
                        />
                        <div className="overflow-hidden flex-1">
                            <h4 className="font-black text-[10px] md:text-xs uppercase truncate">{f.nombre}</h4>
                            <p className="text-blue-600 font-black text-xs md:text-sm mt-0.5">${parseFloat(f.precio || 0).toLocaleString()}</p>
                        </div>
                        
                        {/* 🔥 BOTÓN DE CARRITO AÑADIDO 🔥 */}
                        <button 
                            onClick={() => handleAgregarAlCarrito(f)}
                            className="p-2 md:p-3 bg-black text-white rounded-xl hover:bg-blue-600 transition-colors shadow-md active:scale-95 shrink-0"
                            title="Añadir al carrito"
                        >
                            <ShoppingCart size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DireccionesPagos = () => {
    const [mostrarForm, setMostrarForm] = useState(false);
    const [direcciones, setDirecciones] = useState([]);
    const [nuevaDir, setNuevaDir] = useState({ etiqueta: '', direccion: '', ciudad: '' });
    const [loading, setLoading] = useState(false);

    const fetchDirecciones = async () => {
        try { const res = await API.get('/auth/direcciones'); setDirecciones(res.data); } 
        catch (err) { console.log("Error cargando direcciones"); }
    };

    useEffect(() => { fetchDirecciones(); }, []);

    const handleGuardar = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            await API.post('/auth/direcciones', nuevaDir); toast.success("Dirección agregada");
            setMostrarForm(false); setNuevaDir({ etiqueta: '', direccion: '', ciudad: '' }); fetchDirecciones();
        } catch (err) { toast.error("Error al guardar"); } finally { setLoading(false); }
    };

    const eliminarDireccion = async (id) => {
        try { await API.delete(`/auth/direcciones/${id}`); toast.success("Eliminada"); fetchDirecciones(); } 
        catch (err) { toast.error("Error al eliminar"); }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="border-b pb-4 flex justify-between items-end">
                <div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter text-blue-600">Direcciones</h3>
                    <p className="text-gray-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1">Tus puntos de entrega</p>
                </div>
                {!mostrarForm && (<button onClick={() => setMostrarForm(true)} className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-xl font-black text-[9px] md:text-xs uppercase hover:bg-black transition-all shadow-lg active:scale-95">+ Nueva</button>)}
            </div>

            {mostrarForm ? (
                <form onSubmit={handleGuardar} className="bg-gray-50 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-blue-100 space-y-3 md:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <input required className="w-full p-3 rounded-xl font-bold text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-600 shadow-sm" placeholder="Etiqueta (Ej: Trabajo)" value={nuevaDir.etiqueta} onChange={e => setNuevaDir({...nuevaDir, etiqueta: e.target.value})} />
                        <input required className="w-full p-3 rounded-xl font-bold text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-600 shadow-sm" placeholder="Ciudad (Ej: Apartadó)" value={nuevaDir.ciudad} onChange={e => setNuevaDir({...nuevaDir, ciudad: e.target.value})} />
                        <input required className="w-full sm:col-span-2 p-3 rounded-xl font-bold text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-600 shadow-sm" placeholder="Dirección completa" value={nuevaDir.direccion} onChange={e => setNuevaDir({...nuevaDir, direccion: e.target.value})} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button type="submit" disabled={loading} className="w-full sm:flex-1 bg-black text-white py-3 md:py-4 rounded-xl font-black text-[10px] md:text-xs uppercase hover:bg-blue-600 transition-colors shadow-lg active:scale-95">{loading ? 'Guardando...' : 'Guardar Dirección'}</button>
                        <button type="button" onClick={() => setMostrarForm(false)} className="w-full sm:w-auto px-6 py-3 md:py-4 bg-gray-200 text-gray-600 rounded-xl font-black text-[10px] md:text-xs uppercase hover:bg-gray-300 transition-colors active:scale-95">Cancelar</button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {direcciones.length === 0 ? (
                        <div className="col-span-1 md:col-span-2 p-10 md:p-12 border-2 md:border-4 border-dashed border-gray-100 rounded-[2rem] md:rounded-[3rem] text-center">
                            <MapPin size={32} className="mx-auto text-gray-200 mb-3 md:mb-4 md:w-10 md:h-10" />
                            <p className="text-gray-400 font-bold uppercase text-[9px] md:text-[10px] tracking-widest">No tienes direcciones adicionales</p>
                        </div>
                    ) : (
                        direcciones.map(dir => (
                            <div key={dir.id} className="flex items-center justify-between p-4 md:p-5 bg-white border border-gray-100 rounded-2xl md:rounded-3xl shadow-sm hover:border-black transition-colors group">
                                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                    <div className="w-10 h-10 shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors"><MapPin size={18} /></div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-black text-xs md:text-sm uppercase italic truncate">{dir.etiqueta}</h4>
                                        <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{dir.direccion}, {dir.ciudad}</p>
                                    </div>
                                </div>
                                <button onClick={() => eliminarDireccion(dir.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 shrink-0"><X size={16} /></button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Perfil;