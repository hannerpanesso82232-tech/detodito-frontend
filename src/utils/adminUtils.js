import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const formatCurrency = (valor) => {
    return Number(valor || 0).toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

export const formatearImagen = (url) => {
    if (!url) return 'https://placehold.co/150';
    let urlLimpia = url;
    if (urlLimpia.includes('localhost:3000') || urlLimpia.includes('localhost:5000')) {
        urlLimpia = urlLimpia.replace(/http:\/\/localhost:(3000|5000)/g, '');
    }
    if (urlLimpia.startsWith('https://') || (urlLimpia.startsWith('http://') && !urlLimpia.includes('localhost'))) {
        return urlLimpia;
    }
    const base = process.env.REACT_APP_API_URL || "http://localhost:3000";
    return `${base}${urlLimpia.startsWith('/') ? '' : '/'}${urlLimpia}`;
};

export const calcularFechaReal = (rutaGuardada, ciudadCliente, direccionCliente, rutasDB = [], fechaCreacionStr = null, horaLimite = "20:00") => {
    let diaRuta = rutaGuardada;
    const fechaMaxima = new Date(8640000000000000); 
    
    if (!diaRuta || diaRuta.toUpperCase() === "A CONVENIR") {
        const textoCliente = `${ciudadCliente || ''} ${direccionCliente || ''}`.toUpperCase();
        let matchEncontrado = null;
        for (const ruta of rutasDB) {
            const palabrasClave = (ruta.ciudad || '').toUpperCase().split(',').map(c => c.trim());
            if (palabrasClave.some(palabra => palabra !== '' && textoCliente.includes(palabra))) {
                matchEncontrado = ruta.dia_ruta;
                break;
            }
        }
        if (!matchEncontrado) {
            const MAPA_RUTAS_DEFECTO = {
                "CHIGORODO": "Lunes", "CAREPA": "Lunes", "MUTATA": "Martes", "PAVARANDO": "Martes",
                "BAJIRA": "Miércoles", "PLAYA ROJA": "Miércoles", "APARTADO": "Jueves", "TURBO": "Jueves",
                "NECOCLI": "Viernes", "ARBOLETES": "Viernes"
            };
            for (const [ciudadMap, diaMap] of Object.entries(MAPA_RUTAS_DEFECTO)) {
                if (textoCliente.includes(ciudadMap)) {
                    matchEncontrado = diaMap; break;
                }
            }
        }
        diaRuta = matchEncontrado || "A CONVENIR";
    }

    if (diaRuta.toUpperCase() === "A CONVENIR") return { diaNombre: "A CONVENIR", fechaFormateada: "Por coordinar con cliente", fechaRaw: fechaMaxima };

    const mapDias = { "DOMINGO": 0, "LUNES": 1, "MARTES": 2, "MIÉRCOLES": 3, "MIERCOLES": 3, "JUEVES": 4, "VIERNES": 5, "SÁBADO": 6, "SABADO": 6 };
    const diaDestino = mapDias[diaRuta.toUpperCase()];
    
    if (diaDestino === undefined) return { diaNombre: diaRuta, fechaFormateada: diaRuta, fechaRaw: fechaMaxima };

    const fechaBase = fechaCreacionStr ? new Date(fechaCreacionStr) : new Date();
    const diaActual = fechaBase.getDay(); 
    let diasFaltantes = diaDestino - diaActual;

    if (diasFaltantes < 0) diasFaltantes += 7; 
    if (diasFaltantes === 0) diasFaltantes += 7; 
    else if (diasFaltantes === 1) {
        const [limiteHora, limiteMinuto] = horaLimite.split(':').map(Number);
        const horaPedido = fechaBase.getHours();
        const minutoPedido = fechaBase.getMinutes();
        if (horaPedido > limiteHora || (horaPedido === limiteHora && minutoPedido >= limiteMinuto)) {
            diasFaltantes += 7; 
        }
    }

    const fechaEntrega = new Date(fechaBase);
    fechaEntrega.setDate(fechaBase.getDate() + diasFaltantes);
    fechaEntrega.setHours(0, 0, 0, 0); 

    return { 
        diaNombre: diaRuta, 
        fechaFormateada: fechaEntrega.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }),
        fechaRaw: fechaEntrega 
    };
};

export const imprimirFacturaCliente = (pedido, rutasDinamicas = [], horaLimiteGlobal) => {
    toast.success("Generando PDF de la factura...");
    const doc = new jsPDF();
    doc.setFillColor(0, 0, 0); doc.rect(0, 0, 210, 35, 'F'); 
    doc.setFontSize(24); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255); doc.text("MODERN SHOP S.A.C.", 14, 18);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("ORDEN DE ENTREGA Y FACTURA DE VENTA", 14, 26);
    doc.setTextColor(0, 0, 0); doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("DATOS DEL CLIENTE", 14, 45);
    const nombreCliente = pedido.Usuario?.nombre || pedido.cliente || 'Consumidor Final';
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${nombreCliente}`, 14, 52);
    doc.text(`Dirección: ${pedido.direccion || pedido.Usuario?.direccion || 'A Convenir'}`, 14, 58);
    doc.text(`Ciudad/Zona: ${pedido.Usuario?.ciudad || pedido.ruta || 'Urabá Antioquia'}`, 14, 64);
    const infoRuta = calcularFechaReal(pedido.ruta, pedido.Usuario?.ciudad, pedido.direccion, rutasDinamicas, pedido.fecha, horaLimiteGlobal);
    doc.setFont("helvetica", "bold"); doc.text(`N° DE ORDEN: #${pedido.id}`, 130, 45);
    doc.setFont("helvetica", "normal"); doc.text(`Fecha Pedido: ${new Date(pedido.fecha || new Date()).toLocaleDateString('es-ES')}`, 130, 52);
    doc.text(`Estado: ${(pedido.estado || 'Pendiente').toUpperCase()}`, 130, 58);
    doc.setFont("helvetica", "bold"); doc.text(`Entrega: ${infoRuta.fechaFormateada}`, 130, 64); 
    const tableRows = (pedido.Detalles || pedido.items || []).map(item => {
        const nombreItem = item.Producto?.nombre || item.nombre || 'Item';
        const precioUnitario = parseFloat(item.precioUnitario || item.precio || 0);
        const subtotal = item.cantidad * precioUnitario;
        return [item.cantidad, nombreItem.toUpperCase(), `$${formatCurrency(precioUnitario)}`, `$${formatCurrency(subtotal)}`];
    });
    autoTable(doc, { startY: 75, head: [['CANT', 'PRODUCTO / REFERENCIA', 'PRECIO UNITARIO', 'SUBTOTAL']], body: tableRows, theme: 'striped', headStyles: { fillColor: [0, 0, 0], textColor: [255,255,255], fontStyle: 'bold' }, styles: { fontSize: 9, cellPadding: 5 } });
    const finalY = doc.lastAutoTable.finalY || 75;
    doc.setFillColor(248, 250, 252); doc.rect(120, finalY + 5, 75, 12, 'F'); doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(`TOTAL: $${formatCurrency(pedido.total)}`, 125, finalY + 13);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.line(14, finalY + 50, 80, finalY + 50); doc.text("Firma de Recibido a Conformidad", 14, finalY + 55); doc.text(`C.C: _______________________`, 14, finalY + 62); doc.line(110, finalY + 50, 180, finalY + 50); doc.text("Entregado por (Firma del Conductor)", 110, finalY + 55);
    doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.text("Gracias por elegirnos Dios te bendiga. Este documento avala la entrega de los productos.", 14, 280);
    const nombreArchivoSeguro = nombreCliente.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''); doc.save(`Factura_${nombreArchivoSeguro}_ModernShop_Orden${pedido.id}.pdf`); 
};