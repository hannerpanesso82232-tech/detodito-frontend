import React, { useState, useMemo, useRef } from 'react';
import API from '../../../services/api';
import toast from 'react-hot-toast';
import { 
    Search, ShoppingCart, Loader2, DollarSign, Banknote, 
    ScanBarcode, Minus, Plus, Trash2, MonitorSmartphone, FileText 
} from 'lucide-react';
import { formatCurrency, formatearImagen } from '../../../utils/adminUtils';

const PosTab = ({ productos, usuarios, fetchDatos, setShowCheatSheetModal }) => {
    // --- ESTADOS AISLADOS EXCLUSIVOS PARA EL POS ---
    const [posCart, setPosCart] = useState([]);
    const [posCodigo, setPosCodigo] = useState('');
    const [posClienteId, setPosClienteId] = useState('');
    const [posSearchTerm, setPosSearchTerm] = useState('');
    const [enviando, setEnviando] = useState(false);
    const inputScannerRef = useRef(null);

    // --- LÓGICA DEL ESCÁNER Y CARRITO ---
    const handlePosScan = (e) => {
        e.preventDefault();
        const codigoBuscado = posCodigo.trim();
        if (!codigoBuscado) return;

        let productoEncontrado = null;
        let cantidadParaAgregar = 1;

        for (const prod of (Array.isArray(productos) ? productos : [])) {
            if (prod.codigo_barras) {
                try {
                    const diccionarioCodigos = JSON.parse(prod.codigo_barras);
                    if (diccionarioCodigos[codigoBuscado] !== undefined) {
                        productoEncontrado = prod;
                        cantidadParaAgregar = parseInt(diccionarioCodigos[codigoBuscado]);
                        break;
                    }
                } catch (error) {}
            }
        }

        if (productoEncontrado) {
            if (productoEncontrado.stock <= 0) toast.error("Agotado", { icon: '⚠️' });
            else addToPosCart(productoEncontrado, cantidadParaAgregar);
        } else { toast.error("Código no reconocido", { icon: '❓' }); }
        setPosCodigo(''); inputScannerRef.current?.focus();
    };

    const addToPosCart = (producto, qty = 1) => {
        setPosCart(prev => {
            const existe = prev.find(item => item.id === producto.id);
            if (existe) {
                const nuevaCant = existe.cantidad + qty;
                if (nuevaCant > producto.stock) {
                    toast.error(`Stock máximo alcanzado (${producto.stock})`);
                    return prev.map(i => i.id === producto.id ? { ...i, cantidad: producto.stock } : i);
                }
                return prev.map(i => i.id === producto.id ? { ...i, cantidad: nuevaCant } : i);
            }
            if (producto.stock >= qty) {
                toast.success(`${qty}x ${producto.nombre} agregado`);
                return [...prev, { ...producto, cantidad: qty }];
            } else if (producto.stock > 0) {
                toast.success(`Se agregaron solo ${producto.stock} uds (Stock Total)`);
                return [...prev, { ...producto, cantidad: producto.stock }];
            }
            toast.error("Sin existencias"); return prev;
        });
    };

    const updatePosQuantity = (id, nuevaCantidad) => {
        setPosCart(prev => prev.map(item => {
            if (item.id === id) {
                if (nuevaCantidad > item.stock) {
                    toast.error(`Solo quedan ${item.stock} unidades`);
                    return { ...item, cantidad: item.stock };
                }
                return { ...item, cantidad: Math.max(0, nuevaCantidad) };
            }
            return item;
        }).filter(item => item.cantidad > 0));
    };

    const removeFromPosCart = (id) => { setPosCart(prev => prev.filter(item => item.id !== id)); };

    // --- CÁLCULOS MATEMÁTICOS DEL CARRITO (AL POR MAYOR) ---
    const posCartCalculado = useMemo(() => {
        return (posCart || []).map(item => {
            const metaMayor = parseInt(item.cantidad_mayor) || 0;
            const tienePrecioMayor = metaMayor > 0 && item.precio_mayor !== null;
            const aplicaDescuento = tienePrecioMayor && item.cantidad >= metaMayor;
            const precioFinal = aplicaDescuento ? parseFloat(item.precio_mayor) : parseFloat(item.precio);

            return {
                ...item,
                es_mayor: aplicaDescuento,
                precio_aplicado: precioFinal,
                subtotal: precioFinal * item.cantidad
            };
        });
    }, [posCart]);

    const posTotal = useMemo(() => posCartCalculado.reduce((acc, item) => acc + item.subtotal, 0), [posCartCalculado]);
    
    const productosPOSVisuales = useMemo(() => {
        if(!posSearchTerm) return (Array.isArray(productos) ? productos : []).slice(0, 12); 
        return (Array.isArray(productos) ? productos : []).filter(p => (p.nombre || '').toLowerCase().includes(posSearchTerm.toLowerCase())).slice(0, 20);
    }, [productos, posSearchTerm]);

    // --- FACTURACIÓN Y CONEXIÓN CON EL BACKEND ---
    const handlePosCheckout = async (metodo) => {
        if(posCartCalculado.length === 0) return toast.error("La caja está vacía");
        if(metodo === 'CREDITO' && !posClienteId) return toast.error("Selecciona un cliente para poder fiar");

        setEnviando(true); const loadId = toast.loading("Facturando...");
        try {
            const resPedido = await API.post('/pedidos', {
                productos: posCartCalculado.map(i => ({ id: i.id, cantidad: i.cantidad })),
                direccion: 'VENTA FÍSICA EN MOSTRADOR (CAJA)',
                metodo_pago: 'POS_LOCAL' 
            });
            const pedidoId = resPedido.data.pedidoId;
            await API.put(`/pedidos/${pedidoId}/estado`, { estado: 'Entregado' });

            if (metodo === 'CONTADO') {
                await API.post('/contabilidad/gasto', { monto: posTotal, descripcion: `Venta en Caja - Orden #${pedidoId}`, categoria: 'Ventas Productos', tipo: 'INGRESO', fecha: new Date().toISOString().split('T')[0], pedidoId: pedidoId });
                toast.success("Venta cobrada con éxito", { id: loadId });
            } else if (metodo === 'CREDITO') {
                const cliente = (Array.isArray(usuarios) ? usuarios : []).find(u => u.id === parseInt(posClienteId));
                const dias = parseInt(cliente?.dias_credito || 30);
                const fechaVencimiento = new Date();
                fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);
                await API.post('/creditos', { usuarioId: posClienteId, monto_total: posTotal, descripcion: `Venta Fiada en Caja - Orden #${pedidoId}`, fecha_vencimiento: fechaVencimiento.toISOString() });
                toast.success("Venta anotada en la Cartera del Cliente", { id: loadId });
            }

            // Reiniciamos el estado del POS
            setPosCart([]); setPosCodigo(''); setPosClienteId(''); setPosSearchTerm(''); 
            fetchDatos(); // Refrescamos todo el dashboard
        } catch (error) { toast.error("Error al procesar la venta", { id: loadId }); } finally { setEnviando(false); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-blue-600 rounded-[2rem] p-6 md:p-8 shadow-lg shadow-blue-600/20 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 opacity-10"><ScanBarcode size={200} /></div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter mb-4 relative z-10">Lector de Barras</h3>
                    <form onSubmit={handlePosScan} className="relative z-10 flex gap-2">
                        <div className="relative flex-1">
                            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={24} />
                            <input 
                                ref={inputScannerRef}
                                type="text" 
                                value={posCodigo}
                                onChange={(e) => setPosCodigo(e.target.value)}
                                placeholder="Pistolear código..."
                                className="w-full bg-blue-800/50 border-2 border-blue-500 rounded-xl py-4 pl-12 pr-4 text-lg font-black tracking-widest outline-none focus:bg-white focus:text-black focus:border-white transition-all placeholder:text-blue-400"
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="bg-black text-white px-8 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-all shadow-md active:scale-95">Buscar</button>
                    </form>
                </div>
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <h3 className="font-black uppercase tracking-widest text-sm text-gray-500 flex items-center gap-2"><MonitorSmartphone size={16}/> Catálogo Manual</h3>
                            <button onClick={() => setShowCheatSheetModal(true)} className="text-left mt-1 text-blue-600 font-bold text-[10px] uppercase hover:underline flex items-center gap-1"><FileText size={10}/> ¿Ver códigos de barras?</button>
                        </div>
                        <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input type="text" placeholder="Buscar por nombre..." value={posSearchTerm} onChange={e => setPosSearchTerm(e.target.value)} className="w-full bg-gray-50 border-none rounded-lg pl-9 pr-4 py-2 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {productosPOSVisuales.map(p => (
                            <div key={p.id} className="border border-gray-100 rounded-2xl p-3 flex flex-col hover:shadow-md transition-all group">
                                <div className="aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden"><img src={formatearImagen(p.imagen_url)} className="w-full h-full object-cover group-hover:scale-110 transition-all" alt={p.nombre}/></div>
                                <p className="font-black text-xs uppercase leading-tight line-clamp-2 mb-1">{p.nombre}</p>
                                <p className="text-[10px] font-bold text-gray-400 mb-2">{p.stock} Uds en bodega</p>
                                <button onClick={() => addToPosCart(p, 1)} disabled={p.stock <= 0} className="mt-auto w-full py-2 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50">+ Agregar</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col h-full max-h-[800px]">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 shrink-0"><h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2"><ShoppingCart size={24} className="text-blue-600"/> Cuenta Actual</h2></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {posCartCalculado.length === 0 ? <p className="text-center text-gray-400 font-black uppercase text-[10px] tracking-widest py-20">Escanea productos para empezar</p> : 
                        posCartCalculado.map(item => (
                            <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <div className="flex-1">
                                    <h4 className="font-black text-xs uppercase text-gray-900 line-clamp-1">{item.nombre}</h4>
                                    {item.es_mayor && <span className="text-[8px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black uppercase mt-1 inline-block">Mayorista</span>}
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200">
                                            <button onClick={() => updatePosQuantity(item.id, item.cantidad - 1)} className="text-gray-400 hover:text-black"><Minus size={12}/></button>
                                            <span className="font-black text-xs w-4 text-center">{item.cantidad}</span>
                                            <button onClick={() => addToPosCart(item, 1)} disabled={item.cantidad >= item.stock} className="text-gray-400 hover:text-black disabled:opacity-50"><Plus size={12}/></button>
                                        </div>
                                        <button onClick={() => removeFromPosCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    {item.es_mayor && <p className="text-[9px] text-gray-400 font-bold line-through">${parseFloat(item.precio).toLocaleString()} c/u</p>}
                                    <p className="font-black text-sm italic text-gray-900">${item.precio_aplicado.toLocaleString()}</p>
                                    <p className="text-[10px] font-black text-blue-600 mt-1">${item.subtotal.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                </div>
                <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0">
                    <div className="flex justify-between items-end mb-6"><span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Total</span><span className="text-4xl font-black italic tracking-tighter text-gray-900">${posTotal.toLocaleString('es-CO')}</span></div>
                    <div className="space-y-3">
                        <button onClick={() => handlePosCheckout('CONTADO')} disabled={enviando || posCartCalculado.length === 0} className="w-full bg-green-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 active:scale-95">{enviando ? <Loader2 className="animate-spin" size={16} /> : <DollarSign size={16}/>} Cobrar Efectivo</button>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                            <label className="text-[9px] font-black text-orange-800 uppercase tracking-widest mb-2 block flex items-center gap-1"><Banknote size={12}/> Fiar a Cliente</label>
                            <select value={posClienteId} onChange={e => setPosClienteId(e.target.value)} className="w-full bg-white p-3 rounded-lg font-bold text-xs outline-none mb-3 border border-orange-100">
                                <option value="">-- Seleccionar --</option>
                                {(Array.isArray(usuarios) ? usuarios : []).map(u => <option key={u.id} value={u.id}>{u.nombre} (${formatCurrency(u.limite_credito)})</option>)}
                            </select>
                            <button onClick={() => handlePosCheckout('CREDITO')} disabled={enviando || posCartCalculado.length === 0 || !posClienteId} className="w-full bg-orange-500 text-white py-3 rounded-lg font-black uppercase tracking-widest text-[9px] hover:bg-black transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center">{enviando ? <Loader2 className="animate-spin" size={14} /> : 'Cargar a Cartera'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PosTab;