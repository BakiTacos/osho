// types/retur.ts

export interface ReturOrder {
  id: string;
  orderId: string;
  resi: string;
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

export interface ManualFormState {
  sku: string;
  qty: number;
  reason: string;
  kondisi: "Rusak" | "Bagus";
  marketplace: string; // 🚀 Tambahan Kolom Asal Toko
}