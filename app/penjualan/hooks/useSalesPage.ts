// app/penjualan/hooks/useSalesPage.ts
"use client";

import React, { useState, useEffect } from 'react';
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, serverTimestamp, setDoc, writeBatch, increment } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { useSalesData } from "../hooks/useSalesData"; 
import { SalesService } from "../../penjualan/services/SalesService";
import { MARKETPLACE_CONFIG } from "../../../lib/constants/sales";

export function useSalesPage(currentUser: any) {
  // --- STATES UTAMA ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCatalogPrice, setUseCatalogPrice] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState("shopee");
  const [timeFilter, setTimeFilter] = useState("Hari Ini");
  const [statusTab, setStatusTab] = useState("Semua");
  const [searchSales, setSearchSales] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // --- STATE AKLIR REFRESH COUNTER (ANTI-BOCO R-READS) ---
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- STATES EDIT TRANSAKSI PENDING SKU ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '', orderId: '', resi: '', sku: '', product: '', qty: 1, total: 0, marketplace: ''
  });

  // Ambil data on-demand strictly menggunakan trigger ram hemat kuota
  const { catalog, transactions, shopeeWarehouse, activeFees } = useSalesData(
    currentUser, 
    timeFilter, 
    selectedMonth, 
    selectedYear,
    refreshTrigger 
  );

  // Pemicu taktis ambil data baru secara terukur
  const triggerDataRefresh = () => setRefreshTrigger(prev => prev + 1);
  
  const salesService = new SalesService(currentUser, catalog, shopeeWarehouse, activeFees);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // --- STATE CONFIG FORM MANUAL RUKO MULTI-PRODUK ---
  const [manualForm, setManualForm] = useState({
    orderId: '', 
    resi: '', 
    source: 'Shopee', 
    status: 'Proses', 
    tiktokProvince: '', 
    tiktokWeight: 1, 
    tiktokType: 'Standard',
    items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }]
  });

  // Reset Paginasi / Pilihan IDs jika filter diubah
  useEffect(() => {
    setSelectedIds([]);
  }, [timeFilter, statusTab, searchSales, selectedMonth, selectedYear]);

  // --- LOGIKA FILTER UTAMA FILTER TABEL ---
  const filteredTransactions = transactions.filter((t) => {
    if (!t.createdAt) return false;
    
    const txDate = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
    const now = new Date();
    const diffInDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);

    let timeMatch = timeFilter === "Hari Ini" ? txDate.toDateString() === now.toDateString() :
                    timeFilter === "3 Hari" ? diffInDays <= 3 :
                    txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;

    let statusMatch = statusTab === "Semua" ? true : 
                      statusTab === "Pending" ? t.product === "Produk Luar Katalog" : t.status === statusTab;

    const searchTerm = searchSales.toLowerCase().trim();
    const searchMatch = 
      (t.orderId && String(t.orderId).toLowerCase().includes(searchTerm)) ||
      (t.resi && String(t.resi).toLowerCase().includes(searchTerm)) || 
      (t.product && String(t.product).toLowerCase().includes(searchTerm)) ||
      (t.sku && String(t.sku).toLowerCase().includes(searchTerm)) ||
      (t.marketplace && String(t.marketplace).toLowerCase().includes(searchTerm));
      
    return timeMatch && statusMatch && searchMatch;
  });

  // --- HANDLER 1: PETAKAN ULANG PRODUK PENDING SKU ---
  const handleEditPendingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isProcessing) return;
    setIsProcessing(true);

    try {
      const cleanSkuInput = editForm.sku.replace(/\s+/g, '').toUpperCase();
      const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === cleanSkuInput);
      
      if (!matched) {
        alert("❌ SKU tidak ditemukan di katalog inventaris ruko!");
        setIsProcessing(false);
        return;
      }

      let unitCost = Number(matched.costPrice) || 0;
      let multiplier = 1;

      let targetProductId = matched.id;
      let finalQtyToDeduct = editForm.qty;

      if (matched.isMapping && matched.linkedSku) {
        const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
        if (main) {
          unitCost = Number(main.costPrice);
          multiplier = Number(matched.multiplier) || 1;
          targetProductId = main.id;
          finalQtyToDeduct = editForm.qty * multiplier;
        }
      }

      const totalHpp = (unitCost * multiplier) * editForm.qty;
      const oldTx = transactions.find(t => t.id === editForm.id);
      const logisticsFee = oldTx?.logisticsFee || 0;
      const marketplaceKey = String(editForm.marketplace).toLowerCase();
      const netProfit = salesService.calculateNetProfitEntry(editForm.total, totalHpp, marketplaceKey, logisticsFee);

      const batch = writeBatch(db);
      
      const salesDocRef = doc(db, `users/${currentUser.uid}/sales`, editForm.id);
      batch.update(salesDocRef, {
        sku: cleanSkuInput,
        product: matched.name,
        hpp: totalHpp,
        profit: netProfit,
        status: 'Proses'
      });

      if (oldTx && oldTx.sku) {
        const oldCleanSku = String(oldTx.sku).replace(/\s+/g, '').toUpperCase();
        const oldProdMatch = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === oldCleanSku);
        if (oldProdMatch) {
          let oldProductId = oldProdMatch.id;
          let oldQtyToReturn = oldTx.qty;
          if (oldProdMatch.isMapping && oldProdMatch.linkedSku) {
            const oldMain = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === oldProdMatch.linkedSku.replace(/\s+/g, '').toUpperCase());
            if (oldMain) {
              oldProductId = oldMain.id;
              oldQtyToReturn = oldTx.qty * (Number(oldProdMatch.multiplier) || 1);
            }
          }
          batch.update(doc(db, `users/${currentUser.uid}/products`, oldProductId), { stock: increment(oldQtyToReturn) });
        }
      }

      batch.update(doc(db, `users/${currentUser.uid}/products`, targetProductId), { stock: increment(-finalQtyToDeduct) });

      await batch.commit();

      triggerDataRefresh(); 
      alert("✅ Sukses memetakan produk pending!");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("❌ Gagal memperbarui data pending.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HANDLER 2: SAPU BERSIH DUPLIKASI DATA BERJALAN (ADAPTIF MULTI-MARKETPLACE) ---
  const handleDirectDatabaseCleanup = async () => {
    if (transactions.length === 0) return alert("Tidak ada data transaksi yang termuat.");
    setIsProcessing(true);

    try {
      const seenEntries = new Set<string>();
      const duplicatesToDelete: any[] = [];

      [...transactions].reverse().forEach((t) => {
        const cleanOrderId = String(t.orderId || "").trim().replace(/^#/, "").toLowerCase();
        const cleanSku = String(t.sku || "").replace(/\s+/g, "").toUpperCase();
        const marketplaceName = String(t.marketplace || "").toLowerCase();
        const lazadaItemIdValue = String(t.lazadaItemId || "").trim();

        let uniqueKey = "";
        if (marketplaceName.includes("lazada") && lazadaItemIdValue) {
          uniqueKey = `lazada_${cleanOrderId}_${lazadaItemIdValue}`;
        } else {
          uniqueKey = `general_${cleanOrderId}_${cleanSku}`;
        }

        if (seenEntries.has(uniqueKey)) {
          duplicatesToDelete.push(t); 
        } else {
          seenEntries.add(uniqueKey); 
        }
      });

      if (duplicatesToDelete.length === 0) {
        alert("✨ Mantap, Kev! Database ruko sudah 100% bersih dan rapi dari data ganda.");
        setIsProcessing(false);
        return;
      }

      const konfirmasi = window.confirm(
        `⚠️ Terdeteksi ${duplicatesToDelete.length} data duplikat riil (Aman dari item borongan Lazada).\nSapu bersih dari database cloud?`
      );
      if (!konfirmasi) {
        setIsProcessing(false);
        return;
      }

      const idsToDelete = duplicatesToDelete.map(d => d.id);
      await salesService.bulkDeleteTransactions(transactions, idsToDelete);
      
      triggerDataRefresh(); 
      alert(`✅ Sukses Besar! ${duplicatesToDelete.length} Data duplikat berhasil disapu bersih tanpa merusak pesanan borongan.`);
    } catch (err) {
      console.error("Gagal membersihkan data ganda:", err);
      alert("❌ Terjadi kesalahan sistem saat membersihkan data ganda.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HANDLER 3: UNGGAH DOKUMEN EXCEL MARKETPLACE (SINKRONISASI RESI & ORDER ID) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);
    const reader = new FileReader();
    const config = MARKETPLACE_CONFIG[selectedMarketplace];

    if (!config) {
      alert("❌ Konfigurasi marketplace tidak ditemukan!");
      setIsProcessing(false);
      return;
    }

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
        const excelBatch = writeBatch(db);

        for (const row of rawRows) {
          const resiValue = String(row[config.cols.resi] || "").trim();
          const orderIdValue = String(row[config.cols.orderId] || "").trim().replace(/^#/, "");
          
          const baseKeyForDoc = orderIdValue || resiValue;
          if (!baseKeyForDoc) continue;

          let rawSku = String(row[finalSkuIdx] || "").trim();
          if (selectedMarketplace === 'shopee' && !rawSku) rawSku = String(row[12] || "").trim(); 
          const sku = rawSku.replace(/\s+/g, '').toUpperCase();
          
          let uniqueKeyForCheck = "";
          if (selectedMarketplace === 'lazada' && config.cols.lazadaItemId !== undefined) {
            const lazadaItemIdValue = String(row[config.cols.lazadaItemId as number] || "").trim();
            uniqueKeyForCheck = `${orderIdValue}_${lazadaItemIdValue}`; 
          } else {
            uniqueKeyForCheck = `${orderIdValue}_${sku}`; 
          }

          const isAlreadyInState = transactions.some(t => {
            const txOrderId = String(t.orderId || "").trim().replace(/^#/, "");
            const txSku = String(t.sku || "").replace(/\s+/g, '').toUpperCase();
            const txLazadaItemId = String(t.lazadaItemId || "").trim();

            if (selectedMarketplace === 'lazada' && txLazadaItemId) {
              return `${txOrderId}_${txLazadaItemId}`.toLowerCase() === uniqueKeyForCheck.toLowerCase();
            }
            return `${txOrderId}_${txSku}`.toLowerCase() === uniqueKeyForCheck.toLowerCase();
          });

          if (isAlreadyInState) continue; 

          let qty = Number(row[config.cols.qty]) || 1;
          const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
          
          let unitPrice = 0, unitCost = 0, multiplier = 1, productName = "Produk Luar Katalog";
          let targetProductId = "";
          let finalQtyToDeduct = qty;

          if (matched) {
            productName = matched.name;
            targetProductId = matched.id;

            let catalogPrice = Number(matched.price) || 0;
            if (selectedMarketplace === 'tiktok' && matched.useMarketplacePrices) {
              catalogPrice = (matched.priceTiktok && Number(matched.priceTiktok) > 0) ? Number(matched.priceTiktok) : catalogPrice;
            }
            const excelPrice = (Number(row[config.cols.total]) / qty) || 0;
            unitPrice = catalogPrice > 0 ? catalogPrice : excelPrice;

            if (matched.isMapping && matched.linkedSku) {
              const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
              if (main) {
                unitCost = Number(main.costPrice);
                multiplier = Number(matched.multiplier) || 1;
                targetProductId = main.id;
                finalQtyToDeduct = qty * multiplier;
              }
            } else { 
              unitCost = Number(matched.costPrice) || 0; 
            }
          } else {
            unitPrice = (Number(row[config.cols.total]) / qty) || 0;
          }

          const totalRevenue = unitPrice * qty;
          const totalHpp = (unitCost * multiplier) * qty;

          let logisticsFee = 0;
          if (
            selectedMarketplace === 'tiktok' && 
            config.cols.shippingType !== undefined && 
            config.cols.province !== undefined && 
            config.cols.weight !== undefined
          ) {
            const rawShippingType = String(row[config.cols.shippingType as number] || "").trim().toUpperCase();
            const rawProvince = String(row[config.cols.province as number] || "").trim().toUpperCase();
            const parcelWeight = Number(row[config.cols.weight as number]) || 0;
            
            const finalShippingType = TIKTOK_SHIPPING_MAP[rawShippingType] || "STANDARD";
            logisticsFee = salesService.calculateTikTokLogistics(finalShippingType, rawProvince, parcelWeight);
          }

          const netProfit = salesService.calculateNetProfitEntry(totalRevenue, totalHpp, selectedMarketplace, logisticsFee);
          
          const rawExcelDate = config.cols.createdAt !== undefined ? row[config.cols.createdAt as number] : null; 
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

          const customDocId = selectedMarketplace === 'lazada' && config.cols.lazadaItemId !== undefined
            ? `${orderIdValue}_${String(row[config.cols.lazadaItemId as number] || "").trim()}`
            : `${orderIdValue || baseKeyForDoc}_${sku}`;
            
          const salesDocRef = doc(db, `users/${currentUser.uid}/sales`, customDocId);

          excelBatch.set(salesDocRef, {
            orderId: orderIdValue || baseKeyForDoc, 
            resi: resiValue || "",                
            sku, 
            product: productName, 
            total: totalRevenue, 
            hpp: totalHpp, 
            qty, 
            profit: netProfit, 
            logisticsFee, 
            marketplace: config.name, 
            status: 'Proses', 
            createdAt: transactionDate,
            ...(selectedMarketplace === 'lazada' && config.cols.lazadaItemId !== undefined && { 
              lazadaItemId: String(row[config.cols.lazadaItemId as number] || "").trim() 
            })
          }, { merge: true });

          // 🚀 KUNCI REKONSILIASI PENCOCOKAN HIERARKI PRIORITAS (Anti Double Potong Stok)
          if (targetProductId) {
            // Sterilkan string kunci excel untuk pencarian yang sangat akurat
            const cleanExcelResi = resiValue.replace(/\s+/g, '').toUpperCase().trim();
            const cleanExcelOrderId = orderIdValue.replace(/\s+/g, '').toUpperCase().trim();

            // 🕵️‍♂️ Saringan Prioritas Bertingkat: 
            // Prioritas 1: Wajib cari yang NOMOR RESI-nya cocok duluan
            let warehouseMatch = shopeeWarehouse.find(w => {
              const cleanWhResi = String(w.resi || "").replace(/\s+/g, '').toUpperCase().trim();
              const cleanWhSku = String(w.sku || "").replace(/\s+/g, '').toUpperCase().trim();
              return cleanExcelResi !== "" && cleanWhResi === cleanExcelResi && cleanWhSku === sku && !w.isUsed;
            });

            // Prioritas 2: Jika resi gagal cocok, baru cari cadangan berdasarkan NOMOR PESANAN (Order ID)
            if (!warehouseMatch) {
              warehouseMatch = shopeeWarehouse.find(w => {
                const cleanWhOrderId = String(w.orderId || "").replace(/\s+/g, '').toUpperCase().trim();
                const cleanWhSku = String(w.sku || "").replace(/\s+/g, '').toUpperCase().trim();
                return cleanExcelOrderId !== "" && cleanWhOrderId === cleanExcelOrderId && cleanWhSku === sku && !w.isUsed;
              });
            }

            if (warehouseMatch) {
              // ✅ JALUR AMAN: Terdeteksi ada di Advance Shipment!
              // Cukup ubah status titipan menjadi terpakai, STOK RAK FISIK UTAMA RUKO AMAN UTUH
              excelBatch.update(doc(db, `users/${currentUser.uid}/shopee_warehouse`, warehouseMatch.id), { 
                isUsed: true, 
                usedAt: serverTimestamp() 
              });
            } else {
              // JALUR REGULER: Pesanan baru luar titipan, potong stok di rak reguler berjalan normal
              excelBatch.update(doc(db, `users/${currentUser.uid}/products`, targetProductId), { 
                stock: increment(-finalQtyToDeduct) 
              });
            }
          }
          addedCount++;
        }
        
        await excelBatch.commit();
        
        triggerDataRefresh(); 
        alert(`✅ Sukses Besar! Berhasil impor ${addedCount} data jualan.`);
      } catch (err) { 
        alert("❌ Gagal memproses data file Excel. Cek kembali koordinat kolom."); 
        console.error(err); 
      } finally { 
        setIsProcessing(false); 
        e.target.value = ''; 
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- HANDLER 4: INPUT MULTI-PRODUK MANUAL VIA MODAL ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeFees || isProcessing) return alert("Sistem ruko belum siap.");
    setIsProcessing(true);
    try {
      await salesService.processMultiProductManual(manualForm, useCatalogPrice);
      setIsManualModalOpen(false);
      setManualForm({ 
        orderId: '', 
        resi: '', 
        source: 'Shopee', 
        status: 'Proses', 
        tiktokProvince: '', 
        tiktokWeight: 1, 
        tiktokType: 'Standard',
        items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }] 
      });
      
      triggerDataRefresh(); 
      alert("✅ Pesanan manual ruko berhasil tersimpan!");
    } catch (err) { 
      alert("❌ Terjadi kesalahan sistem saat menyimpan nota manual."); 
    } finally { 
      setIsProcessing(false); 
    }
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