import React from 'react';
import { CalendarDays, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency } from '../../../utils/adminUtils';

const ReportesTab = ({ dataAgendaEntregas, dataTopProductos, dataVentasMensuales, dataGraficoRutas }) => {
    return (
        <div className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8"><div><h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Agenda de Entregas</h3><p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rutas programadas por ciudad</p></div><CalendarDays className="text-blue-600" size={24} /></div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {dataAgendaEntregas.length === 0 ? <p className="text-center text-gray-400 font-bold uppercase text-xs py-10">Sin entregas</p> : 
                            dataAgendaEntregas.map((agenda, i) => (
                                <div key={i} className="flex flex-col gap-4 bg-gray-50 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-base">{agenda.cantidad}</div>
                                            <div>
                                                <p className={`font-black uppercase italic text-xs md:text-sm ${agenda.reprogramado ? 'text-orange-600' : 'text-gray-900'}`}>
                                                    {agenda.reprogramado ? 'REPROGRAMADO' : agenda.dia}
                                                </p>
                                                <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">{agenda.fecha}</p>
                                            </div>
                                        </div>
                                        <span className="font-black text-base md:text-lg italic text-blue-600">${formatCurrency(agenda.total)}</span>
                                    </div>
                                    <div className="pl-12 md:pl-16">
                                        <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detalle de ruta:</p>
                                        <div className="flex flex-col gap-2">
                                            {agenda.pedidos.map((ped, idx) => (
                                                <div key={idx} className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                                                    <span className="text-[9px] md:text-[10px] font-black text-gray-800 uppercase">
                                                        {ped.Usuario?.nombre || ped.cliente || 'Consumidor Final'}
                                                    </span>
                                                    <span className="text-[8px] md:text-[9px] font-bold text-gray-500 mt-0.5 truncate">
                                                        📍 {ped.Usuario?.ciudad || 'Ciudad N/A'} - {ped.direccion || ped.Usuario?.direccion || 'Sin dirección'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
                <div className="bg-black text-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center mb-6"><div><h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter">Top Ventas</h3><p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unidades vendidas</p></div><Activity className="text-blue-400" size={24} /></div>
                    <div className="flex-1 flex flex-col justify-center gap-4">
                        {dataTopProductos.length === 0 && <p className="text-gray-500 text-center text-xs">Sin datos aún</p>}
                        {dataTopProductos.map((prod, i) => (<div key={i} className="flex justify-between items-center border-b border-gray-800 pb-3 last:border-0"><span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase truncate pr-4">{i+1}. {prod.name}</span><span className="text-xs md:text-sm font-black text-white">{prod.Vendidos} u.</span></div>))}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-sm">
                    <div className="mb-6 md:mb-8"><h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter">Crecimiento Mensual</h3></div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={dataVentasMensuales}>
                                <defs>
                                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} dy={10} />
                                <Tooltip formatter={(value) => `$${formatCurrency(value)}`} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="Ventas" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorVentas)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-sm">
                    <div className="mb-6 md:mb-8"><h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter">Pedidos por Zona</h3></div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dataGraficoRutas}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} dy={10} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="pedidos" fill="#000" radius={[10, 10, 10, 10]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ReportesTab;