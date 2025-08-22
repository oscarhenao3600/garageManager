import { Router, Request, Response } from 'express';
import { authenticateToken, isAdmin, type AuthenticatedRequest } from '../middleware/authMiddleware';
import { dbStorage } from '../storage';
import ReportExporter from '../utils/reportExporter';

const router = Router();

/**
 * POST /api/export/sales
 * Exportar reporte de ventas
 */
router.post('/sales', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format: exportFormat, fromDate, toDate, status } = req.body;
    
    // Obtener datos de ventas
    const salesData = await dbStorage.getServiceOrders({
      status,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      limit: 1000 // Obtener más datos para el reporte
    });
    
    // Enriquecer datos con información de clientes y vehículos
    const enrichedData = await Promise.all(
      salesData.map(async (order) => {
        const [client] = await dbStorage.getClientById(order.clientId);
        const [vehicle] = await dbStorage.getVehicleById(order.vehicleId);
        return {
          ...order,
          client,
          vehicle
        };
      })
    );
    
    // Filtros aplicados
    const filters: any = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    if (status) filters.status = status;
    
    // Generar reporte
    const report = await ReportExporter.generateSalesReport(enrichedData, filters);
    
    // Configurar headers de respuesta
    const fileName = `reporte-ventas-${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
      res.send(report.excel);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
      res.send(report.pdf);
    }
    
  } catch (error) {
    console.error('Error exporting sales report:', error);
    res.status(500).json({ message: 'Error generando reporte de ventas' });
  }
});

/**
 * POST /api/export/inventory
 * Exportar reporte de inventario
 */
router.post('/inventory', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format: exportFormat, category, lowStock } = req.body;
    
    // Obtener datos de inventario
    let inventoryData = await dbStorage.getInventoryItems();
    
    // Aplicar filtros
    if (category) {
      inventoryData = inventoryData.filter(item => item.category === category);
    }
    
    if (lowStock) {
      inventoryData = inventoryData.filter(item => 
        (item.currentStock || 0) <= (item.minStock || 0)
      );
    }
    
    // Filtros aplicados
    const filters: any = {};
    if (category) filters.category = category;
    if (lowStock) filters.lowStock = 'Solo items con stock bajo';
    
    // Generar reporte
    const report = await ReportExporter.generateInventoryReport(inventoryData, filters);
    
    // Configurar headers de respuesta
    const fileName = `reporte-inventario-${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
      res.send(report.excel);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
      res.send(report.pdf);
    }
    
  } catch (error) {
    console.error('Error exporting inventory report:', error);
    res.status(500).json({ message: 'Error generando reporte de inventario' });
  }
});

/**
 * POST /api/export/financial
 * Exportar reporte financiero
 */
router.post('/financial', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format: exportFormat, fromDate, toDate } = req.body;
    
    // Obtener datos de ventas para el período
    const salesData = await dbStorage.getServiceOrders({
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      limit: 1000
    });
    
    // Filtros aplicados
    const filters: any = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    
    // Generar reporte
    const report = await ReportExporter.generateFinancialReport(salesData, filters);
    
    // Configurar headers de respuesta
    const fileName = `reporte-financiero-${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
      res.send(report.excel);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
      res.send(report.pdf);
    }
    
  } catch (error) {
    console.error('Error exporting financial report:', error);
    res.status(500).json({ message: 'Error generando reporte financiero' });
  }
});

/**
 * POST /api/export/custom
 * Exportar reporte personalizado
 */
router.post('/custom', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format: exportFormat, title, subtitle, headers, data, summary, filters } = req.body;
    
    // Validar datos requeridos
    if (!title || !headers || !data) {
      return res.status(400).json({ 
        message: 'Título, encabezados y datos son requeridos' 
      });
    }
    
    // Crear estructura de reporte
    const reportData = {
      title,
      subtitle,
      headers,
      data,
      summary,
      filters
    };
    
    // Generar reporte
    let report;
    if (exportFormat === 'excel') {
      const excel = await ReportExporter.generateExcel(reportData);
      report = { excel };
    } else {
      const pdf = await ReportExporter.generatePDF(reportData);
      report = { pdf };
    }
    
    // Configurar headers de respuesta
    const fileName = `reporte-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
      res.send(report.excel);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
      res.send(report.pdf);
    }
    
  } catch (error) {
    console.error('Error exporting custom report:', error);
    res.status(500).json({ message: 'Error generando reporte personalizado' });
  }
});

export default router;
