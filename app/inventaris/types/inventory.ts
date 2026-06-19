// app/inventaris/types/inventory.ts
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  imageUrl: string;
  isMapping?: boolean;
  linkedSku?: string;
  multiplier?: number;
  useMarketplacePrices?: boolean;
  priceShopee?: number;
  priceTiktok?: number;
  priceLazada?: number;
  updatedAt?: any;
}