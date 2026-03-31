import React from 'react';
import { Search, X, CalendarDays, AlertTriangle, Truck, Banknote, DollarSign, Eye, Lock, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../../utils/adminUtils';

const PedidosTab = ({ 
    filtroTextoPedidos, setFiltroTextoPedidos, filtroFechaPedidos, setFiltroFechaPedidos, 
    pedidosFiltradosVisual, calcularFechaReal, rutasDinamicas, horaLimite, creditos, 
    transacciones, actualizarEstadoPedido, actualizarRutaPedido, setPedidoDetalle, 
    setPedidoACobrar, setShowCobroModal, setClienteEstadoCuenta, diasUnicosDropdown 
}) => {
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between mb-4 items-stretch sm:items-center gap-3">
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Filtros de Búsqueda</h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar ciudad, dirección, cliente o ID..." 
                            value={filtroTextoPedidos}
                            onChange={(e) => setFiltroTextoPedidos(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-white border border-blue-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" 
                        />
                        {filtroTextoPedidos && (
                            <button onClick={() => setFiltroTextoPedidos('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-blue-200 p-1.5 rounded-xl shadow-sm w-full sm:w-auto">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><CalendarDays size={16} /></div>
                        <input 
                            type="date" 
                            value={filtroFechaPedidos}
                            onChange={(e) => setFiltroFechaPedidos(e.target.value)}
                            className="border-none bg-transparent text-[10px] md:text-xs font-black uppercase text-gray-700 outline-none cursor-pointer pr-2 w-full"
                        />
                        {filtroFechaPedidos && (
                            <button onClick={() => setFiltroFechaPedidos('')} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-lg transition-colors mr-1" title="Limpiar filtro"><X size={14} /></button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {(Array.isArray(pedidosFiltradosVisual) ? pedidosFiltradosVisual : []).length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><Search size={24}/></div>
                        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">No hay pedidos que coincidan con tu búsqueda.</p>
                    </div>
                )}
                {(Array.isArray(pedidosFiltradosVisual) ? pedidosFiltradosVisual : []).map(ped => {
                    const infoRuta = calcularFechaReal(ped.ruta, ped.Usuario?.ciudad, ped.direccion, rutasDinamicas, ped.fecha, horaLimite);
                    const items = ped.Detalles || ped.items || [];
                    
                    const yaEnCartera = (creditos || []).some(c => c.descripcion === `Factura Pedido #${ped.id}`);
                    const yaEnFinanzas = (transacciones || []).some(t => t.pedidoId === ped.id || t.descripcion === `Pago de Contado - Pedido #${ped.id}` || t.descripcion === `Venta - Orden #${ped.id}`);
                    const estaLiquidado = yaEnCartera || yaEnFinanzas;

                    return (
                        <div key={ped.id} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className={`absolute top-0 left-0 w-full py-1.5 md:py-2 text-center border-b ${infoRuta.reprogramado ? 'bg-orange-500 border-orange-600' : 'bg-black border-black'}`}>
                                    <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-2">
                                        {infoRuta.reprogramado ? <><AlertTriangle size={10} /> REPROGRAMADO: {infoRuta.diaNombre}</> : <><Truck size={10} /> RUTA: {infoRuta.diaNombre?.toUpperCase()}</>}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-start mb-4 mt-6">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[8px] md:text-[9px] font-black bg-gray-100 text-black px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase italic border tracking-tighter w-fit">ID #{ped.id}</span>
                                        <span className={`text-[8px] md:text-[9px] font-black px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase italic border tracking-tighter w-fit flex items-center gap-1 ${ped.metodo_pago === 'CREDITO' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                            {ped.metodo_pago === 'CREDITO' ? <><Banknote size={10}/> FIADO (CRÉDITO)</> : <><DollarSign size={10}/> DE CONTADO</>}
                                        </span>
                                    </div>
                                    <button onClick={() => setPedidoDetalle(ped)} className="p-2 md:p-3 bg-gray-50 group-hover:bg-black group-hover:text-white rounded-xl md:rounded-2xl transition-all"><Eye size={14} /></button>
                                </div>
                                
                                <div className="mb-4 border-b border-gray-50 pb-4"><p className="text-[9px] md:text-[10px] font-black uppercase text-blue-600 mb-1 tracking-widest">{ped.Usuario?.nombre || 'CLIENTE DIRECTO'}</p><p className="text-[10px] md:text-[11px] font-bold text-gray-700 leading-tight">📍 {ped.direccion || ped.Usuario?.direccion || 'Sin dirección'}</p><p className="text-[8px] md:text-[9px] font-black text-gray-400 mt-1 uppercase">Ciudad: {ped.Usuario?.ciudad || 'No especificada'}</p><p className={`text-[8px] md:text-[9px] font-bold mt-2 p-1.5 md:p-2 rounded-lg inline-block ${infoRuta.reprogramado ? 'text-orange-700 bg-orange-100' : 'text-orange-500 bg-orange-50'}`}>📆 Llegará el: {infoRuta.fechaFormateada}</p></div>
                                <div className="mb-6"><p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Contenido:</p><ul className="text-[9px] md:text-[10px] font-bold text-gray-600 space-y-1 mb-4">{items.slice(0, 3).map((item, idx) => (<li key={idx} className="truncate">• {item.cantidad}x {item.Producto?.nombre || item.nombre}</li>))}{items.length > 3 && <li className="text-blue-500">+ {items.length - 3} artículos más</li>}</ul><h4 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tighter">${formatCurrency(ped.total)}</h4></div>
                            </div>
                            <div className="space-y-3 bg-gray-50 p-3 md:p-4 rounded-2xl md:rounded-3xl">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 md:ml-2">Forzar Día</label>
                                        <select value={(!infoRuta.reprogramado && infoRuta.diaNombre) ? infoRuta.diaNombre : ''} onChange={(e) => actualizarRutaPedido(ped.id, e.target.value)} className="w-full border border-gray-200 rounded-xl text-[9px] md:text-[10px] font-bold uppercase p-2 outline-none bg-white cursor-pointer mt-1">
                                            <option value="A CONVENIR">A CONVENIR</option>
                                            {diasUnicosDropdown.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[8px] md:text-[9px] font-black text-orange-500 uppercase tracking-widest ml-1 md:ml-2 flex items-center gap-1"><CalendarDays size={10}/> Reprogramar</label>
                                        <input 
                                            type="date" 
                                            value={infoRuta.reprogramado ? infoRuta.diaNombre : ''} 
                                            onChange={(e) => actualizarRutaPedido(ped.id, e.target.value)} 
                                            className="w-full border border-orange-200 text-orange-700 rounded-xl text-[9px] md:text-[10px] font-bold uppercase p-1.5 outline-none bg-orange-50 cursor-pointer mt-1" 
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 mt-2 border-t border-gray-200">
                                    <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 md:ml-2">Estado Logístico</label>
                                    
                                    <select 
                                        value={ped.estado || ''} 
                                        disabled={ped.estado === 'Cancelado' && ped.cancelado_por === 'CLIENTE'}
                                        onChange={(e) => {
                                            if (e.target.value === 'Entregado') {
                                                if (estaLiquidado) actualizarEstadoPedido(ped.id, 'Entregado');
                                                else { setPedidoACobrar(ped); setShowCobroModal(true); }
                                            } else { actualizarEstadoPedido(ped.id, e.target.value); }
                                        }} 
                                        className={`w-full border-none rounded-xl text-[9px] md:text-[10px] font-black uppercase p-2 md:p-3 outline-none cursor-pointer mt-1 ${(ped.estado === 'Cancelado' && ped.cancelado_por === 'CLIENTE') ? 'bg-red-100 text-red-500 cursor-not-allowed' : 'bg-black text-white'}`}
                                    >
                                        <option value="Pendiente">⏳ PENDIENTE (Bodega)</option>
                                        <option value="Enviado">🚚 EN RUTA (Camión)</option>
                                        <option value="Entregado">✅ ENTREGADO</option>
                                        <option value="Cancelado">❌ CANCELADO</option>
                                    </select>
                                    
                                    {ped.estado === 'Cancelado' && ped.cancelado_por === 'CLIENTE' && (
                                        <p className="text-[8px] text-red-500 font-bold mt-1.5 flex items-center gap-1 uppercase tracking-widest leading-tight">
                                            <Lock size={10} /> Cancelado por el cliente
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
export default PedidosTab;