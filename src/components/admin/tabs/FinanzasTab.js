import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, DollarSign, Award, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../utils/adminUtils';

const FinanzasTab = ({ finanzasFiltradas, dataMejoresClientes, transaccionesFiltradas, setTransaccionSeleccionada, setFormGasto, setShowEditTransaccionModal, setShowDeleteTransaccionModal }) => {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-green-100 shadow-sm"><div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 text-green-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><ArrowUpRight size={20} /></div><p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Ingresos (Ventas)</p><h3 className="text-3xl md:text-4xl font-black text-green-600 tracking-tighter italic truncate">${formatCurrency(finanzasFiltradas.ingresos)}</h3></div>
                <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-red-100 shadow-sm"><div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><ArrowDownRight size={20} /></div><p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Egresos (Gastos)</p><h3 className="text-3xl md:text-4xl font-black text-red-600 tracking-tighter italic truncate">${formatCurrency(finanzasFiltradas.egresos)}</h3></div>
                <div className="bg-black p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={100} /></div><div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 text-white rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><DollarSign size={20} /></div><p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Balance Neto Real</p><h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter italic z-10 relative truncate">${formatCurrency(finanzasFiltradas.balance)}</h3></div>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6"><div><h3 className="text-lg md:text-xl font-black text-blue-900 uppercase tracking-tighter">Patrimonio en Bodega</h3><p className="text-[9px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Cálculo Global: Stock Actual × Costo de Compra</p></div><h3 className="text-3xl md:text-4xl font-black text-blue-600 tracking-tighter italic truncate">${formatCurrency(finanzasFiltradas.valorInventario)}</h3></div>
            
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-sm mt-6">
                <div className="flex justify-between items-center mb-6 md:mb-8">
                    <div><h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Ranking de Clientes</h3><p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top compradores históricos</p></div>
                    <Award className="text-yellow-500" size={28} />
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-widest border-b">
                            <tr><th className="px-4 md:px-6 py-4 rounded-tl-xl">Puesto / Cliente</th><th className="px-4 md:px-6 py-4 text-center">Total Pedidos</th><th className="px-4 md:px-6 py-4 text-right rounded-tr-xl">Inversión Histórica</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {dataMejoresClientes.length === 0 && (<tr><td colSpan="3" className="py-8 text-center text-gray-400 text-xs font-bold uppercase">Sin datos registrados</td></tr>)}
                            {dataMejoresClientes.map((cliente, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-all group">
                                    <td className="px-4 md:px-6 py-4 flex items-center gap-3 md:gap-4">
                                        <div className={`w-6 h-6 md:w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>#{i+1}</div>
                                        <span className="font-black text-xs md:text-sm uppercase text-gray-900 truncate">{cliente.nombre}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-center"><span className="bg-gray-100 text-gray-600 px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest">{cliente.pedidos} Compras</span></td>
                                    <td className="px-4 md:px-6 py-4 text-right font-black text-base md:text-lg italic text-green-600 group-hover:scale-105 transition-transform">${formatCurrency(cliente.totalGastado)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-sm mt-6">
                <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2">Libro Mayor</h3><p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 md:mb-8">Registro detallado de transacciones</p>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {transaccionesFiltradas.length === 0 && <p className="text-center py-10 text-gray-400 font-bold text-xs uppercase">No hay transacciones que coincidan con la búsqueda.</p>}
                    {transaccionesFiltradas.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-4 md:p-5 rounded-2xl md:rounded-3xl border border-gray-50 hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${tx.tipo === 'INGRESO' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>{tx.tipo === 'INGRESO' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}</div>
                                <div><p className="font-black text-xs md:text-sm uppercase text-gray-900 line-clamp-1">{tx.descripcion}</p><p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(tx.fecha).toLocaleDateString()} • {tx.categoria}</p></div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4">
                                <span className={`font-black text-sm md:text-lg italic ${tx.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>{tx.tipo === 'INGRESO' ? '+' : '-'}${formatCurrency(tx.monto)}</span>
                                {!tx.pedidoId && (
                                    <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1 md:gap-2 transition-opacity">
                                        <button onClick={() => {
                                            setTransaccionSeleccionada(tx);
                                            let fechaSegura = '';
                                            try { fechaSegura = tx.fecha ? new Date(tx.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]; } 
                                            catch(e) { fechaSegura = new Date().toISOString().split('T')[0]; }
                                            setFormGasto({ monto: tx.monto, descripcion: tx.descripcion, categoria: tx.categoria, tipo: tx.tipo, fecha: fechaSegura }); 
                                            setShowEditTransaccionModal(true); 
                                        }} className="p-1.5 md:p-2 text-blue-500 hover:bg-blue-100 rounded-lg"><Edit size={14}/></button>
                                        <button onClick={() => { setTransaccionSeleccionada(tx); setShowDeleteTransaccionModal(true); }} className="p-1.5 md:p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
export default FinanzasTab;