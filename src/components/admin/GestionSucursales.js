import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { Store, ArrowRightLeft, Plus, MapPin, Package, Loader2, X } from 'lucide-react';
import { formatCurrency } from '../../utils/adminUtils';

const GestionSucursales = () => {
    const [sucursales, setSucursales] = useState([]);
    const [productosGlobales, setProductosGlobales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    
    // Vistas: 'LISTA', 'NUEVA', 'TRANSFERIR', 'INVENTARIO'
    const [vistaActiva, setVistaActiva] = useState('LISTA'); 
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
    const [inventarioLocal, setInventarioLocal] = useState([]);

    // Formularios
    const [formSucursal, setFormSucursal] = useState({ nombre: '', ciudad: '', direccion: '', telefono: '', es_principal: false });
    const [formTransferencia, setFormTransferencia] = useState({ productoId: '', sucursalOrigenId: '', sucursalDestinoId: '', cantidad: 1 });

    const fetchDatosInit = async () => {
        setLoading(true);
        try {
            const [resSucursales, resProductos] = await Promise.all([
                API.get('/sucursales'),
                API.get('/productos') // Bodega central
            ]);
            setSucursales(resSucursales.data);
            setProductosGlobales(resProductos.data);
        } catch (error) {
            toast.error("Error al cargar datos de sucursales");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDatosInit(); }, []);

    const crearSucursal = async (e) => {
        e.preventDefault();
        setEnviando(true);
        try {
            await API.post('/sucursales', formSucursal);
            toast.success("Sucursal creada exitosamente");
            setFormSucursal({ nombre: '', ciudad: '', direccion: '', telefono: '', es_principal: false });
            setVistaActiva('LISTA');
            fetchDatosInit();
        } catch (error) {
            toast.error("Error al crear sucursal. ¿Nombre duplicado?");
        } finally {
            setEnviando(false);
        }
    };

    const ejecutarTransferencia = async (e) => {
        e.preventDefault();
        setEnviando(true);
        try {
            await API.post('/sucursales/transferir', formTransferencia);
            toast.success("Mercancía transferida con éxito");
            setFormTransferencia({ ...formTransferencia, cantidad: 1 });
            setVistaActiva('LISTA');
            fetchDatosInit();
        } catch (error) {
            toast.error(error.response?.data?.error || "Error en la transferencia");
        } finally {
            setEnviando(false);
        }
    };

    const verInventarioLocal = async (sucursal) => {
        setSucursalSeleccionada(sucursal);
        setVistaActiva('INVENTARIO');
        try {
            const res = await API.get(`/sucursales/${sucursal.id}/inventario`);
            setInventarioLocal(res.data);
        } catch (error) {
            toast.error("Error al cargar inventario local");
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic flex items-center gap-2"><Store className="text-blue-600"/> Multialmacén</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Gestión de Tiendas y Traslados</p>
                </div>
                {vistaActiva === 'LISTA' ? (
                    <div className="flex gap-2">
                        <button onClick={() => setVistaActiva('TRANSFERIR')} className="bg-black text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:bg-gray-800 transition-all"><ArrowRightLeft size={14}/> Enviar Stock</button>
                        <button onClick={() => setVistaActiva('NUEVA')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:bg-blue-700 transition-all"><Plus size={14}/> Nueva Tienda</button>
                    </div>
                ) : (
                    <button onClick={() => setVistaActiva('LISTA')} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:bg-gray-300 transition-all"><X size={14}/> Volver</button>
                )}
            </div>

            <div className="p-6 md:p-8">
                {/* --- VISTA: LISTA DE SUCURSALES --- */}
                {vistaActiva === 'LISTA' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sucursales.length === 0 && <p className="text-gray-400 font-bold uppercase tracking-widest text-xs col-span-3 text-center py-10">No hay sucursales registradas</p>}
                        {sucursales.map(suc => (
                            <div key={suc.id} className="border border-gray-200 rounded-3xl p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                                {suc.es_principal && <div className="absolute top-0 right-0 bg-yellow-400 text-black px-3 py-1 rounded-bl-xl font-black text-[8px] uppercase tracking-widest">Bodega Central</div>}
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Store size={24}/></div>
                                <h3 className="font-black text-xl uppercase tracking-tighter text-gray-900 mb-1">{suc.nombre}</h3>
                                <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mb-4"><MapPin size={12}/> {suc.ciudad} - {suc.direccion}</p>
                                <button onClick={() => verInventarioLocal(suc)} className="w-full bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-700 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex justify-center items-center gap-2">
                                    <Package size={14} /> Ver Inventario Local
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- VISTA: INVENTARIO DE UNA SUCURSAL --- */}
                {vistaActiva === 'INVENTARIO' && sucursalSeleccionada && (
                    <div>
                        <h3 className="font-black text-xl uppercase mb-6 flex items-center gap-2"><Store className="text-blue-500"/> Inventario: {sucursalSeleccionada.nombre}</h3>
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-widest border-b">
                                <tr><th className="px-4 py-4">Producto</th><th className="px-4 py-4 text-center">Stock Físico Local</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {inventarioLocal.length === 0 ? <tr><td colSpan="2" className="text-center py-8 font-bold text-xs text-gray-400">Esta sucursal no tiene mercancía asignada</td></tr> : 
                                    inventarioLocal.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 font-black uppercase text-xs">{inv.Producto?.nombre || 'Producto Desconocido'}</td>
                                            <td className="px-4 py-4 text-center"><span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-lg text-[10px]">{inv.stock_local} Uds</span></td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- VISTA: TRASLADO DE MERCANCÍA --- */}
                {vistaActiva === 'TRANSFERIR' && (
                    <form onSubmit={ejecutarTransferencia} className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                            <h3 className="font-black italic uppercase tracking-tighter text-blue-900 mb-4 text-lg">Traslado de Inventario</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Producto a Enviar</label>
                                    <select required value={formTransferencia.productoId} onChange={e => setFormTransferencia({...formTransferencia, productoId: e.target.value})} className="w-full mt-1 p-3 rounded-xl border-none outline-none font-bold text-xs uppercase cursor-pointer">
                                        <option value="">-- Seleccione un Producto --</option>
                                        {productosGlobales.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock Global: {p.stock})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Origen</label>
                                        <select value={formTransferencia.sucursalOrigenId} onChange={e => setFormTransferencia({...formTransferencia, sucursalOrigenId: e.target.value})} className="w-full mt-1 p-3 rounded-xl border-none outline-none font-bold text-[10px] uppercase cursor-pointer text-orange-600 bg-orange-50">
                                            <option value="">🏭 BODEGA CENTRAL</option>
                                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Destino</label>
                                        <select required value={formTransferencia.sucursalDestinoId} onChange={e => setFormTransferencia({...formTransferencia, sucursalDestinoId: e.target.value})} className="w-full mt-1 p-3 rounded-xl border-none outline-none font-bold text-[10px] uppercase cursor-pointer text-green-600 bg-green-50">
                                            <option value="">-- Seleccionar Tienda --</option>
                                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Cantidad a mover</label>
                                    <input required type="number" min="1" value={formTransferencia.cantidad} onChange={e => setFormTransferencia({...formTransferencia, cantidad: e.target.value})} className="w-full mt-1 p-3 rounded-xl border-none outline-none font-black text-lg text-center" />
                                </div>
                            </div>
                        </div>
                        <button type="submit" disabled={enviando} className="w-full bg-black text-white p-4 rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 hover:bg-gray-800 transition-all active:scale-95">
                            {enviando ? <Loader2 className="animate-spin" size={16}/> : <ArrowRightLeft size={16}/>} Confirmar Traslado
                        </button>
                    </form>
                )}

                {/* --- VISTA: CREAR SUCURSAL --- */}
                {vistaActiva === 'NUEVA' && (
                    <form onSubmit={crearSucursal} className="max-w-xl mx-auto space-y-4">
                        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre de Tienda</label><input required value={formSucursal.nombre} onChange={e=>setFormSucursal({...formSucursal, nombre: e.target.value})} placeholder="Ej: Sucursal Centro" className="w-full mt-1 p-3 rounded-xl bg-gray-50 border-none outline-none font-bold uppercase text-xs focus:ring-2 focus:ring-blue-500" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</label><input required value={formSucursal.ciudad} onChange={e=>setFormSucursal({...formSucursal, ciudad: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-gray-50 border-none outline-none font-bold uppercase text-xs focus:ring-2 focus:ring-blue-500" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono</label><input value={formSucursal.telefono} onChange={e=>setFormSucursal({...formSucursal, telefono: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-gray-50 border-none outline-none font-bold uppercase text-xs focus:ring-2 focus:ring-blue-500" /></div>
                        </div>
                        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección</label><input value={formSucursal.direccion} onChange={e=>setFormSucursal({...formSucursal, direccion: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-gray-50 border-none outline-none font-bold uppercase text-xs focus:ring-2 focus:ring-blue-500" /></div>
                        <button type="submit" disabled={enviando} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center mt-6 hover:bg-blue-700 transition-all active:scale-95">
                            {enviando ? <Loader2 className="animate-spin" size={16}/> : 'Guardar Sucursal'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default GestionSucursales;