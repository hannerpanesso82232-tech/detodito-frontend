import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarPDFPedidos = (pedidos) => {
  if (!pedidos || pedidos.length === 0) {
    return alert("No hay datos para generar el reporte");
  }

  const doc = new jsPDF();
  const nombreEmpresa = "MODERN SHOP S.A.C.";
  const fechaActual = new Date().toLocaleDateString('es-ES');
  const horaActual = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  // --- 1. ENCABEZADO ESTILO PREMIUM ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("MODERN", 14, 20);
  
  doc.setTextColor(37, 99, 235); 
  doc.text("SHOP", 54, 20);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("LOGISTICS & INVENTORY MANAGEMENT SYSTEM", 14, 28);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`FECHA DE EMISIÓN: ${fechaActual}`, 145, 20);
  doc.text(`HORA: ${horaActual}`, 145, 25);

  // --- 2. RESUMEN DE KPI ---
  const ingresosTotales = pedidos
    .filter(p => p.estado?.toUpperCase() !== 'CANCELADO')
    .reduce((acc, p) => acc + parseFloat(p.total || 0), 0);

  const totalPedidos = pedidos.length;
  const pedidosCompletados = pedidos.filter(p => p.estado?.toUpperCase() === 'ENTREGADO').length;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN ESTRATÉGICO", 14, 52);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 55, 196, 55);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Volumen de Órdenes: ${totalPedidos}`, 14, 62);
  doc.text(`Órdenes Finalizadas: ${pedidosCompletados}`, 14, 67);
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(135, 58, 61, 12, 2, 2, 'F');
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL NETO: $${ingresosTotales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 138, 66);

  // --- 3. MAPEADO DE DATOS ---
  const tableRows = pedidos.map(ped => {
    const idOrden = ped.id ? `#${ped.id.toString().padStart(5, '0')}` : 'N/A';
    const cliente = ped.Usuario?.nombre ? ped.Usuario.nombre.toUpperCase() : 'CLIENTE NO REGISTRADO';
    
    let fechaStr = 'S/F';
    if (ped.createdAt || ped.fecha) {
        const d = new Date(ped.createdAt || ped.fecha);
        fechaStr = !isNaN(d) ? d.toLocaleDateString('es-ES') : 'S/F';
    }

    const estado = ped.estado ? ped.estado.toUpperCase() : 'PENDIENTE';
    const total = ped.total ? `$${parseFloat(ped.total).toFixed(2)}` : '$0.00';

    return [idOrden, cliente, fechaStr, estado, total];
  });

  // --- 4. GENERACIÓN DE TABLA ---
  autoTable(doc, {
    startY: 75,
    head: [['ID REF', 'CLIENTE / USUARIO', 'FECHA', 'ESTADO LOGÍSTICO', 'TOTAL']],
    body: tableRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [15, 23, 42], 
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 3) {
        const text = data.cell.raw;
        if (text === 'CANCELADO') data.cell.styles.textColor = [220, 38, 38];
        if (text === 'ENTREGADO') data.cell.styles.textColor = [22, 163, 74];
        if (text === 'ENVIADO') data.cell.styles.textColor = [37, 99, 235];
      }
    }
  });

  // --- 5. PIE DE PÁGINA ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`MODERN SHOP S.A.C. - Página ${i} de ${totalPages}`, 14, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`MODERN_PEDIDOS_${fechaActual.replace(/\//g, '-')}.pdf`);
};