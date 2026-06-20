import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
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
      setReturOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReturOrder[]);
      setLoading(false);
    });

    return () => { unsubProd(); unsubRetur(); };
  }, [currentUser]);

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