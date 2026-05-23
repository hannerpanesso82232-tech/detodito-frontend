import React, { useState, useEffect } from 'react';
import { 
    X, Loader2, CheckCircle2, Calculator, AlertTriangle, User, Key, Settings, 
    Map, Trash2, PackageMinus, Banknote, DollarSign, Image as ImageIcon, 
    Printer, ArrowLeftRight, ChevronRight, History, Edit, ArrowUpRight, ArrowDownRight, Tag, Plus, ScanBarcode, FileText,
    AlertCircle
} from 'lucide-react';
import { formatCurrency, imprimirFacturaCliente, imprimirTirillaPOS } from '../../utils/adminUtils';

const AdminModals = ({ states, forms, setters, handlers, data }) => {
    // 1. Extraemos los estados
    const { 
        showBajaModal, productoBaja, showGastoModal, showEditTransaccionModal, 
        transaccionSeleccionada, showDeleteTransaccionModal, pedidoDetalle, showModal, 
        productoEditando, preview, precioCalculado, showEditUsuarioModal, showUsuarioModal, 
        showPasswordModal, usuarioSeleccionado, showConfigModal, usuarioAEliminar, showDeleteModal,
        productoAEliminar, showCobroModal, pedidoACobrar, showCreditoModal, showAbonoModal,
        creditoSeleccionado, clienteEstadoCuenta, enviando, showCheatSheetModal, showPrintModal,
        facturaAImprimir, showDevolucionModal, itemDevolucion, cantidadDevolucion 
    } = states;
    
    // 2. Extraemos los formularios
    const { 
        formBaja, formGasto, formulario, formEditUsuario, formUsuario, 
        nuevaPassword, whatsappTienda, horaLimite, nuevaRutaCiudad, nuevaRutaDia, 
        formCredito, formAbono 
    } = forms;
    
    // 3. Extraemos los setters
   const { 
    setShowBajaModal, setFormBaja, setShowGastoModal, setShowEditTransaccionModal, 
    setFormGasto, setShowDeleteTransaccionModal, setPedidoDetalle, cerrarModal, setFormulario, 
    setPreview, setShowEditUsuarioModal, setFormEditUsuario, setShowUsuarioModal, setFormUsuario, 
    setShowPasswordModal, setNuevaPassword, setShowConfigModal, setWhatsappTienda, setHoraLimite, 
    setNuevaRutaCiudad, setNuevaRutaDia, setUsuarioAEliminar, setShowDeleteModal, setShowCobroModal, 
    setPedidoACobrar, setShowCreditoModal, setFormCredito, setShowAbonoModal, setFormAbono, setClienteEstadoCuenta, 
    setCreditoSeleccionado, setShowCheatSheetModal, setShowPrintModal, setFacturaAImprimir, setShowArqueoModal, setShowDevolucionModal, setCantidadDevolucion
 } = setters;
    
    // 4. Extraemos los handlers
    const { 
        handleGuardarBaja, handleGuardarTransaccion, handleEliminarTransaccion, 
        handleDevolucionProducto, handleGuardarProducto, handleImagenChange, 
        handleEditarUsuario, handleCrearUsuario, handleRestablecerPassword, 
        handleGuardarConfig, handleCrearRutaConfig, handleEliminarRutaConfig, 
        handleEliminarUsuario, handleEliminar, handleCobro, handleCrearCredito, 
        handleRegistrarAbono, procesarDevolucionAPI
    } = handlers;
    
    // 5. Desempaquetamos los datos
    const { categorias, usuarios, rutasDinamicas, clienteActualData, transacciones, productos } = data;

    // 🔥 ESTADO LOCAL PARA MANEJAR LOS CÓDIGOS DE BARRAS FÁCILMENTE 🔥
    const [barcodesUI, setBarcodesUI] = useState([{ id: Math.random().toString(36).substring(7), code: '', qty: 1 }]);

    // Estado local exclusivo para el cuadre de caja
const [efectivoFisico, setEfectivoFisico] = useState('');

    // 🔥 DECODIFICADOR MAESTRO DE JSON (SELF-HEALING) 🔥
    const safeDecodeJSON = (rawString) => {
        if (!rawString || typeof rawString !== 'string' || rawString.trim() === '') return {};
        
        let current = rawString;
        let attempts = 0;
        
        try {
            while (typeof current === 'string' && attempts < 5) {
                const trimmed = current.trim();
                // Si no parece un objeto JSON o un string escapado, paramos
                if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                    // Si empieza con comillas y tiene llaves dentro, lo quitamos
                    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                        current = trimmed.substring(1, trimmed.length - 1).replace(/\\"/g, '"');
                        attempts++;
                        continue;
                    }
                    break;
                }
                current = JSON.parse(trimmed);
                attempts++;
            }
            if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
                return current;
            }
            return {};
        } catch (e) {
            return {};
        }
    };

    // CARGAR LOS CÓDIGOS AL ABRIR EL MODAL DE EDICIÓN
    useEffect(() => {
        if (showModal) {
            let parsed = {};
            if (productoEditando && productoEditando.codigo_barras) {
                parsed = safeDecodeJSON(productoEditando.codigo_barras);
            }

            // Transformamos el objeto limpio a las filas visuales
            const arr = Object.entries(parsed).map(([code, qty]) => ({ 
                id: Math.random().toString(36).substring(7), 
                code: String(code).replace(/["\\]/g, ''), // Limpiamos la basura residual
                qty: parseInt(qty) || 1 
            }));

            setBarcodesUI(arr.length > 0 ? arr : [{ id: Math.random().toString(36).substring(7), code: '', qty: 1 }]);
        } else {
            // Limpieza al cerrar el modal para evitar "fantasmas de memoria"
            setBarcodesUI([{ id: Math.random().toString(36).substring(7), code: '', qty: 1 }]);
        }
    }, [showModal, productoEditando]); 

    // Mapea la lista visual de vuelta al JSON puro para mandarlo a AdminDashboard
    const updateParentJSON = (list) => {
        const obj = {};
        list.forEach(item => {
            const cleanCode = item.code.trim();
            if (cleanCode !== '') {
                obj[cleanCode] = parseInt(item.qty) || 1;
            }
        });
        // Si hay datos, lo serializa 1 sola vez de forma limpia
        const newJson = Object.keys(obj).length > 0 ? JSON.stringify(obj) : '';
        setFormulario(prev => ({ ...prev, codigo_barras: newJson }));
    };

    const handleAddBarcode = () => {
        const newList = [...barcodesUI, { id: Math.random().toString(36).substring(7), code: '', qty: 1 }];
        setBarcodesUI(newList);
        updateParentJSON(newList);
    };

    const handleRemoveBarcode = (id) => {
        let newList = barcodesUI.filter(b => b.id !== id);
        if (newList.length === 0) {
            newList = [{ id: Math.random().toString(36).substring(7), code: '', qty: 1 }];
        }
        setBarcodesUI(newList);
        updateParentJSON(newList);
    };

    const handleUpdateBarcode = (id, field, value) => {
        const newList = barcodesUI.map(b => b.id === id ? { ...b, [field]: value } : b);
        setBarcodesUI(newList);
        updateParentJSON(newList);
    };

    return (
        <>
            {/* 1. MODAL: CREAR / EDITAR PRODUCTO */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-5xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in slide-in-from-bottom-4 duration-300 my-auto">
                        <button onClick={cerrarModal} className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={16}/>
                        </button>
                        
                        <div className="w-full md:w-1/3 bg-gray-50 p-6 md:p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
                            <div className="w-32 h-32 md:w-full md:aspect-square bg-white rounded-2xl md:rounded-[2.5rem] shadow-inner border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-4 md:mb-8">
                                {preview ? <img src={preview} className="w-full h-full object-cover" alt="Preview" /> : <ImageIcon size={32} className="text-gray-200 md:w-12 md:h-12" />}
                            </div>
                            <label className="w-full text-center bg-black text-white px-4 py-3 md:px-6 md:py-5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase cursor-pointer hover:bg-blue-600 transition-all shadow-xl">
                                {preview ? 'CAMBIAR IMAGEN' : 'ADJUNTAR IMAGEN'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImagenChange} />
                            </label>
                        </div>

                        {/* 🔥 USAMOS EL HANDLER ORIGINAL PASADO POR PROPS 🔥 */}
                        <form onSubmit={handleGuardarProducto} className="flex-1 p-6 md:p-10 grid grid-cols-2 gap-4 md:gap-5 max-h-[70vh] md:max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <h2 className="col-span-2 text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-2 md:mb-4">{productoEditando ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}</h2>
                            
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1">NOMBRE</label>
                                <input required type="text" className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-black text-sm" value={formulario.nombre || ''} onChange={e => setFormulario({...formulario, nombre: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-1">Proveedor (Opcional)</label>
                                <select 
                                    value={forms.formulario.proveedor || ''} 
                                    onChange={(e) => setters.setFormulario({ ...forms.formulario, proveedor: e.target.value })}
                                    className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 md:p-4 text-[10px] md:text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="">-- SELECCIONA PROVEEDOR --</option>
                                    {data.proveedoresDB && data.proveedoresDB.map(prov => (
                                        <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1">CATEGORÍA</label>
                                <select required className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-black text-sm" value={formulario.categoriaId || ''} onChange={e => setFormulario({...formulario, categoriaId: e.target.value})}>
                                    <option value="" disabled>SELECCIONAR</option>
                                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1">DESCRIPCIÓN</label>
                                <textarea rows="1" className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-black resize-none text-sm" value={formulario.descripcion || ''} onChange={e => setFormulario({...formulario, descripcion: e.target.value})} />
                            </div>

                            {/* CALCULADORA DE PRECIOS BASE */}
                            <div className="col-span-2 bg-blue-50/50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-blue-100 mt-2 md:mt-4 space-y-4 md:space-y-5">
                                <div className="flex items-center gap-3 mb-2 border-b border-blue-100 pb-3 md:pb-4">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white rounded-lg md:rounded-xl flex items-center justify-center shadow-lg"><Calculator size={16} className="md:w-5 md:h-5" /></div>
                                    <div>
                                        <p className="text-xs md:text-sm font-black uppercase text-blue-900 tracking-tighter italic">Calculadora precio</p>
                                        <p className="text-[8px] md:text-[9px] font-black text-blue-500 uppercase tracking-widest">Cálculo Automático</p>
                                    </div>
                                </div>
                                {!productoEditando ? (
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 mb-1">Costo de Compra (C/U)</label><input required type="number" step="0.01" min="0" className="w-full bg-white border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-blue-600 shadow-sm text-xs md:text-sm" value={formulario.costo_compra || ''} onChange={e => setFormulario({...formulario, costo_compra: e.target.value})} /></div>
                                        <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 mb-1">Margen de Ganancia (%)</label><input required type="number" min="0" className="w-full bg-white border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-orange-500 shadow-sm text-xs md:text-sm" value={formulario.margen_ganancia || ''} onChange={e => setFormulario({...formulario, margen_ganancia: e.target.value})} /></div>
                                        <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 mb-1">Cantidad (Stock)</label><input required type="number" min="0" className="w-full bg-white border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-black shadow-sm text-xs md:text-sm" value={formulario.stock || ''} onChange={e => setFormulario({...formulario, stock: e.target.value})} /></div>
                                        <div><label className="text-[8px] md:text-[9px] font-black uppercase text-red-500 mb-1">Alerta Stock Bajo</label><input required type="number" min="0" className="w-full bg-white border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-red-500 shadow-sm text-xs md:text-sm" value={formulario.tope_stock || ''} onChange={e => setFormulario({...formulario, tope_stock: e.target.value})} /></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="bg-gray-100 p-3 md:p-4 rounded-xl md:rounded-2xl"><p className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1">Costo Promedio</p><p className="font-bold text-gray-600 text-xs md:text-sm">${formatCurrency(productoEditando.costo_compra)}</p></div>
                                        <div className="bg-gray-100 p-3 md:p-4 rounded-xl md:rounded-2xl"><p className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1">Stock Actual</p><p className="font-bold text-gray-600 text-xs md:text-sm">{formulario.stock} Uds</p></div>
                                        <div><label className="text-[8px] md:text-[9px] font-black uppercase text-blue-600 mb-1">📦 ➕ Unidades Nuevas</label><input type="number" min="0" className="w-full bg-white border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-black text-blue-900 focus:ring-2 focus:ring-blue-600 shadow-sm outline-none text-xs md:text-sm" value={formulario.stock_adicional || ''} onChange={e => setFormulario({...formulario, stock_adicional: e.target.value})} /></div>
                                        <div><label className="text-[8px] md:text-[9px] font-black uppercase text-blue-600 mb-1">💰 Costo (C/U) Nuevo</label><input type="number" step="0.01" min="0" className="w-full bg-white border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-black text-blue-900 focus:ring-2 focus:ring-blue-600 shadow-sm outline-none text-xs md:text-sm" value={formulario.costo_nuevo_lote || ''} onChange={e => setFormulario({...formulario, costo_nuevo_lote: e.target.value})} /></div>
                                        <div className="col-span-2 border-t border-dashed border-blue-200 pt-3 md:pt-4 mt-1 md:mt-2 flex gap-3 md:gap-4">
                                            <div className="flex-1"><label className="text-[8px] md:text-[9px] font-black uppercase text-orange-600 mb-1">Margen (%)</label><input type="number" min="0" className="w-full bg-white border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold text-orange-600 focus:ring-2 focus:ring-orange-500 shadow-sm outline-none text-xs md:text-sm" value={formulario.margen_ganancia || ''} onChange={e => setFormulario({...formulario, margen_ganancia: e.target.value})} /></div>
                                            <div className="flex-1"><label className="text-[8px] md:text-[9px] font-black uppercase text-red-500 mb-1">Alerta Stock Bajo</label><input type="number" min="0" className="w-full bg-white border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold text-red-600 focus:ring-2 focus:ring-red-500 shadow-sm outline-none text-xs md:text-sm" value={formulario.tope_stock || ''} onChange={e => setFormulario({...formulario, tope_stock: e.target.value})} /></div>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-3 md:mt-4 p-4 md:p-5 bg-black text-white rounded-xl md:rounded-2xl flex justify-between items-center shadow-2xl">
                                <div>
                                    <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${parseFloat(formulario.precio) > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                        {parseFloat(formulario.precio) > 0 ? 'PRECIO FORZADO (MANUAL)' : 'Precio Sugerido (Detal)'}
                                    </p>
                                    <p className="text-2xl md:text-3xl font-black italic tracking-tighter">
                                        ${formatCurrency(parseFloat(formulario.precio) > 0 ? parseFloat(formulario.precio) : precioCalculado)}
                                    </p>
                                </div>
                                {productoEditando && parseInt(formulario.stock_adicional || 0) > 0 && (
                                    <div className="text-right"><p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400">Stock Final</p><p className="text-lg md:text-xl font-bold">{parseInt(formulario.stock || 0) + parseInt(formulario.stock_adicional || 0)} Uds</p></div>
                                )}
                                </div>
                            </div>

                            {/* 🔥 REGLAS AL POR MAYOR Y ESCÁNER 🔥 */}
                            <div className="col-span-2 bg-green-50/50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-green-100 mt-2 space-y-4">
                                <div className="flex items-center gap-3 mb-2 border-b border-green-100 pb-3">
                                    <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center shadow-lg"><Tag size={16} /></div>
                                    <div>
                                        <p className="text-xs md:text-sm font-black uppercase text-green-900 tracking-tighter italic">Punto de Venta (Mayorista)</p>
                                        <p className="text-[8px] md:text-[9px] font-black text-green-600 uppercase tracking-widest">Escáner & Descuentos</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-green-700 mb-1">Aplica descuento desde (Uds)</label>
                                        <input type="number" min="0" placeholder="Ej: 10" className="w-full bg-white border-none rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-xs" value={formulario.cantidad_mayor || ''} onChange={e => setFormulario({...formulario, cantidad_mayor: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black uppercase text-green-700 mb-1">Nuevo Precio Unitario ($)</label>
                                        <input type="number" step="0.01" min="0" placeholder="Ej: 400" className="w-full bg-white border-none rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-xs" value={formulario.precio_mayor || ''} onChange={e => setFormulario({...formulario, precio_mayor: e.target.value})} />
                                    </div>
                                </div>

                                {/* LISTA DINÁMICA DE CÓDIGOS DE BARRAS */}
                                <div className="col-span-2 border-t border-green-200/50 pt-4 mt-2">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <label className="text-[9px] md:text-[10px] font-black uppercase text-green-800 block">Asociar Códigos de Barras</label>
                                            <p className="text-[8px] text-green-600 font-bold uppercase tracking-widest">Ej: Código Blíster = 1 ud. Código Caja = 10 uds.</p>
                                        </div>
                                        <button type="button" onClick={handleAddBarcode} className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-[9px] font-black uppercase tracking-widest shadow-sm">
                                            <Plus size={12}/> Añadir
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {barcodesUI.map((b) => (
                                            <div key={b.id} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-green-100 shadow-sm">
                                                <div className="flex-1">
                                                    <input type="text" placeholder="Pistolear código aquí..." className="w-full bg-gray-50 border-none rounded-lg p-2 font-bold outline-none focus:ring-2 focus:ring-green-500 text-xs text-gray-700 placeholder:text-gray-400" value={b.code} onChange={e => handleUpdateBarcode(b.id, 'code', e.target.value)} />
                                                </div>
                                                <div className="w-24">
                                                    <div className="flex items-center bg-gray-50 rounded-lg pr-2" title="¿Cuántas unidades se descuentan del inventario al pistolear este código?">
                                                        <input type="number" min="1" className="w-full bg-transparent border-none p-2 font-black outline-none focus:ring-0 text-xs text-center text-green-700" value={b.qty} onChange={e => handleUpdateBarcode(b.id, 'qty', e.target.value)} />
                                                        <span className="text-[8px] font-black text-gray-400">Uds</span>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveBarcode(b.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><X size={14}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* FORZAR PRECIO MANUAL */}
                            <div className="col-span-2 mt-1 md:mt-2 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 flex items-center justify-between">
                                <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-500 block mb-0.5 md:mb-1">¿Forzar cambio de precio manual (Detal)?</label></div>
                                <input type="number" step="0.01" className="w-1/2 sm:w-1/3 bg-white border-none rounded-lg md:rounded-xl p-2 md:p-3 font-bold shadow-sm outline-none focus:ring-2 focus:ring-black text-xs md:text-sm" value={formulario.precio || ''} onChange={e => setFormulario({...formulario, precio: e.target.value})} placeholder="Precio exacto..." />
                            </div>

                            {/* 🔥 MÓDULO DE FARMACIA (FRACCIONAMIENTO) 🔥 */}
                            <div className="col-span-1 md:col-span-2 bg-blue-50 border border-blue-200 p-4 rounded-2xl mt-2">
                                <label className="flex items-center gap-2 cursor-pointer mb-4">
                                    <input 
                                        type="checkbox" 
                                        checked={forms.formulario.es_fraccionable || false} 
                                        onChange={(e) => setters.setFormulario({...forms.formulario, es_fraccionable: e.target.checked})} 
                                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                                    />
                                    <span className="font-black uppercase text-blue-900 text-xs tracking-widest">Habilitar Fraccionamiento (Farmacia)</span>
                                </label>

                                {forms.formulario.es_fraccionable && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in zoom-in-95">
                                        <div>
                                            <label className="text-[9px] font-black text-blue-700 uppercase tracking-widest ml-1">Uds. por Caja</label>
                                            <input type="number" placeholder="Ej: 30" value={forms.formulario.unidades_por_caja || ''} onChange={e=>setters.setFormulario({...forms.formulario, unidades_por_caja: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-white border border-blue-100 outline-none font-bold text-xs focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-blue-700 uppercase tracking-widest ml-1">Precio x Caja</label>
                                            <input type="number" placeholder="Ej: 30000" value={forms.formulario.precio_caja || ''} onChange={e=>setters.setFormulario({...forms.formulario, precio_caja: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-white border border-blue-100 outline-none font-bold text-xs focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-green-700 uppercase tracking-widest ml-1">Uds. por Sello</label>
                                            <input type="number" placeholder="Ej: 10" value={forms.formulario.unidades_por_sello || ''} onChange={e=>setters.setFormulario({...forms.formulario, unidades_por_sello: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-white border border-green-100 outline-none font-bold text-xs focus:ring-2 focus:ring-green-500" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-green-700 uppercase tracking-widest ml-1">Precio x Sello</label>
                                            <input type="number" placeholder="Ej: 12000" value={forms.formulario.precio_sello || ''} onChange={e=>setters.setFormulario({...forms.formulario, precio_sello: e.target.value})} className="w-full mt-1 p-3 rounded-xl bg-white border border-green-100 outline-none font-bold text-xs focus:ring-2 focus:ring-green-500" />
                                        </div>
                                        <div className="col-span-2 md:col-span-4 mt-2">
                                            <p className="text-[9px] text-blue-600 font-bold uppercase italic flex items-center gap-1">⚠️ Recuerda: El "Stock" y el "Precio Venta (Final)" de arriba ahora equivalen a la pastilla/unidad suelta.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button disabled={enviando || (precioCalculado <= 0 && !formulario.precio)} className={`col-span-2 mt-2 md:mt-4 text-white py-4 md:py-6 rounded-xl md:rounded-3xl font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl ${(precioCalculado <= 0 && !formulario.precio) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-black hover:scale-[1.02]'}`}>
                                {enviando ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={16} className="md:w-5 md:h-5"/>} {productoEditando ? 'Guardar Cambios' : 'PUBLICAR PRODUCTO'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. MODAL: BAJA DE PRODUCTOS */}
            {showBajaModal && productoBaja && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        <button onClick={() => setShowBajaModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={16}/>
                        </button>
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <PackageMinus size={24} className="md:w-8 md:h-8"/>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-1 text-center">Dar de Baja</h3>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center line-clamp-1">{productoBaja.nombre}</p>
                        
                        <form onSubmit={handleGuardarBaja} className="space-y-4 md:space-y-5">
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase">Stock Actual:</span>
                                <span className="text-xs md:text-sm font-black text-gray-900">{productoBaja.stock} Uds</span>
                            </div>
                            <div>
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-1 block ml-2">¿Cuántas unidades se dañaron?</label>
                                <input required type="number" min="1" max={productoBaja.stock} className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-black outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={formBaja.cantidad} onChange={e => setFormBaja({...formBaja, cantidad: parseInt(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-1 block ml-2">Motivo de la pérdida</label>
                                <select className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500 text-xs md:text-sm cursor-pointer" value={formBaja.motivo} onChange={e => setFormBaja({...formBaja, motivo: e.target.value})}>
                                    <option value="Dañado/Roto">Dañado / Roto</option>
                                    <option value="Defectuoso de Fábrica">Defectuoso de Fábrica</option>
                                    <option value="Vencido/Caducado">Vencido / Caducado</option>
                                    <option value="Pérdida/Robo">Pérdida / Robo</option>
                                </select>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-xl md:rounded-2xl border border-orange-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[8px] md:text-[9px] font-black text-orange-600 uppercase">Pérdida Financiera</p>
                                    <p className="text-[7px] md:text-[8px] font-bold text-orange-500">Se restará del libro mayor</p>
                                </div>
                                <p className="text-lg md:text-xl font-black text-orange-600 italic">-${formatCurrency((productoBaja.costo_compra || 0) * formBaja.cantidad)}</p>
                            </div>
                            <button disabled={enviando || productoBaja.stock <= 0} className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest bg-orange-500 text-white hover:bg-black transition-all flex justify-center items-center mt-2 shadow-lg disabled:opacity-50">
                                {enviando ? <Loader2 className="animate-spin" /> : 'Confirmar Baja'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. MODAL: DETALLE DE PEDIDO (OJITO) */}
            {pedidoDetalle && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative animate-in zoom-in duration-200">
                        <button onClick={() => setPedidoDetalle(null)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={18}/>
                        </button>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6 md:mb-8 pr-10 md:pr-12">
                            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Detalle Pedido</h2>
                            <button onClick={() => imprimirFacturaCliente(pedidoDetalle, rutasDinamicas, horaLimite)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 md:gap-2 transition-all shadow-lg active:scale-95">
                                <Printer size={14}/> PDF
                            </button>
                        </div>
                        <div className="space-y-3 md:space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {(pedidoDetalle.Detalles || pedidoDetalle.items || []).map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 md:p-5 rounded-[1rem] md:rounded-[1.5rem] border border-gray-100 gap-3 sm:gap-0">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] md:text-[10px] font-black uppercase text-gray-900">{item.Producto?.nombre || item.nombre || 'Item'}</span>
                                        <span className="text-[9px] font-bold text-gray-400 mt-1">Cant: {item.cantidad} x ${formatCurrency(item.precioUnitario || item.precio)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        <span className="font-black text-sm md:text-sm italic text-blue-600">${formatCurrency(item.cantidad * parseFloat(item.precioUnitario || item.precio || 0))}</span>
                                        <button onClick={() => handleDevolucionProducto(pedidoDetalle.id, item)} className="bg-red-100 text-red-600 p-1.5 md:p-2 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase" title="Procesar Devolución">
                                            <ArrowLeftRight size={12} className="md:w-3 md:h-3"/> <span className="sm:hidden">Devolver</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                            <span className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Cliente</span>
                            <span className="text-3xl md:text-4xl font-black italic tracking-tighter text-black">${formatCurrency(pedidoDetalle.total)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. MODAL: ESTADO DE CUENTA CARTERA (Panel 360) */}
            {clienteEstadoCuenta && clienteActualData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[180] flex items-center justify-center p-2 md:p-6 overflow-hidden">
                    <div className="bg-gray-50 w-full max-w-6xl h-[95vh] md:h-[90vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-300">
                        <div className="bg-white p-6 md:p-8 border-b border-gray-200 flex justify-between items-center z-10 shrink-0">
                            <div>
                                <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3"><User className="text-blue-600" /> {clienteActualData.nombre}</h2>
                                <p className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Estado de Cuenta Oficial</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:block text-right mr-4 border-r pr-8 border-gray-200">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Deuda Total Activa</p>
                                    <p className="text-2xl font-black italic tracking-tighter text-red-600">${formatCurrency(clienteActualData.totalDeuda)}</p>
                                </div>
                                <button onClick={() => setClienteEstadoCuenta(null)} className="p-3 md:p-4 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all active:scale-90">
                                    <X size={20}/>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            <div className="flex-1 border-r border-gray-200 flex flex-col overflow-hidden bg-white">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                                    <h3 className="font-black uppercase tracking-tighter text-lg md:text-xl flex items-center gap-2"><Banknote className="text-red-500" size={20}/> Deudas Activas</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                                    <div className="md:hidden bg-red-50 border border-red-100 p-4 rounded-2xl mb-4 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Deuda Total Activa</p>
                                        <p className="text-3xl font-black italic tracking-tighter text-red-600">${formatCurrency(clienteActualData.totalDeuda)}</p>
                                    </div>
                                    {clienteActualData.creditos.length === 0 ? (
                                        <p className="text-center text-gray-400 text-xs font-bold uppercase py-10">El cliente no tiene historial de deudas.</p>
                                    ) : (
                                        clienteActualData.creditos.map(c => {
                                            const hoy = new Date(); hoy.setHours(0,0,0,0);
                                            const vence = new Date(c.fecha_vencimiento); vence.setHours(0,0,0,0);
                                            const estaEnMora = c.estado === 'VIGENTE' && hoy > vence;

                                            return (
                                            <div key={c.id} className={`p-5 rounded-2xl md:rounded-3xl border transition-all ${c.estado === 'VIGENTE' ? (estaEnMora ? 'bg-red-50 border-red-200 shadow-lg shadow-red-500/10' : 'bg-white border-blue-100 shadow-lg shadow-blue-500/5') : 'bg-gray-50 border-gray-100 opacity-60 hover:opacity-100'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${c.estado === 'VIGENTE' ? (estaEnMora ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-50 text-blue-600') : 'bg-green-50 text-green-600'}`}>
                                                            {c.estado === 'VIGENTE' ? (estaEnMora ? 'VENCIDO (EN MORA)' : 'AL DÍA') : 'PAGADO'}
                                                        </span>
                                                        <p className="font-black text-gray-900 text-sm md:text-base mt-2 line-clamp-1">{c.descripcion}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Creado: {new Date(c.fecha).toLocaleDateString()}</p>
                                                        {c.estado === 'VIGENTE' && c.fecha_vencimiento && (
                                                            <p className={`text-[8px] font-black uppercase mt-1.5 ${estaEnMora ? 'text-red-500' : 'text-blue-500'}`}>Vence: {new Date(c.fecha_vencimiento).toLocaleDateString()}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Debe</p>
                                                        <p className={`font-black italic tracking-tighter text-xl ${c.estado === 'VIGENTE' ? (estaEnMora ? 'text-red-600' : 'text-blue-600') : 'text-gray-400 line-through'}`}>${formatCurrency(c.saldo)}</p>
                                                    </div>
                                                </div>
                                                {c.estado === 'VIGENTE' && (
                                                    <button onClick={() => { setCreditoSeleccionado(c); setShowAbonoModal(true); }} className="w-full mt-2 py-3 bg-green-50 hover:bg-green-600 text-green-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 active:scale-95">
                                                        <DollarSign size={14}/> Recibir Pago (Abono)
                                                    </button>
                                                )}
                                            </div>
                                        )})
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                                    <h3 className="font-black uppercase tracking-tighter text-lg md:text-xl flex items-center gap-2 text-gray-700"><History className="text-blue-500" size={20}/> Facturas (Pedidos)</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                                    {clienteActualData.pedidos.length === 0 ? (
                                        <p className="text-center text-gray-400 text-xs font-bold uppercase py-10">El cliente no ha realizado pedidos aún.</p>
                                    ) : (
                                        clienteActualData.pedidos.slice().reverse().map(ped => {
                                            const yaEnCartera = clienteActualData.creditos.some(c => c.descripcion === `Factura Pedido #${ped.id}`);
                                            const yaEnFinanzas = transacciones.some(t => t.pedidoId === ped.id || t.descripcion === `Pago de Contado - Pedido #${ped.id}` || t.descripcion === `Venta - Orden #${ped.id}`);

                                            return (
                                                <div key={ped.id} className="bg-white p-5 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="bg-gray-100 text-black px-2 py-1 rounded-md text-[9px] font-black uppercase italic">ID #{ped.id}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(ped.fecha).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-600 mb-1"><span className="font-black text-gray-800">{ped.Detalles?.length || 0}</span> artículos comprados</p>
                                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-2 py-1 rounded-md mt-2">Logística: {ped.estado}</p>
                                                    </div>
                                                    <div className="flex flex-col items-start sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4">
                                                        <p className="font-black text-xl md:text-2xl italic tracking-tighter text-gray-900">${formatCurrency(ped.total)}</p>
                                                        
                                                        {yaEnCartera ? (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-1 mt-2"><CheckCircle2 size={12}/> Fiado (En Cartera)</span>
                                                        ) : yaEnFinanzas ? (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1 mt-2"><CheckCircle2 size={12}/> Pagado de Contado</span>
                                                        ) : (
                                                            <button onClick={() => { setPedidoACobrar(ped); setShowCobroModal(true); setClienteEstadoCuenta(null); }} className="mt-2 py-2 px-4 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap">
                                                                Liquidar Factura <ChevronRight size={12}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. MODAL: LIQUIDAR PEDIDO (CONTADO VS CREDITO) */}
            {showCobroModal && pedidoACobrar && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        <button onClick={() => {setShowCobroModal(false); setPedidoACobrar(null);}} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={16}/>
                        </button>
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={24} className="md:w-8 md:h-8"/>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-1 text-center">Liquidar Pedido</h3>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">Pedido #{pedidoACobrar.id} • ${formatCurrency(pedidoACobrar.total)}</p>
                        
                        <div className="space-y-3">
                            <button onClick={() => handleCobro('CONTADO')} disabled={enviando} className="w-full p-4 border-2 border-green-500 bg-green-50 hover:bg-green-500 hover:text-white text-green-700 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95">
                                {enviando ? <Loader2 className="animate-spin" size={16} /> : <DollarSign size={16} />} Pago de Contado
                            </button>
                            <button onClick={() => handleCobro('CREDITO')} disabled={enviando} className="w-full p-4 border-2 border-orange-500 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-700 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95">
                                {enviando ? <Loader2 className="animate-spin" size={16} /> : <Banknote size={16} />} Fiar (Mandar a Cartera)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. MODAL: CREAR CRÉDITO (FIAR MANUAL) */}
            {showCreditoModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        <button onClick={() => setShowCreditoModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={16}/>
                        </button>
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Banknote size={24} className="md:w-8 md:h-8"/>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-1 text-center">Fiar a Cliente</h3>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">Registrar deuda manual</p>
                        
                        <form onSubmit={handleCrearCredito} className="space-y-4 md:space-y-5 text-left">
                            <div>
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-1 block ml-2">Cliente Deudor</label>
                                <select required className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-black text-xs md:text-sm cursor-pointer" value={formCredito.usuarioId} onChange={e => setFormCredito({...formCredito, usuarioId: e.target.value})}>
                                    <option value="" disabled>Selecciona un cliente</option>
                                    {usuarios.map(u => (<option key={u.id} value={u.id}>{u.nombre} - CC: {u.cedula || 'N/A'}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-1 block ml-2">Monto a Fiar ($)</label>
                                <input required type="number" step="0.01" min="1" placeholder="Ej: 150000" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-black outline-none focus:ring-2 focus:ring-black text-sm" value={formCredito.monto_total} onChange={e => setFormCredito({...formCredito, monto_total: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-1 block ml-2">Concepto / Descripción</label>
                                <input required type="text" placeholder="Ej: Mercancía de Noviembre" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold outline-none focus:ring-2 focus:ring-black text-xs md:text-sm" value={formCredito.descripcion} onChange={e => setFormCredito({...formCredito, descripcion: e.target.value})} />
                            </div>
                            <button disabled={enviando} className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest bg-black text-white hover:bg-blue-600 transition-all flex justify-center items-center mt-2 shadow-lg disabled:opacity-50">
                                {enviando ? <Loader2 className="animate-spin" /> : 'Crear Crédito'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 7. MODAL: REGISTRAR ABONO (PAGO) */}
            {showAbonoModal && creditoSeleccionado && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        <button onClick={() => setShowAbonoModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={16}/>
                        </button>
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <DollarSign size={24} className="md:w-8 md:h-8"/>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-1 text-center">Recibir Abono</h3>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center line-clamp-1">{creditoSeleccionado.Usuario?.nombre}</p>
                        
                        <form onSubmit={handleRegistrarAbono} className="space-y-4 md:space-y-5 text-left">
                            <div className="flex items-center justify-between bg-red-50 p-3 rounded-xl border border-red-100">
                                <span className="text-[9px] md:text-[10px] font-black text-red-400 uppercase tracking-widest">Deuda Actual:</span>
                                <span className="text-sm md:text-base font-black italic text-red-600">${formatCurrency(creditoSeleccionado.saldo)}</span>
                            </div>
                            <div>
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-1 block ml-2">¿Cuánto pagó hoy?</label>
                                <input required type="number" step="0.01" min="1" max={creditoSeleccionado.saldo} placeholder={`Máximo $${creditoSeleccionado.saldo}`} className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-black outline-none focus:ring-2 focus:ring-green-500 text-sm text-green-700" value={formAbono.monto} onChange={e => setFormAbono({...formAbono, monto: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-1 block ml-2">Nota (Opcional)</label>
                                <input type="text" placeholder="Ej: Efectivo, Transferencia..." className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold outline-none focus:ring-2 focus:ring-green-500 text-xs md:text-sm" value={formAbono.nota} onChange={e => setFormAbono({...formAbono, nota: e.target.value})} />
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl md:rounded-2xl border border-green-100 flex justify-between items-center mt-2">
                                <div>
                                    <p className="text-[8px] md:text-[9px] font-black text-green-600 uppercase">Impacto Contable</p>
                                    <p className="text-[7px] md:text-[8px] font-bold text-green-500 uppercase">Se registrará como ingreso</p>
                                </div>
                                <p className="text-lg md:text-xl font-black text-green-600 italic">+${formatCurrency(formAbono.monto || 0)}</p>
                            </div>
                            <button disabled={enviando || parseFloat(formAbono.monto || 0) <= 0} className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest bg-green-600 text-white hover:bg-black transition-all flex justify-center items-center mt-2 shadow-lg disabled:opacity-50 active:scale-95">
                                {enviando ? <Loader2 className="animate-spin" /> : 'Confirmar Abono'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 8. MODALES TRANSACCIONES */}
            {(showGastoModal || showEditTransaccionModal) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
                        <button onClick={() => {setShowGastoModal(false); setShowEditTransaccionModal(false);}} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={18}/>
                        </button>
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6 ${formGasto.tipo === 'INGRESO' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                            {formGasto.tipo === 'INGRESO' ? <ArrowUpRight size={24} className="md:w-8 md:h-8"/> : <ArrowDownRight size={24} className="md:w-8 md:h-8"/>}
                        </div>
                        <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-1 md:mb-2">{transaccionSeleccionada ? 'Editar Movimiento' : 'Registrar Movimiento'}</h2>
                        <form onSubmit={handleGuardarTransaccion} className="space-y-3 md:space-y-4 text-left mt-4">
                            <div className="flex gap-2 mb-2 md:mb-4">
                                <button type="button" onClick={() => setFormGasto({...formGasto, tipo: 'INGRESO'})} className={`flex-1 py-2 md:py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase transition-all ${formGasto.tipo === 'INGRESO' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Ingreso</button>
                                <button type="button" onClick={() => setFormGasto({...formGasto, tipo: 'EGRESO'})} className={`flex-1 py-2 md:py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase transition-all ${formGasto.tipo === 'EGRESO' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Egreso</button>
                            </div>
                            <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-2">Monto ($)</label><input required type="number" step="0.01" min="0" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={formGasto.monto || ''} onChange={e => setFormGasto({...formGasto, monto: e.target.value})} /></div>
                            <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-2">Descripción</label><input required type="text" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={formGasto.descripcion || ''} onChange={e => setFormGasto({...formGasto, descripcion: e.target.value})} /></div>
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="flex-1">
                                    <label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-2">Categoría</label>
                                    <select className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm" value={formGasto.categoria || 'Logística'} onChange={e => setFormGasto({...formGasto, categoria: e.target.value})}>
                                        <option value="Ventas Productos">Ventas Productos</option><option value="Logística">Logística</option><option value="Mercancía">Compra Mercancía</option><option value="Servicios">Servicios</option><option value="Nómina">Nómina</option><option value="Otros">Otros</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-2">Fecha</label>
                                    <input type="date" required className="w-full bg-white p-3 md:p-4 rounded-xl md:rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm" value={formGasto.fecha || new Date().toISOString().split('T')[0]} onChange={e => setFormGasto({...formGasto, fecha: e.target.value})} />
                                </div>
                            </div>
                            <button disabled={enviando} className={`w-full text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all flex items-center justify-center mt-2 shadow-lg active:scale-95 ${formGasto.tipo === 'INGRESO' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                {enviando ? <Loader2 className="animate-spin" /> : 'Guardar Movimiento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteTransaccionModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-red-50 text-red-500 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8">
                            <AlertTriangle size={32} className="md:w-12 md:h-12"/>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2">¿Borrar Registro?</h3>
                        <p className="text-gray-400 text-[9px] md:text-[10px] font-bold mb-8 md:mb-10 uppercase tracking-[0.2em]">Se eliminará de la contabilidad.</p>
                        <div className="flex gap-3 md:gap-4">
                            <button onClick={() => setShowDeleteTransaccionModal(false)} className="flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] bg-gray-100 hover:bg-gray-200 transition-all">Cancelar</button>
                            <button onClick={handleEliminarTransaccion} className="flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] bg-red-600 text-white hover:bg-red-700 transition-all">Borrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 9. MODAL EDITAR USUARIO (CON LÍMITES) */}
            {showEditUsuarioModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowEditUsuarioModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white">
                            <X size={18}/>
                        </button>
                        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 border-b border-gray-100 pb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center"><User size={20} className="md:w-6 md:h-6"/></div>
                            <div><h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Editar Cliente</h2></div>
                        </div>
                        <form onSubmit={handleEditarUsuario} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                            <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 md:ml-2">Nombre Completo</label><input required type="text" className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm" value={formEditUsuario.nombre || ''} onChange={e => setFormEditUsuario({...formEditUsuario, nombre: e.target.value})} /></div>
                            <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 md:ml-2">Cédula</label><input required type="text" className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm" value={formEditUsuario.cedula || ''} onChange={e => setFormEditUsuario({...formEditUsuario, cedula: e.target.value})} /></div>
                            <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 md:ml-2">Correo (Opcional)</label><input type="email" className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm" value={formEditUsuario.email || ''} onChange={e => setFormEditUsuario({...formEditUsuario, email: e.target.value})} /></div>
                            <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 md:ml-2">Teléfono</label><input type="text" className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm" value={formEditUsuario.telefono || ''} onChange={e => setFormEditUsuario({...formEditUsuario, telefono: e.target.value})} /></div>
                            <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 md:ml-2">Ciudad</label><input type="text" className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm" value={formEditUsuario.ciudad || ''} onChange={e => setFormEditUsuario({...formEditUsuario, ciudad: e.target.value})} /></div>
                            <div><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 md:ml-2">Rol del Sistema</label>
                                <select className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm" value={formEditUsuario.rol || 'CLIENTE'} onChange={e => setFormEditUsuario({...formEditUsuario, rol: e.target.value})}>
                                    <option value="CLIENTE">CLIENTE REGULAR</option>
                                    <option value="ADMIN">ADMINISTRADOR</option>
                                    <option value="CAJERO">CAJERO POS</option>
                                </select>
                                {/* 🔥 SELECTOR DE SUCURSAL (Solo visible si es Cajero) 🔥 */}
                            {forms.formEditUsuario.rol === 'CAJERO' && (
                                <div className="mt-4">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2 block mb-1">Asignar a Sucursal</label>
                                    <select 
                                        value={forms.formEditUsuario.sucursalId || ''} 
                                        onChange={e => setters.setFormEditUsuario({...forms.formEditUsuario, sucursalId: e.target.value})} 
                                        className="w-full bg-blue-50 text-blue-700 p-4 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="">Bodega Central (Sin Sucursal)</option>
                                        {(data.sucursales || []).map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                                
                            </div>
                            
                            <div className="sm:col-span-2"><label className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mb-1 ml-1 md:ml-2">Dirección Exacta</label><textarea rows="2" className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none text-xs md:text-sm" value={formEditUsuario.direccion || ''} onChange={e => setFormEditUsuario({...formEditUsuario, direccion: e.target.value})} /></div>
                            
                            <div className="sm:col-span-2 mt-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100 grid grid-cols-2 gap-4">
                                <div className="col-span-2"><p className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2"><Banknote size={14}/> Configuración de Crédito</p></div>
                                <div><label className="text-[8px] font-black uppercase text-gray-500 mb-1 ml-1">Límite de Crédito ($)</label><input type="number" min="0" className="w-full bg-white border-none rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-orange-500 text-xs shadow-sm" placeholder="0 = Sin Crédito" value={formEditUsuario.limite_credito} onChange={e => setFormEditUsuario({...formEditUsuario, limite_credito: e.target.value})} /></div>
                                <div><label className="text-[8px] font-black uppercase text-gray-500 mb-1 ml-1">Días de Plazo para Pagar</label><input type="number" min="1" className="w-full bg-white border-none rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-orange-500 text-xs shadow-sm" value={formEditUsuario.dias_credito} onChange={e => setFormEditUsuario({...formEditUsuario, dias_credito: e.target.value})} /></div>
                            </div>

                            <button disabled={enviando} className="sm:col-span-2 bg-blue-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-black transition-all flex items-center justify-center mt-2 shadow-lg active:scale-95">
                                {enviando ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 10. MODAL CREAR USUARIO (CON LÍMITES) */}
            {showUsuarioModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowUsuarioModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white">
                            <X size={18}/>
                        </button>
                        <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-4 md:mb-6">Crear Cliente / Usuario</h2>
                        <form onSubmit={handleCrearUsuario} className="space-y-3 md:space-y-4">
                            <input required type="text" placeholder="Nombre completo" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none" value={formUsuario.nombre || ''} onChange={e => setFormUsuario({...formUsuario, nombre: e.target.value})} />
                            <input required type="text" placeholder="Número de Cédula" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none" value={formUsuario.cedula || ''} onChange={e => setFormUsuario({...formUsuario, cedula: e.target.value})} />
                            <input type="email" placeholder="Correo electrónico (Opcional)" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none" value={formUsuario.email || ''} onChange={e => setFormUsuario({...formUsuario, email: e.target.value})} />
                            <input required type="password" placeholder="Contraseña (mínimo 6 caracteres)" minLength="6" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none" value={formUsuario.password || ''} onChange={e => setFormUsuario({...formUsuario, password: e.target.value})} />
                            
                            <select className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:ring-2 focus:ring-black text-xs md:text-sm cursor-pointer" value={formUsuario.rol || 'CLIENTE'} onChange={e => setFormUsuario({...formUsuario, rol: e.target.value})}>
                                <option value="CLIENTE">CLIENTE REGULAR</option>
                                <option value="ADMIN">ADMINISTRADOR</option>
                                <option value="CAJERO">CAJERO POS</option>
                            </select>

                            {/* 🔥 SELECTOR DE SUCURSAL (Solo visible si es Cajero) 🔥 */}
                            {forms.formUsuario.rol === 'CAJERO' && (
                                <div className="mt-4">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2 block mb-1">Asignar a Sucursal</label>
                                    <select 
                                        value={forms.formUsuario.sucursalId || ''} 
                                        onChange={e => setters.setFormUsuario({...forms.formUsuario, sucursalId: e.target.value})} 
                                        className="w-full bg-blue-50 text-blue-700 p-4 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="">Bodega Central (Sin Sucursal)</option>
                                        {(data.sucursales || []).map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 md:gap-4"><input type="text" placeholder="Ciudad (Ej: Carepa)" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none" value={formUsuario.ciudad || ''} onChange={e => setFormUsuario({...formUsuario, ciudad: e.target.value})} /><input type="text" placeholder="Teléfono" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none" value={formUsuario.telefono || ''} onChange={e => setFormUsuario({...formUsuario, telefono: e.target.value})} /></div>
                            <input type="text" placeholder="Dirección Exacta" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none" value={formUsuario.direccion || ''} onChange={e => setFormUsuario({...formUsuario, direccion: e.target.value})} />
                            
                            <div className="mt-4 bg-orange-50 p-4 rounded-2xl border border-orange-100 grid grid-cols-2 gap-4">
                                <div className="col-span-2"><p className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2"><Banknote size={14}/> Crédito Inicial</p></div>
                                <div><label className="text-[8px] font-black uppercase text-gray-500 mb-1 ml-1">Límite ($)</label><input type="number" min="0" className="w-full bg-white border-none rounded-xl p-3 font-bold outline-none text-xs shadow-sm" placeholder="0 = Contado" value={formUsuario.limite_credito} onChange={e => setFormUsuario({...formUsuario, limite_credito: e.target.value})} /></div>
                                <div><label className="text-[8px] font-black uppercase text-gray-500 mb-1 ml-1">Plazo (Días)</label><input type="number" min="1" className="w-full bg-white border-none rounded-xl p-3 font-bold outline-none text-xs shadow-sm" value={formUsuario.dias_credito} onChange={e => setFormUsuario({...formUsuario, dias_credito: e.target.value})} /></div>
                            </div>

                            <button disabled={enviando} className="w-full mt-2 md:mt-4 bg-black text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-blue-600 transition-all flex items-center justify-center">
                                {enviando ? <Loader2 className="animate-spin" /> : 'Registrar Cliente'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 11. RESTO DE MODALES DE CONFIGURACIÓN Y ELIMINACIÓN */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative text-center">
                        <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white">
                            <X size={18}/>
                        </button>
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6"><Key size={24} className="md:w-8 md:h-8"/></div>
                        <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-1 md:mb-2">Restablecer Clave</h2>
                        <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-6">Para: {usuarioSeleccionado?.nombre}</p>
                        <form onSubmit={handleRestablecerPassword} className="space-y-3 md:space-y-4">
                            <input required type="text" placeholder="Nueva contraseña" minLength="6" className="w-full bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-center text-xs md:text-sm outline-none" value={nuevaPassword || ''} onChange={e => setNuevaPassword(e.target.value)} />
                            <button disabled={enviando} className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-black transition-all flex items-center justify-center">
                                {enviando ? <Loader2 className="animate-spin" /> : 'Forzar Cambio'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 12. Ajustes */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative flex flex-col md:flex-row gap-6 md:gap-8 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowConfigModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={18}/>
                        </button>
                        
                        <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8 text-center">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 text-green-500 rounded-xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6"><Settings size={24} className="md:w-8 md:h-8"/></div>
                            <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-1 md:mb-2">Ajustes Generales</h2>
                            <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-6">Soporte y Límite de Pedidos</p>
                            
                            <form onSubmit={handleGuardarConfig} className="space-y-4 md:space-y-5 text-left">
                                <div className="bg-gray-50 p-4 md:p-5 rounded-2xl border border-gray-100">
                                    <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Número de WhatsApp</label>
                                    <input required type="text" className="w-full bg-white p-3 rounded-xl font-bold text-xs md:text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm" value={whatsappTienda || ''} onChange={e => setWhatsappTienda(e.target.value)} />
                                </div>
                                <div className="bg-blue-50 p-4 md:p-5 rounded-2xl border border-blue-100">
                                    <label className="text-[8px] md:text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 block">Corte Diario de Rutas</label>
                                    <input required type="time" className="w-full bg-white p-3 rounded-xl font-black text-blue-900 text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-sm cursor-pointer" value={horaLimite} onChange={e => setHoraLimite(e.target.value)} />
                                </div>
                                <button disabled={enviando} className="w-full bg-black text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-green-500 transition-all shadow-lg active:scale-95">
                                    {enviando ? <Loader2 className="animate-spin mx-auto" /> : 'Guardar Ajustes'}
                                </button>
                            </form>
                        </div>

                        <div className="flex-1 md:pl-4 mt-2 md:mt-0">
                            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center"><Map size={20} className="md:w-6 md:h-6"/></div>
                                <div><h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Tabla de Rutas</h2><p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Asigna días a ciudades</p></div>
                            </div>
                            <form onSubmit={handleCrearRutaConfig} className="flex flex-col gap-2 mb-4 md:mb-6 bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100">
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Ciudades (Separadas por coma)</label>
                                <input required type="text" className="bg-white p-2.5 md:p-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" value={nuevaRutaCiudad} onChange={e => setNuevaRutaCiudad(e.target.value)} />
                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 md:mt-2">Día de Entrega</label>
                                <div className="flex gap-2">
                                    <select required className="flex-1 bg-white p-2.5 md:p-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm" value={nuevaRutaDia} onChange={e => setNuevaRutaDia(e.target.value)}>
                                        <option value="" disabled>Selecciona Día</option><option value="Lunes">Lunes</option><option value="Martes">Martes</option><option value="Miércoles">Miércoles</option><option value="Jueves">Jueves</option><option value="Viernes">Viernes</option><option value="Sábado">Sábado</option><option value="Domingo">Domingo</option>
                                    </select>
                                    <button disabled={enviando} className="bg-blue-600 text-white px-4 md:px-6 rounded-lg md:rounded-xl font-black uppercase text-[10px] md:text-xs hover:bg-blue-700 shadow-md">Añadir</button>
                                </div>
                            </form>
                            <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead><tr className="border-b border-gray-200"><th className="py-2 text-[8px] md:text-[9px] font-black text-gray-400 uppercase">Día</th><th className="py-2 text-[8px] md:text-[9px] font-black text-gray-400 uppercase">Ciudades</th><th></th></tr></thead>
                                    <tbody>
                                        {rutasDinamicas.map(r => (
                                            <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="py-2 md:py-3 text-[9px] md:text-[10px] font-black text-blue-600 uppercase">{r.dia_ruta}</td>
                                                <td className="py-2 md:py-3 text-[9px] md:text-[10px] font-bold text-gray-900 uppercase truncate max-w-[100px] md:max-w-[150px]">{r.ciudad}</td>
                                                <td className="py-2 md:py-3 text-right"><button onClick={() => handleEliminarRutaConfig(r.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 md:p-2 rounded-lg transition-colors"><Trash2 size={12}/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 13. Eliminar Usuario */}
            {usuarioAEliminar && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-red-50 text-red-500 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8"><AlertTriangle size={32} className="md:w-12 md:h-12" /></div>
                        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2">¿Eliminar Cliente?</h3>
                        <p className="text-gray-400 text-[9px] md:text-[10px] font-bold mb-8 md:mb-10 uppercase tracking-[0.2em]">Se borrará a "{usuarioAEliminar.nombre}" permanentemente.</p>
                        <div className="flex gap-3 md:gap-4">
                            <button onClick={() => setUsuarioAEliminar(null)} className="flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] bg-gray-100 hover:bg-gray-200 transition-all">Cancelar</button>
                            <button onClick={handleEliminarUsuario} className="flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] bg-red-600 text-white hover:bg-red-700 transition-all">Destruir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 14. Eliminar Producto */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-red-50 text-red-500 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8"><AlertTriangle size={32} className="md:w-12 md:h-12"/></div>
                        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2">Delete Asset?</h3>
                        <p className="text-gray-400 text-[9px] md:text-[10px] font-bold mb-8 md:mb-10 uppercase tracking-[0.2em]">Permanently remove "{productoAEliminar?.nombre}"</p>
                        <div className="flex gap-3 md:gap-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] bg-gray-100 hover:bg-gray-200 transition-all">Cancel</button>
                            <button onClick={handleEliminar} className="flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] bg-red-600 text-white hover:bg-red-700 transition-all">Destroy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 15. NUEVO MODAL: LISTADO DE CÓDIGOS DE BARRAS (CHEAT SHEET) 🔥 */}
            {showCheatSheetModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><ScanBarcode size={20}/></div>
                                <div>
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Listado de Códigos (POS)</h2>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Guía rápida para cajeros</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCheatSheetModal(false)} className="p-2 bg-gray-200 rounded-full hover:bg-black hover:text-white transition-all"><X size={16}/></button>
                        </div>
                        <div className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="p-4 text-[9px] uppercase font-black text-gray-400 tracking-widest border-b">Producto</th>
                                        <th className="p-4 text-[9px] uppercase font-black text-gray-400 tracking-widest border-b">Categoría</th>
                                        <th className="p-4 text-[9px] uppercase font-black text-gray-400 tracking-widest border-b">Códigos Asociados</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(Array.isArray(productos) ? productos : []).map(p => {
                                        const codigos = safeDecodeJSON(p.codigo_barras);
                                        if (Object.keys(codigos).length === 0) return null;
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-black text-xs uppercase text-gray-800">{p.nombre}</td>
                                                <td className="p-4 text-[10px] font-bold text-blue-600 uppercase">{p.Categoria?.nombre || 'Gral'}</td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(codigos).map(([code, qty]) => (
                                                            <span key={code} className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 text-[10px] font-mono font-black flex items-center gap-1">
                                                                <ScanBarcode size={10}/> {code} <span className="text-blue-400">({qty}u)</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {(Array.isArray(productos) ? productos : []).filter(p => Object.keys(safeDecodeJSON(p.codigo_barras)).length > 0).length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-10 text-center text-gray-400 font-bold uppercase text-[10px]">No hay códigos registrados en el sistema.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 16. NUEVO MODAL: SELECCIÓN DE TIPO DE IMPRESIÓN 🔥 */}
            {showPrintModal && facturaAImprimir && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] max-w-md w-full shadow-2xl relative text-center animate-in zoom-in-95 duration-300">
                        <button onClick={() => { setShowPrintModal(false); setFacturaAImprimir(null); }} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={16}/>
                        </button>
                        
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} />
                        </div>
                        
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-gray-900">Venta Exitosa</h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">¿Cómo deseas imprimir el recibo?</p>
                        
                        <div className="flex flex-col gap-4">
                            {/* BOTÓN PRINCIPAL (TIRILLA POS) */}
                            <button 
                                onClick={() => { imprimirTirillaPOS(facturaAImprimir); setShowPrintModal(false); setFacturaAImprimir(null); }}
                                className="w-full bg-blue-600 text-white p-5 rounded-2xl flex items-center justify-center gap-4 hover:bg-black transition-all shadow-lg active:scale-95"
                            >
                                <Printer size={24} />
                                <div className="text-left">
                                    <p className="font-black text-sm uppercase tracking-widest leading-none">Tirilla Térmica</p>
                                    <p className="text-[9px] text-blue-200 mt-1.5 uppercase font-bold">Impresora POS (80mm / 58mm)</p>
                                </div>
                            </button>

                            {/* BOTÓN SECUNDARIO (FACTURA A4) */}
                            <button 
                                onClick={() => { imprimirFacturaCliente(facturaAImprimir, rutasDinamicas, horaLimite); setShowPrintModal(false); setFacturaAImprimir(null); }}
                                className="w-full bg-gray-50 border-2 border-gray-200 text-gray-700 p-5 rounded-2xl flex items-center justify-center gap-4 hover:border-black hover:text-black transition-all active:scale-95"
                            >
                                <FileText size={24} />
                                <div className="text-left">
                                    <p className="font-black text-sm uppercase tracking-widest leading-none">Factura Normal</p>
                                    <p className="text-[9px] text-gray-400 mt-1.5 uppercase font-bold">Documento PDF (Tamaño Carta)</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: ARQUEO DE CAJA (CUADRE) --- */}
            {states.showArqueoModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => { setters.setShowArqueoModal(false); setEfectivoFisico(''); }} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={16}/>
                        </button>
                        
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Calculator size={32} />
                        </div>
                        
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1 text-center text-gray-900">Cuadre de Caja</h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8 text-center border-b border-gray-100 pb-4">Cierre de Turno Operativo</p>
                        
                        {(() => {
                            // 1. Cálculos Teóricos (Lo que dice el sistema)
                            const hoy = new Date();
                            const yyyy = hoy.getFullYear();
                            const mm = String(hoy.getMonth() + 1).padStart(2, '0');
                            const dd = String(hoy.getDate()).padStart(2, '0');
                            const todayStr = `${yyyy}-${mm}-${dd}`;

                            const txHoy = data.transacciones.filter(t => t.fecha && t.fecha.split('T')[0] === todayStr);

                            const efectivoTeorico = txHoy
                                .filter(t => (t.descripcion || '').toUpperCase().includes('EFECTIVO'))
                                .reduce((acc, t) => {
                                    const monto = parseFloat(t.monto || 0);
                                    if (t.tipo === 'EGRESO' || (t.descripcion || '').toUpperCase().includes('REEMBOLSO')) return acc - monto;
                                    return acc + monto;
                                }, 0);

                            const transferenciasTeorico = txHoy
                                .filter(t => (t.descripcion || '').toUpperCase().includes('TRANSFERENCIA'))
                                .reduce((acc, t) => {
                                    const monto = parseFloat(t.monto || 0);
                                    if (t.tipo === 'EGRESO' || (t.descripcion || '').toUpperCase().includes('REEMBOLSO')) return acc - monto;
                                    return acc + monto;
                                }, 0);
                            
                            // 2. Cálculos Físicos (Lo que dice el cajero)
                            const fisico = parseFloat(efectivoFisico || 0);
                            const diferencia = fisico - efectivoTeorico;
                            const hayDescuadre = diferencia !== 0;

                            const handleProcesarArqueo = (e) => {
                                e.preventDefault();
                                
                                // Aquí puedes inyectar a futuro la lógica para guardar el cierre en tu base de datos (Backend)
                                // Por ahora, generamos la tirilla térmica y cerramos.

                                const printWindow = window.open('', '_blank', 'width=400,height=600');
                                const html = `
                                    <!DOCTYPE html><html><head><meta charset="utf-8"><title>Cierre de Caja</title>
                                    <style>
                                        body{font-family:'Courier New', monospace; width:80mm; margin:0 auto; padding:10px; font-size:12px; color:#000;} 
                                        .header{text-align:center; border-bottom:1px dashed #000; padding-bottom:10px; margin-bottom:10px;} 
                                        .row{display:flex; justify-content:space-between; margin:4px 0;} 
                                        .bold{font-weight:bold;}
                                        .title{font-size:16px; font-weight:bold; margin:0 0 5px 0;}
                                        .divider{border-top:1px dashed #000; margin:8px 0;}
                                        .alert{background:#000; color:#fff; padding:2px 4px; border-radius:2px;}
                                    </style>
                                    </head><body>
                                    <div class="header">
                                        <p class="title">REPORTE DE ARQUEO</p>
                                        <p>CIERRE DE TURNO POS</p>
                                        <p>${new Date().toLocaleString('es-CO')}</p>
                                    </div>
                                    
                                    <p class="bold" style="text-align:center;">--- VENTAS DEL SISTEMA ---</p>
                                    <div class="row"><span>Ventas Efectivo:</span><span>$${efectivoTeorico.toLocaleString('es-CO')}</span></div>
                                    <div class="row"><span>Transferencias:</span><span>$${transferenciasTeorico.toLocaleString('es-CO')}</span></div>
                                    <div class="divider"></div>
                                    <div class="row bold"><span>TOTAL SISTEMA:</span><span>$${(efectivoTeorico + transferenciasTeorico).toLocaleString('es-CO')}</span></div>
                                    
                                    <div class="divider" style="margin-top:15px;"></div>
                                    <p class="bold" style="text-align:center;">--- RESULTADO ARQUEO ---</p>
                                    <div class="row"><span>Efectivo Esperado:</span><span>$${efectivoTeorico.toLocaleString('es-CO')}</span></div>
                                    <div class="row"><span>Efectivo Contado:</span><span>$${fisico.toLocaleString('es-CO')}</span></div>
                                    <div class="divider"></div>
                                    
                                    <div class="row bold" style="font-size:14px; margin-top:10px;">
                                        <span>DIFERENCIA:</span>
                                        <span class="${diferencia < 0 ? 'alert' : ''}">${diferencia > 0 ? '+' : ''}$${diferencia.toLocaleString('es-CO')}</span>
                                    </div>
                                    <p style="text-align:center; font-size:10px; margin-top:5px;">
                                        (${diferencia === 0 ? 'CUADRE PERFECTO' : diferencia > 0 ? 'SOBRANTE EN CAJA' : 'FALTANTE EN CAJA'})
                                    </p>
                                    
                                    <div style="text-align:center; margin-top:30px; padding-top:20px; border-top:1px solid #000;">
                                        Firma del Cajero
                                    </div>
                                    <div style="text-align:center; margin-top:20px;">
                                        ========================<br>FIN DE REPORTE<br>========================
                                    </div>
                                    <script>window.onload=function(){setTimeout(()=>{window.print();window.close();},300);}</script></body></html>
                                `;
                                printWindow.document.write(html);
                                printWindow.document.close();
                                
                                setters.setShowArqueoModal(false);
                                setEfectivoFisico('');
                            };

                            return (
                                <form onSubmit={handleProcesarArqueo} className="space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Efectivo Esperado (Sistema)</p>
                                            <p className="text-xs font-bold text-gray-500 mt-0.5">Dinero que debería haber</p>
                                        </div>
                                        <p className="font-black text-xl italic">${formatCurrency(efectivoTeorico)}</p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2 block flex items-center gap-1">
                                            ¿Cuánto efectivo físico contaste?
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                            <input 
                                                required 
                                                autoFocus
                                                type="number" 
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-white border-2 border-blue-100 rounded-2xl py-4 pl-8 pr-4 font-black text-xl text-blue-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-300" 
                                                placeholder="Ej: 150000"
                                                value={efectivoFisico} 
                                                onChange={e => setEfectivoFisico(e.target.value)} 
                                            />
                                        </div>
                                    </div>

                                    {/* Panel de Diferencia Dinámico */}
                                    {efectivoFisico !== '' && (
                                        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${diferencia === 0 ? 'bg-green-50 border-green-200 text-green-700' : diferencia > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                            <div className="mt-1">
                                                {diferencia === 0 ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest">
                                                    {diferencia === 0 ? 'Cuadre Perfecto' : diferencia > 0 ? 'Sobrante en Caja' : 'Faltante en Caja'}
                                                </p>
                                                <p className="font-black text-lg italic mt-0.5">
                                                    {diferencia > 0 ? '+' : ''}${formatCurrency(diferencia)}
                                                </p>
                                                {hayDescuadre && <p className="text-[9px] font-bold mt-1 opacity-80">La diferencia quedará registrada en el reporte final para auditoría.</p>}
                                            </div>
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={efectivoFisico === ''}
                                        className="w-full bg-black text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Printer size={16}/> Confirmar Arqueo e Imprimir
                                    </button>
                                </form>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* --- MODAL: PROCESAR DEVOLUCIÓN --- */}
            {showDevolucionModal && itemDevolucion && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[600] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                        
                        <button onClick={() => setShowDevolucionModal(false)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all">
                            <X size={16}/>
                        </button>

                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <ArrowLeftRight size={32} />
                        </div>

                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1 text-center">Reembolso</h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 text-center border-b border-gray-100 pb-4 line-clamp-2">
                            {itemDevolucion.Producto?.nombre || itemDevolucion.nombre}
                        </p>

                        <form onSubmit={procesarDevolucionAPI} className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <label className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2 block">
                                    ¿Cuántas unidades regresó?
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        min="1"
                                        max={itemDevolucion.cantidad}
                                        value={cantidadDevolucion}
                                        onChange={(e) => setCantidadDevolucion(e.target.value)}
                                        autoFocus
                                        className="w-full bg-white border-2 border-red-100 rounded-xl py-3 px-4 font-black text-xl text-red-600 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-center"
                                    />
                                    <div className="flex flex-col text-left shrink-0">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Máximo:</span>
                                        <span className="text-sm font-black text-gray-700">{itemDevolucion.cantidad} Uds</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={enviando || cantidadDevolucion < 1 || cantidadDevolucion > itemDevolucion.cantidad}
                                className="w-full bg-black text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 transition-all shadow-xl disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {enviando ? <Loader2 className="animate-spin" size={16}/> : 'Confirmar Devolución'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminModals;