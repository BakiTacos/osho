// app/penjualan/settings/hooks/useSettingsPage.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { SettingsService } from "../../pengaturan/services/SettingsServices";
import { AdminFeesSettings } from "../types/settings";

export function useSettingsPage(currentUser: any) {
  const [feeSettings, setFeeSettings] = useState<AdminFeesSettings | null>(null);
  const [modules, setModules] = useState<any | null>(null);
  const [qrSettings, setQrSettings] = useState<any | null>(null);
  const [fetching, setFetching] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const settingsService = new SettingsService(currentUser?.uid || "");

  // Fetch data on-demand strictly saat UID terdeteksi aman
  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadSettings = async () => {
      try {
        const [feesData, modulesData, qrData] = await Promise.all([
          settingsService.getAdminFees(),
          settingsService.getActiveModules(),
          settingsService.getQrCodeSettings()
        ]);
        setFeeSettings(feesData);
        setModules(modulesData);
        setQrSettings(qrData);
      } catch (error) {
        console.error("Gagal memuat domain settings:", error);
      } finally {
        setFetching(false);
      }
    };

    loadSettings();
  }, [currentUser?.uid]);

  // Handler toggle sub-program bebas efek samping mutasi langsung (Deep Clone)
  const toggleProgram = useCallback((marketplace: string, index: number) => {
    setFeeSettings((prev) => {
      if (!prev) return null;
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[marketplace]?.programs?.[index]) {
        copy[marketplace].programs[index].enabled = !copy[marketplace].programs[index].enabled;
      }
      return copy;
    });
  }, []);

  // Handler toggle modul
  const toggleModule = useCallback((target: "home" | "mobileNavbar" | "sidebar", key: string) => {
    setModules((prev: any) => {
      if (!prev) return null;
      const copy = { ...prev };
      if (!copy[target]) copy[target] = {};
      copy[target][key] = !copy[target][key];
      return copy;
    });
  }, []);

  // Handler pengubah base fee admin
  const handleBaseFeeChange = useCallback((marketplace: string, value: string) => {
    setFeeSettings((prev) => {
      if (!prev) return null;
      const copy = { ...prev };
      if (copy[marketplace]) {
        copy[marketplace] = { ...copy[marketplace], baseFee: value };
      }
      return copy;
    });
  }, []);

  // Hitung kumulatif persentase potongan komisi secara real-time
  const calculateTotalFee = useCallback((marketplace: string) => {
    if (!feeSettings || !feeSettings[marketplace]) return 0;
    const base = Number(feeSettings[marketplace].baseFee) || 0;
    const programs = feeSettings[marketplace].programs
      .filter((p: any) => p.enabled)
      .reduce((acc: number, curr: any) => acc + Number(curr.percent), 0);
    return Number((base + programs).toFixed(2));
  }, [feeSettings]);

  // Fungsi eksekusi simpan massal
  const saveConfiguration = async () => {
    if (!currentUser?.uid || isSaving) return;
    setIsSaving(true);
    try {
      const promises: Promise<any>[] = [];
      if (feeSettings) {
        promises.push(settingsService.saveAdminFees(feeSettings));
      }
      if (modules) {
        promises.push(settingsService.saveActiveModules(modules));
      }
      if (qrSettings) {
        promises.push(settingsService.saveQrCodeSettings(qrSettings));
      }
      await Promise.all(promises);
      alert("✅ Pengaturan Berhasil Disimpan!");
    } catch (error) {
      console.error(error);
      alert("❌ Gagal menyimpan konfigurasi ke cloud server ruko.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    feeSettings,
    modules,
    qrSettings,
    setQrSettings,
    fetching,
    isSaving,
    toggleProgram,
    toggleModule,
    handleBaseFeeChange,
    calculateTotalFee,
    saveConfiguration
  };
}