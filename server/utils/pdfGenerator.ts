import PDFDocument from 'pdfkit';
import { type Invoice } from '@shared/schema';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';

export async function generateInvoicePDF(invoice: InvoiceWithItems): Promise<string> {
  const companySettings = await storage.getCompanySettings();
  if (!companySettings) {
    throw new Error('Configuración de la empresa no encontrada');
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Crear directorio para PDFs si no existe
  const pdfDir = path.join(__dirname, '../public/pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  const filename = `invoice-${invoice.invoiceNumber}.pdf`;
  const filePath = path.join(pdfDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  // Encabezado
  if (companySettings.logo) {
    doc.image(companySettings.logo, 50, 45, { width: 100 });
  }

  doc.font('Helvetica-Bold')
     .fontSize(20)
     .text(companySettings.name, 200, 45, { align: 'right' });

  doc.font('Helvetica')
     .fontSize(10)
     .text(companySettings.address, 200, 65, { align: 'right' })
     .text(`NIT: ${companySettings.nit}`, 200, 80, { align: 'right' })
     .text(`Tel: ${companySettings.phone}`, 200, 95, { align: 'right' })
     .text(companySettings.email, 200, 110, { align: 'right' });

  // Información de la factura
  doc.font('Helvetica-Bold')
     .fontSize(14)
     .text('FACTURA', 50, 150)
     .font('Helvetica')
     .fontSize(10)
     .text(`Número: ${invoice.invoiceNumber}`, 50, 170)
     .text(`Fecha: ${invoice.createdAt.toLocaleDateString('es-CO')}`, 50, 185)
     .text(`Vencimiento: ${invoice.dueDate.toLocaleDateString('es-CO')}`, 50, 200);

  // Información del cliente
  const client = await storage.getClientByServiceOrder(invoice.serviceOrderId);
  if (client) {
    doc.text(`Cliente: ${client.firstName} ${client.lastName}`, 300, 170)
       .text(`Documento: ${client.documentNumber}`, 300, 185)
       .text(`Teléfono: ${client.phone}`, 300, 200);
  }

  // Tabla de items
  let y = 250;

  // Encabezado de la tabla
  doc.font('Helvetica-Bold')
     .rect(50, y, 500, 20)
     .fill('#f6f6f6')
     .fillColor('black')
     .text('Descripción', 60, y + 5)
     .text('Cantidad', 300, y + 5)
     .text('Precio', 370, y + 5)
     .text('Total', 470, y + 5);

  y += 30;

  // Items
  doc.font('Helvetica');
  for (const item of invoice.items) {
    doc.text(item.description, 60, y)
       .text(item.quantity.toString(), 300, y)
       .text(formatCurrency(item.price), 370, y)
       .text(formatCurrency(item.quantity * item.price), 470, y);
    y += 20;
  }

  y += 10;

  // Totales
  doc.font('Helvetica-Bold')
     .text('Subtotal:', 370, y)
     .text(formatCurrency(Number(invoice.subtotal)), 470, y);
  y += 20;
  doc.text('IVA (19%):', 370, y)
     .text(formatCurrency(Number(invoice.tax)), 470, y);
  y += 20;
  doc.fontSize(12)
     .text('Total:', 370, y)
     .text(formatCurrency(Number(invoice.total)), 470, y);

  // Pie de página
  if (companySettings.invoiceFooter) {
    doc.font('Helvetica')
       .fontSize(10)
       .text(companySettings.invoiceFooter, 50, 700, { align: 'center' });
  }

  // Información bancaria
  if (companySettings.bankInfo) {
    const bankInfo = JSON.parse(companySettings.bankInfo);
    y += 50;
    doc.fontSize(10)
       .text('Información Bancaria:', 50, y)
       .font('Helvetica');
    y += 15;
    Object.entries(bankInfo).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 50, y);
      y += 15;
    });
  }

  // Notas
  if (companySettings.invoiceNotes) {
    doc.font('Helvetica')
       .fontSize(10)
       .text(companySettings.invoiceNotes, 50, y + 20);
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}
