import { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export function usePaymentData(currentUser: any) {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser || !currentUser.uid) return;

    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubWithdraw = onSnapshot(query(collection(db, `users/${currentUser.uid}/withdrawals`), orderBy("createdAt", "desc")), (snap) => {
      setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubInvoices = onSnapshot(query(collection(db, `users/${currentUser.uid}/supplier_invoices`), orderBy("createdAt", "desc")), (snap) => {
      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubExpenses = onSnapshot(query(collection(db, `users/${currentUser.uid}/expenses`), orderBy("createdAt", "desc")), (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubProd(); unsubWithdraw(); unsubInvoices(); unsubExpenses(); };
  }, [currentUser]);

  return { withdrawals, invoices, expenses, products };
}