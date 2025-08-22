import ReportExporter from '../../utils/reportExporter';

describe('ReportExporter', () => {
  const mockReportData = {
    title: 'Test Report',
    subtitle: 'Test Subtitle',
    headers: ['Col1', 'Col2', 'Col3'],
    data: [
      ['Data1', 'Data2', 'Data3'],
      ['Data4', 'Data5', 'Data6']
    ],
    summary: [
      { label: 'Total', value: 2 }
    ],
    filters: [
      { label: 'Date', value: '2024-01-01' }
    ]
  };

  describe('generatePDF', () => {
    it('should generate PDF buffer', async () => {
      const result = await ReportExporter.generatePDF(mockReportData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty data', async () => {
      const emptyData = { ...mockReportData, data: [] };
      const result = await ReportExporter.generatePDF(emptyData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateExcel', () => {
    it('should generate Excel buffer', async () => {
      const result = await ReportExporter.generateExcel(mockReportData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty data', async () => {
      const emptyData = { ...mockReportData, data: [] };
      const result = await ReportExporter.generateExcel(emptyData);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateSalesReport', () => {
    const mockSalesData = [
      {
        id: 1,
        orderNumber: 'ORD-001',
        client: { firstName: 'John', lastName: 'Doe' },
        vehicle: { brand: 'Toyota', model: 'Camry', plate: 'ABC123' },
        total: 150.00,
        status: 'completed',
        createdAt: new Date('2024-01-01')
      }
    ];

    it('should generate sales report in both formats', async () => {
      const result = await ReportExporter.generateSalesReport(mockSalesData, { status: 'completed' });
      
      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.excel).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.excel.length).toBeGreaterThan(0);
    });
  });

  describe('generateInventoryReport', () => {
    const mockInventoryData = [
      {
        code: 'ITEM-001',
        name: 'Test Item',
        currentStock: 10,
        minStock: 5,
        price: 25.00,
        category: 'Test Category'
      }
    ];

    it('should generate inventory report in both formats', async () => {
      const result = await ReportExporter.generateInventoryReport(mockInventoryData, { category: 'Test Category' });
      
      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.excel).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.excel.length).toBeGreaterThan(0);
    });
  });

  describe('generateFinancialReport', () => {
    const mockFinancialData = [
      {
        total: 1000.00,
        finalCost: 1000.00
      }
    ];

    it('should generate financial report in both formats', async () => {
      const result = await ReportExporter.generateFinancialReport(mockFinancialData, { fromDate: '2024-01-01' });
      
      expect(result.pdf).toBeInstanceOf(Buffer);
      expect(result.excel).toBeInstanceOf(Buffer);
      expect(result.pdf.length).toBeGreaterThan(0);
      expect(result.excel.length).toBeGreaterThan(0);
    });
  });
});
