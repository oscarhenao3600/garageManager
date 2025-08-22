import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Configurar jsPDF para español
jsPDF.autoTable = autoTable;

export interface ReportData {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  summary?: {
    label: string;
    value: string | number;
  }[];
  filters?: {
    label: string;
    value: string | number;
  }[];
}

export class ReportExporter {
  /**
   * Generar reporte en PDF
   */
  static async generatePDF(reportData: ReportData): Promise<Buffer> {
    const doc = new jsPDF();
    
    // Configurar idioma español
    doc.setLanguage('es');
    
    // Título del reporte
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title, 20, 20);
    
    // Subtítulo
    if (reportData.subtitle) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(reportData.subtitle, 20, 30);
    }
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 20, 40);
    
    // Filtros aplicados
    if (reportData.filters && reportData.filters.length > 0) {
      let yPos = 50;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Filtros aplicados:', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      reportData.filters.forEach(filter => {
        doc.text(`${filter.label}: ${filter.value}`, 25, yPos);
        yPos += 5;
      });
      yPos += 5;
    }
    
    // Tabla de datos
    if (reportData.data.length > 0) {
      const tableY = reportData.filters ? 80 : 60;
      
      (doc as any).autoTable({
        head: [reportData.headers],
        body: reportData.data,
        startY: tableY,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 20 },
      });
    }
    
    // Resumen al final
    if (reportData.summary && reportData.summary.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen:', 20, finalY);
      
      let yPos = finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      reportData.summary.forEach(item => {
        doc.text(`${item.label}: ${item.value}`, 25, yPos);
        yPos += 5;
      });
    }
    
    // Convertir a Buffer
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  /**
   * Generar reporte en Excel
   */
  static async generateExcel(reportData: ReportData): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja de datos
    const worksheetData = [
      [reportData.title],
      [reportData.subtitle || ''],
      [''],
      ['Generado el:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
      [''],
    ];
    
    // Agregar filtros
    if (reportData.filters && reportData.filters.length > 0) {
      worksheetData.push(['Filtros aplicados:']);
      reportData.filters.forEach(filter => {
        worksheetData.push([filter.label, filter.value]);
      });
      worksheetData.push(['']);
    }
    
    // Agregar encabezados y datos
    worksheetData.push(reportData.headers);
    reportData.data.forEach(row => {
      worksheetData.push(row);
    });
    
    // Agregar resumen
    if (reportData.summary && reportData.summary.length > 0) {
      worksheetData.push(['']);
      worksheetData.push(['Resumen:']);
      reportData.summary.forEach(item => {
        worksheetData.push([item.label, item.value]);
      });
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Aplicar estilos
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Estilo para el título
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, size: 16 },
        alignment: { horizontal: 'center' }
      };
    }
    
    // Estilo para encabezados
    const headerRow = range.s.r + (reportData.filters ? 7 : 5);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "2952A3" } },
          font: { color: { rgb: "FFFFFF" } }
        };
      }
    }
    
    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    
    // Convertir a Buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
  }
  
  /**
   * Generar reporte de ventas
   */
  static async generateSalesReport(data: any[], filters: any = {}): Promise<{ pdf: Buffer; excel: Buffer }> {
    const reportData: ReportData = {
      title: 'Reporte de Ventas',
      subtitle: 'Análisis detallado de ventas del período',
      headers: ['Fecha', 'Orden', 'Cliente', 'Vehículo', 'Servicios', 'Total', 'Estado'],
      data: data.map(item => [
        format(new Date(item.createdAt), 'dd/MM/yyyy'),
        item.orderNumber || item.id,
        `${item.client?.firstName || ''} ${item.client?.lastName || ''}`,
        `${item.vehicle?.brand || ''} ${item.vehicle?.model || ''} (${item.vehicle?.plate || ''})`,
        item.services?.map((s: any) => s.name).join(', ') || 'N/A',
        `$${item.total || item.finalCost || 0}`,
        item.status || 'N/A'
      ]),
      filters: Object.entries(filters).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as string | number
      })),
      summary: [
        { label: 'Total de Órdenes', value: data.length },
        { label: 'Total de Ventas', value: `$${data.reduce((sum, item) => sum + (item.total || item.finalCost || 0), 0)}` },
        { label: 'Promedio por Orden', value: `$${data.length > 0 ? (data.reduce((sum, item) => sum + (item.total || item.finalCost || 0), 0) / data.length).toFixed(2) : 0}` }
      ]
    };
    
    const [pdf, excel] = await Promise.all([
      this.generatePDF(reportData),
      this.generateExcel(reportData)
    ]);
    
    return { pdf, excel };
  }
  
  /**
   * Generar reporte de inventario
   */
  static async generateInventoryReport(data: any[], filters: any = {}): Promise<{ pdf: Buffer; excel: Buffer }> {
    const reportData: ReportData = {
      title: 'Reporte de Inventario',
      subtitle: 'Estado actual del inventario',
      headers: ['Código', 'Nombre', 'Stock Actual', 'Stock Mínimo', 'Precio', 'Categoría', 'Estado'],
      data: data.map(item => [
        item.code || 'N/A',
        item.name || 'N/A',
        item.currentStock || 0,
        item.minStock || 0,
        `$${item.price || 0}`,
        item.category || 'N/A',
        (item.currentStock || 0) <= (item.minStock || 0) ? 'Stock Bajo' : 'Normal'
      ]),
      filters: Object.entries(filters).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as string | number
      })),
      summary: [
        { label: 'Total de Items', value: data.length },
        { label: 'Items con Stock Bajo', value: data.filter(item => (item.currentStock || 0) <= (item.minStock || 0)).length },
        { label: 'Valor Total del Inventario', value: `$${data.reduce((sum, item) => sum + ((item.currentStock || 0) * (item.price || 0)), 0).toFixed(2)}` }
      ]
    };
    
    const [pdf, excel] = await Promise.all([
      this.generatePDF(reportData),
      this.generateExcel(reportData)
    ]);
    
    return { pdf, excel };
  }
  
  /**
   * Generar reporte financiero
   */
  static async generateFinancialReport(data: any[], filters: any = {}): Promise<{ pdf: Buffer; excel: Buffer }> {
    const totalRevenue = data.reduce((sum, item) => sum + (item.total || item.finalCost || 0), 0);
    const totalExpenses = totalRevenue * 0.3; // Estimado
    const netProfit = totalRevenue - totalExpenses;
    
    const reportData: ReportData = {
      title: 'Reporte Financiero',
      subtitle: 'Análisis de ingresos, gastos y ganancias',
      headers: ['Período', 'Ingresos', 'Gastos', 'Ganancia Neta', 'Margen %'],
      data: [
        ['Total', `$${totalRevenue.toFixed(2)}`, `$${totalExpenses.toFixed(2)}`, `$${netProfit.toFixed(2)}`, `${((netProfit / totalRevenue) * 100).toFixed(1)}%`]
      ],
      filters: Object.entries(filters).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as string | number
      })),
      summary: [
        { label: 'Ingresos Totales', value: `$${totalRevenue.toFixed(2)}` },
        { label: 'Gastos Totales', value: `$${totalExpenses.toFixed(2)}` },
        { label: 'Ganancia Neta', value: `$${netProfit.toFixed(2)}` },
        { label: 'Margen de Ganancia', value: `${((netProfit / totalRevenue) * 100).toFixed(1)}%` }
      ]
    };
    
    const [pdf, excel] = await Promise.all([
      this.generatePDF(reportData),
      this.generateExcel(reportData)
    ]);
    
    return { pdf, excel };
  }
}

export default ReportExporter;
