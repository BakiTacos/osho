import { db } from "../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export interface DashboardStats {
  omset: number;
  modal: number;
  profit: number;
  grossProfit: number;
}

export interface MarketplaceData {
  Shopee: number;
  Tiktok: number;
  Lazada: number;
  Offline: number;
}

// ✅ Fungsi untuk memantau stok kritis
export function subscribeCriticalStock(userId: string, callback: (count: number) => void) {
  const qProd = query(
    collection(db, `users/${userId}/products`),
    where("stock", "<=", 10)
  );
  
  return onSnapshot(qProd, (snapshot) => {
    callback(snapshot.docs.length);
  });
}

// ✅ Fungsi untuk memantau data penjualan berdasarkan filter waktu
export function subscribeSalesData(
  userId: string, 
  startDate: Date, 
  endDate: Date, 
  callback: (stats: DashboardStats, mpData: MarketplaceData) => void
) {
  const qSales = query(
    collection(db, `users/${userId}/sales`),
    where("createdAt", ">=", startDate),
    where("createdAt", "<=", endDate)
  );

  return onSnapshot(qSales, (snapshot) => {
    let totalOmset = 0;
    let totalModal = 0;
    let totalGrossProfit = 0;
    let mpCounts: MarketplaceData = { Shopee: 0, Tiktok: 0, Lazada: 0, Offline: 0 };

    snapshot.docs.forEach(doc => {
      const s = doc.data();
      
      if (s.status !== 'Retur') {
        totalOmset += Number(s.total) || 0;
        totalModal += Number(s.hpp) || 0;
        totalGrossProfit += Number(s.profit) || 0; 
        
        const source = (s.marketplace || 'Offline') as keyof MarketplaceData;
        if (mpCounts[source] !== undefined) {
          mpCounts[source] += Number(s.total) || 0;
        }
      }
    });

    callback(
      { omset: totalOmset, modal: totalModal, grossProfit: totalGrossProfit, profit: totalOmset - totalModal },
      mpCounts
    );
  });
}