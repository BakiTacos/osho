// app/penjualan/settings/services/SettingsService.ts
import { db } from "../../../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { AdminFeesSettings } from "../types/settings";
import { DEFAULT_MARKETPLACE_SETTINGS } from "../../../lib/constants/sales";

export class SettingsService {
  constructor(private uid: string) {}

  /**
   * Mengambil data master biaya dari Firestore.
   * Jika user baru dan dokumen kosong, otomatis menginisialisasi dengan data default ruko.
   */
  public async getAdminFees(): Promise<AdminFeesSettings> {
    if (!this.uid) throw new Error("UID pengguna tidak valid.");
    
    const docRef = doc(db, `users/${this.uid}/settings`, "admin_fees");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ...DEFAULT_MARKETPLACE_SETTINGS, ...docSnap.data() };
    } else {
      const initialData = {
        ...DEFAULT_MARKETPLACE_SETTINGS,
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, initialData);
      return initialData;
    }
  }

  /**
   * Menyimpan perubahan seluruh konfigurasi program marketplace ke Firestore Cloud.
   */
  public async saveAdminFees(settings: AdminFeesSettings): Promise<void> {
    if (!this.uid) throw new Error("UID pengguna tidak valid.");
    
    const docRef = doc(db, `users/${this.uid}/settings`, "admin_fees");
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Mengambil data modul aktif dari Firestore.
   */
  public async getActiveModules(): Promise<Record<string, any>> {
    if (!this.uid) throw new Error("UID pengguna tidak valid.");
    
    const docRef = doc(db, `users/${this.uid}/settings`, "modules");
    const docSnap = await getDoc(docRef);
    
    const defaultModules = {
      home: {
        inventaris: true,
        penjualan: true,
        invoicing: true,
        pembayaran: true,
        retur: true,
        laporan: true
      },
      mobileNavbar: {
        inventaris: true,
        penjualan: true,
        invoicing: false,
        pembayaran: false,
        retur: true,
        laporan: false
      },
      sidebar: {
        inventaris: true,
        penjualan: true,
        invoicing: true,
        pembayaran: true,
        retur: true,
        laporan: true
      }
    };
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        home: { ...defaultModules.home, ...data.home },
        mobileNavbar: { ...defaultModules.mobileNavbar, ...data.mobileNavbar },
        sidebar: { ...defaultModules.sidebar, ...data.sidebar }
      };
    } else {
      await setDoc(docRef, defaultModules);
      return defaultModules;
    }
  }

  /**
   * Menyimpan data modul aktif ke Firestore.
   */
  public async saveActiveModules(modules: Record<string, any>): Promise<void> {
    if (!this.uid) throw new Error("UID pengguna tidak valid.");
    
    const docRef = doc(db, `users/${this.uid}/settings`, "modules");
    await setDoc(docRef, {
      home: modules.home || {},
      mobileNavbar: modules.mobileNavbar || {},
      sidebar: modules.sidebar || {},
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Mengambil data QR Code dinamis dari Firestore.
   */
  public async getQrCodeSettings(): Promise<any> {
    if (!this.uid) throw new Error("UID pengguna tidak valid.");
    
    const docRef = doc(db, `users/${this.uid}/qrcode`, "main");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      const initialData = {
        destinationUrl: "",
        scanCount: 0,
        lastScannedAt: null,
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, initialData);
      return initialData;
    }
  }

  /**
   * Menyimpan konfigurasi QR Code dinamis ke Firestore.
   */
  public async saveQrCodeSettings(settings: any): Promise<void> {
    if (!this.uid) throw new Error("UID pengguna tidak valid.");
    
    const docRef = doc(db, `users/${this.uid}/qrcode`, "main");
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
}