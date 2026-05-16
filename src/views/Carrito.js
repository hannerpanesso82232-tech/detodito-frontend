import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; 
import API from '../services/api';
import toast from 'react-hot-toast';
import { 
    CheckCircle, Printer, ShoppingBag, X, 
    CreditCard, Plus, Minus, Trash2, ArrowLeft, 
    MapPin, CalendarClock, UserX, Banknote, DollarSign 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 🔥 CORRECCIÓN AGRESIVA: Limpieza de Localhost para imágenes 🔥
const formatearImagen = (url) => {
    if (!url) return 'https://placehold.co/400x500?text=Sin+Imagen';
    
    let urlLimpia = url;
    if (urlLimpia.includes('localhost:3000') || urlLimpia.includes('localhost:5000')) {
        urlLimpia = urlLimpia.replace(/http:\/\/localhost:(3000|5000)/g, '');
    }

    if (urlLimpia.startsWith('https://') || (urlLimpia.startsWith('http://') && !urlLimpia.includes('localhost'))) {
        return urlLimpia;
    }
    
    const base = process.env.REACT_APP_API_URL || "http://localhost:3000";
    return `${base}${urlLimpia.startsWith('/') ? '' : '/'}${urlLimpia}`;
};

// 🔥 MOTOR MATEMÁTICO DE FECHAS DINÁMICAS (Con Hora Límite) 🔥
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

    if (diaRuta.toUpperCase() === "A CONVENIR") {
        return { diaNombre: "A CONVENIR", fechaFormateada: "Por definir con logística", color: "text-amber-500", bg: "bg-amber-50" };
    }

    const mapDias = { "DOMINGO": 0, "LUNES": 1, "MARTES": 2, "MIÉRCOLES": 3, "MIERCOLES": 3, "JUEVES": 4, "VIERNES": 5, "SÁBADO": 6, "SABADO": 6 };
    const diaDestino = mapDias[diaRuta.toUpperCase()];
    
    if (diaDestino === undefined) return { diaNombre: diaRuta, fechaFormateada: diaRuta, color: "text-gray-500", bg: "bg-gray-50" };

    const fechaBase = fechaCreacionStr ? new Date(fechaCreacionStr) : new Date();
    const diaActual = fechaBase.getDay(); 
    let diasFaltantes = diaDestino - diaActual;

    if (diasFaltantes < 0) diasFaltantes += 7;

    // 🔥 LÓGICA DE HORA LÍMITE PARA EL CLIENTE 🔥
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

    return {
        ciudad: diaRuta, // Referencia rápida
        diaNombre: diaRuta,
        fechaFormateada: fechaEntrega.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
        color: "text-green-600",
        bg: "bg-green-50"
    };
};

const Carrito = () => {
  const { cart, total, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth(); 
  const [comprando, setComprando] = useState(false);
  const [factura, setFactura] = useState(null);
  const [direccion, setDireccion] = useState(''); 
  
  // Métodos y permisos de pago
  const [metodoPago, setMetodoPago] = useState('CONTADO');
  const [infoCredito, setInfoCredito] = useState(null); // 🔥 NUEVO ESTADO PARA VERIFICAR CRÉDITO

  const navigate = useNavigate();
  
  // Estados de configuración
  const [rutasDinamicas, setRutasDinamicas] = useState([]);
  const [horaLimite, setHoraLimite] = useState('20:00');

  useEffect(() => {
      if (user) {
          const dirPredeterminada = [user.direccion, user.ciudad].filter(Boolean).join(', ');
          if (dirPredeterminada) setDireccion(dirPredeterminada);
      }

      // Cargar configuración de rutas, hora límite y EL CUPO DEL CLIENTE
      const cargarConfiguracion = async () => {
          try {
              const peticiones = [
                  API.get('/pedidos/config/rutas').catch(() => ({ data: [] })),
                  API.get('/pedidos/config/horalimite').catch(() => ({ data: { hora: '20:00' } }))
              ];

              if (user) {
                  const token = localStorage.getItem('token');
                  peticiones.push(
                      API.get('/creditos/mi-cartera', {
                          headers: token ? { Authorization: `Bearer ${token}` } : {}
                      }).catch(() => ({ data: null }))
                  );
              }

              const resultados = await Promise.all(peticiones);
              
              setRutasDinamicas(resultados[0].data || []);
              setHoraLimite(resultados[1].data.hora || '20:00');
              
              if (user && resultados[2] && resultados[2].data) {
                  setInfoCredito(resultados[2].data);
              }
          } catch (error) {
              console.error("Error cargando configuración logística");
          }
      };
      cargarConfiguracion();
  }, [user]);

  const infoEntrega = useMemo(() => {
      if (!direccion) return null;
      return calcularFechaReal(null, '', direccion, rutasDinamicas, new Date(), horaLimite);
  }, [direccion, rutasDinamicas, horaLimite]);

  const handleFinalizarCompra = async () => {
    if (!user) {
        toast.error("¡Ups! Debes iniciar sesión para realizar un pedido", { icon: '🔒', duration: 4000 });
        navigate('/login'); 
        return; 
    }

    if (cart.length === 0) return toast.error("El carrito está vacío");
    if (!direccion.trim()) return toast.error("Por favor ingresa una dirección o ciudad", { icon: '📍' });

    setComprando(true);
    const loadingToast = toast.loading("Confirmando pedido con logística...");

    try {
      const productosPedido = cart.map(p => ({ producto_id: p.id, cantidad: p.cantidad }));
      
      const res = await API.post('/pedidos', { 
          productos: productosPedido,
          direccion: direccion,
          ruta_sugerida: infoEntrega?.diaNombre ? infoEntrega.diaNombre : 'A Convenir',
          metodo_pago: metodoPago 
      });

      if (res.status === 201 || res.status === 200) {
        toast.dismiss(loadingToast);
        toast.success("¡Pedido programado con éxito!", { duration: 4000 });
        
        setFactura({
          id: res.data.pedidoId || Math.floor(Math.random() * 100000),
          items: [...cart],
          total: total,
          direccionEnvio: direccion,
          entrega: infoEntrega?.fechaFormateada || 'A convenir',
          fecha: new Date().toLocaleDateString(),
          metodo_pago: metodoPago 
        });
        
        clearCart();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || "Error al procesar la compra");
    } finally {
      setComprando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <header className="flex items-center justify-between mb-8 md:mb-12 pt-6 md:pt-8">
            <button onClick={() => navigate(-1)} className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm hover:bg-black hover:text-white transition-all group active:scale-95">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase flex items-center gap-3 md:gap-4">
                <ShoppingBag className="text-blue-600 w-8 h-8 md:w-10 md:h-10" /> Checkout
            </h2>
            <div className="w-10" />
        </header>

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-6 md:gap-12">
          {/* Lista de Productos */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {cart.length === 0 ? (
              <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] text-center border border-dashed border-gray-300">
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] md:text-xs mb-4 md:mb-6">Tu bolsa está vacía</p>
                <button onClick={() => navigate('/')} className="bg-black text-white px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-blue-600 transition-colors">
                    Volver a la tienda
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4 md:gap-6 group hover:shadow-md transition-shadow">
                  <div className="w-full sm:w-32 h-40 sm:h-32 bg-gray-50 rounded-xl md:rounded-[2rem] overflow-hidden flex-shrink-0">
                    <img src={formatearImagen(item.imagen_url)} className="w-full h-full object-cover sm:group-hover:scale-110 transition-transform duration-500 bg-white" alt={item.nombre} />
                  </div>
                  <div className="flex-1 text-center sm:text-left w-full">
                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-base md:text-lg leading-tight mb-1 md:mb-2">{item.nombre}</h3>
                    <p className="text-[9px] md:text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-3 md:mb-4">{item.Categoria?.nombre || 'Premium Collection'}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                        <div className="flex items-center gap-3 md:gap-4 bg-gray-50 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-gray-100">
                            <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-white rounded-lg md:rounded-xl shadow-sm hover:text-blue-600 transition-colors"><Minus size={14} /></button>
                            <span className="font-black text-xs md:text-sm w-4 text-center">{item.cantidad}</span>
                            <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-white rounded-lg md:rounded-xl shadow-sm hover:text-blue-600 transition-colors"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2"><Trash2 size={18} className="md:w-5 md:h-5"/></button>
                    </div>
                  </div>
                  <div className="text-center sm:text-right w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-0 border-gray-100 pt-3 sm:pt-0 flex flex-col items-center sm:items-end">
                    {item.es_mayor && (
                        <span className="text-[8px] md:text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase font-black tracking-widest mb-1 w-fit">
                            Precio VIP
                        </span>
                    )}
                    <p className={`font-black text-xl md:text-2xl italic tracking-tighter ${item.es_mayor ? 'text-green-600' : 'text-gray-900'}`}>
                        ${((item.precio_aplicado || item.precio) * item.cantidad).toLocaleString('es-CO')}
                    </p>
                    <div className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        <span>Unit: ${parseFloat(item.precio_aplicado || item.precio).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumen de Pago */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl md:shadow-2xl border border-gray-50">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-6 md:mb-8 text-center sm:text-left">Resumen</h3>
              
              <div className="space-y-3 md:space-y-4 mb-6">
                <div className="flex justify-between text-xs md:text-sm items-center">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Subtotal</span>
                  <span className="font-black text-gray-900">${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm items-center">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Envío</span>
                  <span className="font-black text-green-500 uppercase text-[9px] md:text-[10px] bg-green-50 px-2 py-1 rounded-md">Gratis Urabá</span>
                </div>
                <div className="border-t border-dashed border-gray-100 pt-3 md:pt-4 flex justify-between items-end">
                  <span className="text-gray-900 font-black uppercase tracking-widest text-[10px] md:text-xs">Total</span>
                  <span className="text-3xl md:text-4xl font-black italic tracking-tighter text-blue-600 md:text-gray-900">${total.toLocaleString()}</span>
                </div>
              </div>

              {/* Input de Dirección */}
              <div className="mb-6">
                  <label className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 md:gap-2">
                      <MapPin size={12} /> Dirección y Ciudad
                  </label>
                  <textarea 
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej: Calle 123, Barrio Centro, Apartadó..."
                      className="w-full bg-gray-50 border border-gray-100 p-3 md:p-4 rounded-xl md:rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none mb-3"
                      rows="3"
                  />

                  {infoEntrega && (
                      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl flex items-start gap-2 md:gap-3 border transition-colors ${infoEntrega.bg} border-transparent`}>
                          <CalendarClock size={16} className={`mt-0.5 md:w-5 md:h-5 shrink-0 ${infoEntrega.color}`} />
                          <div>
                              <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${infoEntrega.color}`}>Programación de Ruta</p>
                              <p className="text-[10px] md:text-xs font-bold text-gray-700 capitalize mt-0.5 md:mt-1 leading-tight">
                                  {infoEntrega.fechaFormateada}
                              </p>
                          </div>
                      </div>
                  )}
              </div>

              {/* 🔥 SECCIÓN DINÁMICA: MÉTODOS DE PAGO 🔥 */}
              {user && cart.length > 0 && (
                  <div className="mb-6">
                      <label className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 block">
                          Forma de Pago
                      </label>
                      {infoCredito && parseFloat(infoCredito.limite_credito || 0) > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                              <button 
                                  onClick={() => setMetodoPago('CONTADO')}
                                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${metodoPago === 'CONTADO' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'}`}
                              >
                                  <DollarSign size={20} className={metodoPago === 'CONTADO' ? 'text-blue-600' : ''} />
                                  <span className="font-black uppercase text-[8px] md:text-[9px] tracking-widest">De Contado</span>
                              </button>
                              
                              <button 
                                  onClick={() => setMetodoPago('CREDITO')}
                                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${metodoPago === 'CREDITO' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'}`}
                              >
                                  <Banknote size={20} className={metodoPago === 'CREDITO' ? 'text-orange-500' : ''} />
                                  <span className="font-black uppercase text-[8px] md:text-[9px] tracking-widest">Fiar / Crédito</span>
                              </button>
                          </div>
                      ) : (
                          // Si no tiene límite de crédito, se le bloquea la opción de fiar
                          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-not-allowed">
                              <DollarSign size={20} className="text-gray-400" />
                              <span className="font-black uppercase text-[8px] md:text-[9px] tracking-widest text-gray-500">Pago Contra Entrega (Contado)</span>
                          </div>
                      )}
                  </div>
              )}

              <button
                onClick={handleFinalizarCompra}
                disabled={comprando || cart.length === 0}
                className={`w-full py-4 md:py-6 rounded-xl md:rounded-3xl font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] flex items-center justify-center gap-2 md:gap-3 transition-all shadow-xl active:scale-95 ${
                  comprando || cart.length === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : !user ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {comprando ? 'Procesando...' : !user ? 'Inicia Sesión' : 'Confirmar Pedido'}
                {!comprando && !user ? <UserX size={16} className="md:w-[18px] md:h-[18px]" /> : !comprando && <CreditCard size={16} className="md:w-[18px] md:h-[18px]" />}
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DE ÉXITO */}
        {factura && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 my-auto">
              <div className="bg-blue-600 p-8 md:p-10 text-white text-center relative">
                <div className="bg-white w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3">
                  <CheckCircle size={32} className="text-green-500 md:w-10 md:h-10" />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">¡Pedido Agendado!</h3>
                <p className="text-blue-100 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 md:mt-2">Orden #{factura.id}</p>
              </div>

              <div className="p-6 md:p-10">
                <div className="bg-green-50 text-green-700 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 mb-5 md:mb-6 border border-green-100">
                    <CalendarClock size={18} className="md:w-5 md:h-5 shrink-0" />
                    <div>
                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Llegada estimada</p>
                        <p className="text-xs md:text-sm font-bold capitalize">{factura.entrega}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-5 md:mb-6 max-h-40 md:max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {factura.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs md:text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                      <div className="flex flex-col pr-2">
                        <span className="text-gray-900 font-black uppercase text-[10px] md:text-[11px] leading-tight mb-1 line-clamp-1">{item.nombre}</span>
                        <span className="text-[9px] md:text-[10px] text-blue-600 font-bold">CANT: {item.cantidad}</span>
                      </div>
                      <span className="font-black text-gray-900 italic shrink-0">${((item.precio_aplicado || item.precio) * item.cantidad).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 md:p-6 rounded-xl md:rounded-[2rem] flex justify-between items-center mb-6 md:mb-8">
                  <span className={`font-black uppercase text-[9px] md:text-[10px] tracking-widest max-w-[50%] ${factura.metodo_pago === 'CREDITO' ? 'text-orange-500' : 'text-gray-400'}`}>
                      {factura.metodo_pago === 'CREDITO' ? 'A Crédito / Fiado' : 'Pago Contra Entrega'}
                  </span>
                  <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-gray-900 truncate">${factura.total.toLocaleString()}</span>
                </div>

                <button 
                  onClick={() => { setFactura(null); navigate('/perfil'); }}
                  className="w-full bg-black py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest text-white hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  Ver seguimiento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Carrito;