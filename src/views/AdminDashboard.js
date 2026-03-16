import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { io } from "socket.io-client";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
    Plus, Package, ShoppingCart, Search, 
    AlertTriangle, Loader2, FileSpreadsheet, Eye, Truck,
    CalendarDays, Activity, DollarSign, Clock, Users, Settings,
    ArrowUpRight, ArrowDownRight, Wallet, Filter, Map, Banknote, FileText,
    Receipt, Award, Edit, Trash2, PackageMinus, Key, CheckCircle2, ChevronRight, Briefcase, History
} from 'lucide-react';
import GestionCategorias from '../components/admin/GestionCategorias';
import AdminModals from '../components/admin/AdminModals';
import { formatCurrency, formatearImagen, calcularFechaReal } from '../utils/adminUtils';

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
const RUTAS_BASE = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo", "A CONVENIR"];

const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm group hover:border-black transition-all duration-300">
        <div className={`w-12 h-12 md:w-14 md:h-14 ${color} rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm group-hover:-rotate-12 transition-transform duration-500`}>{React.cloneElement(icon, { size: 24 })}</div>
        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1">{title}</p>
        <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter italic mb-1 md:mb-2 truncate">{value}</h3>
        {subtitle && <p className="text-[10px] md:text-xs font-bold text-gray-500">{subtitle}</p>}
    </div>
);

const AdminDashboard = () => {
    // --- ESTADOS GLOBALES ---
    const [productos, setProductos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [rutasDinamicas, setRutasDinamicas] = useState([]); 
    const [creditos, setCreditos] = useState([]); 
    const [transacciones, setTransacciones] = useState([]);
    const [finanzas, setFinanzas] = useState({ ingresos: 0, egresos: 0, balance: 0, valorInventario: 0 });
    const [whatsappTienda, setWhatsappTienda] = useState('');
    const [horaLimite, setHoraLimite] = useState('20:00'); 
    
    const [tab, setTab] = useState('reportes'); 
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [filtroStockBajo, setFiltroStockBajo] = useState(false);
    const [filtroFechaPedidos, setFiltroFechaPedidos] = useState(''); 
    const [searchTermCartera, setSearchTermCartera] = useState(''); 
    const [filtroEstadoCartera, setFiltroEstadoCartera] = useState('TODOS'); 
    const [mesFiltroContable, setMesFiltroContable] = useState('Todos');

    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBajaModal, setShowBajaModal] = useState(false);
    const [pedidoDetalle, setPedidoDetalle] = useState(null);
    const [showUsuarioModal, setShowUsuarioModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showEditUsuarioModal, setShowEditUsuarioModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showGastoModal, setShowGastoModal] = useState(false);
    const [showEditTransaccionModal, setShowEditTransaccionModal] = useState(false);
    const [showDeleteTransaccionModal, setShowDeleteTransaccionModal] = useState(false);
    const [showCreditoModal, setShowCreditoModal] = useState(false);
    const [showAbonoModal, setShowAbonoModal] = useState(false);
    const [showCobroModal, setShowCobroModal] = useState(false);
    
    const [transaccionSeleccionada, setTransaccionSeleccionada] = useState(null);
    const [productoEditando, setProductoEditando] = useState(null);
    const [productoAEliminar, setProductoAEliminar] = useState(null);
    const [productoBaja, setProductoBaja] = useState(null);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
    const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
    const [clienteEstadoCuenta, setClienteEstadoCuenta] = useState(null);
    const [pedidoACobrar, setPedidoACobrar] = useState(null);
    const [imagenArchivo, setImagenArchivo] = useState(null);
    const [preview, setPreview] = useState(null);
    const [precioCalculado, setPrecioCalculado] = useState(0);

    const [nuevaRutaPersonalizada, setNuevaRutaPersonalizada] = useState('');
    const [nuevaRutaCiudad, setNuevaRutaCiudad] = useState('');
    const [nuevaRutaDia, setNuevaRutaDia] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [formulario, setFormulario] = useState({ nombre: '', precio: '', stock: '', stock_adicional: '', precio_nuevo_lote: '', categoriaId: '', descripcion: '', proveedor: '', costo_compra: '', margen_ganancia: '', tope_stock: 10 });
    const [formUsuario, setFormUsuario] = useState({ nombre: '', cedula: '', email: '', password: '', telefono: '', ciudad: '', direccion: '', rol: 'CLIENTE', limite_credito: 0, dias_credito: 30 });
    const [formEditUsuario, setFormEditUsuario] = useState({ id: '', nombre: '', cedula: '', email: '', telefono: '', ciudad: '', direccion: '', rol: 'CLIENTE', limite_credito: 0, dias_credito: 30 });
    const [formGasto, setFormGasto] = useState({ monto: '', descripcion: '', categoria: 'Logística', tipo: 'EGRESO', fecha: '' });
    const [formBaja, setFormBaja] = useState({ cantidad: 1, motivo: 'Dañado/Roto' });
    const [formCredito, setFormCredito] = useState({ usuarioId: '', monto_total: '', descripcion: '' });
    const [formAbono, setFormAbono] = useState({ monto: '', nota: '' });

    const diasUnicosDropdown = [...new Set([...RUTAS_BASE, ...rutasDinamicas.map(r => r.dia_ruta)])];

    const fetchDatos = useCallback(async () => {
        try {
            const [resProd, resPed, resCat, resUsers, resWa, resFinanzas, resTransacciones, resRutas, resHora, resCreditos] = await Promise.all([
                API.get('/productos'), API.get('/pedidos/admin/todos'), API.get('/categorias'),
                API.get('/auth/admin/usuarios'), API.get('/auth/config/whatsapp'),
                API.get('/contabilidad/resumen'), API.get('/contabilidad/transacciones'),
                API.get('/pedidos/config/rutas').catch(() => ({ data: [] })),
                API.get('/pedidos/config/horalimite').catch(() => ({ data: { hora: '20:00' } })),
                API.get('/creditos').catch(() => ({ data: [] })) 
            ]);
            setProductos(resProd.data || []); setPedidos(resPed.data || []); setCategorias(resCat.data || []);
            setUsuarios(resUsers.data || []); setWhatsappTienda(resWa.data.whatsapp || ''); 
            setFinanzas(resFinanzas.data); setTransacciones(resTransacciones.data); setRutasDinamicas(resRutas.data || []);
            setHoraLimite(resHora.data.hora || '20:00');
            setCreditos(resCreditos.data || []); 
        } catch (err) { toast.error("Error de sincronización"); } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchDatos();
        const socket = io(SOCKET_URL);
        socket.on("nuevo_pedido_admin", (data) => {
            const audio = new Audio('/alert-notification.mp3'); audio.play().catch(() => {});
            toast(`📦 Nuevo Pedido de ${data.cliente || 'Cliente'}`, { icon: '🚀', style: { borderRadius: '20px', background: '#000', color: '#fff', fontSize: '10px' } });
            fetchDatos();
        });
        socket.on('stockActualizado', (data) => { setProductos(prev => prev.map(p => p.id === parseInt(data.id) ? { ...p, stock: data.nuevoStock } : p)); });
        return () => { if(socket) socket.disconnect(); };
    }, [fetchDatos]);

    useEffect(() => {
        const costoBase = parseFloat(formulario.costo_compra) || 0; const margen = parseFloat(formulario.margen_ganancia) || 0;
        if (!productoEditando) { setPrecioCalculado(costoBase + (costoBase * (margen / 100)) || 0); } else {
            const stockViejo = parseInt(formulario.stock) || 0; const stockNuevo = parseInt(formulario.stock_adicional) || 0; const costoNuevoLote = parseFloat(formulario.costo_nuevo_lote) || 0;
            if (stockNuevo > 0) { const stockTotal = stockViejo + stockNuevo; const costoPromedio = ((stockViejo * costoBase) + (stockNuevo * costoNuevoLote)) / stockTotal; setPrecioCalculado(costoPromedio + (costoPromedio * (margen / 100)) || 0); } 
            else { setPrecioCalculado(costoBase + (costoBase * (margen / 100)) || parseFloat(formulario.precio) || 0); }
        }
    }, [formulario.costo_compra, formulario.margen_ganancia, formulario.stock_adicional, formulario.costo_nuevo_lote, formulario.stock, formulario.precio, productoEditando]);

    // --- MEMOS ---
    const kpis = useMemo(() => {
        const hoy = new Date(); let ventasHoy = 0, ventasMes = 0, pendientes = 0;
        pedidos.forEach(p => {
            if (p.estado !== 'Cancelado') {
                const fecha = new Date(p.fecha); const monto = parseFloat(p.total || 0);
                if (fecha.toDateString() === hoy.toDateString()) ventasHoy += monto;
                if (fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()) ventasMes += monto;
            }
            if (p.estado === 'Pendiente') pendientes++;
        });
        return { ventasHoy, ventasMes, pendientes };
    }, [pedidos]);

    const statsProductos = useMemo(() => {
        return { total: productos.length, stockBajo: productos.filter(p => parseInt(p.stock) <= (parseInt(p.tope_stock) || 10)).length };
    }, [productos]);

    const dataVentasMensuales = useMemo(() => {
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]; const data = meses.map(m => ({ name: m, Ventas: 0 }));
        pedidos.filter(p => p.estado !== 'Cancelado').forEach(ped => { const fecha = new Date(ped.fecha); const mesIndex = fecha.getMonth(); if(!isNaN(mesIndex)) data[mesIndex].Ventas += parseFloat(ped.total || 0); });
        return data.slice(0, new Date().getMonth() + 1);
    }, [pedidos]);

    const dataTopProductos = useMemo(() => {
        const conteo = {};
        pedidos.filter(p => p.estado !== 'Cancelado').forEach(ped => { (ped.Detalles || ped.items || []).forEach(item => { const nombre = item.Producto?.nombre || item.nombre || 'Item'; conteo[nombre] = (conteo[nombre] || 0) + item.cantidad; }); });
        return Object.keys(conteo).map(key => ({ name: key, Vendidos: conteo[key] })).sort((a, b) => b.Vendidos - a.Vendidos).slice(0, 5);
    }, [pedidos]);

    const dataAgendaEntregas = useMemo(() => {
        const agenda = {};
        pedidos.filter(p => p.estado === 'Pendiente').forEach(ped => {
            const info = calcularFechaReal(ped.ruta, ped.Usuario?.ciudad, ped.direccion, rutasDinamicas, ped.fecha, horaLimite);
            const clave = info.fechaFormateada;
            if (!agenda[clave]) { agenda[clave] = { dia: info.diaNombre, fecha: info.fechaFormateada, cantidad: 0, total: 0, pedidos: [] }; }
            agenda[clave].cantidad += 1; agenda[clave].total += parseFloat(ped.total || 0); agenda[clave].pedidos.push(ped);
        });
        return Object.values(agenda).sort((a, b) => b.cantidad - a.cantidad);
    }, [pedidos, rutasDinamicas, horaLimite]);

    const dataGraficoRutas = useMemo(() => {
        const conteo = {};
        pedidos.forEach(ped => { 
            const info = calcularFechaReal(ped.ruta, ped.Usuario?.ciudad, ped.direccion, rutasDinamicas, ped.fecha, horaLimite);
            const ruta = info.diaNombre.toUpperCase(); 
            if(!conteo[ruta]) conteo[ruta] = 0; conteo[ruta]++; 
        });
        return Object.keys(conteo).map(key => ({ name: key, pedidos: conteo[key] })).filter(i => i.pedidos > 0);
    }, [pedidos, rutasDinamicas, horaLimite]);

    const dataMejoresClientes = useMemo(() => {
        const conteo = {};
        pedidos.filter(p => p.estado !== 'Cancelado').forEach(ped => {
            const cliente = ped.Usuario?.nombre || 'Consumidor Final';
            if (!conteo[cliente]) conteo[cliente] = { pedidos: 0, totalGastado: 0 };
            conteo[cliente].pedidos += 1; conteo[cliente].totalGastado += parseFloat(ped.total || 0);
        });
        return Object.keys(conteo).map(nombre => ({ nombre, ...conteo[nombre] })).sort((a, b) => b.totalGastado - a.totalGastado).slice(0, 5);
    }, [pedidos]);

    const transaccionesFiltradas = useMemo(() => {
        if (mesFiltroContable === 'Todos') return transacciones;
        return transacciones.filter(tx => { const fechaTx = new Date(tx.fecha); return `${fechaTx.getFullYear()}-${String(fechaTx.getMonth() + 1).padStart(2, '0')}` === mesFiltroContable; });
    }, [transacciones, mesFiltroContable]);

    const finanzasFiltradas = useMemo(() => {
        let ingresos = 0, egresos = 0;
        transaccionesFiltradas.forEach(tx => { if (tx.tipo === 'INGRESO') ingresos += parseFloat(tx.monto); if (tx.tipo === 'EGRESO') egresos += parseFloat(tx.monto); });
        return { ingresos, egresos, balance: ingresos - egresos, valorInventario: finanzas.valorInventario };
    }, [transaccionesFiltradas, finanzas.valorInventario]);

    const opcionesMeses = useMemo(() => {
        const meses = new Set();
        transacciones.forEach(tx => { const d = new Date(tx.fecha); meses.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); });
        return Array.from(meses).sort((a,b) => b.localeCompare(a));
    }, [transacciones]);

    const pedidosFiltradosVisual = useMemo(() => {
        if (!filtroFechaPedidos) return pedidos;
        const [year, month, day] = filtroFechaPedidos.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);
        targetDate.setHours(0, 0, 0, 0); 
        return pedidos.filter(ped => {
            const infoRuta = calcularFechaReal(ped.ruta, ped.Usuario?.ciudad, ped.direccion, rutasDinamicas, ped.fecha, horaLimite);
            return infoRuta.fechaRaw && infoRuta.fechaRaw.getTime() === targetDate.getTime();
        });
    }, [pedidos, rutasDinamicas, horaLimite, filtroFechaPedidos]);

    const clientesCartera = useMemo(() => {
        const mapa = {};
        usuarios.forEach(u => { 
            mapa[u.id] = { 
                ...u, creditos: [], pedidos: [], 
                totalDeuda: 0, totalFiado: 0,
                facturasPendientes: 0, tieneMora: false,
                limite_credito: parseFloat(u.limite_credito) || 0,
                dias_credito: parseInt(u.dias_credito) || 30
            }; 
        });

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

        creditos.forEach(c => {
            const uid = parseInt(c.usuarioId || c.usuario_id || c.Usuario?.id);
            if (mapa[uid]) {
                mapa[uid].creditos.push(c);
                if (c.estado === 'VIGENTE') {
                    mapa[uid].totalDeuda += parseFloat(c.saldo);
                    mapa[uid].facturasPendientes += 1;
                    if (c.fecha_vencimiento) {
                        const vencimiento = new Date(c.fecha_vencimiento);
                        vencimiento.setHours(0, 0, 0, 0);
                        if (hoy > vencimiento) mapa[uid].tieneMora = true;
                    }
                }
                mapa[uid].totalFiado += parseFloat(c.monto_total);
            }
        });
        
        pedidos.forEach(p => { 
            const uid = parseInt(p.usuarioId || p.usuario_id);
            if (mapa[uid]) mapa[uid].pedidos.push(p); 
        });
        
        return Object.values(mapa).filter(c => c.creditos.length > 0 || c.pedidos.length > 0)
            .filter(c => {
                if(!searchTermCartera) return true;
                const termino = searchTermCartera.toLowerCase();
                return (c.nombre || '').toLowerCase().includes(termino) || (c.cedula || '').includes(termino);
            }).filter(c => {
                if(filtroEstadoCartera === 'TODOS') return true;
                if(filtroEstadoCartera === 'VIGENTE') return c.totalDeuda > 0 && !c.tieneMora;
                if(filtroEstadoCartera === 'MORA') return c.tieneMora;
                if(filtroEstadoCartera === 'PAGADO') return c.totalDeuda === 0 && c.creditos.length > 0;
                return true;
            }).sort((a, b) => {
                if (a.tieneMora && !b.tieneMora) return -1;
                if (!a.tieneMora && b.tieneMora) return 1;
                return b.totalDeuda - a.totalDeuda;
            });
    }, [usuarios, creditos, pedidos, searchTermCartera, filtroEstadoCartera]);

    const statsCartera = useMemo(() => {
        let porCobrar = 0, fiadoTotal = 0;
        creditos.forEach(c => { if(c.estado === 'VIGENTE') porCobrar += parseFloat(c.saldo); fiadoTotal += parseFloat(c.monto_total); });
        return { porCobrar, fiadoTotal };
    }, [creditos]);

    const clienteActualData = useMemo(() => {
        if(!clienteEstadoCuenta) return null;
        return clientesCartera.find(c => c.id === clienteEstadoCuenta.id);
    }, [clienteEstadoCuenta, clientesCartera]);

    const productosFiltrados = useMemo(() => {
        if (!Array.isArray(productos)) return [];
        return productos.filter(p => {
            const coincideNombre = (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
            const catId = p.categoriaId || p.categoria_id; const coincideCat = filtroCategoria === 'todas' || catId?.toString() === filtroCategoria;
            const tope = p.tope_stock || 10; const coincideStock = filtroStockBajo ? parseInt(p.stock) <= tope : true;
            return coincideNombre && coincideCat && coincideStock;
        });
    }, [productos, searchTerm, filtroCategoria, filtroStockBajo]);

    // --- HANDLERS ---
    const exportarManifiestoCarga = async () => {
        const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente');
        if (pedidosPendientes.length === 0) return toast.error("No hay pedidos pendientes en bodega.");
        const pedidosConInfoFecha = pedidosPendientes.map(p => ({
            ...p, infoCalculada: calcularFechaReal(p.ruta, p.Usuario?.ciudad, p.direccion, rutasDinamicas, p.fecha, horaLimite)
        }));
        const pedidosConRutaProgramada = pedidosConInfoFecha.filter(p => p.infoCalculada.diaNombre !== "A CONVENIR");
        if (pedidosConRutaProgramada.length === 0) return toast.error("Solo hay pedidos 'A CONVENIR'. Asígnales un día primero.");
        pedidosConRutaProgramada.sort((a, b) => a.infoCalculada.fechaRaw - b.infoCalculada.fechaRaw);
        const fechaProximaStr = pedidosConRutaProgramada[0].infoCalculada.fechaFormateada;
        const pedidosParaExportar = pedidosConRutaProgramada.filter(p => p.infoCalculada.fechaFormateada === fechaProximaStr);
        const loadId = toast.loading(`Empaquetando ruta de ${fechaProximaStr}...`);
        const datosExcel = [];
        try {
            for (const ped of pedidosParaExportar) {
                const info = ped.infoCalculada; const items = ped.Detalles || [];
                for (const item of items) {
                    datosExcel.push({
                        "DÍA ASIGNADO": info.diaNombre.toUpperCase(), "FECHA EXACTA": info.fechaFormateada, "CLIENTE": ped.Usuario?.nombre || 'Consumidor Final',
                        "CIUDAD DESTINO": ped.Usuario?.ciudad || 'N/A', "DIRECCIÓN EXACTA": ped.direccion || ped.Usuario?.direccion || 'N/A',
                        "TELÉFONO": ped.Usuario?.telefono || 'N/A', "PEDIDO ID": `#${ped.id}`, "PRODUCTO": (item.Producto?.nombre || 'Producto sin nombre').toUpperCase(),
                        "DESCRIPCIÓN": item.Producto?.descripcion || 'Sin descripción', "CANTIDAD": item.cantidad
                    });
                }
                await API.put(`/pedidos/${ped.id}/estado`, { estado: 'Enviado' });
            }
            const ws = XLSX.utils.json_to_sheet(datosExcel); const wb = XLSX.utils.book_new(); 
            XLSX.utils.book_append_sheet(wb, ws, "Manifiesto_Ruta"); XLSX.writeFile(wb, `RUTA_TRABAJO_${fechaProximaStr.replace(/[, ]+/g, '_').toUpperCase()}.xlsx`);
            fetchDatos(); toast.success(`Ruta generada para el ${fechaProximaStr}`, { id: loadId });
        } catch (err) { toast.error("Error procesando ruta", { id: loadId }); }
    };

    const exportarExcelInventario = () => {
        const dataParaExportar = productosFiltrados.map(p => ({ ID: p.id, Nombre: p.nombre, Categoria: p.Categoria?.nombre || 'N/A', Costo_Compra: p.costo_compra, Margen: p.margen_ganancia, Precio_Final: p.precio, Stock: p.stock, Tope_Minimo: p.tope_stock || 10, Proveedor: p.proveedor || 'No especificado' }));
        const ws = XLSX.utils.json_to_sheet(dataParaExportar); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Inventario"); XLSX.writeFile(wb, filtroStockBajo ? `Reporte_Inventario_Stock_Bajo.xlsx` : `Reporte_Inventario.xlsx`);
    };

    const cerrarModal = () => { setShowModal(false); setProductoEditando(null); setImagenArchivo(null); setPreview(null); setFormulario({ nombre: '', precio: '', stock: '', stock_adicional: '', precio_nuevo_lote: '', categoriaId: '', descripcion: '', proveedor: '', costo_compra: '', margen_ganancia: '', tope_stock: 10 }); setPrecioCalculado(0); };
    const handleImagenChange = (e) => { const file = e.target.files[0]; if (file) { setImagenArchivo(file); setPreview(URL.createObjectURL(file)); } };
    const abrirModalEditar = (p) => { setProductoEditando(p); setFormulario({ nombre: p.nombre || '', precio: p.precio || '', stock: p.stock || 0, stock_adicional: '', precio_nuevo_lote: p.costo_compra || 0, categoriaId: p.categoriaId || p.categoria_id || '', descripcion: p.descripcion || '', proveedor: p.proveedor || '', costo_compra: p.costo_compra || 0, margen_ganancia: p.margen_ganancia || 0, tope_stock: p.tope_stock || 10 }); setPreview(formatearImagen(p.imagen_url)); setShowModal(true); };
    const abrirModalBaja = (p) => { setProductoBaja(p); setFormBaja({ cantidad: 1, motivo: 'Dañado/Roto' }); setShowBajaModal(true); };

    const handleGuardarProducto = async (e) => {
        e.preventDefault(); setEnviando(true); const data = new FormData();
        const stockExistente = parseInt(formulario.stock || 0); const stockNuevo = parseInt(formulario.stock_adicional || 0); const stockFinal = productoEditando ? (stockExistente + stockNuevo) : parseInt(formulario.stock || 0);
        let costoFinalBD = parseFloat(formulario.costo_compra || 0);
        if (productoEditando && stockNuevo > 0) { const costoNuevoLote = parseFloat(formulario.costo_nuevo_lote || 0); costoFinalBD = ((stockExistente * costoFinalBD) + (stockNuevo * costoNuevoLote)) / stockFinal; }
        data.append('nombre', formulario.nombre); data.append('precio', precioCalculado.toFixed(2)); data.append('stock', stockFinal); data.append('categoriaId', formulario.categoriaId); data.append('descripcion', formulario.descripcion); data.append('proveedor', formulario.proveedor || 'No especificado'); data.append('costo_compra', costoFinalBD.toFixed(2)); data.append('margen_ganancia', parseFloat(formulario.margen_ganancia || 0)); data.append('tope_stock', parseInt(formulario.tope_stock || 10)); if (imagenArchivo) data.append('imagen', imagenArchivo);
        try { if (productoEditando) { await API.put(`/productos/${productoEditando.id}`, data); } else { await API.post('/productos', data); } cerrarModal(); fetchDatos(); toast.success("Producto Guardado en Inventario"); } catch (err) { toast.error("Error al guardar"); } finally { setEnviando(false); }
    };

    const handleGuardarBaja = async (e) => {
        e.preventDefault(); setEnviando(true);
        try {
            await API.put(`/productos/${productoBaja.id}/stock`, { cantidad: formBaja.cantidad, operacion: 'restar' });
            const costoPerdida = parseFloat(productoBaja.costo_compra || 0) * parseInt(formBaja.cantidad);
            if (costoPerdida > 0) { await API.post('/contabilidad/gasto', { monto: costoPerdida, descripcion: `Baja de inventario (${formBaja.motivo}): ${formBaja.cantidad}x ${productoBaja.nombre}`, categoria: 'Mercancía', tipo: 'EGRESO', fecha: new Date().toISOString().split('T')[0] }); }
            toast.success("Producto dado de baja. Pérdida registrada en contabilidad."); setShowBajaModal(false); setProductoBaja(null); fetchDatos();
        } catch (err) { toast.error(err.response?.data?.error || "Error al procesar la baja del producto."); } finally { setEnviando(false); }
    };

    const handleEliminar = async () => { try { await API.delete(`/productos/${productoAEliminar.id}`); setShowDeleteModal(false); fetchDatos(); toast.success("Producto Eliminado"); } catch (err) { toast.error("Error"); } };
    const actualizarEstadoPedido = async (id, nuevoEstado) => { try { await API.put(`/pedidos/${id}/estado`, { estado: nuevoEstado }); fetchDatos(); toast.success("Estado Actualizado"); } catch (err) { toast.error("Error"); } };
    const actualizarRutaPedido = async (id, nuevaRuta) => { try { await API.put(`/pedidos/${id}/ruta`, { ruta: nuevaRuta }); fetchDatos(); toast.success(`Ruta actualizada a ${nuevaRuta}`); } catch (err) { toast.error("Error al actualizar la ruta"); } };
    
    const handleDevolucionProducto = async (pedidoId, item) => {
        const qtyStr = window.prompt(`Reembolso / Devolución:\n\n¿Cuántas unidades de "${item.Producto?.nombre || item.nombre}" regresó el cliente?\n(Máximo disponible: ${item.cantidad})`, "1");
        if (qtyStr === null) return; const qty = parseInt(qtyStr);
        if (isNaN(qty) || qty <= 0 || qty > item.cantidad) return toast.error("Cantidad inválida ingresada.");
        try {
            setEnviando(true); await API.put(`/pedidos/${pedidoId}/devolucion`, { productoId: item.productoId || item.Producto?.id || item.producto_id, cantidadDevuelta: qty, precioUnitario: item.precioUnitario || item.precio });
            toast.success("Devolución y Reembolso procesado con éxito"); setPedidoDetalle(null); fetchDatos();
        } catch (err) { toast.error(err.response?.data?.error || "Error al procesar la devolución."); } finally { setEnviando(false); }
    };

    const handleCrearUsuario = async (e) => { e.preventDefault(); setEnviando(true); try { await API.post('/auth/registro', formUsuario); setShowUsuarioModal(false); fetchDatos(); toast.success("Cliente registrado"); setFormUsuario({ nombre: '', cedula: '', email: '', password: '', telefono: '', ciudad: '', direccion: '', rol: 'CLIENTE', limite_credito: 0, dias_credito: 30 }); } catch (err) { toast.error("Error al crear cliente"); } finally { setEnviando(false); } };
    const abrirModalEditarUsuario = (u) => { setFormEditUsuario({ id: u.id, nombre: u.nombre || '', cedula: u.cedula || '', email: u.email || '', telefono: u.telefono || '', ciudad: u.ciudad || '', direccion: u.direccion || '', rol: u.rol || 'CLIENTE', limite_credito: u.limite_credito || 0, dias_credito: u.dias_credito || 30 }); setShowEditUsuarioModal(true); };
    const handleEditarUsuario = async (e) => { e.preventDefault(); setEnviando(true); try { await API.put(`/auth/admin/usuarios/${formEditUsuario.id}`, formEditUsuario); setShowEditUsuarioModal(false); fetchDatos(); toast.success("Datos actualizados"); } catch (err) { toast.error("Error al actualizar cliente"); } finally { setEnviando(false); } };
    const handleRestablecerPassword = async (e) => { e.preventDefault(); setEnviando(true); try { await API.put(`/auth/admin/usuarios/${usuarioSeleccionado.id}/password`, { password: nuevaPassword }); setShowPasswordModal(false); setNuevaPassword(''); toast.success("Contraseña restablecida"); } catch (err) { toast.error("Error al cambiar contraseña"); } finally { setEnviando(false); } };
    const handleEliminarUsuario = async () => { try { await API.delete(`/auth/admin/usuarios/${usuarioAEliminar.id}`); setUsuarioAEliminar(null); fetchDatos(); toast.success("Usuario eliminado"); } catch (err) { toast.error("Error al eliminar usuario"); } };
    
    const handleCrearRutaConfig = async (e) => { e.preventDefault(); setEnviando(true); try { await API.post('/pedidos/config/rutas', { ciudad: nuevaRutaCiudad, dia_ruta: nuevaRutaDia }); toast.success(`Reglas guardadas`); setNuevaRutaCiudad(''); setNuevaRutaDia(''); fetchDatos(); } catch (err) { toast.error("Error"); } finally { setEnviando(false); } };
    const handleEliminarRutaConfig = async (id) => { try { await API.delete(`/pedidos/config/rutas/${id}`); fetchDatos(); toast.success("Regla eliminada"); } catch (err) { toast.error("Error"); } };
    const handleGuardarConfig = async (e) => { e.preventDefault(); setEnviando(true); try { await API.put('/auth/config/whatsapp', { whatsapp: whatsappTienda }); await API.put('/pedidos/config/horalimite', { hora: horaLimite }); toast.success("Ajustes guardados"); setShowConfigModal(false); } catch (err) { toast.error("Error"); } finally { setEnviando(false); } };
    
    // 🔥 CORRECCIÓN CRÍTICA DE FECHA 🔥
    const abrirModalEditarTransaccion = (tx) => { 
        setTransaccionSeleccionada(tx); 
        let fechaSegura = '';
        try {
            fechaSegura = tx.fecha ? new Date(tx.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        } catch(e) {
            fechaSegura = new Date().toISOString().split('T')[0];
        }
        setFormGasto({ monto: tx.monto, descripcion: tx.descripcion, categoria: tx.categoria, tipo: tx.tipo, fecha: fechaSegura }); 
        setShowEditTransaccionModal(true); 
    };
    
    const handleGuardarTransaccion = async (e) => { e.preventDefault(); setEnviando(true); try { if (transaccionSeleccionada) { await API.put(`/contabilidad/transacciones/${transaccionSeleccionada.id}`, formGasto); toast.success("Transacción actualizada"); } else { await API.post('/contabilidad/gasto', formGasto); toast.success("Transacción registrada"); } setShowGastoModal(false); setShowEditTransaccionModal(false); setTransaccionSeleccionada(null); setFormGasto({ monto: '', descripcion: '', categoria: 'Logística', tipo: 'EGRESO', fecha: '' }); fetchDatos(); } catch (err) { toast.error("Error"); } finally { setEnviando(false); } };
    const handleEliminarTransaccion = async () => { try { await API.delete(`/contabilidad/transacciones/${transaccionSeleccionada.id}`); setShowDeleteTransaccionModal(false); setTransaccionSeleccionada(null); fetchDatos(); toast.success("Transacción eliminada"); } catch (err) { toast.error("Error"); } };

    const handleCrearCredito = async (e) => { 
        e.preventDefault(); 
        const cliente = usuarios.find(u => u.id === parseInt(formCredito.usuarioId));
        const montoNuevo = parseFloat(formCredito.monto_total);
        const dataClienteCartera = clientesCartera.find(c => c.id === cliente?.id);
        const deudaActual = dataClienteCartera ? dataClienteCartera.totalDeuda : 0;
        const limite = parseFloat(cliente?.limite_credito || 0);

        if (limite > 0 && (deudaActual + montoNuevo) > limite) {
            if (!window.confirm(`⚠️ ADVERTENCIA DE RIESGO ⚠️\n\nEste cliente tiene un Límite de Crédito de $${formatCurrency(limite)}.\nCon esta nueva deuda su saldo llegaría a $${formatCurrency(deudaActual + montoNuevo)}.\n\n¿Autorizas forzar este crédito de todas formas?`)) {
                return;
            }
        }

        setEnviando(true); 
        try { 
            const dias = parseInt(cliente?.dias_credito || 30);
            const fechaVencimiento = new Date();
            fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);

            await API.post('/creditos', { ...formCredito, fecha_vencimiento: fechaVencimiento.toISOString() }); 
            toast.success("Crédito registrado"); 
            setShowCreditoModal(false); setFormCredito({ usuarioId: '', monto_total: '', descripcion: '' }); 
            fetchDatos(); 
        } catch (err) { toast.error("Error al registrar crédito"); } finally { setEnviando(false); } 
    };

    const handleRegistrarAbono = async (e) => { e.preventDefault(); setEnviando(true); try { await API.post(`/creditos/${creditoSeleccionado.id}/abono`, formAbono); toast.success("Abono registrado."); setShowAbonoModal(false); setCreditoSeleccionado(null); setFormAbono({ monto: '', nota: '' }); fetchDatos(); } catch (err) { toast.error("Error"); } finally { setEnviando(false); } };
    
    const handleCobro = async (tipoPago) => {
        const cliente = usuarios.find(u => u.id === parseInt(pedidoACobrar.usuarioId || pedidoACobrar.usuario_id));
        if (tipoPago === 'CREDITO') {
            const dataClienteCartera = clientesCartera.find(c => c.id === cliente?.id);
            const deudaActual = dataClienteCartera ? dataClienteCartera.totalDeuda : 0;
            const limite = parseFloat(cliente?.limite_credito || 0);

            if (limite > 0 && (deudaActual + parseFloat(pedidoACobrar.total)) > limite) {
                if (!window.confirm(`⚠️ LÍMITE SUPERADO ⚠️\nEl cliente tiene un límite de $${formatCurrency(limite)}.\nSu deuda llegaría a $${formatCurrency(deudaActual + parseFloat(pedidoACobrar.total))}.\n¿Deseas fiarle de todas formas?`)) {
                    return;
                }
            }
        }

        setEnviando(true); const loadingId = toast.loading("Procesando liquidación de pedido...");
        try {
            await API.put(`/pedidos/${pedidoACobrar.id}/estado`, { estado: 'Entregado' });
            if (tipoPago === 'CONTADO') {
                await API.post('/contabilidad/gasto', { monto: pedidoACobrar.total, descripcion: `Pago de Contado - Pedido #${pedidoACobrar.id}`, categoria: 'Ventas Productos', tipo: 'INGRESO', fecha: new Date().toISOString().split('T')[0], pedidoId: pedidoACobrar.id });
                toast.success("Pedido Entregado. Dinero registrado en finanzas.", { id: loadingId });
            } else if (tipoPago === 'CREDITO') {
                const dias = parseInt(cliente?.dias_credito || 30);
                const fechaVencimiento = new Date();
                fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);
                await API.post('/creditos', { usuarioId: cliente.id, monto_total: pedidoACobrar.total, descripcion: `Factura Pedido #${pedidoACobrar.id}`, fecha_vencimiento: fechaVencimiento.toISOString() });
                toast.success("Pedido Entregado. Deuda creada en Cartera.", { id: loadingId });
            }
            setShowCobroModal(false); setPedidoACobrar(null); fetchDatos();
        } catch (error) { toast.error("Error al liquidar el pedido", { id: loadingId }); } finally { setEnviando(false); }
    };
    
    const handlePasarPedidoACartera = async (pedido) => {
        const cliente = usuarios.find(u => u.id === parseInt(pedido.usuarioId || pedido.usuario_id));
        const dataClienteCartera = clientesCartera.find(c => c.id === cliente?.id);
        const deudaActual = dataClienteCartera ? dataClienteCartera.totalDeuda : 0;
        const limite = parseFloat(cliente?.limite_credito || 0);

        if (limite > 0 && (deudaActual + parseFloat(pedido.total)) > limite) {
            if (!window.confirm(`⚠️ LÍMITE SUPERADO ⚠️\nEl cliente tiene un límite de $${formatCurrency(limite)}.\nSu deuda llegaría a $${formatCurrency(deudaActual + parseFloat(pedido.total))}.\n¿Deseas fiarle de todas formas?`)) {
                return;
            }
        }

        const loadingId = toast.loading("Convirtiendo pedido en deuda...");
        try {
            const dias = parseInt(cliente?.dias_credito || 30);
            const fechaVencimiento = new Date();
            fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);
            await API.post('/creditos', { usuarioId: cliente.id, monto_total: pedido.total, descripcion: `Factura Pedido #${pedido.id}`, fecha_vencimiento: fechaVencimiento.toISOString() });
            toast.success("Factura agregada a cartera", { id: loadingId }); fetchDatos();
        } catch (error) { toast.error("Error al transferir factura", { id: loadingId }); }
    };

    // --- EMPAQUETADO PARA COMPONENTES HIJOS ---
    const statesProps = { showBajaModal, productoBaja, showGastoModal, showEditTransaccionModal, transaccionSeleccionada, showDeleteTransaccionModal, pedidoDetalle, showModal, productoEditando, preview, precioCalculado, showEditUsuarioModal, showUsuarioModal, showPasswordModal, usuarioSeleccionado, showConfigModal, usuarioAEliminar, showDeleteModal, productoAEliminar, showCobroModal, pedidoACobrar, showCreditoModal, showAbonoModal, creditoSeleccionado, clienteEstadoCuenta, enviando };
    const formsProps = { formBaja, formGasto, formulario, formEditUsuario, formUsuario, nuevaPassword, whatsappTienda, horaLimite, nuevaRutaCiudad, nuevaRutaDia, formCredito, formAbono };
    const settersProps = { setShowBajaModal, setFormBaja, setShowGastoModal, setShowEditTransaccionModal, setFormGasto, setShowDeleteTransaccionModal, setPedidoDetalle, cerrarModal, setFormulario, setPreview, setShowEditUsuarioModal, setFormEditUsuario, setShowUsuarioModal, setFormUsuario, setShowPasswordModal, setNuevaPassword, setShowConfigModal, setWhatsappTienda, setHoraLimite, setNuevaRutaCiudad, setNuevaRutaDia, setUsuarioAEliminar, setShowDeleteModal, setShowCobroModal, setPedidoACobrar, setShowCreditoModal, setFormCredito, setShowAbonoModal, setFormAbono, setClienteEstadoCuenta, setCreditoSeleccionado };
    const handlersProps = { handleGuardarBaja, handleGuardarTransaccion, handleEliminarTransaccion, handleDevolucionProducto, handleGuardarProducto, handleImagenChange, handleEditarUsuario, handleCrearUsuario, handleRestablecerPassword, handleGuardarConfig, handleCrearRutaConfig, handleEliminarRutaConfig, handleEliminarUsuario, handleEliminar, handleCobro, handleCrearCredito, handleRegistrarAbono, handlePasarPedidoACartera };
    const dataProps = { categorias, usuarios, rutasDinamicas, diasUnicosDropdown, clienteActualData, transacciones };

    if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-white font-black text-gray-400"><Loader2 className="animate-spin text-black mb-4" size={48} /> SYNCING LIVE DATA...</div>;

    // --- RENDER DE VISTAS ---
    return (
        <div className="min-h-screen bg-gray-50 pb-20 px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4 pt-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase italic">HQ Dashboard</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 mt-1">Control Logístico Urabá <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span></p>
                </div>
                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                    {tab === 'finanzas' && (<button onClick={() => { setTransaccionSeleccionada(null); setFormGasto({ monto: '', descripcion: '', categoria: 'Logística', tipo: 'EGRESO', fecha: '' }); setShowGastoModal(true); }} className="col-span-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/30 uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"><ArrowDownRight size={16} /> Movimiento Manual</button>)}
                    {tab === 'cartera' && (<button onClick={() => setShowCreditoModal(true)} className="col-span-2 bg-black hover:bg-gray-800 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"><Banknote size={16} /> Fiar Libre</button>)}
                    <button onClick={exportarManifiestoCarga} className={`${(tab === 'finanzas' || tab === 'cartera') ? 'col-span-1' : 'col-span-2'} bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95`}><Truck size={16} /> Extraer Ruta</button>
                    {tab === 'productos' && (<button onClick={() => { setProductoEditando(null); setPreview(null); setFormulario({ nombre: '', precio: '', stock: '', stock_adicional: '', precio_nuevo_lote: '', categoriaId: '', descripcion: '', proveedor: '', costo_compra: '', margen_ganancia: '', tope_stock: 10 }); setPrecioCalculado(0); setShowModal(true); }} className="col-span-1 bg-black hover:bg-gray-800 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"><Plus size={16} /> Producto</button>)}
                    {tab === 'clientes' && (<button onClick={() => setShowUsuarioModal(true)} className="col-span-1 bg-black hover:bg-gray-800 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"><Users size={16} /> Cliente</button>)}
                    <button onClick={() => setShowConfigModal(true)} className="col-span-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"><Settings size={16} /> Ajustes</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                <StatCard title="Ventas Mes Actual" value={`$${formatCurrency(kpis.ventasMes)}`} subtitle={`Hoy: $${formatCurrency(kpis.ventasHoy)}`} icon={<DollarSign />} color="bg-green-100 text-green-600" />
                <StatCard title="Pedidos Pendientes" value={kpis.pendientes} subtitle="Listos para ruta" icon={<Clock />} color="bg-amber-100 text-amber-600" />
                <StatCard title="Total Pedidos" value={pedidos.length} subtitle="Histórico completo" icon={<ShoppingCart />} color="bg-blue-100 text-blue-600" />
                <StatCard title="Clientes Registrados" value={usuarios.length} subtitle="En base de datos" icon={<Users />} color="bg-purple-100 text-purple-600" />
                <StatCard title="Total Productos" value={statsProductos.total} subtitle="En inventario" icon={<Package />} color="bg-indigo-100 text-indigo-600" />
                <StatCard title="Stock Bajo" value={statsProductos.stockBajo} subtitle="Requieren atención" icon={<AlertTriangle />} color="bg-red-100 text-red-600" />
                <StatCard title="Cuentas por Cobrar" value={`$${formatCurrency(statsCartera.porCobrar)}`} subtitle="Deuda pendiente total" icon={<Banknote />} color="bg-rose-100 text-rose-600" />
                <StatCard title="Total Histórico Fiado" value={`$${formatCurrency(statsCartera.fiadoTotal)}`} subtitle="Lo que has fiado" icon={<FileText />} color="bg-orange-100 text-orange-600" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
                <div className="flex gap-2 p-1 bg-gray-200/50 rounded-2xl w-full md:w-fit border border-gray-100 overflow-x-auto custom-scrollbar">
                    {['reportes', 'cartera', 'finanzas', 'pedidos', 'productos', 'clientes', 'categorias'].map((t) => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 md:px-8 py-2 md:py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] transition-all whitespace-nowrap ${tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>{t === 'reportes' ? 'Analíticas' : t}</button>
                    ))}
                </div>
                {tab === 'productos' && (
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
                        <button onClick={() => setFiltroStockBajo(!filtroStockBajo)} className={`px-4 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors ${filtroStockBajo ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}><AlertTriangle size={16} /> {filtroStockBajo ? 'Ocultar Filtro' : 'Filtrar Stock Bajo'}</button>
                        <button onClick={exportarExcelInventario} className="bg-green-100 text-green-700 px-4 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-green-200 transition-colors"><FileSpreadsheet size={16}/> Bajar Inventario</button>
                        <div className="relative flex-1 md:w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="BUSCAR..." value={searchTerm || ''} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none shadow-sm" /></div>
                    </div>
                )}
                {tab === 'cartera' && (
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
                        <select value={filtroEstadoCartera} onChange={(e) => setFiltroEstadoCartera(e.target.value)} className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-black uppercase text-[10px] outline-none shadow-sm cursor-pointer text-gray-600">
                            <option value="TODOS">Todos los Clientes</option>
                            <option value="VIGENTE">Con Deuda Activa</option>
                            <option value="MORA">En Mora (Vencidos)</option>
                            <option value="PAGADO">Sin Deudas (Pagados)</option>
                        </select>
                        <div className="relative flex-1 md:w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Buscar cliente o CC..." value={searchTermCartera || ''} onChange={(e) => setSearchTermCartera(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none shadow-sm" /></div>
                    </div>
                )}
            </div>

            <div className="animate-in fade-in duration-500">
                {/* VISTA DE CARTERA */}
                {tab === 'cartera' && (
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
                )}

                {/* VISTAS NORMALES */}
                {tab === 'reportes' && (
                    <div className="space-y-6 md:space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                            <div className="lg:col-span-2 bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-center mb-8"><div><h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Agenda de Entregas</h3><p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rutas programadas por ciudad</p></div><CalendarDays className="text-blue-600" size={24} /></div>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {dataAgendaEntregas.length === 0 && <p className="text-center text-gray-400 font-bold uppercase text-xs py-10">No hay entregas pendientes</p>}
                                    {dataAgendaEntregas.map((agenda, i) => (
                                        <div key={i} className="flex flex-col gap-4 bg-gray-50 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-base">{agenda.cantidad}</div>
                                                    <div>
                                                        <p className="font-black text-gray-900 uppercase italic text-xs md:text-sm">{agenda.dia}</p>
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
                )}

                {tab === 'finanzas' && (
                    <div className="space-y-6 md:space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div><h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter">Panel Financiero</h3><p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Selecciona un mes para ver su rendimiento</p></div>
                            <div className="flex items-center gap-3 w-full sm:w-auto"><Filter size={18} className="text-gray-400"/><select value={mesFiltroContable} onChange={(e) => setMesFiltroContable(e.target.value)} className="w-full sm:w-auto bg-gray-50 border-none font-black text-xs md:text-sm p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"><option value="Todos">HISTÓRICO COMPLETO</option>{opcionesMeses.map(mes => (<option key={mes} value={mes}>{mes}</option>))}</select></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-green-100 shadow-sm"><div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 text-green-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><ArrowUpRight size={20} /></div><p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Ingresos (Ventas)</p><h3 className="text-3xl md:text-4xl font-black text-green-600 tracking-tighter italic truncate">${formatCurrency(finanzasFiltradas.ingresos)}</h3></div>
                            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-red-100 shadow-sm"><div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><ArrowDownRight size={20} /></div><p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Egresos (Gastos)</p><h3 className="text-3xl md:text-4xl font-black text-red-600 tracking-tighter italic truncate">${formatCurrency(finanzasFiltradas.egresos)}</h3></div>
                            <div className="bg-black p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={100} /></div><div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 text-white rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"><DollarSign size={20} /></div><p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Balance Neto Real</p><h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter italic z-10 relative truncate">${formatCurrency(finanzasFiltradas.balance)}</h3></div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"><div><h3 className="text-lg md:text-xl font-black text-blue-900 uppercase tracking-tighter">Patrimonio en Bodega</h3><p className="text-[9px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Cálculo Global: Stock Actual × Costo de Compra</p></div><h3 className="text-3xl md:text-4xl font-black text-blue-600 tracking-tighter italic truncate">${formatCurrency(finanzasFiltradas.valorInventario)}</h3></div>
                        
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-sm">
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

                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-sm">
                            <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2">Libro Mayor</h3><p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 md:mb-8">Registro detallado del periodo {mesFiltroContable}</p>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {transaccionesFiltradas.length === 0 && <p className="text-center py-10 text-gray-400 font-bold text-xs uppercase">No hay transacciones en este mes</p>}
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
                                                    <button onClick={() => abrirModalEditarTransaccion(tx)} className="p-1.5 md:p-2 text-blue-500 hover:bg-blue-100 rounded-lg"><Edit size={14}/></button>
                                                    <button onClick={() => { setTransaccionSeleccionada(tx); setShowDeleteTransaccionModal(true); }} className="p-1.5 md:p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={14}/></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'productos' && (
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-gray-100">
                                <tr><th className="px-4 py-4 md:px-8 md:py-6">Item / Categoría</th><th className="px-4 py-4 md:px-8 md:py-6">Proveedor</th><th className="px-4 py-4 md:px-8 md:py-6 bg-blue-50/50 rounded-tl-xl md:rounded-tl-2xl">Finanzas: Costo/Margen/Venta</th><th className="px-4 py-4 md:px-8 md:py-6">Stock</th><th className="px-4 py-4 md:px-8 md:py-6 text-right">Acciones</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {productosFiltrados.length === 0 ? (<tr><td colSpan="5" className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No hay productos.</td></tr>) : (
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
                )}

                {tab === 'pedidos' && (
                    <>
                        <div className="flex justify-end mb-4 items-center gap-3">
                            <div className="flex items-center gap-2 bg-white border border-blue-200 p-1.5 rounded-xl shadow-sm">
                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                    <CalendarDays size={16} />
                                </div>
                                <input 
                                    type="date" 
                                    value={filtroFechaPedidos}
                                    onChange={(e) => setFiltroFechaPedidos(e.target.value)}
                                    className="border-none bg-transparent text-[10px] md:text-xs font-black uppercase text-gray-700 outline-none cursor-pointer pr-2"
                                />
                                {filtroFechaPedidos && (
                                    <button 
                                        onClick={() => setFiltroFechaPedidos('')}
                                        className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-lg transition-colors mr-1"
                                        title="Limpiar filtro"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {pedidosFiltradosVisual.length === 0 && (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10">
                                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No hay pedidos programados para esta fecha.</p>
                                </div>
                            )}
                            {pedidosFiltradosVisual.map(ped => {
                                const infoRuta = calcularFechaReal(ped.ruta, ped.Usuario?.ciudad, ped.direccion, rutasDinamicas, ped.fecha, horaLimite);
                                const items = ped.Detalles || ped.items || [];
                                
                                const yaEnCartera = creditos.some(c => c.descripcion === `Factura Pedido #${ped.id}`);
                                const yaEnFinanzas = transacciones.some(t => t.pedidoId === ped.id || t.descripcion === `Pago de Contado - Pedido #${ped.id}` || t.descripcion === `Venta - Orden #${ped.id}`);
                                const estaLiquidado = yaEnCartera || yaEnFinanzas;

                                return (
                                    <div key={ped.id} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between">
                                        <div>
                                            <div className="absolute top-0 left-0 w-full bg-black py-1.5 md:py-2 text-center border-b"><span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-2"><Truck size={10} /> RUTA: {infoRuta.diaNombre.toUpperCase()}</span></div>
                                            <div className="flex justify-between items-start mb-4 mt-6"><span className="text-[8px] md:text-[9px] font-black bg-gray-100 text-black px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase italic border tracking-tighter">ID #{ped.id}</span><button onClick={() => setPedidoDetalle(ped)} className="p-2 md:p-3 bg-gray-50 group-hover:bg-black group-hover:text-white rounded-xl md:rounded-2xl transition-all"><Eye size={14} /></button></div>
                                            <div className="mb-4 border-b border-gray-50 pb-4"><p className="text-[9px] md:text-[10px] font-black uppercase text-blue-600 mb-1 tracking-widest">{ped.Usuario?.nombre || 'CLIENTE DIRECTO'}</p><p className="text-[10px] md:text-[11px] font-bold text-gray-700 leading-tight">📍 {ped.direccion || ped.Usuario?.direccion || 'Sin dirección'}</p><p className="text-[8px] md:text-[9px] font-black text-gray-400 mt-1 uppercase">Ciudad: {ped.Usuario?.ciudad || 'No especificada'}</p><p className="text-[8px] md:text-[9px] font-bold text-orange-500 mt-2 bg-orange-50 p-1.5 md:p-2 rounded-lg inline-block">📆 Llegará el: {infoRuta.fechaFormateada}</p></div>
                                            <div className="mb-6"><p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Contenido:</p><ul className="text-[9px] md:text-[10px] font-bold text-gray-600 space-y-1 mb-4">{items.slice(0, 3).map((item, idx) => (<li key={idx} className="truncate">• {item.cantidad}x {item.Producto?.nombre || item.nombre}</li>))}{items.length > 3 && <li className="text-blue-500">+ {items.length - 3} artículos más</li>}</ul><h4 className="text-2xl md:text-3xl font-black text-gray-900 italic tracking-tighter">${formatCurrency(ped.total)}</h4></div>
                                        </div>
                                        <div className="space-y-2 bg-gray-50 p-3 md:p-4 rounded-2xl md:rounded-3xl">
                                            <div>
                                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 md:ml-2">Forzar Ruta</label>
                                                <select value={infoRuta.diaNombre || ''} onChange={(e) => actualizarRutaPedido(ped.id, e.target.value)} className="w-full border border-gray-200 rounded-xl text-[9px] md:text-[10px] font-bold uppercase p-2 md:p-3 outline-none bg-white cursor-pointer mt-1">
                                                    <option value="A CONVENIR">A CONVENIR</option>
                                                    {diasUnicosDropdown.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                            <div className="pt-2 mt-2 border-t border-gray-200">
                                                <label className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 md:ml-2">Estado Logístico</label>
                                                <select 
                                                    value={ped.estado || ''} 
                                                    onChange={(e) => {
                                                        if (e.target.value === 'Entregado') {
                                                            if (estaLiquidado) {
                                                                actualizarEstadoPedido(ped.id, 'Entregado');
                                                            } else {
                                                                setPedidoACobrar(ped);
                                                                setShowCobroModal(true);
                                                            }
                                                        } else {
                                                            actualizarEstadoPedido(ped.id, e.target.value);
                                                        }
                                                    }} 
                                                    className="w-full border-none rounded-xl text-[9px] md:text-[10px] font-black uppercase p-2 md:p-3 outline-none bg-black text-white cursor-pointer mt-1"
                                                >
                                                    <option value="Pendiente">⏳ PENDIENTE (Bodega)</option>
                                                    <option value="Enviado">🚚 EN RUTA (Camión)</option>
                                                    <option value="Entregado">✅ ENTREGADO</option>
                                                    <option value="Cancelado">❌ CANCELADO</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {tab === 'clientes' && (
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-gray-100">
                                <tr><th className="px-4 py-4 md:px-8 md:py-6">Usuario / Cédula</th><th className="px-4 py-4 md:px-8 md:py-6 text-center">Crédito</th><th className="px-4 py-4 md:px-8 md:py-6">Teléfono / Ciudad</th><th className="px-4 py-4 md:px-8 md:py-6 text-center">Rol</th><th className="px-4 py-4 md:px-8 md:py-6 text-right">Acciones</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {usuarios.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-all">
                                        <td className="px-4 py-4 md:px-8 md:py-5"><p className="font-black text-gray-900 uppercase text-[10px] md:text-xs">{u.nombre}</p><p className="text-[9px] md:text-[10px] text-gray-500 font-bold">CC: {u.cedula || 'Sin cédula'}</p></td>
                                        <td className="px-4 py-4 md:px-8 md:py-5 text-center">
                                            {parseFloat(u.limite_credito) > 0 ? (
                                                <div className="bg-green-50 text-green-600 px-3 py-1 rounded-lg inline-block text-left">
                                                    <p className="text-[9px] font-black uppercase tracking-widest">Límite: ${formatCurrency(u.limite_credito)}</p>
                                                    <p className="text-[8px] font-bold uppercase mt-0.5">{u.dias_credito} Días plazo</p>
                                                </div>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Estricto Contado</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 md:px-8 md:py-5"><p className="text-[9px] md:text-[10px] font-bold text-gray-600">{u.telefono || 'N/A'}</p><p className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 mt-0.5">{u.ciudad || 'No definida'}</p></td>
                                        <td className="px-4 py-4 md:px-8 md:py-5 text-center"><span className={`text-[8px] md:text-[9px] font-black uppercase px-2 py-1 md:px-3 rounded-lg ${u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>{u.rol}</span></td>
                                        <td className="px-4 py-4 md:px-8 md:py-5 text-right flex justify-end gap-1 md:gap-2"><button onClick={() => abrirModalEditarUsuario(u)} className="p-2 md:p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><Edit size={14} /></button><button onClick={() => { setUsuarioSeleccionado(u); setShowPasswordModal(true); }} className="p-2 md:p-2.5 bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition-all"><Key size={14} /></button><button onClick={() => setUsuarioAEliminar(u)} className="p-2 md:p-2.5 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"><Trash2 size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {tab === 'categorias' && <GestionCategorias />}
            </div>

            {/*Y AQUÍ LLAMAMOS A TODOS LOS MODALES */}
            <AdminModals states={statesProps} forms={formsProps} setters={settersProps} handlers={handlersProps} data={dataProps} />
        </div>
    );
};

export default AdminDashboard;