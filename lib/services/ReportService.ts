// lib/services/ReportService.ts

export class ReportService {
  constructor(
    private sales: any[],
    private expenses: any[], // Data OPEX dari Firestore
    private products: any[],
    private invoices: any[],
    private selectedMonth: number,
    private selectedYear: number,
    private timeRange: string
  ) {}

  /**
   * Helper Pengaman Tanggal (Mencegah Crash & Data Kosong)
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
   * Menyaring data berdasarkan filter waktu aktif
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

    // 1. Hitung total Omset & HPP (untuk analisis data dasar)
    const totalOmset = filteredSales.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const totalHpp = filteredSales.reduce((acc, curr) => acc + (Number(curr.hpp) || 0), 0);
    
    // 2. Profit Kotor (Gross Profit) = Akumulasi profit murni tiap transaksi 
    // (Sudah dikurangi HPP, Admin Marketplace, & Logistik di database)
    const grossProfit = filteredSales.reduce((acc, curr) => acc + (Number(curr.profit) || 0), 0);

    // 3. Total Biaya Operasional (OPEX)
    const totalOpex = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // 4. Profit Bersih Akhir (Net Profit) = Profit Kotor - Total OPEX
    const netProfit = grossProfit - totalOpex;

    return {
      totalOmset,
      totalHpp,
      grossProfit,
      totalOpex,
      netProfit,
      profitFinal: netProfit // Sinkronisasi ke UI StatCard
    };
  }

  /**
   * Mengembalikan nilai valuasi stok aset gudang yang mengendap
   */
  public getStockFinancials() {
    const totalStockValue = this.products.reduce((acc, curr) => {
      const stock = Number(curr.stock) || 0;
      const cost = Number(curr.costPrice) || 0;
      return acc + (stock * cost);
    }, 0);

    return {
      totalStockValue
    };
  }

  /**
   * Memantau kondisi produk dengan stok kritis (< 10 pcs)
   */
  public getStockAnalyzerStats() {
    const lowStockProducts = this.products.filter(p => (Number(p.stock) || 0) < 10);
    return {
      lowStockCount: lowStockProducts.length,
      totalProducts: this.products.length
    };
  }

  /**
   * Membuat struktur data tren bulanan untuk Recharts (Pemasukan vs Profit Bersih)
   */
  public getChartData(months: string[]) {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Inisialisasi struktur dasar 12 bulan
    const monthlyData = months.map(m => ({ name: m, pemasukan: 0, laba: 0 }));

    // Isi data akumulasi Omset & Profit Kotor bulanan dari transaksi penjualan
    this.sales.forEach(sale => {
      const date = this.parseDate(sale.createdAt);
      if (date && date.getFullYear() === currentYear) {
        const mIdx = date.getMonth();
        const saleTotal = Number(sale.total) || 0;
        const saleProfit = Number(sale.profit) || 0; 

        monthlyData[mIdx].pemasukan += saleTotal;
        monthlyData[mIdx].laba += saleProfit; // Masukkan profit kotor transaksi ke dalam grafik laba
      }
    });

    // Kurangi nilai laba bulanan dengan pengeluaran OPEX pada bulan berjalan untuk mendapatkan Profit Bersih Final
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