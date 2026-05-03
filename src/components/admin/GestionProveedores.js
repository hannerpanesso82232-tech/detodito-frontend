import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Briefcase, Loader2, X } from 'lucide-react';

const GestionProveedores = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [provEditando, setProvEditando] = useState(null);
    const [formulario, setFormulario] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' });

    const fetchProveedores = async () => {
        try {
            const res = await API.get('/proveedores');
            setProveedores(res.data);
        } catch (error) { 
            toast.error("Error al cargar proveedores"); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchProveedores(); }, []);

    const guardarProveedor = async (e) => {
        e.preventDefault(); 
        
        // 🔥 EL CANDADO ANTI-DOBLE CLIC 🔥
        // Si ya está enviando, aborta cualquier clic adicional inmediatamente
        if (enviando) return; 
        
        setEnviando(true);
        try {
            if (provEditando) {
                await API.put(`/proveedores/${provEditando.id}`, formulario);
                toast.success("Proveedor actualizado");
            } else {
                await API.post('/proveedores', formulario);
                toast.success("Proveedor creado");
            }
            setShowModal(false); 
            setProvEditando(null); 
            setFormulario({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' });
            fetchProveedores();
            if (onUpdate) onUpdate(); // Avisa al dashboard global
        } catch (error) { 
            // 🔥 AHORA SÍ LEEMOS LA MENTE DEL SERVIDOR 🔥
            // Si hay un error (ej: duplicado), te mostrará el motivo real
            const mensajeReal = error.response?.data?.error || "Error al guardar proveedor";
            toast.error(mensajeReal); 
        } finally { 
            setEnviando(false); 
        }
    };

    const eliminarProveedor = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este proveedor? Toda su mercancía seguirá intacta.")) return;
        try { 
            await API.delete(`/proveedores/${id}`); 
            toast.success("Proveedor eliminado"); 
            fetchProveedores(); 
            if (onUpdate) onUpdate(); // 🔥 AVISA AL DASHBOARD QUE ACTUALICE LA LISTA 🔥
        } catch (error) { 
            toast.error("Error al eliminar proveedor"); 
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase italic flex items-center gap-2"><Briefcase className="text-blue-600"/> Directorio de Proveedores</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestiona las marcas y fábricas que te surten</p>
                </div>
                <button onClick={() => { setProvEditando(null); setFormulario({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' }); setShowModal(true); }} className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95">
                    <Plus size={16}/> Nuevo Proveedor
                </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-widest border-b">
                        <tr>
                            <th className="px-4 py-4 rounded-tl-xl">Empresa / Marca</th>
                            <th className="px-4 py-4">Contacto</th>
                            <th className="px-4 py-4">Teléfono</th>
                            <th className="px-4 py-4 text-right rounded-tr-xl">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {proveedores.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-xs font-bold text-gray-400 uppercase">Aún no has registrado proveedores</td></tr>}
                        {proveedores.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 font-black uppercase text-sm text-gray-900">{p.nombre}</td>
                                <td className="px-4 py-4 font-bold text-gray-500 text-xs uppercase">{p.contacto || 'N/A'}</td>
                                <td className="px-4 py-4 font-black text-blue-600 text-xs tracking-widest">{p.telefono || 'N/A'}</td>
                                <td className="px-4 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => { setProvEditando(p); setFormulario({ nombre: p.nombre, contacto: p.contacto||'', telefono: p.telefono||'', email: p.email||'', direccion: p.direccion||'' }); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16}/></button>
                                    <button onClick={() => eliminarProveedor(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[600] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-[2rem] w-full max-w-md relative shadow-2xl">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-colors"><X size={16}/></button>
                        <h3 className="text-xl font-black uppercase italic mb-6 tracking-tighter">{provEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                        <form onSubmit={guardarProveedor} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre de Empresa *</label>
                                <input required value={formulario.nombre} onChange={e=>setFormulario({...formulario, nombre: e.target.value})} placeholder="Ej: Distribuidora XYZ" className="w-full bg-gray-50 border-none p-4 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500 mt-1 transition-all"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del Contacto</label>
                                <input value={formulario.contacto} onChange={e=>setFormulario({...formulario, contacto: e.target.value})} placeholder="Ej: Juan Pérez" className="w-full bg-gray-50 border-none p-4 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500 mt-1 transition-all"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono / WhatsApp</label>
                                <input value={formulario.telefono} onChange={e=>setFormulario({...formulario, telefono: e.target.value})} placeholder="Ej: 3001234567" className="w-full bg-gray-50 border-none p-4 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500 mt-1 transition-all"/>
                            </div>
                            <button type="submit" disabled={enviando} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all mt-4 flex justify-center items-center gap-2 shadow-lg active:scale-95">
                                {enviando ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Proveedor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionProveedores;