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
    private selectedMonth: number,
    private selectedYear: number,
    private timeRange: string
  ) {
    // PENGAMAN UTAMA: Selalu berikan fallback array kosong jika data masih loading
    this.sales = sales || [];
    this.expenses = expenses || [];
    this.products = products || [];
    this.invoices = invoices || [];
  }

  /**
   * Helper Pengaman Tanggal (Mencegah Crash saat Parsing Date)
   */
  private parseDate(createdAt: any): Date | null {
    if (!createdAt) return null;
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate();
    }
    const parsed = new Date(createdAt);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Menyaring data berdasarkan filter waktu aktif di dashboard
   */
  private filterByTime(data: any[]) {
    const now = new Date();
    return data.filter(item => {
      const itemDate = this.parseDate(item.createdAt);
      if (!itemDate) return false;

      if (this.timeRange === "Bulan + Tahun") {
        return itemDate.getMonth() === this.selectedMonth && 
               itemDate.getFullYear() === this.selectedYear;
      }
      
      if (this.timeRange === "3 Bulan Terakhir") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return itemDate >= threeMonthsAgo && itemDate <= now;
      }
      
      if (this.timeRange === "Tahun Ini") {
        return itemDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }

  /**
   * Mengembalikan rincian ringkasan finansial utama (Omset, Profit Kotor, OPEX, Profit Bersih)
   */
  public getFinancialSummary() {
    const filteredSales = this.filterByTime(this.sales);
    const filteredExpenses = this.filterByTime(this.expenses);

    const totalOmset = filteredSales.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const totalHpp = filteredSales.reduce((acc, curr) => acc + (Number(curr.hpp) || 0), 0);
    
    // Profit kotor murni akumulasi dari profit tiap transaksi penjualan
    const grossProfit = filteredSales.reduce((acc, curr) => acc + (Number(curr.profit) || 0), 0);
    const totalOpex = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const netProfit = grossProfit - totalOpex;

    return {
      totalOmset,
      totalHpp,
      grossProfit,
      totalOpex,
      netProfit,
      profitFinal: netProfit
    };
  }

  /**
   * KUNCI PERBAIKAN 1: Menghitung total nilai valuasi aset serta potensi cuan sisa stok aktif
   * (Mengecualikan produk dengan stok minus/penyesuaian)
   */
  public getStockFinancials() {
    let totalValuation = 0;
    let totalEstProfit = 0;

    this.products.forEach(p => {
      const stock = Number(p.stock) || 0;
      
      // PERBAIKAN: Jika stok 0 atau minus, jangan masukkan ke kalkulasi aset & potensi cuan
      if (stock <= 0) return; 

      const cost = Number(p.costPrice || p.capitalPrice || p.buyPrice || 0);
      const price = Number(p.sellingPrice || p.price || 0);
      
      totalValuation += stock * cost;
      totalEstProfit += stock * Math.max(0, price - cost);
    });

    return {
      totalValuation,
      totalEstProfit
    };
  }

  /**
   * KUNCI PERBAIKAN 2: Menghitung metrik analisis stok termasuk penyaringan produk dengan MARGIN < 10%
   */
  public getStockAnalyzerStats() {
    const filteredSales = this.filterByTime(this.sales);
    const filteredInvoices = this.filterByTime(this.invoices);

    // 1. Kalkulasi barang keluar (Unit & Valuasi HPP) & Hitung Frekuensi Terjual per Produk
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
        const qty = Number(sale.qty || sale.quantity || 1);
        unitOut += qty;

        const productName = sale.name || sale.sku || "Unknown Product";
        productSalesTracker[productName] = (productSalesTracker[productName] || 0) + qty;
      }
    });

    // 2. Tentukan produk dengan penjualan tertinggi (Most Sold)
    let topProduct = "Belum Ada Data";
    let topQty = 0;

    Object.entries(productSalesTracker).forEach(([name, qty]) => {
      if (qty > topQty) {
        topQty = qty;
        topProduct = name;
      }
    });

    const mostSold = [topProduct, topQty];

    // 3. Cari produk dengan jumlah stok fisik terbanyak di gudang (Top Inventory)
    let topInventoryProduct = { name: "Belum Ada Data", stock: 0 };
    let maxStock = -1;

    this.products.forEach(p => {
      const stockVal = Number(p.stock) || 0;
      if (stockVal > maxStock) {
        maxStock = stockVal;
        topInventoryProduct = {
          name: p.name || p.sku || "Unknown Product",
          stock: stockVal
        };
      }
    });

    // 4. Kalkulasi barang masuk (Unit & Nominal belanja) dari Nota Supplier
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
      valuationIn += Number(inv.amount || 0);
    });

    // 5. Deteksi produk yang stoknya kritis (< 10 pcs)
    const lowStockProducts = this.products.filter(p => (Number(p.stock) || 0) < 10);

    // 6. PERBAIKAN: Hitung jumlah produk dengan Margin Keuntungan < 10%
    const lowMarginProducts = this.products.filter(p => {
      const cost = Number(p.costPrice || p.capitalPrice || p.buyPrice || 0);
      const price = Number(p.sellingPrice || p.price || 0);
      
      // Lewati produk yang belum diset harga jualnya untuk menghindari pembagian dengan nol
      if (price <= 0) return false; 
      
      // Rumus Margin Keuntungan: ((Harga Jual - Modal) / Harga Jual) * 100
      const margin = ((price - cost) / price) * 100;
      return margin < 10;
    });

    const lowMarginCount = lowMarginProducts.length;

    return {
      unitOut,
      valuationOut,
      unitIn,
      valuationIn,
      mostSold,
      topInventory: topInventoryProduct,
      lowStockCount: lowStockProducts.length,
      totalProducts: this.products.length,
      lowStockProducts,
      // Properti baru untuk dikonsumsi oleh komponen "Margin < 10%" di UI
      lowMarginCount, 
      lowMarginProducts
    };
  }

  /**
   * Membuat struktur data tren bulanan untuk Recharts (Pemasukan vs Profit Bersih)
   */
  public getChartData(months: string[]) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthlyData = months.map(m => ({ name: m, pemasukan: 0, laba: 0 }));

    this.sales.forEach(sale => {
      const date = this.parseDate(sale.createdAt);
      if (date && date.getFullYear() === currentYear) {
        const mIdx = date.getMonth();
        const saleTotal = Number(sale.total) || 0;
        const saleProfit = Number(sale.profit) || 0; 

        monthlyData[mIdx].pemasukan += saleTotal;
        monthlyData[mIdx].laba += saleProfit;
      }
    });

    this.expenses.forEach(exp => {
      const date = this.parseDate(exp.createdAt);
      if (date && date.getFullYear() === currentYear) {
        const mIdx = date.getMonth();
        monthlyData[mIdx].laba -= (Number(exp.amount) || 0);
      }
    });

    return monthlyData;
  }
}