// lib/services/ReportService.ts

export class ReportService {
  private sales: any[];
  private expenses: any[];
  private products: any[];
  private invoices: any[];

  constructor(
    sales: any[] = [],
    expenses: any[] = [],
    products: any[] = [],
    invoices: any[] = [],
    customerInvoices: any[] = [],
    private selectedMonth: number,
    private selectedYear: number,
    private timeRange: string
  ) {
    const normalizedCustomerInvoices = (customerInvoices || []).map(inv => ({
      ...inv,
      hpp: typeof inv.hpp === 'number' ? inv.hpp : 0,
      profit: typeof inv.profit === 'number' ? inv.profit : inv.total,
      createdAt: inv.createdAt || inv.date || null
    }));
    this.sales = [...(sales || []), ...normalizedCustomerInvoices];
    this.expenses = expenses || [];
    this.products = products || [];
    this.invoices = invoices || [];
  }

  /**
   * Mengubah timestamp Firebase atau string biasa menjadi objek tanggal Javascript yang valid
   */
  private parseDate(dateObj: any): Date | null {
    if (!dateObj) return null;
    if (typeof dateObj.toDate === 'function') {
      return dateObj.toDate();
    }
    const parsed = new Date(dateObj);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * 🚀 KUNCI PERBAIKAN 1: Penyaring waktu super ketat (Anti-Bocor Data Bulan Lain)
   */
  private filterByTime(data: any[]) {
    return data.filter(item => {
      // Periksa semua kemungkinan field nama tanggal di database ruko Kakak
      const itemDate = this.parseDate(item.createdAt || item.date || item.invoiceDate || item.tanggalNota);
      if (!itemDate) return false;

      const itemMonth = itemDate.getMonth();
      const itemYear = itemDate.getFullYear();

      // Jika memilih rentang Bulan + Tahun aktif
      if (this.timeRange === "Bulan + Tahun") {
        return itemMonth === this.selectedMonth && itemYear === this.selectedYear;
      }
      
      // Jika memilih rentang 3 Bulan Terakhir
      if (this.timeRange === "3 Bulan Terakhir") {
        const now = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return itemDate >= threeMonthsAgo && itemDate <= now;
      }
      
      // Jika memilih rentang Tahun Ini
      if (this.timeRange === "Tahun Ini") {
        const now = new Date();
        return itemYear === now.getFullYear();
      }

      // 🚀 DEFAULT FALLBACK: Jika tidak ada yang cocok, kunci wajib hanya bulan berjalan (Mencegah meluber ke 31 juta)
      return itemMonth === this.selectedMonth && itemYear === this.selectedYear;
    });
  }

  public getFinancialSummary() {
    const filteredSales = this.filterByTime(this.sales);
    const filteredExpenses = this.filterByTime(this.expenses);

    const totalOmset = filteredSales.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const totalHpp = filteredSales.reduce((acc, curr) => acc + (Number(curr.hpp) || 0), 0);
    const grossProfit = filteredSales.reduce((acc, curr) => acc + (Number(curr.profit) || 0), 0);
    const totalOpex = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const netProfit = grossProfit - totalOpex;

    return { totalOmset, totalHpp, grossProfit, totalOpex, netProfit };
  }

  public getStockFinancials() {
    let totalValuation = 0;
    let totalEstProfit = 0;

    this.products.forEach(p => {
      const stock = Number(p.stock) || 0;
      if (stock <= 0) return; 
      const cost = Number(p.costPrice || p.capitalPrice || 0);
      const price = Number(p.price || 0);
      totalValuation += stock * cost;
      totalEstProfit += stock * Math.max(0, price - cost);
    });

    return { totalValuation, totalEstProfit };
  }

  public getStockAnalyzerStats() {
    const filteredSales = this.filterByTime(this.sales);
    const filteredInvoices = this.filterByTime(this.invoices);

    let unitOut = 0;
    let valuationOut = 0;
    const productSalesTracker: Record<string, number> = {};

    filteredSales.forEach(sale => {
      valuationOut += Number(sale.hpp || 0);
      if (Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const qty = Number(item.qty || item.quantity || 1);
          unitOut += qty;
          const productName = item.name || item.sku || "Unknown Product";
          productSalesTracker[productName] = (productSalesTracker[productName] || 0) + qty;
        });
      } else {
        const qty = Number(sale.qty || 1);
        unitOut += qty;
        const productName = sale.name || sale.sku || "Unknown Product";
        productSalesTracker[productName] = (productSalesTracker[productName] || 0) + qty;
      }
    });

    let topProduct = "Belum Ada Data";
    let topQty = 0;
    Object.entries(productSalesTracker).forEach(([name, qty]) => {
      if (qty > topQty) { topQty = qty; topProduct = name; }
    });

    let topInventoryProduct = { name: "Belum Ada Data", stock: 0 };
    let maxStock = -1;
    this.products.forEach(p => {
      const stockVal = Number(p.stock) || 0;
      if (stockVal > maxStock) {
        maxStock = stockVal;
        topInventoryProduct = { name: p.name || p.sku || "Unknown Product", stock: stockVal };
      }
    });

    let unitIn = 0;
    let valuationIn = 0;
    filteredInvoices.forEach(inv => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach((item: any) => {
          const multiplier = item.unit === 'lusin' ? 12 : 1;
          unitIn += Number(item.qty || 0) * multiplier;
        });
      } else {
        unitIn += Number(inv.qty || 0);
      }
      valuationIn += Number(inv.amount || inv.totalAmount || 0);
    });

    const lowStockProducts = this.products.filter(p => (Number(p.stock) || 0) < 10);
    const lowMarginProducts = this.products.filter(p => {
      const cost = Number(p.costPrice || 0);
      const price = Number(p.price || 0);
      if (price <= 0) return false; 
      const margin = ((price - cost) / price) * 100;
      return margin < 10;
    });

    return {
      unitOut, valuationOut, unitIn, valuationIn, mostSold: [topProduct, topQty],
      topInventory: topInventoryProduct, lowStockCount: lowStockProducts.length,
      totalProducts: this.products.length, lowMarginCount: lowMarginProducts.length
    };
  }

  /**
   * 🚀 PERBAIKAN TOTAL: Garansi Akurasi Data Belanja Nota Supplier & Kerugian Retur Gudang
   */
  public getDeepFinancialDetail() {
    const filteredInvoices = this.filterByTime(this.invoices);
    const filteredExpenses = this.filterByTime(this.expenses);
    const filteredSales = this.filterByTime(this.sales);
    
    // 1. Akumulasi belanja nota supplier dengan membaca seluruh variasi key nominal Firestore
    const totalInvoiceSpend = filteredInvoices.reduce((acc, curr) => {
      const value = Number(curr.amount || curr.totalAmount || curr.grandTotal || curr.total || 0);
      return acc + value;
    }, 0);
    
    // 2. Akumulasi nilai kerugian riil retur barang yang valid (Menampilkan angka 130rb yang sesungguhnya)
    const totalReturnLoss = filteredSales.reduce((acc, curr) => {
      const statusStr = String(curr.status || "").toLowerCase();
      
      // Jika invoice penjualan terdeteksi berstatus retur atau pembatalan sejenis
      if (statusStr === 'retur' || curr.isRetur === true || statusStr === 'refund') {
        // Menggunakan nilai nominal transaksi penuh atau nilai total kerugian modal barang yang hangus
        const lossValue = Number(curr.total || curr.hpp || curr.amount || 0);
        return acc + lossValue;
      }
      return acc;
    }, 0);

    // 3. Breakdown Kategori Operasional (OPEX)
    const opexBreakdown: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      const cat = exp.category || "Lainnya";
      opexBreakdown[cat] = (opexBreakdown[cat] || 0) + (Number(exp.amount || exp.total || 0));
    });

    const opexChartData = Object.entries(opexBreakdown).map(([name, value]) => ({
      name,
      value
    }));

    return { totalInvoiceSpend, totalReturnLoss, opexChartData };
  }

  public getChartData() {
    const totalDays = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();
    const dailyData = Array.from({ length: totalDays }, (_, i) => ({
      name: `${i + 1}`, 
      pemasukan: 0,
      laba: 0 
    }));

    this.sales.forEach(sale => {
      const date = this.parseDate(sale.createdAt || sale.date);
      if (date && date.getMonth() === this.selectedMonth && date.getFullYear() === this.selectedYear) {
        const dayIdx = date.getDate() - 1; 
        if (dayIdx >= 0 && dayIdx < totalDays) {
          dailyData[dayIdx].pemasukan += (Number(sale.total) || 0);
          dailyData[dayIdx].laba += (Number(sale.profit) || 0); 
        }
      }
    });

    return dailyData;
  }
}