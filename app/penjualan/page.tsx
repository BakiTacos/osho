"use client";

import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useSalesData } from "../hooks/useSalesData";
import { doc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import * as XLSX from 'xlsx';
import { SalesService } from "../../lib/services/SalesService";
import { MARKETPLACE_CONFIG } from "../../lib/constants/sales";

// IMPORT SUB-COMPONENTS
import SalesHeader from "../../components/sales/SalesHeader";
import SalesFilters from "../../components/sales/SalesFilters";
import SalesStats from "../../components/sales/SalesStats";
import SalesTable from "../../components/sales/SalesTable";
import ImportCard from "../../components/sales/ImportCard";
import { ManualInputModal } from "../../components/sales/SalesModals";

export default function PenjualanPage() {
  const { currentUser } = useAuth();
  

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCatalogPrice, setUseCatalogPrice] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState("shopee");
  const [timeFilter, setTimeFilter] = useState("Hari Ini");
  const [statusTab, setStatusTab] = useState("Semua");
  const [searchSales, setSearchSales] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { catalog, transactions, shopeeWarehouse, activeFees } = useSalesData(currentUser);
  const salesService = new SalesService(currentUser, catalog, shopeeWarehouse, activeFees);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualForm, setManualForm] = useState({
    orderId: '', source: 'Shopee', status: 'Proses', tiktokProvince: '', 
    tiktokWeight: 1, tiktokType: 'Standard',
    items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }]
  });

  // Logic Filter
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

  // --- HANDLERS ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);
    const reader = new FileReader();
    const config = MARKETPLACE_CONFIG[selectedMarketplace];
    const existingOrderIds = new Set(transactions.map(t => String(t.orderId).trim()));

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
          if (!finalId || existingOrderIds.has(finalId)) continue;

          let logisticsFee = 0;
          if (selectedMarketplace === 'tiktok') {
            const rawShippingType = String(row[config.cols.shippingType] || "").trim().toUpperCase();
            const rawProvince = String(row[config.cols.province] || "").trim().toUpperCase();
            const parcelWeight = Number(row[config.cols.weight]) || 0;
            const finalShippingType = TIKTOK_SHIPPING_MAP[rawShippingType] || "STANDARD";
            logisticsFee = salesService.calculateTikTokLogistics(finalShippingType, rawProvince, parcelWeight);
          }

          let rawSku = String(row[finalSkuIdx] || "").trim();
          if (selectedMarketplace === 'shopee' && !rawSku) rawSku = String(row[12] || "").trim(); 
          const sku = rawSku.replace(/\s+/g, '').toUpperCase();
          const qty = Number(row[config.cols.qty]) || 1;
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
          const netProfit = salesService.calculateNetProfitEntry(totalRevenue, totalHpp, selectedMarketplace, logisticsFee);

          await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
            orderId: finalId, sku, product: productName, total: totalRevenue, hpp: totalHpp, qty, 
            profit: netProfit, logisticsFee, marketplace: config.name, status: 'Proses', createdAt: serverTimestamp()
          });
          await salesService.updateProductStock(sku, -qty, finalId);
          addedCount++;
        }
        alert(`Berhasil impor ${addedCount} data. Ekstraksi tarif Logistik TikTok aktif.`);
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

  if (!currentUser) return null;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-10">
      <SalesHeader onOpenManual={() => setIsManualModalOpen(true)} />
      
      <SalesFilters 
        timeFilter={timeFilter} setTimeFilter={setTimeFilter}
        selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        searchSales={searchSales} setSearchSales={setSearchSales}
        statusTab={statusTab} setStatusTab={setStatusTab}
        pendingCount={transactions.filter(t => t.product === "Produk Luar Katalog").length}
      />

      <SalesStats transactions={filteredTransactions} label={timeFilter} />

      <div className="px-4 sm:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ImportCard 
          selectedMarketplace={selectedMarketplace}
          setSelectedMarketplace={setSelectedMarketplace}
          isProcessing={isProcessing}
          onUpload={handleFileUpload}
        />

        <SalesTable 
          items={filteredTransactions}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onDeleteBulk={() => {
            salesService.bulkDeleteTransactions(transactions, selectedIds);
            setSelectedIds([]);
          }}
          onDeleteSingle={(t: any) => salesService.deleteTransaction(t)}
          onStatusUpdate={async (id: string, status: string) => {
            await updateDoc(doc(db, `users/${currentUser?.uid}/sales`, id), { status });
          }}
        />
      </div>

      <ManualInputModal 
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        manualForm={manualForm}
        setManualForm={setManualForm}
        useCatalogPrice={useCatalogPrice}
        setUseCatalogPrice={setUseCatalogPrice}
        isProcessing={isProcessing}
        onSubmit={handleManualSubmit}
        addManualItem={() => setManualForm({...manualForm, items: [...manualForm.items, { sku: '', qty: 1, manualPrice: '', manualCost: '' }]})} 
        removeManualItem={(index: number) => setManualForm({...manualForm, items: manualForm.items.filter((_, i) => i !== index)})} 
        updateManualItem={(index: number, field: string, value: any) => { 
          const newItems = [...manualForm.items]; 
          newItems[index] = { ...newItems[index], [field]: value }; 
          setManualForm({ ...manualForm, items: newItems }); 
        }} 
      />
    </div>
  );
}