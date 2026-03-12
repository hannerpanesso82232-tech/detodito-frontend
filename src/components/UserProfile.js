import React, { useEffect, useState, useCallback } from 'react';
import API from '../services/api';
import { Package, Clock, Truck, CheckCircle, CalendarClock, ShoppingBag, X } from 'lucide-react';
import toast from 'react-hot-toast'; // Importante para los mensajes

// 🔥 MOTOR MATEMÁTICO DINÁMICO (Conectado a la BD) 🔥
const calcularFechaReal = (rutaGuardada, ciudadCliente, direccionCliente, rutasDB = [], fechaCreacionStr) => {
    let diaRuta = rutaGuardada;
    
    // Si el pedido no tiene ruta asignada, intentamos auto-asignarla por ciudad
    if (!diaRuta || diaRuta.toUpperCase() === "A CONVENIR") {
        const textoCliente = `${ciudadCliente || ''} ${direccionCliente || ''}`.toUpperCase();
        let matchEncontrado = null;

        // 1. Buscamos en las reglas dinámicas creadas por el Admin
        for (const ruta of rutasDB) {
            const palabrasClave = (ruta.ciudad || '').toUpperCase().split(',').map(c => c.trim());
            if (palabrasClave.some(palabra => palabra !== '' && textoCliente.includes(palabra))) {
                matchEncontrado = ruta.dia_ruta;
                break;
            }
        }

        // 2. Fallback por defecto si no hay coincidencias
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

    // 3. Matemática de calendario basada en la fecha de creación del pedido
    const mapDias = { "DOMINGO": 0, "LUNES": 1, "MARTES": 2, "MIÉRCOLES": 3, "MIERCOLES": 3, "JUEVES": 4, "VIERNES": 5, "SÁBADO": 6, "SABADO": 6 };
    const diaDestino = mapDias[diaRuta.toUpperCase()];
    
    if (diaDestino === undefined) return "Fecha en validación";

    const fechaCreacion = new Date(fechaCreacionStr);
    const diaCreacion = fechaCreacion.getDay(); 
    let diasFaltantes = diaDestino - diaCreacion;
    
    // Si lo pidió el mismo día que sale el camión o después, se va la próxima semana
    if (diasFaltantes <= 0) diasFaltantes += 7;

    const fechaEntrega = new Date(fechaCreacion);
    fechaEntrega.setDate(fechaCreacion.getDate() + diasFaltantes);

    return fechaEntrega.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};

const UserProfile = () => {
  const [pedidos, setPedidos] = useState([]);
  const [rutasDinamicas, setRutasDinamicas] = useState([]); // Guardará las rutas del admin
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
      try {
          // Cargamos simultáneamente los pedidos y las rutas configuradas
          const [resPedidos, resRutas] = await Promise.all([
              API.get('/pedidos/mis-pedidos'),
              API.get('/pedidos/config/rutas').catch(() => ({ data: [] }))
          ]);
          setPedidos(resPedidos.data);
          setRutasDinamicas(resRutas.data || []);
      } catch (err) {
          console.error("Error al cargar datos");
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
      fetchData();
  }, [fetchData]);

  // 🔥 FUNCIÓN PARA CANCELAR PEDIDO 🔥
  const handleCancelarPedido = async (pedidoId) => {
      if(!window.confirm("¿Estás seguro de que deseas cancelar este pedido? Los productos regresarán a la tienda.")) return;
      
      try {
          await API.put(`/pedidos/${pedidoId}/cancelar`);
          toast.success("Pedido cancelado exitosamente");
          fetchData(); // Recargamos para ver el estado 'Cancelado'
      } catch (error) {
          toast.error(error.response?.data?.error || "Error al cancelar el pedido");
      }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-gray-300 animate-pulse tracking-widest text-sm">CARGANDO TU HISTORIAL...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 md:py-20 px-4">
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        
        <header className="mb-10 md:mb-16 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-1 md:mb-2 italic">MIS PEDIDOS</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em]">Rastreo logístico en tiempo real</p>
        </header>

        {pedidos.length === 0 ? (
          <div className="bg-white p-12 md:p-20 rounded-[2rem] md:rounded-[3rem] text-center border-2 border-dashed border-gray-200">
             <ShoppingBag size={60} className="mx-auto text-gray-200 mb-4 md:mb-6" />
             <p className="text-gray-400 font-black tracking-widest uppercase text-[10px] md:text-xs">Aún no has realizado ninguna compra</p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-10">
            {pedidos.map((ped) => {
              const esEntregado = ped.estado === 'Entregado';
              const esCancelado = ped.estado === 'Cancelado';
              // Pasamos las rutas de la BD al motor para que calcule con las reglas del admin
              const fechaEstimada = calcularFechaReal(ped.ruta, ped.Usuario?.ciudad, ped.direccion, rutasDinamicas, ped.createdAt || ped.fecha);

              return (
              <div key={ped.id} className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-500">
                
                {/* Header del pedido */}
                <div className="p-6 md:p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 bg-gray-50/20">
                  <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0">
                      <Package size={20} className="md:w-6 md:h-6"/>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-2xl font-black text-gray-900 tracking-tighter">ORDEN #00{ped.id}</h3>
                      <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(ped.createdAt || ped.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 border-gray-200 pt-3 md:pt-0">
                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">Monto Total</p>
                    <p className="text-2xl md:text-3xl font-black text-blue-600 leading-none">${parseFloat(ped.total || 0).toLocaleString()}</p>
                  </div>
                </div>

                {/* Línea de tiempo y Aviso de Fecha */}
                <div className="p-6 md:p-10">
                  
                  {/* Mensaje de Cancelado */}
                  {esCancelado && (
                      <div className="mb-6 md:mb-10 bg-red-50 border border-red-100 p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 text-red-600">
                          <X size={20} className="shrink-0" />
                          <div>
                              <p className="text-[9px] font-black uppercase tracking-widest">Pedido Anulado</p>
                              <p className="text-xs md:text-sm font-bold">Esta compra ha sido cancelada.</p>
                          </div>
                      </div>
                  )}

                  {/* Mensaje de Envío */}
                  {!esEntregado && !esCancelado && (
                      <div className="mb-8 md:mb-10 bg-green-50 border border-green-100 p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 text-green-700">
                          <CalendarClock size={20} className="animate-pulse shrink-0 md:w-6 md:h-6" />
                          <div>
                              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-green-600">Programación de logística</p>
                              <p className="text-xs md:text-sm font-bold capitalize">Llegada estimada: {fechaEstimada}</p>
                          </div>
                      </div>
                  )}

                  {/* Barra de Progreso (Oculta si está cancelado) */}
                  {!esCancelado && (
                    <div className="relative flex justify-between items-center px-2 md:px-4 mt-4">
                      <div className="absolute top-5 md:top-6 left-0 w-full h-1 bg-gray-100 -z-0"></div>
                      
                      <StatusStep 
                        icon={<Clock size={16} className="md:w-5 md:h-5"/>} 
                        label="Procesando" 
                        active={true} 
                        completed={ped.estado === 'Enviado' || ped.estado === 'Entregado'} 
                      />
                      <StatusStep 
                        icon={<Truck size={16} className="md:w-5 md:h-5"/>} 
                        label="En camino" 
                        active={ped.estado === 'Enviado' || ped.estado === 'Entregado'} 
                        completed={ped.estado === 'Entregado'} 
                      />
                      <StatusStep 
                        icon={<CheckCircle size={16} className="md:w-5 md:h-5"/>} 
                        label="Entregado" 
                        active={ped.estado === 'Entregado'} 
                        completed={ped.estado === 'Entregado'} 
                      />
                    </div>
                  )}

                  {/* 🔥 BOTÓN DE CANCELAR: Solo se muestra si el estado es 'Pendiente' 🔥 */}
                  {ped.estado === 'Pendiente' && (
                      <div className="mt-8 md:mt-12 text-right">
                          <button 
                              onClick={() => handleCancelarPedido(ped.id)}
                              className="w-full md:w-auto bg-white border border-red-200 text-red-500 hover:bg-red-600 hover:text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest px-6 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                          >
                              <X size={14} /> Cancelar Pedido
                          </button>
                      </div>
                  )}

                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusStep = ({ icon, label, active, completed }) => (
  <div className="relative z-10 flex flex-col items-center gap-2 md:gap-3 bg-white px-2">
    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-700 ${
      completed ? 'bg-green-500 text-white' : 
      active ? 'bg-blue-600 text-white scale-110 md:scale-125 shadow-lg shadow-blue-200' : 'bg-white text-gray-300 border-2 border-gray-100'
    }`}>
      {icon}
    </div>
    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center mt-1 ${active ? 'text-gray-900' : 'text-gray-300'}`}>
      {label}
    </span>
  </div>
);

export default UserProfile;