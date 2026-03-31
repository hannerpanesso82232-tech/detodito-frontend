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

// 🔥 NUEVA FUNCIÓN: GENERADOR DE TIRILLA TÉRMICA (80mm / 58mm) 🔥
export const imprimirTirillaPOS = (pedido) => {
    // Abrimos una ventana temporal invisible para imprimir
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    // Generamos las filas de los productos
    const itemsHtml = (pedido.Detalles || []).map(item => {
        const nombreStr = item.Producto?.nombre || item.nombre || 'Item';
        const cant = item.cantidad;
        const precio = parseFloat(item.precioUnitario || 0);
        const sub = cant * precio;
        return `
        <div class="item-row">
            <span class="desc">${nombreStr.substring(0, 18)}</span>
            <span class="cant">${cant}</span>
            <span class="precio">$${sub.toLocaleString('es-CO')}</span>
        </div>
        `;
    }).join('');

    const totalFormateado = parseFloat(pedido.total).toLocaleString('es-CO');
    const fecha = new Date(pedido.fecha || new Date());
    const fechaStr = fecha.toLocaleDateString('es-CO');
    const horaStr = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const clienteStr = pedido.Usuario?.nombre || 'VENTA MOSTRADOR';
    const documentoStr = pedido.Usuario?.cedula || '0000';

    // Maquetación exacta para impresoras POS (CSS Print)
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Tirilla #${pedido.id}</title>
        <style>
            @page { margin: 0; } /* Quita los márgenes del navegador (Header/Footer url) */
            body { 
                font-family: 'Courier New', Courier, monospace; 
                width: 80mm; /* Estándar de impresora térmica */
                margin: 0 auto; 
                padding: 10px 15px;
                color: #000;
                font-size: 12px;
                text-transform: uppercase;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .header { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h3 { margin: 0 0 5px 0; font-size: 16px; }
            .header p { margin: 2px 0; font-size: 10px; }
            
            .info-section { margin-bottom: 10px; font-size: 11px; line-height: 1.4; }
            .flex-between { display: flex; justify-content: space-between; }
            
            .table-header { 
                display: flex; 
                justify-content: space-between; 
                border-top: 1px dashed #000; 
                border-bottom: 1px dashed #000; 
                padding: 5px 0; 
                margin-bottom: 5px;
                font-weight: bold;
                font-size: 11px;
            }
            
            .item-row { 
                display: flex; 
                justify-content: space-between; 
                padding: 3px 0;
                font-size: 11px;
            }
            
            .desc { flex: 2; text-align: left; padding-right: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .cant { flex: 1; text-align: center; }
            .precio { flex: 1; text-align: right; }
            
            .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-top: 5px; }
            
            .footer { margin-top: 15px; font-size: 10px; text-align: center; border-top: 1px dashed #000; padding-top: 10px;}
        </style>
    </head>
    <body>
        <div class="header text-center">
            <h3>DETODITO</h3>
            <p>NIT: 000.000.000-0</p>
            <p>RÉGIMEN RESPONSABLE DE IVA</p>
            <p>TEL: 000 000 0000</p>
        </div>
        
        <div class="info-section">
            <div class="flex-between"><span>FACTURA VENTA:</span> <span>#${pedido.id}</span></div>
            <div class="flex-between"><span>FECHA: ${fechaStr}</span> <span>HORA: ${horaStr}</span></div>
            <div>CLIENTE: ${clienteStr}</div>
            <div>C.C./NIT: ${documentoStr}</div>
            <div>MÉTODO: ${pedido.metodo_pago}</div>
        </div>

        <div class="table-header">
            <span class="desc">DESCRIPCIÓN</span>
            <span class="cant">CANT</span>
            <span class="precio">PRECIO</span>
        </div>

        <div style="margin-bottom: 10px;">
            ${itemsHtml}
        </div>

        <div class="totals">
            <div class="flex-between" style="font-size: 11px;">
                <span>SUBTOTAL:</span>
                <span>$${totalFormateado}</span>
            </div>
            <div class="total-row">
                <span>TOTAL FACTURA:</span>
                <span>$${totalFormateado}</span>
            </div>
            <div class="flex-between" style="font-size: 11px; margin-top: 5px;">
                <span>${pedido.metodo_pago.includes('CONTADO') ? 'EFECTIVO:' : 'CRÉDITO:'}</span>
                <span>$${totalFormateado}</span>
            </div>
        </div>

        <div class="footer text-center">
            <p>NO SE DEVUELVE DINERO</p>
            <p>CONSERVE SU TIRILLA PARA RECLAMOS</p>
            <p style="margin-top: 10px; font-weight: bold;">GRACIAS POR SU COMPRA</p>
        </div>

        <script>
            // Dispara el menú de impresión de Windows inmediatamente
            window.onload = function() {
                setTimeout(() => {
                    window.print();
                    window.close(); // Cierra la pestaña fantasma al terminar
                }, 300);
            }
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};