import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, orderBy, writeBatch, doc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { ReturOrder } from "../types/retur";

export const useReturData = (currentUser: any) => {
  const [returOrders, setReturOrders] = useState<ReturOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const q = query(
      collection(db, `users/${currentUser.uid}/sales`), 
      where("status", "==", "Retur"),
      orderBy("createdAt", "desc")
    );

    const unsubRetur = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const orders = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const createdDate = data.createdAt?.toDate ? data.createdAt.toDate() : (data.date ? new Date(data.date) : new Date());
        const diffTime = now.getTime() - createdDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return { id: docSnap.id, ...data, diffDays };
      }) as ReturOrder[];
      
      setReturOrders(orders);
      setLoading(false);
    });

    return () => { unsubProd(); unsubRetur(); };
  }, [currentUser]);

  // Background Auto-expiration for returns older than 30 days
  useEffect(() => {
    if (!currentUser || products.length === 0 || returOrders.length === 0) return;

    const runAutoUpdate = async () => {
      const now = new Date();
      const batch = writeBatch(db);
      let needCommit = false;

      returOrders.forEach((order: any) => {
        if (order.returFinal) return;

        const createdDate = order.createdAt?.toDate ? order.createdAt.toDate() : (order.date ? new Date(order.date) : new Date());
        const diffTime = now.getTime() - createdDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 30) {
          needCommit = true;
          const matchedProd = products.find(p => p.sku?.toUpperCase().trim() === order.sku?.toUpperCase().trim());
          const sellingPrice = matchedProd ? (Number(matchedProd.price || matchedProd.sellingPrice) || 0) : 0;
          
          const qty = order.qty || 1;
          const lossProfit = -(sellingPrice * qty);

          const docRef = doc(db, `users/${currentUser.uid}/sales`, order.id);
          batch.update(docRef, {
            penanganan: "Tidak Kembali",
            returFinal: true,
            profit: lossProfit,
            catatan: `[AUTO-EXPIRED 30 HARI] Paket retur tidak kembali. Otomatis mengurangi profitabilitas sebesar Rp ${Math.abs(lossProfit).toLocaleString('id-ID')}`
          });
        }
      });

      if (needCommit) {
        try {
          await batch.commit();
          console.log("Auto-expired returns processed successfully.");
        } catch (e) {
          console.error("Gagal memproses auto-expire retur:", e);
        }
      }
    };

    runAutoUpdate();
  }, [currentUser, products, returOrders]);

  const stats = useMemo(() => {
    const totalLoss = returOrders.reduce((acc, curr) => {
      if (["Rusak", "Tidak Kembali", "Afkir"].includes(curr.penanganan)) {
        return acc + (curr.hpp || 0);
      }
      return acc;
    }, 0);

    return {
      totalLoss,
      totalCases: returOrders.length,
      processingCount: returOrders.filter(o => !o.returFinal).length,
      finalCount: returOrders.filter(o => o.returFinal).length
    };
  }, [returOrders]);

  return { products, returOrders, stats, loading };
};