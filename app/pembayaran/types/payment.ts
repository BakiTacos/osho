// app/pembayaran/types/payment.ts
export interface InvoiceItem {
  sku: string;
  name: string;
  qty: number;
  price: number;
  unit: string;
}

export interface SupplierInvoice {
  id?: string;
  noNota: string;
  supplier: string;
  dueDate: string;
  status: 'TERBAYAR' | 'BELUM BAYAR';
  amount: number;
  items: InvoiceItem[];
  createdAt?: any;
}

export interface OperationalExpense {
  id?: string;
  category: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  createdAt?: any;
}

export interface BalanceWithdrawal {
  id?: string;
  platform: string;
  amount: number;
  date: string;
  status?: string;
  editCount?: number;
  createdAt?: any;
}

export interface SupplierMitra {
  id: string;
  name: string;
  code: string;
  createdAt?: any;
}