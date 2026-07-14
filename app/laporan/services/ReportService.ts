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
      const createdDate = this.parseDate(item.createdAt || item.date || item.invoiceDate || item.tanggalNota);
      
      const isRetur = String(item.status || "").toLowerCase() === 'retur' || item.isRetur === true;
      const isFinal = item.returFinal === true || ["Selesai", "Rusak", "Tidak Kembali", "Afkir"].includes(item.penanganan);
      const updateDate = isRetur && isFinal ? this.parseDate(item.statusUpdatedAt) : null;

      const createdMonth = createdDate ? createdDate.getMonth() : -1;
      const createdYear = createdDate ? createdDate.getFullYear() : -1;
      const updateMonth = updateDate ? updateDate.getMonth() : -1;
      const updateYear = updateDate ? updateDate.getFullYear() : -1;

      if (this.timeRange === "Bulan + Tahun") {
        const matchCreated = createdMonth === this.selectedMonth && createdYear === this.selectedYear;
        const matchUpdated = updateMonth === this.selectedMonth && updateYear === this.selectedYear;
        return matchCreated || matchUpdated;
      }
      
      if (this.timeRange === "3 Bulan Terakhir") {
        const now = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        
        const createdMatch = createdDate && createdDate >= threeMonthsAgo && createdDate <= now;
        const updatedMatch = updateDate && updateDate >= threeMonthsAgo && updateDate <= now;
        return createdMatch || updatedMatch;
      }
      
      if (this.timeRange === "Tahun Ini") {
        const now = new Date();
        const createdMatch = createdYear === now.getFullYear();
        const updatedMatch = updateYear === now.getFullYear();
        return createdMatch || updatedMatch;
      }

      // Default fallback
      const matchCreated = createdMonth === this.selectedMonth && createdYear === this.selectedYear;
      const matchUpdated = updateMonth === this.selectedMonth && updateYear === this.selectedYear;
      return matchCreated || matchUpdated;
    });
  }

  public getFinancialSummary() {
    const filteredSales = this.filterByTime(this.sales);
    const filteredExpenses = this.filterByTime(this.expenses);

    let totalOmset = 0;
    let totalHpp = 0;
    let grossProfit = 0;
    let totalReturnLoss = 0;

    filteredSales.forEach(curr => {
      // 1. Cek apakah transaksi merupakan Penjualan Normal di bulan terpilih (berdasarkan createdAt)
      const createdDate = this.parseDate(curr.createdAt || curr.date);
      const isSaleInMonth = createdDate && 
                            createdDate.getMonth() === this.selectedMonth && 
                            createdDate.getFullYear() === this.selectedYear;

      if (isSaleInMonth) {
        // Kontribusi penjualan normal (gunakan nilai original jika ada)
        const t = curr.originalTotal !== undefined ? Number(curr.originalTotal) : Number(curr.total || 0);
        const h = curr.originalHpp !== undefined ? Number(curr.originalHpp) : Number(curr.hpp || 0);
        const p = curr.originalProfit !== undefined ? Number(curr.originalProfit) : Number(curr.profit || 0);
        
        totalOmset += t;
        totalHpp += h;
        grossProfit += p;
      }

      // 2. Cek apakah transaksi merupakan Retur Selesai/Final di bulan terpilih (berdasarkan statusUpdatedAt)
      const isRetur = String(curr.status || "").toLowerCase() === 'retur' || curr.isRetur === true;
      const isFinal = curr.returFinal === true || ["Selesai", "Rusak", "Tidak Kembali", "Afkir"].includes(curr.penanganan);
      
      if (isRetur && isFinal) {
        const updateDate = this.parseDate(curr.statusUpdatedAt || curr.createdAt || curr.date);
        const isReturnInMonth = updateDate && 
                                updateDate.getMonth() === this.selectedMonth && 
                                updateDate.getFullYear() === this.selectedYear;

        if (isReturnInMonth) {
          let lossVal = 0;
          if (curr.penanganan === "Selesai") {
            lossVal = curr.originalProfit !== undefined && curr.originalProfit > 0 
              ? Number(curr.originalProfit) 
              : (curr.profit < 0 ? Math.abs(Number(curr.profit)) : 0);
          } else {
            lossVal = curr.originalTotal !== undefined && curr.originalTotal > 0 
              ? Number(curr.originalTotal) 
              : (curr.total > 0 ? Number(curr.total) : (curr.profit < 0 ? Math.abs(Number(curr.profit)) : Number(curr.hpp || 0)));
          }
          totalReturnLoss += lossVal;
        }
      }
    });

    const totalOpex = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const netProfit = grossProfit - totalOpex - totalReturnLoss;

    return { totalOmset, totalHpp, grossProfit, totalOpex, totalReturnLoss, netProfit };
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
    let totalReturnLoss = 0;
    filteredSales.forEach(curr => {
      const isRetur = String(curr.status || "").toLowerCase() === 'retur' || curr.isRetur === true;
      const isFinal = curr.returFinal === true || ["Selesai", "Rusak", "Tidak Kembali", "Afkir"].includes(curr.penanganan);
      
      if (isRetur && isFinal) {
        const updateDate = this.parseDate(curr.statusUpdatedAt || curr.createdAt || curr.date);
        const isReturnInMonth = updateDate && 
                                updateDate.getMonth() === this.selectedMonth && 
                                updateDate.getFullYear() === this.selectedYear;

        if (isReturnInMonth) {
          let lossVal = 0;
          if (curr.penanganan === "Selesai") {
            lossVal = curr.originalProfit !== undefined && curr.originalProfit > 0 
              ? Number(curr.originalProfit) 
              : (curr.profit < 0 ? Math.abs(Number(curr.profit)) : 0);
          } else {
            lossVal = curr.originalTotal !== undefined && curr.originalTotal > 0 
              ? Number(curr.originalTotal) 
              : (curr.total > 0 ? Number(curr.total) : (curr.profit < 0 ? Math.abs(Number(curr.profit)) : Number(curr.hpp || 0)));
          }
          totalReturnLoss += lossVal;
        }
      }
    });

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