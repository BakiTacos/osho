// app/penjualan/settings/types/settings.ts
import { FieldValue } from "firebase/firestore";

export interface ProgramSetting {
  name: string;
  percent: number;
  enabled: boolean;
}

export interface MarketplaceFeeConfig {
  baseFee: string | number;
  programs: ProgramSetting[];
}

export interface AdminFeesSettings {
  [marketplace: string]: MarketplaceFeeConfig | FieldValue | any;
  updatedAt?: FieldValue | Date | null;
}