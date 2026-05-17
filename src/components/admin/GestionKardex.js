import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Package, Search, Loader2, MapPin } from 'lucide-react';
import { formatCurrency } from '../../utils/adminUtils';

const GestionKardex = () => {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroTexto, setFiltroTexto] = useState('');

    const fetchKardex = async () => {
        try {
            const res = await API.get('/kardex/historial');
            setHistorial(res.data);
        } catch (error) { toast.error("Error cargando Kardex"); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchKardex(); }, []);

    const historialFiltrado = historial.filter(h => {
        if (!filtroTexto) return true;
        const texto = filtroTexto.toLowerCase();
        return (h.Producto?.nombre || '').toLowerCase().includes(texto) || 
               (h.referencia || '').toLowerCase().includes(texto) ||
               h.tipo.toLowerCase().includes(texto);
    });

    const getTipoBadge = (tipo) => {
        switch(tipo) {
            case 'ENTRADA': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-black uppercase tracking-widest text-[8px]">+ ENTRADA</span>;
            case 'SALIDA': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-black uppercase tracking-widest text-[8px]">- SALIDA</span>;
            case 'DEVOLUCION': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-black uppercase tracking-widest text-[8px]">+ DEVOLUCIÓN</span>;
            case 'TRASLADO': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-black uppercase tracking-widest text-[8px]">↔ TRASLADO</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-black uppercase tracking-widest text-[8px]">{tipo}</span>;
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic flex items-center gap-2"><ArrowRightLeft className="text-blue-600"/> Kardex Valorizado</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Trazabilidad de inventario (Promedio Ponderado)</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Buscar producto, referencia..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar p-6 md:p-8">
                <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-widest border-b">
                        <tr>
                            <th className="px-4 py-4">Fecha / Ref.</th>
                            <th className="px-4 py-4">Producto</th>
                            <th className="px-4 py-4 text-center">Movimiento</th>
                            <th className="px-4 py-4 text-center">Cant.</th>
                            <th className="px-4 py-4 bg-blue-50/50 text-center" colSpan="2">Valores Unitarios</th>
                            <th className="px-4 py-4 bg-gray-100 text-center" colSpan="2">Saldos Finales (FOTO)</th>
                            <th className="px-4 py-4 text-right">Sucursales</th>
                        </tr>
                        <tr className="text-[8px] bg-gray-50/50">
                            <th colSpan="4"></th>
                            <th className="px-4 py-2 text-center text-gray-500 bg-blue-50/30">Costo Operación</th>
                            <th className="px-4 py-2 text-center text-gray-500 bg-blue-50/30">Valor Total</th>
                            <th className="px-4 py-2 text-center text-gray-800 bg-gray-100/50">Stock Disp.</th>
                            <th className="px-4 py-2 text-center text-gray-800 bg-gray-100/50">Costo Promedio</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {historialFiltrado.length === 0 && <tr><td colSpan="9" className="text-center py-10 text-xs font-bold text-gray-400 uppercase">Sin movimientos registrados</td></tr>}
                        {historialFiltrado.map(h => (
                            <tr key={h.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-4 py-3">
                                    <p className="font-bold text-[9px] text-gray-500">{new Date(h.fecha).toLocaleDateString('es-CO')} {new Date(h.fecha).toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}</p>
                                    <p className="font-black text-[9px] text-gray-900 uppercase mt-0.5">{h.referencia || 'N/A'}</p>
                                </td>
                                <td className="px-4 py-3 font-black text-[10px] md:text-xs uppercase text-gray-900 truncate max-w-[200px]">{h.Producto?.nombre}</td>
                                <td className="px-4 py-3 text-center">{getTipoBadge(h.tipo)}</td>
                                <td className={`px-4 py-3 text-center font-black text-xs ${h.tipo === 'ENTRADA' || h.tipo==='DEVOLUCION' ? 'text-green-600' : 'text-red-600'}`}>{h.tipo === 'SALIDA' ? '-' : '+'}{h.cantidad}</td>
                                
                                <td className="px-4 py-3 text-center font-bold text-[10px] text-gray-600 bg-blue-50/10">${formatCurrency(h.costo_unitario)}</td>
                                <td className="px-4 py-3 text-center font-black italic text-gray-900 text-xs bg-blue-50/10">${formatCurrency(h.valor_total)}</td>
                                
                                <td className="px-4 py-3 text-center font-black text-xs text-blue-600 bg-gray-50">{h.saldo_stock_momento} <span className="text-[8px] text-gray-400">uds</span></td>
                                <td className="px-4 py-3 text-center font-black italic text-gray-900 text-xs bg-gray-50">${formatCurrency(h.saldo_costo_promedio)}</td>
                                
                                <td className="px-4 py-3 text-right">
                                    <p className="text-[8px] font-black uppercase text-gray-400 flex items-center justify-end gap-1"><MapPin size={8}/> Origen: <span className="text-gray-900">{h.sucursal_origen}</span></p>
                                    <p className="text-[8px] font-black uppercase text-gray-400 flex items-center justify-end gap-1 mt-0.5"><MapPin size={8}/> Destino: <span className="text-blue-600">{h.sucursal_destino}</span></p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GestionKardex;