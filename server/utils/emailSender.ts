import nodemailer from 'nodemailer';
import { type Invoice } from '@shared/schema';
import { dbStorage } from '../storage';
import { generateInvoicePDF } from './pdfGenerator';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export async function sendInvoiceEmail(invoice: Invoice, recipientEmail: string): Promise<void> {
  const companySettings = await dbStorage.getCompanySettings();
  if (!companySettings) {
    throw new Error('Configuración de la empresa no encontrada');
  }

  // Obtener configuración de email de la configuración de la empresa
  const settings = companySettings.electronicInvoiceSettings 
    ? (typeof companySettings.electronicInvoiceSettings === 'string' 
      ? JSON.parse(companySettings.electronicInvoiceSettings) 
      : companySettings.electronicInvoiceSettings)
    : null;

  if (!settings?.email) {
    throw new Error('Configuración de correo electrónico no encontrada');
  }

  // Crear transportador de email
  const transporter = nodemailer.createTransport(settings.email as EmailConfig);

  // Generar PDF
  const pdfPath = await generateInvoicePDF(invoice);

  // Obtener información del cliente
  const client = await dbStorage.getClientByServiceOrder(invoice.serviceOrderId);
  if (!client) {
    throw new Error('Cliente no encontrado');
  }

  // Enviar email
  await transporter.sendMail({
    from: `"${companySettings.name}" <${settings.email.auth.user}>`,
    to: recipientEmail,
    subject: `Factura ${invoice.invoiceNumber} - ${companySettings.name}`,
    html: `
      <h2>Factura ${invoice.invoiceNumber}</h2>
      <p>Estimado/a ${client.firstName} ${client.lastName},</p>
      <p>Adjunto encontrará la factura correspondiente a los servicios prestados.</p>
      <p><strong>Detalles de la factura:</strong></p>
      <ul>
        <li>Número: ${invoice.invoiceNumber}</li>
        <li>Fecha: ${invoice.createdAt.toLocaleDateString('es-CO')}</li>
        <li>Vencimiento: ${invoice.dueDate.toLocaleDateString('es-CO')}</li>
        <li>Total: ${formatCurrency(Number(invoice.total))}</li>
      </ul>
      ${companySettings.bankInfo ? `
      <p><strong>Información bancaria para el pago:</strong></p>
      <pre>${JSON.stringify(
        typeof companySettings.bankInfo === 'string' 
          ? JSON.parse(companySettings.bankInfo) 
          : companySettings.bankInfo, 
        null, 
        2
      )}</pre>
      ` : ''}
      <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
      <br>
      <p>Atentamente,</p>
      <p><strong>${companySettings.name}</strong></p>
      <p>${companySettings.address}</p>
      <p>Tel: ${companySettings.phone}</p>
      <p>Email: ${companySettings.email}</p>
      ${companySettings.website ? `<p>Web: ${companySettings.website}</p>` : ''}
    `,
    attachments: [
      {
        filename: `factura-${invoice.invoiceNumber}.pdf`,
        path: pdfPath
      }
    ]
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}
