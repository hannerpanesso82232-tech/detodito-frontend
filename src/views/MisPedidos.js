import React, { useEffect, useState } from 'react';
import API from '../services/api'; 
import { Package, Clock, CheckCircle, Truck, Calendar, ShoppingBag, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

// MOTOR PARA CALCULAR LA FECHA EXACTA DE ENTREGA PARA EL CLIENTE
const calcularFechaExacta = (diaRuta) => {
    if (!diaRuta || diaRuta.toUpperCase() === 'A CONVENIR') return { nombre: 'A CONVENIR', fecha: 'Programando con logística' };
    
    const diasSemana = { "LUNES": 1, "MARTES": 2, "MIÉRCOLES": 3, "JUEVES": 4, "VIERNES": 5 };
    const diaDestino = diasSemana[diaRuta.toUpperCase()];
    
    if (!diaDestino) return { nombre: diaRuta, fecha: 'Fecha en validación' };

    const hoy = new Date();
    const diaActual = hoy.getDay(); 
    let diasFaltantes = diaDestino - diaActual;
    
    // Si el día ya pasó, o es hoy mismo (el camión ya salió), programar para la próxima semana
    if (diasFaltantes <= 0) diasFaltantes += 7;

    const fechaEntrega = new Date(hoy);
    fechaEntrega.setDate(hoy.getDate() + diasFaltantes);

    return {
        nombre: diaRuta.toUpperCase(),
        fecha: fechaEntrega.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    };
};

const MisPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        const res = await API.get('/pedidos/mis-pedidos');
        setPedidos(res.data);
      } catch (error) {
        toast.error("No pudimos cargar tus pedidos");
      } finally {
        setLoading(false);
      }
    };
    cargarPedidos();
  }, []);

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'Pendiente': return <Clock className="text-amber-500" />;
      case 'Enviado': return <Truck className="text-blue-500" />;
      case 'Entregado': return <CheckCircle className="text-green-500" />;
      default: return <Package className="text-gray-500" />;
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-[0.3em] text-gray-300">Sincronizando tus compras...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500 mt-10">
      <div className="border-l-8 border-blue-600 pl-6 mb-12">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic text-gray-900">Mis Pedidos</h1>
        <p className="text-gray-400 text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase">Rastreo de envíos y facturación</p>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-gray-50 rounded-[3rem] p-24 text-center border-4 border-dashed border-gray-100">
          <ShoppingBag size={80} className="mx-auto text-gray-200 mb-6" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Aún no tienes pedidos registrados</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pedidos.map((pedido) => {
              // 🔥 CALCULAMOS LA FECHA EXACTA DE LLEGADA 🔥
              const infoLlegada = calcularFechaExacta(pedido.ruta);

              return (
                <div key={pedido.id} className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-100 overflow-hidden group hover:border-blue-400 transition-all duration-500">
                  
                  {/* 🔥 BANNER DE AVISO DE LLEGADA MEJORADO 🔥 */}
                  <div className={`p-4 flex items-center justify-center gap-3 ${pedido.estado === 'Entregado' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {pedido.estado === 'Entregado' ? (
                          <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle size={16}/> PEDIDO ENTREGADO CON ÉXITO</span>
                      ) : (
                          <>
                              <CalendarClock size={18} className="animate-pulse" />
                              <div className="text-center sm:text-left">
                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block sm:inline">Llegada Estimada: </span>
                                  <span className="text-sm font-black capitalize ml-2">{infoLlegada.fecha}</span>
                              </div>
                          </>
                      )}
                  </div>

                  {/* Header del Pedido */}
                  <div className="p-8 bg-gray-50/50 flex flex-wrap justify-between items-center gap-6 border-b border-gray-100">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:rotate-6 transition-transform">
                        {getStatusIcon(pedido.estado)}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Orden #{pedido.id}</span>
                        <h3 className="text-xl font-black text-gray-900 uppercase italic">Estado: {pedido.estado}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1 justify-end">
                        <Calendar size={12} /> {new Date(pedido.fecha || pedido.createdAt).toLocaleDateString()}
                      </div>
                      <span className="text-3xl font-black text-gray-900 italic">${parseFloat(pedido.total).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="p-8 space-y-4">
                    {(pedido.Detalles || []).map((detalle) => (
                      <div key={detalle.id} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-900 font-black text-xs">
                            {detalle.cantidad}x
                          </div>
                          <div>
                            <p className="font-black text-sm text-gray-800 uppercase italic tracking-tight">{detalle.Producto?.nombre || 'Item'}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Precio unitario: ${parseFloat(detalle.precioUnitario).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="font-black text-gray-400 text-sm italic">${(detalle.cantidad * detalle.precioUnitario).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
          })}
        </div>
      )}
    </div>
  );
};

export default MisPedidos;