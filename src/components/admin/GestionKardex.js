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
                <table className="w-full text-left min-w-[1200px] border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-[9px] uppercase font-black tracking-widest border-b">
                        <tr>
                            <th className="px-4 py-4" rowSpan="2">Fecha / Ref.</th>
                            <th className="px-4 py-4" rowSpan="2">Producto</th>
                            <th className="px-4 py-4 text-center" rowSpan="2">Movimiento</th>
                            <th className="px-4 py-3 border-l border-gray-200 text-center bg-gray-100/50" colSpan="2">ANTES (Histórico)</th>
                            <th className="px-4 py-3 border-l border-blue-200 text-center bg-blue-50/50" colSpan="3">OPERACIÓN (Nuevo Movimiento)</th>
                            <th className="px-4 py-3 border-l border-green-200 text-center bg-green-50/50" colSpan="2">DESPUÉS (Saldos)</th>
                        </tr>
                        <tr className="text-[8px]">
                            {/* ANTES */}
                            <th className="px-4 py-2 border-l border-gray-200 text-center">Stock</th>
                            <th className="px-4 py-2 text-center">Costo Prom.</th>
                            {/* OPERACION */}
                            <th className="px-4 py-2 border-l border-blue-200 text-center text-blue-700">Cant.</th>
                            <th className="px-4 py-2 text-center text-blue-700">Costo Unit.</th>
                            <th className="px-4 py-2 text-center text-blue-700">Total</th>
                            {/* DESPUES */}
                            <th className="px-4 py-2 border-l border-green-200 text-center text-green-700">Stock Final</th>
                            <th className="px-4 py-2 text-center text-green-700">Nuevo Costo Prom.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {historialFiltrado.length === 0 && <tr><td colSpan="10" className="text-center py-10 text-xs font-bold text-gray-400 uppercase">Sin movimientos registrados</td></tr>}
                        {historialFiltrado.map(h => (
                            <tr key={h.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-4 py-4">
                                    <p className="font-bold text-[9px] text-gray-500">{new Date(h.fecha).toLocaleDateString('es-CO')} {new Date(h.fecha).toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}</p>
                                    <p className="font-black text-[9px] text-gray-900 uppercase mt-0.5">{h.referencia || 'N/A'}</p>
                                </td>
                                <td className="px-4 py-4 font-black text-[10px] md:text-xs uppercase text-gray-900 truncate max-w-[200px]">{h.Producto?.nombre}</td>
                                <td className="px-4 py-4 text-center">{getTipoBadge(h.tipo)}</td>
                                
                                {/* ANTES */}
                                <td className="px-4 py-4 border-l border-gray-100 text-center font-bold text-gray-500 bg-gray-50/30">{h.stock_anterior} uds</td>
                                <td className="px-4 py-4 text-center font-bold text-gray-500 bg-gray-50/30">${formatCurrency(h.costo_anterior)}</td>

                                {/* OPERACIÓN */}
                                <td className={`px-4 py-4 border-l border-blue-100 text-center font-black text-xs bg-blue-50/10 ${h.tipo === 'ENTRADA' || h.tipo==='DEVOLUCION' ? 'text-green-600' : 'text-red-600'}`}>{h.tipo === 'SALIDA' ? '-' : '+'}{h.cantidad}</td>
                                <td className="px-4 py-4 text-center font-bold text-[10px] text-blue-800 bg-blue-50/10">${formatCurrency(h.costo_unitario)}</td>
                                <td className="px-4 py-4 text-center font-black italic text-blue-900 text-xs bg-blue-50/10">${formatCurrency(h.valor_total)}</td>

                                {/* DESPUÉS */}
                                <td className="px-4 py-4 border-l border-green-100 text-center font-black text-xs text-green-700 bg-green-50/30">{h.saldo_stock_momento} uds</td>
                                <td className="px-4 py-4 text-center font-black italic text-green-800 text-xs bg-green-50/30">${formatCurrency(h.saldo_costo_promedio)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GestionKardex;