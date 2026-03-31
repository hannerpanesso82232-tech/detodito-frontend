import React from 'react';
import { Briefcase, Edit, PackageMinus, Trash2 } from 'lucide-react';
import { formatCurrency, formatearImagen } from '../../../utils/adminUtils';

const ProductosTab = ({ productosFiltrados, abrirModalEditar, abrirModalBaja, setProductoAEliminar, setShowDeleteModal }) => {
    return (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[700px]">
                <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-gray-100">
                    <tr><th className="px-4 py-4 md:px-8 md:py-6">Item / Categoría</th><th className="px-4 py-4 md:px-8 md:py-6">Proveedor</th><th className="px-4 py-4 md:px-8 md:py-6 bg-blue-50/50 rounded-tl-xl md:rounded-tl-2xl">Finanzas: Costo/Margen/Venta</th><th className="px-4 py-4 md:px-8 md:py-6">Stock</th><th className="px-4 py-4 md:px-8 md:py-6 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {(Array.isArray(productosFiltrados) ? productosFiltrados : []).length === 0 ? (<tr><td colSpan="5" className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No hay productos.</td></tr>) : (
                        productosFiltrados.map(p => {
                            const tope = p.tope_stock || 10; const stockBajo = parseInt(p.stock) <= tope;
                            return (
                            <tr key={p.id} className="group hover:bg-gray-50/50 transition-all">
                                <td className="px-4 py-4 md:px-8 md:py-5 flex items-center gap-3 md:gap-4"><div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border"><img src={formatearImagen(p.imagen_url)} className="w-full h-full object-cover" alt={p.nombre}/></div><div><p className="font-black text-gray-900 uppercase text-[10px] md:text-xs line-clamp-1">{p.nombre}</p><p className="text-[8px] md:text-[9px] text-blue-600 uppercase font-black italic">{p.Categoria?.nombre || 'Standard'}</p></div></td>
                                <td className="px-4 py-4 md:px-8 md:py-5"><span className="bg-gray-100 text-gray-600 px-2 py-1 md:px-3 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><Briefcase size={10} /> {p.proveedor || 'N/A'}</span></td>
                                <td className="px-4 py-4 md:px-8 md:py-5 bg-blue-50/20"><p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Costo: <span className="text-gray-900">${formatCurrency(p.costo_compra)}</span></p><p className="text-[9px] md:text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-1">Margen: {p.margen_ganancia || 0}%</p><p className="font-black text-xs md:text-sm italic text-green-600">${formatCurrency(p.precio)}</p></td>
                                <td className="px-4 py-4 md:px-8 md:py-5"><span className={`text-[9px] md:text-[10px] font-black uppercase px-2 py-1 md:px-3 rounded-lg ${stockBajo ? 'bg-red-50 text-red-500 animate-pulse border border-red-200' : 'bg-gray-50 text-gray-500 border border-transparent'}`}>{p.stock} Uds {stockBajo && '⚠️'}</span>{stockBajo && <p className="text-[7px] md:text-[8px] text-red-400 mt-1 font-bold uppercase">Tope: {tope}</p>}</td>
                                <td className="px-4 py-4 md:px-8 md:py-5 text-right flex justify-end gap-1">
                                    <button onClick={() => abrirModalEditar(p)} className="p-2 md:p-2.5 hover:bg-black hover:text-white rounded-xl transition-all text-gray-400" title="Editar"><Edit size={14}/></button>
                                    <button onClick={() => abrirModalBaja(p)} className="p-2 md:p-2.5 hover:bg-orange-500 hover:text-white rounded-xl transition-all text-orange-500" title="Reportar Dañado/Merma"><PackageMinus size={14}/></button>
                                    <button onClick={() => { setProductoAEliminar(p); setShowDeleteModal(true); }} className="p-2 md:p-2.5 hover:bg-red-500 hover:text-white rounded-xl transition-all text-red-500" title="Eliminar Permanente"><Trash2 size={14}/></button>
                                </td>
                            </tr>
                        )})
                    )}
                </tbody>
            </table>
        </div>
    );
};
export default ProductosTab;