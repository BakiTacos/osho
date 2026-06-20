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
}