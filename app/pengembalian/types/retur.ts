// types/retur.ts

export interface ReturOrder {
  id: string;
  orderId: string;
  resi?: string; // Tambahkan opsional field resi
  product: string;
  sku: string;
  qty: number;
  hpp: number;
  total: number;
  marketplace: string;
  status: string;
  penanganan: "Proses" | "Menunggu Barang" | "Selesai" | "Rusak" | "Tidak Kembali" | "Afkir" | "Pending SKU";
  returFinal: boolean;
  profit: number;
  date: string;
  catatan?: string;
  createdAt: any;
}

// 1. Form Khusus Menyusut Gudang (Internal Ruko)
export interface AfkirFormState {
  sku: string;
  qty: number;
  reason: string;
  kondisi: "Rusak" | "Bagus";
  marketplace: string;
}

// 2. Form Khusus Paket Misterius Hasil Scan Zong (Eksternal)
export interface MysteriousReturnFormState {
  orderIdOrResi: string; // Wajib diisi (otomatis terisi dari hasil scan)
  sku: string;
  qty: number;
  marketplace: string;
  reason: string;
}