// lib/calculations.ts

export const calculateMarketplaceFee = (revenue: number, settings: any) => {
  if (!settings) return 0;

  // 1. Hitung Biaya Dasar (Base Fee)
  const baseCharge = revenue * (Number(settings.baseFee) / 100);

  // 2. Hitung Biaya Program dengan Logika 'Cap' (Batas Maksimal)
  const programCharge = settings.programs
    ? settings.programs
        .filter((p: any) => p.enabled)
        .reduce((acc: number, p: any) => {
          const calculated = revenue * (Number(p.percent) / 100);
          // Jika ada cap (seperti 60rb), ambil nilai terkecil antara kalkulasi vs cap
          const finalCharge = p.cap ? Math.min(calculated, Number(p.cap)) : calculated;
          return acc + finalCharge;
        }, 0)
    : 0;

  // 3. Total Admin = Base + Program + Biaya Tetap
  return baseCharge + programCharge + (Number(settings.fixedFee) || 0);
};

const getMarketplaceEstimation = (price: number, cost: number) => {
  if (!activeFees) return null;

  const results: any = {};
  
  ['shopee', 'tiktok', 'lazada'].forEach((mp) => {
    const settings = activeFees[mp];
    if (settings) {
      // Hitung Biaya Admin menggunakan helper yang sudah mendukung CAP
      const adminFee = calculateMarketplaceFee(price, settings);
      const netProfit = price - cost - adminFee;
      const margin = (netProfit / price) * 100;
      
      results[mp] = { netProfit, margin };
    }
  });
  
  return results;
};