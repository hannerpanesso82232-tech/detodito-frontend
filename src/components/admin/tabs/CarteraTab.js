import React from 'react';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../../utils/adminUtils';

const CarteraTab = ({ clientesCartera, setClienteEstadoCuenta }) => {
    return (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[700px]">
                <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-4 md:px-8 md:py-6">Cliente (Deudor)</th>
                        <th className="px-4 py-4 md:px-8 md:py-6 text-center">Facturas Pendientes</th>
                        <th className="px-4 py-4 md:px-8 md:py-6 text-right">Límite / Cupo</th>
                        <th className="px-4 py-4 md:px-8 md:py-6 text-right">Saldo Deuda</th>
                        <th className="px-4 py-4 md:px-8 md:py-6 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {clientesCartera.length === 0 ? (<tr><td colSpan="5" className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No hay historial de clientes ni deudas.</td></tr>) : (
                        clientesCartera.map(c => {
                            const cupoDisponible = c.limite_credito > 0 ? (c.limite_credito - c.totalDeuda) : 0;
                            return (
                                <tr key={c.id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-4 py-4 md:px-8 md:py-5">
                                        <p className="font-black text-gray-900 uppercase text-[10px] md:text-xs">{c.nombre}</p>
                                        <p className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase tracking-widest">CC: {c.cedula || 'N/A'} • 📞 {c.telefono || 'N/A'}</p>
                                    </td>
                                    <td className="px-4 py-4 md:px-8 md:py-5 text-center">
                                        {c.facturasPendientes > 0 ? (
                                            <span className="bg-orange-50 text-orange-600 px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest">{c.facturasPendientes} Por pagar</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-400 px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest">Al día</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 md:px-8 md:py-5 text-right">
                                        {c.limite_credito > 0 ? (
                                            <>
                                                <p className="font-bold text-gray-600 text-[10px] md:text-xs">Límite: ${formatCurrency(c.limite_credito)}</p>
                                                <p className={`font-black text-[9px] uppercase mt-1 ${cupoDisponible > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    Cupo: ${formatCurrency(cupoDisponible > 0 ? cupoDisponible : 0)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="font-bold text-gray-400 text-[9px] uppercase">Sin límite</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 md:px-8 md:py-5 text-right">
                                        <p className={`font-black text-base md:text-lg italic ${c.totalDeuda > 0 ? (c.tieneMora ? 'text-red-600' : 'text-orange-500') : 'text-green-600'}`}>
                                            ${formatCurrency(c.totalDeuda)}
                                        </p>
                                        {c.totalDeuda > 0 && (
                                            c.tieneMora ? 
                                            <p className="text-[7px] md:text-[8px] text-red-500 font-black uppercase mt-1 animate-pulse bg-red-50 py-0.5 rounded-md inline-block px-2">🔴 EN MORA</p> 
                                            : 
                                            <p className="text-[7px] md:text-[8px] text-orange-500 font-bold uppercase mt-1">🟡 VIGENTE</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 md:px-8 md:py-5 text-right">
                                        <button onClick={() => setClienteEstadoCuenta(c)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-1.5 ml-auto">
                                            <Receipt size={14} /> Estado de Cuenta
                                        </button>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};
export default CarteraTab;