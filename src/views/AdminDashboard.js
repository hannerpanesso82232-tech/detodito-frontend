import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { io } from "socket.io-client";
import { 
    Plus, Package, ShoppingCart, Search, 
    AlertTriangle, Loader2, FileSpreadsheet, Truck,
    DollarSign, Clock, Users, Settings, Banknote, FileText
} from 'lucide-react';
import GestionCategorias from '../components/admin/GestionCategorias';
import AdminModals from '../components/admin/AdminModals';
import { formatCurrency } from '../utils/adminUtils';
import { useAuth } from '../context/AuthContext';

// IMPORTAMOS LOS COMPONENTES MODULARES (TABS)
import PosTab from '../components/admin/tabs/PosTab';
import CarteraTab from '../components/admin/tabs/CarteraTab';
import ReportesTab from '../components/admin/tabs/ReportesTab';
import FinanzasTab from '../components/admin/tabs/FinanzasTab';
import ProductosTab from '../components/admin/tabs/ProductosTab';
import PedidosTab from '../components/admin/tabs/PedidosTab';
import ClientesTab from '../components/admin/tabs/ClientesTab';

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
const RUTAS_BASE = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo", "A CONVENIR"];

const calcularFechaReal = (rutaGuardada, ciudadCliente, direccionCliente, rutasDB = [], fechaCreacionStr = null, horaLimite = "20:00") => {
    let diaRuta = rutaGuardada;
    if (diaRuta && /^\d{4}-\d{2}-\d{2}$/.test(diaRuta)) {
        const fechaExacta = new Date(diaRuta);
        fechaExacta.setMinutes(fechaExacta.getMinutes() + fechaExacta.getTimezoneOffset());
        return { ciudad: 'REPROGRAMADO', diaNombre: diaRuta, fechaFormateada: fechaExacta.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }), fechaRaw: fechaExacta, color: "text-orange-600", bg: "bg-orange-50", reprogramado: true };
    }
    if (!diaRuta || diaRuta.toUpperCase() === "A CONVENIR") {
        const textoCliente = `${ciudadCliente || ''} ${direccionCliente || ''}`.toUpperCase();
        let matchEncontrado = null;
        for (const ruta of rutasDB) {
            const palabrasClave = (ruta.ciudad || '').toUpperCase().split(',').map(c => c.trim());
            if (palabrasClave.some(palabra => palabra !== '' && textoCliente.includes(palabra))) { matchEncontrado = ruta.dia_ruta; break; }
        }
        if (!matchEncontrado) {
            const MAPA_RUTAS_DEFECTO = { "CHIGORODO": "Lunes", "CAREPA": "Lunes", "MUTATA": "Martes", "PAVARANDO": "Martes", "BAJIRA": "Miércoles", "PLAYA ROJA": "Miércoles", "APARTADO": "Jueves", "TURBO": "Jueves", "NECOCLI": "Viernes", "ARBOLETES": "Viernes" };
            for (const [ciudadMap, diaMap] of Object.entries(MAPA_RUTAS_DEFECTO)) { if (textoCliente.includes(ciudadMap)) { matchEncontrado = diaMap; break; } }
        }
        diaRuta = matchEncontrado || "A CONVENIR";
    }
    if (diaRuta.toUpperCase() === "A CONVENIR") { return { ciudad: "A CONVENIR", diaNombre: "A CONVENIR", fechaFormateada: "Por definir con logística", fechaRaw: null, color: "text-amber-500", bg: "bg-amber-50", reprogramado: false }; }
    const mapDias = { "DOMINGO": 0, "LUNES": 1, "MARTES": 2, "MIÉRCOLES": 3, "MIERCOLES": 3, "JUEVES": 4, "VIERNES": 5, "SÁBADO": 6, "SABADO": 6 };
    const diaDestino = mapDias[diaRuta.toUpperCase()];
    if (diaDestino === undefined) return { ciudad: diaRuta, diaNombre: diaRuta, fechaFormateada: diaRuta, fechaRaw: null, color: "text-gray-500", bg: "bg-gray-50", reprogramado: false };
    const fechaBase = fechaCreacionStr ? new Date(fechaCreacionStr) : new Date();
    const diaActual = fechaBase.getDay(); 
    let diasFaltantes = diaDestino - diaActual;
    if (diasFaltantes < 0) diasFaltantes += 7;
    if (diasFaltantes === 0) diasFaltantes += 7;
    else if (diasFaltantes === 1) {
        const [limiteHora, limiteMinuto] = horaLimite.split(':').map(Number);
        if (fechaBase.getHours() > limiteHora || (fechaBase.getHours() === limiteHora && fechaBase.getMinutes() >= limiteMinuto)) diasFaltantes += 7;
    }
    const fechaEntrega = new Date(fechaBase);
    fechaEntrega.setDate(fechaBase.getDate() + diasFaltantes);
    return { ciudad: diaRuta, diaNombre: diaRuta, fechaRaw: fechaEntrega, fechaFormateada: fechaEntrega.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }), color: "text-green-600", bg: "bg-green-50", reprogramado: false };
};

const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm group hover:border-black transition-all duration-300">
        <div className={`w-12 h-12 md:w-14 md:h-14 ${color} rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm group-hover:-rotate-12 transition-transform duration-500`}>{React.cloneElement(icon, { size: 24 })}</div>
        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1">{title}</p>
        <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter italic mb-1 md:mb-2 truncate">{value}</h3>
        {subtitle && <p className="text-[10px] md:text-xs font-bold text-gray-500">{subtitle}</p>}
    </div>
);

const AdminDashboard = () => {
    // 🔥 CONTROL DE ACCESO (RBAC) 🔥
    const { user } = useAuth();
    const esCajero = user?.rol === 'CAJERO';

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
    
    const [tab, setTab] = useState(esCajero ? 'pos' : 'reportes'); 
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);

    // Búsquedas y filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [filtroStockBajo, setFiltroStockBajo] = useState(false);
    const [filtroFechaPedidos, setFiltroFechaPedidos] = useState(''); 
    const [filtroTextoPedidos, setFiltroTextoPedidos] = useState(''); 
    const [searchTermCartera, setSearchTermCartera] = useState(''); 
    const [filtroEstadoCartera, setFiltroEstadoCartera] = useState('TODOS'); 
    const [fechaInicioFinanzas, setFechaInicioFinanzas] = useState('');
    const [fechaFinFinanzas, setFechaFinFinanzas] = useState('');
    const [filtroClienteFinanzas, setFiltroClienteFinanzas] = useState('Todos');
    const [filtroTextoFinanzas, setFiltroTextoFinanzas] = useState('');

    // Estados de Modales
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
    const [showCheatSheetModal, setShowCheatSheetModal] = useState(false);

    // Items Seleccionados
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

    // Formularios
    const [nuevaRutaPersonalizada, setNuevaRutaPersonalizada] = useState('');
    const [nuevaRutaCiudad, setNuevaRutaCiudad] = useState('');
    const [nuevaRutaDia, setNuevaRutaDia] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [formulario, setFormulario] = useState({ nombre: '', precio: '', stock: '', stock_adicional: '', precio_nuevo_lote: '', categoriaId: '', descripcion: '', proveedor: '', costo_compra: '', margen_ganancia: '', tope_stock: 10 });
    const [formUsuario, setFormUsuario] = useState({ nombre: '', cedula: '', email: '', password: '', telefono: '', ciudad: '', direccion: '', rol: 'CLIENTE', limite_credito: 0, dias_credito: 30, credito_activo: true });
    const [formEditUsuario, setFormEditUsuario] = useState({ id: '', nombre: '', cedula: '', email: '', telefono: '', ciudad: '', direccion: '', rol: 'CLIENTE', limite_credito: 0, dias_credito: 30, credito_activo: true });
    const [formGasto, setFormGasto] = useState({ monto: '', descripcion: '', categoria: 'Logística', tipo: 'EGRESO', fecha: '' });
    const [formBaja, setFormBaja] = useState({ cantidad: 1, motivo: 'Dañado/Roto' });
    const [formCredito, setFormCredito] = useState({ usuarioId: '', monto_total: '', descripcion: '' });
    const [formAbono, setFormAbono] = useState({ monto: '', nota: '' });

    const diasUnicosDropdown = [...new Set([...RUTAS_BASE, ...(rutasDinamicas || []).map(r => r.dia_ruta)])];

    const fetchDatos = useCallback(async () => {
        try {
            const [resProd, resPed, resCat, resUsers, resWa, resFinanzas, resTransacciones, resRutas, resHora, resCreditos] = await Promise.all([
                API.get('/productos').catch(() => ({ data: [] })), 
                API.get('/pedidos/admin/todos').catch(() => ({ data: [] })), 
                API.get('/categorias').catch(() => ({ data: [] })),
                API.get('/auth/admin/usuarios').catch(() => ({ data: [] })), 
                API.get('/auth/config/whatsapp').catch(() => ({ data: { whatsapp: '' } })),
                API.get('/contabilidad/resumen').catch(() => ({ data: { ingresos: 0, egresos: 0, balance: 0, valorInventario: 0 } })), 
                API.get('/contabilidad/transacciones').catch(() => ({ data: [] })),
                API.get('/pedidos/config/rutas').catch(() => ({ data: [] })),
                API.get('/pedidos/config/horalimite').catch(() => ({ data: { hora: '20:00' } })),
                API.get('/creditos').catch(() => ({ data: [] })) 
            ]);
            setProductos(resProd.data || []); 
            setPedidos(resPed.data || []); 
            setCategorias(resCat.data || []);
            setUsuarios(resUsers.data || []); 
            setWhatsappTienda(resWa.data?.whatsapp || ''); 
            setFinanzas(resFinanzas.data || { ingresos: 0, egresos: 0, balance: 0, valorInventario: 0 }); 
            setTransacciones(resTransacciones.data || []); 
            setRutasDinamicas(resRutas.data || []);
            setHoraLimite(resHora.data?.hora || '20:00');
            setCreditos(resCreditos.data || []); 
        } catch (err) { toast.error("Error de sincronización"); } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchDatos();
        const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
        socket.on("nuevo_pedido_admin", (data) => {
            const audio = new Audio('/alert-notification.mp3'); audio.play().catch(() => {});
            const metodoTXT = data.metodo_pago === 'CREDITO' ? '💳 FIADO' : '💵 CONTADO';
            toast(`📦 Nuevo Pedido [${metodoTXT}] de ${data.cliente || 'Cliente'}`, { icon: '🚀', style: { borderRadius: '20px', background: '#000', color: '#fff', fontSize: '10px' } });
            fetchDatos();
        });
        socket.on('stockActualizado', (data) => { setProductos(prev => (Array.isArray(prev) ? prev : []).map(p => p.id === parseInt(data.id) ? { ...p, stock: data.nuevoStock } : p)); });
        socket.on('productoActualizado', (productoModificado) => { setProductos(prev => (Array.isArray(prev) ? prev : []).map(p => p.id === productoModificado.id ? productoModificado : p)); });
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

    // CÁLCULOS PRINCIPALES
    const kpis = useMemo(() => {
        const hoy = new Date(); let ventasHoy = 0, ventasMes = 0, pendientes = 0;
        (Array.isArray(pedidos) ? pedidos : []).forEach(p => {
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
        return { total: (Array.isArray(productos) ? productos : []).length, stockBajo: (Array.isArray(productos) ? productos : []).filter(p => parseInt(p.stock) <= (parseInt(p.tope_stock) || 10)).length };
    }, [productos]);

    const dataVentasMensuales = useMemo(() => {
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]; const data = meses.map(m => ({ name: m, Ventas: 0 }));
        (Array.isArray(pedidos) ? pedidos : []).filter(p => p.estado !== 'Cancelado').forEach(ped => { const fecha = new Date(ped.fecha); const mesIndex = fecha.getMonth(); if(!isNaN(mesIndex)) data[mesIndex].Ventas += parseFloat(ped.total || 0); });
        return data.slice(0, new Date().getMonth() + 1);
    }, [pedidos]);

    const dataTopProductos = useMemo(() => {
        const conteo = {};
        (Array.isArray(pedidos) ? pedidos : []).filter(p => p.estado !== 'Cancelado').forEach(ped => { (ped.Detalles || ped.items || []).forEach(item => { const nombre = item.Producto?.nombre || item.nombre || 'Item'; conteo[nombre] = (conteo[nombre] || 0) + item.cantidad; }); });
        return Object.keys(conteo).map(key => ({ name: key, Vendidos: conteo[key] })).sort((a, b) => b.Vendidos - a.Vendidos).slice(0, 5);
    }, [pedidos]);

    const dataAgendaEntregas = useMemo(() => {
        const agenda = {};
        (Array.isArray(pedidos) ? pedidos : []).filter(p => p.estado === 'Pendiente').forEach(ped => {
            const info = calcularFechaReal(ped.ruta, ped.Usuario?.ciudad, ped.direccion, rutasDinamicas, ped.fecha, horaLimite);
            if(info && info.fechaFormateada) {
                const clave = info.fechaFormateada;
                if (!agenda[clave]) { agenda[clave] = { dia: info.diaNombre, fecha: info.fechaFormateada, cantidad: 0, total: 0, pedidos: [], reprogramado: info.reprogramado }; }
                agenda[clave].cantidad += 1; agenda[clave].total += parseFloat(ped.total || 0); agenda[clave].pedidos.push(ped);
            }
        });
        return Object.values(agenda).sort((a, b) => b.cantidad - a.cantidad);
    }, [pedidos, rutasDinamicas, horaLimite]);

    const dataGraficoRutas = useMemo(() => {
        const conteo = {};
        (Array.isArray(pedidos) ? pedidos : []).forEach(ped => { 
            const info = calcularFechaReal(ped.ruta, ped.Usuario?.ciudad, ped.direccion, rutasDinamicas, ped.fecha, horaLimite);
            if(info && info.diaNombre) {
                const ruta = info.diaNombre.toUpperCase(); 
                if(!conteo[ruta]) conteo[ruta] = 0; conteo[ruta]++; 
            }
        });
        return Object.keys(conteo).map(key => ({ name: key, pedidos: conteo[key] })).filter(i => i.pedidos > 0);
    }, [pedidos, rutasDinamicas, horaLimite]);

    const dataMejoresClientes = useMemo(() => {
        const conteo = {};
        (Array.isArray(pedidos) ? pedidos : []).filter(p => p.estado !== 'Cancelado').forEach(ped => {
            const cliente = ped.Usuario?.nombre || 'Consumidor Final';
            if (!conteo[cliente]) conteo[cliente] = { pedidos: 0, totalGastado: 0 };
            conteo[cliente].pedidos += 1; conteo[cliente].totalGastado += parseFloat(ped.total || 0);
        });
        return Object.keys(conteo).map(nombre => ({ nombre, ...conteo[nombre] })).sort((a, b) => b.totalGastado - a.totalGastado).slice(0, 5);
    }, [pedidos]);

    const transaccionesFiltradas = useMemo(() => {
        let filtradas = Array.isArray(transacciones) ? transacciones : [];
        if (fechaInicioFinanzas || fechaFinFinanzas) {
            filtradas = filtradas.filter(tx => {
                if(!tx.fecha) return false;
                const fechaTx = new Date(tx.fecha);
                fechaTx.setHours(0, 0, 0, 0); 
                let cumpleInicio = true, cumpleFin = true;
                if (fechaInicioFinanzas) {
                    const [year, month, day] = fechaInicioFinanzas.split('-').map(Number);
                    const fInicio = new Date(year, month - 1, day); fInicio.setHours(0, 0, 0, 0);
                    cumpleInicio = fechaTx >= fInicio;
                }
                if (fechaFinFinanzas) {
                    const [year, month, day] = fechaFinFinanzas.split('-').map(Number);
                    const fFin = new Date(year, month - 1, day); fFin.setHours(23, 59, 59, 999); 
                    cumpleFin = fechaTx <= fFin;
                }
                return cumpleInicio && cumpleFin;
            });
        }
        if (filtroClienteFinanzas !== 'Todos') {
            const nombreCliente = filtroClienteFinanzas.toLowerCase();
            filtradas = filtradas.filter(tx => (tx.descripcion || '').toLowerCase().includes(nombreCliente));
        }
        if (filtroTextoFinanzas) {
            const term = filtroTextoFinanzas.toLowerCase();
            filtradas = filtradas.filter(tx => {
                const desc = (tx.descripcion || '').toLowerCase();
                const cat = (tx.categoria || '').toLowerCase();
                const pedId = String(tx.pedidoId || '');
                return desc.includes(term) || cat.includes(term) || pedId.includes(term);
            });
        }
        return filtradas;
    }, [transacciones, fechaInicioFinanzas, fechaFinFinanzas, filtroClienteFinanzas, filtroTextoFinanzas]);

    const finanzasFiltradas = useMemo(() => {
        let ingresos = 0, egresos = 0;
        (Array.isArray(transaccionesFiltradas) ? transaccionesFiltradas : []).forEach(tx => { if (tx.tipo === 'INGRESO') ingresos += parseFloat(tx.monto || 0); if (tx.tipo === 'EGRESO') egresos += parseFloat(tx.monto || 0); });
        return { ingresos, egresos, balance: ingresos - egresos, valorInventario: finanzas?.valorInventario || 0 };
    }, [transaccionesFiltradas, finanzas]);

    const pedidosFiltradosVisual = useMemo(() => {
        let filtrados = Array.isArray(pedidos) ? pedidos : [];
        if (filtroTextoPedidos) {
            const termino = filtroTextoPedidos.toLowerCase();
            filtrados = filtrados.filter(ped => {
                const ciudad = (ped.Usuario?.ciudad || '').toLowerCase();
                const direccion = (ped.direccion || ped.Usuario?.direccion || '').toLowerCase();
                const nombre = (ped.Usuario?.nombre || ped.cliente || '').toLowerCase();
                const idString = String(ped.id);
                return ciudad.includes(termino) || direccion.includes(termino) || nombre.includes(termino) || idString.includes(termino);
            });
        }
        if (filtroFechaPedidos) {
            const [year, month, day] = filtroFechaPedidos.split('-').map(Number);
            const targetDate = new Date(year, month - 1, day);
            targetDate.setHours(0, 0, 0, 0); 
            
            filtrados = filtrados.filter(ped => {
                const infoRuta = calcularFechaReal(ped.ruta, ped.Usuario?.ciudad, ped.direccion, rutasDinamicas, ped.fecha, horaLimite);
                if (!infoRuta || !infoRuta.fechaRaw) return false;
                const pedDate = new Date(infoRuta.fechaRaw);
                pedDate.setHours(0,0,0,0);
                return pedDate.getTime() === targetDate.getTime();
            });
        }
        return filtrados;
    }, [pedidos, rutasDinamicas, horaLimite, filtroFechaPedidos, filtroTextoPedidos]);

    const clientesCartera = useMemo(() => {
        const mapa = {};
        (Array.isArray(usuarios) ? usuarios : []).forEach(u => { 
            mapa[u.id] = { 
                ...u, creditos: [], pedidos: [], 
                totalDeuda: 0, totalFiado: 0,
                facturasPendientes: 0, tieneMora: false,
                limite_credito: parseFloat(u.limite_credito) || 0,
                dias_credito: parseInt(u.dias_credito) || 30
            }; 
        });

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

        (Array.isArray(creditos) ? creditos : []).forEach(c => {
            const uid = parseInt(c.usuarioId || c.usuario_id || c.Usuario?.id);
            if (mapa[uid]) {
                mapa[uid].creditos.push(c);
                if (c.estado === 'VIGENTE') {
                    mapa[uid].totalDeuda += parseFloat(c.saldo || 0);
                    mapa[uid].facturasPendientes += 1;
                    if (c.fecha_vencimiento) {
                        const vencimiento = new Date(c.fecha_vencimiento);
                        vencimiento.setHours(0, 0, 0, 0);
                        if (hoy > vencimiento) mapa[uid].tieneMora = true;
                    }
                }
                mapa[uid].totalFiado += parseFloat(c.monto_total || 0);
            }
        });
        
        (Array.isArray(pedidos) ? pedidos : []).forEach(p => { 
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
        (Array.isArray(creditos) ? creditos : []).forEach(c => { if(c.estado === 'VIGENTE') porCobrar += parseFloat(c.saldo || 0); fiadoTotal += parseFloat(c.monto_total || 0); });
        return { porCobrar, fiadoTotal };
    }, [creditos]);

    const clienteActualData = useMemo(() => {
        if(!clienteEstadoCuenta) return null;
        return (Array.isArray(clientesCartera) ? clientesCartera : []).find(c => c.id === clienteEstadoCuenta.id);
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

    const exportarManifiestoCarga = async () => {
        const pedidosPendientes = (Array.isArray(pedidos) ? pedidos : []).filter(p => p.estado === 'Pendiente');
        if (pedidosPendientes.length === 0) return toast.error("No hay pedidos pendientes en bodega.");
        const pedidosConInfoFecha = pedidosPendientes.map(p => ({
            ...p, infoCalculada: calcularFechaReal(p.ruta, p.Usuario?.ciudad, p.direccion, rutasDinamicas, p.fecha, horaLimite)
        }));
        const pedidosConRutaProgramada = pedidosConInfoFecha.filter(p => p.infoCalculada && p.infoCalculada.diaNombre !== "A CONVENIR");
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
        const dataParaExportar = (Array.isArray(productosFiltrados) ? productosFiltrados : []).map(p => ({ ID: p.id, Nombre: p.nombre, Categoria: p.Categoria?.nombre || 'N/A', Costo_Compra: p.costo_compra, Margen: p.margen_ganancia, Precio_Final: p.precio, Stock: p.stock, Tope_Minimo: p.tope_stock || 10, Proveedor: p.proveedor || 'No especificado' }));
        const ws = XLSX.utils.json_to_sheet(dataParaExportar); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Inventario"); XLSX.writeFile(wb, filtroStockBajo ? `Reporte_Inventario_Stock_Bajo.xlsx` : `Reporte_Inventario.xlsx`);
    };

    const cerrarModal = () => { setShowModal(false); setProductoEditando(null); setImagenArchivo(null); setPreview(null); setFormulario({ nombre: '', precio: '', stock: '', stock_adicional: '', precio_nuevo_lote: '', categoriaId: '', descripcion: '', proveedor: '', costo_compra: '', margen_ganancia: '', tope_stock: 10, cantidad_mayor: 0, precio_mayor: '', codigo_barras: '' }); setPrecioCalculado(0); };
    const handleImagenChange = (e) => { const file = e.target.files[0]; if (file) { setImagenArchivo(file); setPreview(URL.createObjectURL(file)); } };
    const abrirModalEditar = (p) => { setProductoEditando(p); setFormulario({ nombre: p.nombre || '', precio: p.precio || '', stock: p.stock || 0, stock_adicional: '', precio_nuevo_lote: p.costo_compra || 0, categoriaId: p.categoriaId || p.categoria_id || '', descripcion: p.descripcion || '', proveedor: p.proveedor || '', costo_compra: p.costo_compra || 0, margen_ganancia: p.margen_ganancia || 0, tope_stock: p.tope_stock || 10, cantidad_mayor: p.cantidad_mayor || 0, precio_mayor: p.precio_mayor || '', codigo_barras: p.codigo_barras || '' }); setPreview(formatearImagen(p.imagen_url)); setShowModal(true); };
    const abrirModalBaja = (p) => { setProductoBaja(p); setFormBaja({ cantidad: 1, motivo: 'Dañado/Roto' }); setShowBajaModal(true); };

    const handleGuardarProducto = async (e) => {
        e.preventDefault(); setEnviando(true); const data = new FormData();
        const stockExistente = parseInt(formulario.stock || 0); const stockNuevo = parseInt(formulario.stock_adicional || 0); const stockFinal = productoEditando ? (stockExistente + stockNuevo) : parseInt(formulario.stock || 0);
        let costoFinalBD = parseFloat(formulario.costo_compra || 0);
        if (productoEditando && stockNuevo > 0) { const costoNuevoLote = parseFloat(formulario.costo_nuevo_lote || 0); costoFinalBD = ((stockExistente * costoFinalBD) + (stockNuevo * costoNuevoLote)) / stockFinal; }
        
        data.append('nombre', formulario.nombre); data.append('precio', precioCalculado.toFixed(2)); data.append('stock', stockFinal); data.append('categoriaId', formulario.categoriaId); data.append('descripcion', formulario.descripcion); data.append('proveedor', formulario.proveedor || 'No especificado'); data.append('costo_compra', costoFinalBD.toFixed(2)); data.append('margen_ganancia', parseFloat(formulario.margen_ganancia || 0)); data.append('tope_stock', parseInt(formulario.tope_stock || 10)); 
        if (formulario.cantidad_mayor) data.append('cantidad_mayor', parseInt(formulario.cantidad_mayor));
        if (formulario.precio_mayor) data.append('precio_mayor', parseFloat(formulario.precio_mayor).toFixed(2));
        if (formulario.codigo_barras) data.append('codigo_barras', formulario.codigo_barras);
        if (imagenArchivo) data.append('imagen', imagenArchivo);
        
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
    const actualizarEstadoPedido = async (id, nuevoEstado) => { try { await API.put(`/pedidos/${id}/estado`, { estado: nuevoEstado }); fetchDatos(); toast.success("Estado Actualizado"); } catch (err) { toast.error(err.response?.data?.error || "Error"); } };
    const actualizarRutaPedido = async (id, nuevaRuta) => { try { await API.put(`/pedidos/${id}/ruta`, { ruta: nuevaRuta }); fetchDatos(); toast.success(`Ruta actualizada`); } catch (err) { toast.error("Error al actualizar la ruta"); } };
    
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
    
    const handleToggleCredito = async (u) => {
        try {
            const res = await API.put(`/creditos/usuarios/${u.id}/toggle-credito`);
            toast.success(res.data.mensaje);
            fetchDatos(); 
        } catch (error) {
            toast.error("Error al modificar el estado de crédito");
        }
    };

    const handleCrearRutaConfig = async (e) => { e.preventDefault(); setEnviando(true); try { await API.post('/pedidos/config/rutas', { ciudad: nuevaRutaCiudad, dia_ruta: nuevaRutaDia }); toast.success(`Reglas guardadas`); setNuevaRutaCiudad(''); setNuevaRutaDia(''); fetchDatos(); } catch (err) { toast.error("Error"); } finally { setEnviando(false); } };
    const handleEliminarRutaConfig = async (id) => { try { await API.delete(`/pedidos/config/rutas/${id}`); fetchDatos(); toast.success("Regla eliminada"); } catch (err) { toast.error("Error"); } };
    const handleGuardarConfig = async (e) => { e.preventDefault(); setEnviando(true); try { await API.put('/auth/config/whatsapp', { whatsapp: whatsappTienda }); await API.put('/pedidos/config/horalimite', { hora: horaLimite }); toast.success("Ajustes guardados"); setShowConfigModal(false); } catch (err) { toast.error("Error"); } finally { setEnviando(false); } };
    
    const abrirModalEditarTransaccion = (tx) => { 
        setTransaccionSeleccionada(tx); 
        let fechaSegura = '';
        try { fechaSegura = tx.fecha ? new Date(tx.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]; } 
        catch(e) { fechaSegura = new Date().toISOString().split('T')[0]; }
        setFormGasto({ monto: tx.monto, descripcion: tx.descripcion, categoria: tx.categoria, tipo: tx.tipo, fecha: fechaSegura }); 
        setShowEditTransaccionModal(true); 
    };
    const handleGuardarTransaccion = async (e) => { e.preventDefault(); setEnviando(true); try { if (transaccionSeleccionada) { await API.put(`/contabilidad/transacciones/${transaccionSeleccionada.id}`, formGasto); toast.success("Transacción actualizada"); } else { await API.post('/contabilidad/gasto', formGasto); toast.success("Transacción registrada"); } setShowGastoModal(false); setShowEditTransaccionModal(false); setTransaccionSeleccionada(null); setFormGasto({ monto: '', descripcion: '', categoria: 'Logística', tipo: 'EGRESO', fecha: '' }); fetchDatos(); } catch (err) { toast.error("Error"); } finally { setEnviando(false); } };
    const handleEliminarTransaccion = async () => { try { await API.delete(`/contabilidad/transacciones/${transaccionSeleccionada.id}`); setShowDeleteTransaccionModal(false); setTransaccionSeleccionada(null); fetchDatos(); toast.success("Transacción eliminada"); } catch (err) { toast.error("Error"); } };

    const handleCrearCredito = async (e) => { 
        e.preventDefault(); 
        const cliente = (Array.isArray(usuarios) ? usuarios : []).find(u => u.id === parseInt(formCredito.usuarioId));
        const montoNuevo = parseFloat(formCredito.monto_total);
        const dataClienteCartera = (Array.isArray(clientesCartera) ? clientesCartera : []).find(c => c.id === cliente?.id);
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
        const cliente = (Array.isArray(usuarios) ? usuarios : []).find(u => u.id === parseInt(pedidoACobrar.usuarioId || pedidoACobrar.usuario_id));
        if (tipoPago === 'CREDITO') {
            const dataClienteCartera = (Array.isArray(clientesCartera) ? clientesCartera : []).find(c => c.id === cliente?.id);
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
        const cliente = (Array.isArray(usuarios) ? usuarios : []).find(u => u.id === parseInt(pedido.usuarioId || pedido.usuario_id));
        const dataClienteCartera = (Array.isArray(clientesCartera) ? clientesCartera : []).find(c => c.id === cliente?.id);
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

    const handleToggleModals = (modalStateSetter, value) => {
        return () => modalStateSetter(value);
    };

    // 🔥 RENDERIZADO DEL DASHBOARD UTILIZANDO LOS COMPONENTES MODULARES 🔥
    if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-white font-black text-gray-400"><Loader2 className="animate-spin text-black mb-4" size={48} /> SYNCING LIVE DATA...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 pt-8 gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase italic">HQ Dashboard</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 mt-1">Control Logístico Urabá <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span></p>
                </div>
                
                {/* 🔥 CONTROL DE ACCESO PARA BOTONES GLOBALES 🔥 */}
                {!esCajero && (
                    <div className="flex flex-wrap gap-2">
                        {tab === 'finanzas' && (<button onClick={() => { setTransaccionSeleccionada(null); setFormGasto({ monto: '', descripcion: '', categoria: 'Logística', tipo: 'EGRESO', fecha: '' }); setShowGastoModal(true); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/30 uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"><ArrowDownRight size={16} /> Movimiento Manual</button>)}
                        {tab === 'cartera' && (<button onClick={() => setShowCreditoModal(true)} className="bg-black hover:bg-gray-800 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"><Banknote size={16} /> Fiar Libre</button>)}
                        
                        <button onClick={exportarManifiestoCarga} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:bg-blue-700 transition-all"><Truck size={16}/> Extraer Ruta</button>
                        
                        {tab === 'productos' && (<button onClick={() => { setProductoEditando(null); setPreview(null); setFormulario({ nombre: '', precio: '', stock: '', stock_adicional: '', precio_nuevo_lote: '', categoriaId: '', descripcion: '', proveedor: '', costo_compra: '', margen_ganancia: '', tope_stock: 10, precio_mayor: '', cantidad_mayor: '', codigo_barras: '' }); setPrecioCalculado(0); setShowModal(true); }} className="bg-black hover:bg-gray-800 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"><Plus size={16} /> Producto</button>)}
                        {tab === 'clientes' && (<button onClick={() => setShowUsuarioModal(true)} className="bg-black hover:bg-gray-800 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl uppercase text-[9px] md:text-[10px] tracking-widest active:scale-95"><Users size={16} /> Cliente</button>)}

                        <button onClick={() => setShowConfigModal(true)} className="bg-gray-200 text-gray-900 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-gray-300 transition-all"><Settings size={16}/> Ajustes</button>
                    </div>
                )}
            </div>

            {/* 🔥 MÉTRICAS OCULTAS PARA EL CAJERO 🔥 */}
            {!esCajero && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                    <StatCard title="Ventas Mes Actual" value={`$${formatCurrency(kpis.ventasMes)}`} subtitle={`Hoy: $${formatCurrency(kpis.ventasHoy)}`} icon={<DollarSign />} color="bg-green-100 text-green-600" />
                    <StatCard title="Pedidos Pendientes" value={kpis.pendientes} subtitle="Listos para ruta" icon={<Clock />} color="bg-amber-100 text-amber-600" />
                    <StatCard title="Total Pedidos" value={(Array.isArray(pedidos) ? pedidos : []).length} subtitle="Histórico completo" icon={<ShoppingCart />} color="bg-blue-100 text-blue-600" />
                    <StatCard title="Clientes Registrados" value={(Array.isArray(usuarios) ? usuarios : []).length} subtitle="En base de datos" icon={<Users />} color="bg-purple-100 text-purple-600" />
                    <StatCard title="Total Productos" value={statsProductos.total} subtitle="En inventario" icon={<Package />} color="bg-indigo-100 text-indigo-600" />
                    <StatCard title="Stock Bajo" value={statsProductos.stockBajo} subtitle="Requieren atención" icon={<AlertTriangle />} color="bg-red-100 text-red-600" />
                    <StatCard title="Cuentas por Cobrar" value={`$${formatCurrency(statsCartera.porCobrar)}`} subtitle="Deuda pendiente total" icon={<Banknote />} color="bg-rose-100 text-rose-600" />
                    <StatCard title="Total Histórico Fiado" value={`$${formatCurrency(statsCartera.fiadoTotal)}`} subtitle="Lo que has fiado" icon={<FileText />} color="bg-orange-100 text-orange-600" />
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
                <div className="flex gap-2 p-1 bg-gray-200/50 rounded-2xl w-full md:w-fit border border-gray-100 overflow-x-auto custom-scrollbar">
                    {/* 🔥 FILTRO DE PESTAÑAS: EL CAJERO SOLO VE 'POS' Y 'PEDIDOS' 🔥 */}
                    {['reportes', 'pos', 'cartera', 'finanzas', 'pedidos', 'productos', 'clientes', 'categorias'].map((t) => {
                        if (esCajero && t !== 'pos' && t !== 'pedidos') return null;
                        
                        return (
                            <button key={t} onClick={() => setTab(t)} className={`px-4 md:px-8 py-2 md:py-3 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] transition-all whitespace-nowrap ${tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}>{t === 'reportes' ? 'Analíticas' : t === 'pos' ? 'Caja (POS)' : t}</button>
                        );
                    })}
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
                {/* RENDERIZADO DE LAS VISTAS MODULARES */}
                {tab === 'pos' && (
                    <PosTab 
                        productos={productos}
                        usuarios={usuarios}
                        fetchDatos={fetchDatos}
                        setShowCheatSheetModal={setShowCheatSheetModal}
                    />
                )}

                {tab === 'cartera' && (
                    <CarteraTab 
                        clientesCartera={clientesCartera}
                        setClienteEstadoCuenta={setClienteEstadoCuenta}
                    />
                )}

                {tab === 'reportes' && (
                    <ReportesTab 
                        dataAgendaEntregas={dataAgendaEntregas}
                        dataTopProductos={dataTopProductos}
                        dataVentasMensuales={dataVentasMensuales}
                        dataGraficoRutas={dataGraficoRutas}
                    />
                )}

                {tab === 'finanzas' && (
                    <FinanzasTab 
                        finanzasFiltradas={finanzasFiltradas}
                        dataMejoresClientes={dataMejoresClientes}
                        transaccionesFiltradas={transaccionesFiltradas}
                        setTransaccionSeleccionada={setTransaccionSeleccionada}
                        setFormGasto={setFormGasto}
                        setShowEditTransaccionModal={setShowEditTransaccionModal}
                        setShowDeleteTransaccionModal={setShowDeleteTransaccionModal}
                    />
                )}

                {tab === 'productos' && (
                    <ProductosTab 
                        productosFiltrados={productosFiltrados}
                        abrirModalEditar={abrirModalEditar}
                        abrirModalBaja={abrirModalBaja}
                        setProductoAEliminar={setProductoAEliminar}
                        setShowDeleteModal={setShowDeleteModal}
                    />
                )}

                {tab === 'pedidos' && (
                    <PedidosTab 
                        filtroTextoPedidos={filtroTextoPedidos}
                        setFiltroTextoPedidos={setFiltroTextoPedidos}
                        filtroFechaPedidos={filtroFechaPedidos}
                        setFiltroFechaPedidos={setFiltroFechaPedidos}
                        pedidosFiltradosVisual={pedidosFiltradosVisual}
                        calcularFechaReal={calcularFechaReal}
                        rutasDinamicas={rutasDinamicas}
                        horaLimite={horaLimite}
                        creditos={creditos}
                        transacciones={transacciones}
                        actualizarEstadoPedido={actualizarEstadoPedido}
                        actualizarRutaPedido={actualizarRutaPedido}
                        setPedidoDetalle={setPedidoDetalle}
                        setPedidoACobrar={setPedidoACobrar}
                        setShowCobroModal={setShowCobroModal}
                        setClienteEstadoCuenta={setClienteEstadoCuenta}
                        diasUnicosDropdown={diasUnicosDropdown}
                    />
                )}

                {tab === 'clientes' && (
                    <ClientesTab 
                        usuarios={usuarios}
                        handleToggleCredito={handleToggleCredito}
                        abrirModalEditarUsuario={abrirModalEditarUsuario}
                        setUsuarioSeleccionado={setUsuarioSeleccionado}
                        setShowPasswordModal={setShowPasswordModal}
                        setUsuarioAEliminar={setUsuarioAEliminar}
                    />
                )}

                {tab === 'categorias' && <GestionCategorias />}
            </div>

            <AdminModals 
                states={{ showBajaModal, productoBaja, showGastoModal, showEditTransaccionModal, transaccionSeleccionada, showDeleteTransaccionModal, pedidoDetalle, showModal, productoEditando, preview, precioCalculado, showEditUsuarioModal, showUsuarioModal, showPasswordModal, usuarioSeleccionado, showConfigModal, usuarioAEliminar, showDeleteModal, productoAEliminar, showCobroModal, pedidoACobrar, showCreditoModal, showAbonoModal, creditoSeleccionado, clienteEstadoCuenta, enviando, showCheatSheetModal }} 
                forms={{ formBaja, formGasto, formulario, formEditUsuario, formUsuario, nuevaPassword, whatsappTienda, horaLimite, nuevaRutaCiudad, nuevaRutaDia, formCredito, formAbono }} 
                setters={{ setShowBajaModal, setFormBaja, setShowGastoModal, setShowEditTransaccionModal, setFormGasto, setShowDeleteTransaccionModal, setPedidoDetalle, cerrarModal, setFormulario, setPreview, setShowEditUsuarioModal, setFormEditUsuario, setShowUsuarioModal, setFormUsuario, setShowPasswordModal, setNuevaPassword, setShowConfigModal, setWhatsappTienda, setHoraLimite, setNuevaRutaCiudad, setNuevaRutaDia, setUsuarioAEliminar, setShowDeleteModal, setShowCobroModal, setPedidoACobrar, setShowCreditoModal, setFormCredito, setShowAbonoModal, setFormAbono, setClienteEstadoCuenta, setCreditoSeleccionado, setShowCheatSheetModal }} 
                handlers={{ handleGuardarBaja, handleGuardarTransaccion, handleEliminarTransaccion, handleDevolucionProducto, handleGuardarProducto, handleImagenChange, handleEditarUsuario, handleCrearUsuario, handleRestablecerPassword, handleGuardarConfig, handleCrearRutaConfig, handleEliminarRutaConfig, handleEliminarUsuario, handleEliminar, handleCobro, handleCrearCredito, handleRegistrarAbono, handlePasarPedidoACartera }} 
                data={{ categorias, usuarios, rutasDinamicas, diasUnicosDropdown, clienteActualData, transacciones, productos }} 
            />
        </div>
    );
};

export default AdminDashboard;