// app/penjualan/hooks/useSalesPage.ts
import { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, serverTimestamp, setDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { useSalesData } from "../hooks/useSalesData"; 
import { SalesService } from "../../penjualan/services/SalesService";
import { MARKETPLACE_CONFIG } from "../../../lib/constants/sales";

export function useSalesPage(currentUser: any) {
  // States Utama
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCatalogPrice, setUseCatalogPrice] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState("shopee");
  const [timeFilter, setTimeFilter] = useState("Hari Ini");
  const [statusTab, setStatusTab] = useState("Semua");
  const [searchSales, setSearchSales] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // States Edit Transaksi Pending
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '', orderId: '', sku: '', product: '', qty: 1, total: 0, marketplace: ''
  });

  const { catalog, transactions, shopeeWarehouse, activeFees } = useSalesData(
    currentUser, 
    timeFilter, 
    selectedMonth, 
    selectedYear
  );
  
  const salesService = new SalesService(currentUser, catalog, shopeeWarehouse, activeFees);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualForm, setManualForm] = useState({
    orderId: '', source: 'Shopee', status: 'Proses', tiktokProvince: '', 
    tiktokWeight: 1, tiktokType: 'Standard',
    items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }]
  });

  // Reset Paginasi / Pilihan IDs jika filter berubah
  useEffect(() => {
    setSelectedIds([]);
  }, [timeFilter, statusTab, searchSales, selectedMonth, selectedYear]);

  // Logic Filter Tabel Utama
  const filteredTransactions = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const txDate = t.createdAt.toDate();
    const now = new Date();
    const diffInDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);

    let timeMatch = timeFilter === "Hari Ini" ? txDate.toDateString() === now.toDateString() :
                    timeFilter === "3 Hari" ? diffInDays <= 3 :
                    txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;

    let statusMatch = statusTab === "Semua" ? true : 
                      statusTab === "Pending" ? t.product === "Produk Luar Katalog" : t.status === statusTab;

    const searchTerm = searchSales.toLowerCase();
    const searchMatch = 
      (t.orderId && t.orderId.toLowerCase().includes(searchTerm)) ||
      (t.product && t.product.toLowerCase().includes(searchTerm)) ||
      (t.sku && t.sku.toLowerCase().includes(searchTerm)) ||
      (t.marketplace && t.marketplace.toLowerCase().includes(searchTerm));
      
    return timeMatch && statusMatch && searchMatch;
  });

  // Handler: Kirim Perbaikan Produk Pending
  const handleEditPendingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isProcessing) return;
    setIsProcessing(true);

    try {
      const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === editForm.sku);
      if (!matched) {
        alert("❌ SKU tidak ditemukan di katalog inventaris!");
        setIsProcessing(false);
        return;
      }

      let unitCost = Number(matched.costPrice) || 0;
      let multiplier = 1;

      if (matched.isMapping && matched.linkedSku) {
        const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
        unitCost = main ? Number(main.costPrice) : Number(matched.costPrice);
        multiplier = Number(matched.multiplier) || 1;
      }

      const totalHpp = (unitCost * multiplier) * editForm.qty;
      const oldTx = transactions.find(t => t.id === editForm.id);
      const logisticsFee = oldTx?.logisticsFee || 0;
      const marketplaceKey = String(editForm.marketplace).toLowerCase();
      const netProfit = salesService.calculateNetProfitEntry(editForm.total, totalHpp, marketplaceKey, logisticsFee);

      const salesDocRef = doc(db, `users/${currentUser.uid}/sales`, editForm.id);
      await updateDoc(salesDocRef, {
        sku: editForm.sku,
        product: matched.name,
        hpp: totalHpp,
        profit: netProfit,
        status: 'Proses'
      });

      if (oldTx && oldTx.sku) {
        await salesService.updateProductStock(String(oldTx.sku).replace(/\s+/g, '').toUpperCase(), oldTx.qty, editForm.orderId);
      }
      await salesService.updateProductStock(editForm.sku, -editForm.qty, editForm.orderId);

      alert("✅ Sukses memetakan produk!");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui data pending.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Sapu Bersih Duplikasi Transaksi
  const handleDirectDatabaseCleanup = async () => {
    if (transactions.length === 0) return alert("Tidak ada data transaksi yang termuat.");
    setIsProcessing(true);

    try {
      const seenEntries = new Set<string>();
      const duplicatesToDelete: any[] = [];

      [...transactions].reverse().forEach((t) => {
        const cleanOrderId = String(t.orderId || "").trim().replace(/^#/, "").toLowerCase();
        const cleanSku = String(t.sku || "").replace(/\s+/g, "").toUpperCase();
        const uniqueKey = `${cleanOrderId}_${cleanSku}`;

        if (seenEntries.has(uniqueKey)) {
          duplicatesToDelete.push(t);
        } else {
          seenEntries.add(uniqueKey);
        }
      });

      if (duplicatesToDelete.length === 0) {
        alert("✨ Mantap, Kev! Database bersih dari data ganda.");
        setIsProcessing(false);
        return;
      }

      const konfirmasi = window.confirm(`⚠️ Terdeteksi ${duplicatesToDelete.length} data duplikat baru. Sapu bersih?`);
      if (!konfirmasi) {
        setIsProcessing(false);
        return;
      }

      for (const tx of duplicatesToDelete) {
        await salesService.deleteTransaction(tx);
        const cleanSku = String(tx.sku || "").replace(/\s+/g, "").toUpperCase();
        await salesService.updateProductStock(cleanSku, Number(tx.qty) || 1, tx.orderId);
      }
      alert(`✅ Sukses Besar! Data duplikat berhasil disapu bersih.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Pemrosesan Unggah Dokumen Excel Marketplace
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);
    const reader = new FileReader();
    const config = MARKETPLACE_CONFIG[selectedMarketplace];

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
        const headers = data[0];
        const finalSkuIdx = (config.cols.sku !== undefined) ? config.cols.sku : headers.findIndex((h: any) => String(h).toUpperCase().includes("SKU"));
        const rawRows = data.slice(config.dataStartRow);

        const TIKTOK_SHIPPING_MAP: Record<string, string> = {
          "PENGIRIMAN STANDAR": "STANDARD", "EKONOMI": "ECONOMY", "KARGO": "CARGO", "STANDARD": "STANDARD", "SAVER": "SAVER"
        };
        
        let addedCount = 0;
        for (const row of rawRows) {
          const resiValue = String(row[config.cols.resi] || "").trim();
          const orderIdLama = String(row[config.cols.orderId] || "").trim();
          const finalId = resiValue || orderIdLama;
          if (!finalId) continue;

          const cleanOrderId = finalId.replace(/^#/, "").trim();
          let rawSku = String(row[finalSkuIdx] || "").trim();
          if (selectedMarketplace === 'shopee' && !rawSku) rawSku = String(row[12] || "").trim(); 
          const sku = rawSku.replace(/\s+/g, '').toUpperCase();
          
          const isAlreadyInState = transactions.some(t => 
            String(t.orderId).trim().replace(/^#/, "").toLowerCase() === cleanOrderId.toLowerCase() && 
            String(t.sku).replace(/\s+/g, '').toUpperCase() === sku
          );
          if (isAlreadyInState) continue;

          let qty = Number(row[config.cols.qty]) || 1;
          const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
          
          let unitPrice = 0, unitCost = 0, multiplier = 1, productName = "Produk Luar Katalog";
          if (matched) {
            productName = matched.name;
            let catalogPrice = Number(matched.price) || 0;
            if (selectedMarketplace === 'tiktok' && matched.useMarketplacePrices) {
              catalogPrice = (matched.priceTiktok && Number(matched.priceTiktok) > 0) ? Number(matched.priceTiktok) : catalogPrice;
            }
            const excelPrice = (Number(row[config.cols.total]) / qty) || 0;
            unitPrice = catalogPrice > 0 ? catalogPrice : excelPrice;

            if (matched.isMapping && matched.linkedSku) {
              const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
              unitCost = main ? Number(main.costPrice) : Number(matched.costPrice);
              multiplier = Number(matched.multiplier) || 1;
            } else { 
              unitCost = Number(matched.costPrice) || 0; 
            }
          } else {
            unitPrice = (Number(row[config.cols.total]) / qty) || 0;
          }

          const totalRevenue = unitPrice * qty;
          const totalHpp = (unitCost * multiplier) * qty;

          let logisticsFee = 0;
          if (selectedMarketplace === 'tiktok') {
            const rawShippingType = String(row[config.cols.shippingType] || "").trim().toUpperCase();
            const rawProvince = String(row[config.cols.province] || "").trim().toUpperCase();
            const parcelWeight = Number(row[config.cols.weight]) || 0;
            const finalShippingType = TIKTOK_SHIPPING_MAP[rawShippingType] || "STANDARD";
            logisticsFee = salesService.calculateTikTokLogistics(finalShippingType, rawProvince, parcelWeight);
          }

          const netProfit = salesService.calculateNetProfitEntry(totalRevenue, totalHpp, selectedMarketplace, logisticsFee);
          const rawExcelDate = config.cols.createdAt !== undefined ? row[config.cols.createdAt] : null; 
          let transactionDate = new Date();

          if (rawExcelDate !== null && rawExcelDate !== undefined && rawExcelDate !== "") {
            if (typeof rawExcelDate === 'number') {
              transactionDate = new Date((rawExcelDate - 25569) * 86400 * 1000);
            } else {
              const parsedDate = new Date(rawExcelDate);
              if (!isNaN(parsedDate.getTime())) transactionDate = parsedDate;
            }
          }

          if (isNaN(transactionDate.getTime())) transactionDate = new Date();

          const customDocId = `${cleanOrderId}_${sku}`;
          const salesDocRef = doc(db, `users/${currentUser.uid}/sales`, customDocId);

          await setDoc(salesDocRef, {
            orderId: finalId, sku, product: productName, total: totalRevenue, 
            hpp: totalHpp, qty, profit: netProfit, logisticsFee, 
            marketplace: config.name, status: 'Proses', createdAt: transactionDate 
          }, { merge: true });

          await salesService.updateProductStock(sku, -qty, finalId);
          addedCount++;
        }
        alert(`Berhasil impor ${addedCount} data.`);
      } catch (err) { alert("Gagal memproses file."); console.error(err); } 
      finally { setIsProcessing(false); e.target.value = ''; }
    };
    reader.readAsBinaryString(file);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeFees || isProcessing) return alert("Sistem belum siap.");
    setIsProcessing(true);
    try {
      await salesService.processMultiProductManual(manualForm, useCatalogPrice);
      setIsManualModalOpen(false);
      setManualForm({ 
        orderId: '', source: 'Shopee', status: 'Proses', tiktokProvince: '', tiktokWeight: 1, tiktokType: 'Standard',
        items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }] 
      });
      alert("Pesanan tersimpan!");
    } catch (err) { alert("Terjadi kesalahan."); } 
    finally { setIsProcessing(false); }
  };

  return {
    isProcessing, useCatalogPrice, setUseCatalogPrice, isManualModalOpen, setIsManualModalOpen,
    selectedMarketplace, setSelectedMarketplace, timeFilter, setTimeFilter, statusTab, setStatusTab,
    searchSales, setSearchSales, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
    isEditModalOpen, setIsEditModalOpen, editForm, setEditForm, selectedIds, setSelectedIds,
    manualForm, setManualForm, filteredTransactions, transactions, salesService,
    handleEditPendingSubmit, handleDirectDatabaseCleanup, handleFileUpload, handleManualSubmit
  };
}