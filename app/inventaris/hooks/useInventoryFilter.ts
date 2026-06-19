// app/inventaris/hooks/useInventoryFilter.ts
import { useState, useEffect, useMemo } from 'react';
import { Product } from '../types/inventory';

export function useInventoryFilter(products: Product[], inventoryService: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "netProfit" | "netMargin">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // 💡 Angka limit halaman ada di sini

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, sortBy, sortOrder]);

  const processedProducts = useMemo(() => {
    return products
      .filter(p => 
        (p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
         p.sku.toLowerCase().includes(debouncedSearch.toLowerCase())) && 
        (selectedCategory === "Semua" || p.category === selectedCategory)
      )
      .sort((a, b) => {
        let valA: any, valB: any;
        if (sortBy === "netProfit" || sortBy === "netMargin") {
          const estA = inventoryService.getMarketplaceEstimation(a);
          const estB = inventoryService.getMarketplaceEstimation(b);
          valA = sortBy === "netProfit" ? (estA?.results?.shopee?.netProfit || 0) : (estA?.results?.shopee?.margin || 0);
          valB = sortBy === "netProfit" ? (estB?.results?.shopee?.netProfit || 0) : (estB?.results?.shopee?.margin || 0);
        } else {
          valA = a[sortBy] || 0;
          valB = b[sortBy] || 0;
        }
        return sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
  }, [products, debouncedSearch, selectedCategory, sortBy, sortOrder, inventoryService]);

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  
  const currentItems = useMemo(() => {
    return processedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [processedProducts, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      if (p.stock === 0) {
        outOfStock++;
      } else if (p.stock > 0 && p.stock <= 10) {
        lowStock++;
      }
    });

    return {
      totalProducts: products.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock
    };
  }, [products]);

  // 🚀 DISINI KOREKSINYA: Pastikan itemsPerPage ikut dioper keluar!
  return {
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    currentPage, setCurrentPage,
    totalPages, currentItems, processedProducts, 
    itemsPerPage, // ✨ Sekarang aman, file page.tsx tidak akan bingung lagi!
    stats
  };
}