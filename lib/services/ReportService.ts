import { StockAnalyzer } from "../StockAnalyzer";

export class ReportService {
  private readonly ADMIN_PERCENT = 0.16;
  private readonly FIXED_FEE = 1250;

  constructor(
    private sales: any[],
    private expenses: any[],
    private products: any[],
    private invoices: any[],
    private selectedMonth: number,
    private selectedYear: number,
    private timeRange: string
  ) {}

  public getFilteredData() {
    const now = new Date();
    const isMatch = (date: any) => {
      if (!date) return false;
      const d = date.toDate();
      if (this.timeRange === "Bulan + Tahun") {
        return d.getMonth() === this.selectedMonth && d.getFullYear() === this.selectedYear;
      } else if (this.timeRange === "3 Bulan Terakhir") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return d >= threeMonthsAgo;
      } else if (this.timeRange === "Tahun Ini") {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    };

    return {
      filteredSales: this.sales.filter(s => isMatch(s.createdAt)),
      filteredExpenses: this.expenses.filter(e => isMatch(e.createdAt))
    };
  }

  public getFinancialSummary() {
    const { filteredSales, filteredExpenses } = this.getFilteredData();
    
    const totalOmset = filteredSales.filter(s => s.status !== 'Retur').reduce((acc, curr) => acc + (curr.total || 0), 0);
    const grossProfit = filteredSales.filter(s => s.status !== 'Retur').reduce((acc, curr) => acc + (curr.profit || 0), 0);
    const totalOpex = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    const netProfit = grossProfit - totalOpex;
    const totalKerugian = filteredSales.filter(s => s.status === 'Retur' && (s.penanganan === 'Rusak' || s.penanganan === 'Tidak Kembali')).reduce((acc, curr) => acc + (curr.hpp || 0), 0);
    const profitFinal = netProfit - totalKerugian;

    return { totalOmset, netProfit, totalKerugian, profitFinal };
  }

  public getStockFinancials() {
    const totalInventoryValuation = this.products.reduce((acc, p) => acc + ((p.stock || 0) * (p.costPrice || 0)), 0);

    const financials = this.products.reduce((acc, p) => {
      const stock = p.stock || 0;
      const unitCost = p.costPrice || 0;
      const price = p.price || 0;
      const multiplier = p.isMapping ? (p.multiplier || 1) : 1;

      const totalHppPerUnit = unitCost * multiplier;
      const netProfitPerUnit = price - totalHppPerUnit - (price * this.ADMIN_PERCENT) - this.FIXED_FEE;
      const marginPercent = price > 0 ? (netProfitPerUnit / price) * 100 : 0;

      if (stock > 0) {
        acc.totalValuation += (totalHppPerUnit * stock);
        acc.totalEstProfit += (netProfitPerUnit * stock);
        if (marginPercent < 10) acc.lowMarginCount += 1;
      }
      return acc;
    }, { totalValuation: 0, totalEstProfit: 0, lowMarginCount: 0 });

    return { totalInventoryValuation, ...financials };
  }

  public getStockAnalyzerStats() {
    const analyzer = new StockAnalyzer(this.sales, this.invoices, this.products, this.selectedMonth, this.selectedYear);
    return {
      unitOut: analyzer.getTotalUnitOut(),
      unitIn: analyzer.getTotalUnitIn(),
      valuationOut: analyzer.getValuationOut(),
      valuationIn: analyzer.getValuationIn(),
      mostSold: analyzer.getMostSoldProduct(),
      topInventory: analyzer.getTopInventory()
    };
  }

  public getChartData(months: string[]) {
    return months.map((m, index) => {
      const monthlySales = this.sales.filter(s => s.createdAt?.toDate().getMonth() === index && s.createdAt?.toDate().getFullYear() === this.selectedYear);
      const monthlyExpenses = this.expenses.filter(e => e.createdAt?.toDate().getMonth() === index && e.createdAt?.toDate().getFullYear() === this.selectedYear);
      
      const omset = monthlySales.filter(s => s.status !== 'Retur').reduce((acc, curr) => acc + (curr.total || 0), 0);
      const profit = monthlySales.filter(s => s.status !== 'Retur').reduce((acc, curr) => acc + (curr.profit || 0), 0) - monthlyExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      return {
        name: m.substring(0, 3).toUpperCase(),
        pemasukan: omset,
        laba: profit < 0 ? 0 : profit
      };
    }).slice(Math.max(this.selectedMonth - 5, 0), this.selectedMonth + 1);
  }
}