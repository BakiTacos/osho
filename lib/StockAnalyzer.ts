// lib/StockAnalyzer.ts

export class StockAnalyzer {
  private sales: any[];
  private invoices: any[];
  private products: any[];
  private month: number;
  private year: number;

  constructor(sales: any[], invoices: any[], products: any[], month: number, year: number) {
    this.sales = sales;
    this.invoices = invoices;
    this.products = products;
    this.month = month;
    this.year = year;
  }

  // Helper untuk cek apakah data sesuai bulan & tahun pilihan
  private isMatch(createdAt: any) {
    if (!createdAt) return false;
    const d = createdAt.toDate();
    return d.getMonth() === this.month && d.getFullYear() === this.year;
  }

  // 1. Hitung Total Unit Keluar
  getTotalUnitOut() {
    return this.sales
      .filter(s => this.isMatch(s.createdAt) && s.status !== 'Retur')
      .reduce((acc, curr) => acc + (curr.qty || 0), 0);
  }

  // 2. Hitung Total Unit Masuk (Handle Lusin)
  getTotalUnitIn() {
    return this.invoices
      .filter(inv => this.isMatch(inv.createdAt))
      .reduce((acc, inv) => {
        const itemQty = inv.items?.reduce((a: number, b: any) => {
          const multiplier = b.unit === 'lusin' ? 12 : 1;
          return a + (b.qty * multiplier);
        }, 0);
        return acc + (itemQty || 0);
      }, 0);
  }

  // 3. Valuasi Keluar (HPP)
  getValuationOut() {
    return this.sales
      .filter(s => this.isMatch(s.createdAt) && s.status !== 'Retur')
      .reduce((acc, curr) => acc + (curr.hpp || 0), 0);
  }

  // 4. Valuasi Masuk (Modal Belanja)
  getValuationIn() {
    return this.invoices
      .filter(inv => this.isMatch(inv.createdAt))
      .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  }

  // 5. Cari Barang Keluar Terbanyak (Ranking 1)
  getMostSoldProduct() {
    const outMap: Record<string, number> = {};
    this.sales
      .filter(s => this.isMatch(s.createdAt) && s.status !== 'Retur')
      .forEach(s => {
        outMap[s.product] = (outMap[s.product] || 0) + s.qty;
      });
    
    return Object.entries(outMap).sort((a, b) => b[1] - a[1])[0] || ["Tidak ada data", 0];
  }

  // 6. Cari Barang dengan Stok Terbanyak saat ini
  getTopInventory() {
    return [...this.products].sort((a, b) => b.stock - a.stock)[0] || { name: "Kosong", stock: 0 };
  }
}