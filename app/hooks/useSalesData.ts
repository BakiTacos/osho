import { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";

export function useSalesData(currentUser: any) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [shopeeWarehouse, setShopeeWarehouse] = useState<any[]>([]);
  const [activeFees, setActiveFees] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    const unsubProd = onSnapshot(query(collection(db, `users/${currentUser.uid}/products`)), (snap) => {
      setCatalog(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSales = onSnapshot(query(collection(db, `users/${currentUser.uid}/sales`), orderBy("createdAt", "desc")), (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubWarehouse = onSnapshot(collection(db, `users/${currentUser.uid}/shopee_warehouse`), (snap) => {
      setShopeeWarehouse(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubFees = onSnapshot(doc(db, `users/${currentUser.uid}/settings`, "admin_fees"), (snap) => {
      if (snap.exists()) {
        setActiveFees(snap.data());
        console.log("✅ Admin Fees Sync Berhasil");
      }
    });

    return () => { unsubProd(); unsubSales(); unsubWarehouse(); unsubFees(); };
  }, [currentUser]);

  return { catalog, transactions, shopeeWarehouse, activeFees };
}