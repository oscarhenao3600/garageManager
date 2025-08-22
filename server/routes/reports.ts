import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { authenticateToken, isAdmin, type AuthenticatedRequest } from "../middleware/authMiddleware";

const router = Router();

// Reporte de ventas por período
router.get("/sales", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, groupBy = 'month' } = req.query;
    
    const salesReport = await dbStorage.getSalesReport({
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      groupBy: groupBy as string
    });

    res.json(salesReport);
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ message: 'Error generating sales report' });
  }
});

// Reporte de inventario con alertas
router.get("/inventory", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const inventoryReport = await dbStorage.getInventoryReport();
    res.json(inventoryReport);
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ message: 'Error generating inventory report' });
  }
});

// Reporte de vehículos con documentos próximos a vencer
router.get("/vehicles/expiring-documents", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const expiringDocs = await dbStorage.getVehiclesWithExpiringDocuments(parseInt(days as string));
    res.json(expiringDocs);
  } catch (error) {
    console.error('Error generating expiring documents report:', error);
    res.status(500).json({ message: 'Error generating expiring documents report' });
  }
});

// Reporte de rendimiento de operarios
router.get("/operators/performance", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    
    const performanceReport = await dbStorage.getOperatorPerformanceReport({
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined
    });

    res.json(performanceReport);
  } catch (error) {
    console.error('Error generating operator performance report:', error);
    res.status(500).json({ message: 'Error generating operator performance report' });
  }
});

// Reporte de clientes más frecuentes
router.get("/clients/top", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { limit = 10, fromDate, toDate } = req.query;
    
    const topClients = await dbStorage.getTopClients({
      limit: parseInt(limit as string),
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined
    });

    res.json(topClients);
  } catch (error) {
    console.error('Error generating top clients report:', error);
    res.status(500).json({ message: 'Error generating top clients report' });
  }
});

// Reporte de servicios más solicitados
router.get("/services/popular", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { limit = 10, fromDate, toDate } = req.query;
    
    const popularServices = await dbStorage.getPopularServices({
      limit: parseInt(limit as string),
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined
    });

    res.json(popularServices);
  } catch (error) {
    console.error('Error generating popular services report:', error);
    res.status(500).json({ message: 'Error generating popular services report' });
  }
});

// Reporte de ganancias y pérdidas
router.get("/financial/pnl", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    
    const pnlReport = await dbStorage.getProfitLossReport({
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined
    });

    res.json(pnlReport);
  } catch (error) {
    console.error('Error generating P&L report:', error);
    res.status(500).json({ message: 'Error generating P&L report' });
  }
});

// Reporte de facturación por estado
router.get("/billing/status", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    
    const billingStatusReport = await dbStorage.getBillingStatusReport({
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined
    });

    res.json(billingStatusReport);
  } catch (error) {
    console.error('Error generating billing status report:', error);
    res.status(500).json({ message: 'Error generating billing status report' });
  }
});

export default router;
