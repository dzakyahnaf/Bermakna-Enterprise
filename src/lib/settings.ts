import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/constants";

export type PlatformSettings = {
  commissionPercent: number;
  adminFee: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  supportWhatsapp: string;
  instagram: string;
};

/** Membaca pengaturan platform, jatuh ke nilai bawaan bila belum diisi. */
export const getSettings = cache(async (): Promise<PlatformSettings> => {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const read = (key: string) => map.get(key) ?? DEFAULT_SETTINGS[key] ?? "";

  return {
    commissionPercent: Number(read(SETTING_KEYS.COMMISSION_PERCENT)) || 0,
    adminFee: Number(read(SETTING_KEYS.ADMIN_FEE)) || 0,
    bankName: read(SETTING_KEYS.BANK_NAME),
    bankAccount: read(SETTING_KEYS.BANK_ACCOUNT),
    bankHolder: read(SETTING_KEYS.BANK_HOLDER),
    supportWhatsapp: read(SETTING_KEYS.SUPPORT_WHATSAPP),
    instagram: read(SETTING_KEYS.INSTAGRAM),
  };
});

export type RincianBiaya = {
  subtotal: number;
  adminFee: number;
  commission: number;
  total: number;
  providerPayout: number;
};

/**
 * Menghitung rincian biaya satu pesanan.
 * - Pembeli membayar: subtotal + biaya administrasi
 * - Penyedia menerima: subtotal - komisi layanan
 * - Pendapatan platform: biaya administrasi + komisi
 */
export function hitungBiaya(
  unitPrice: number,
  quantity: number,
  settings: Pick<PlatformSettings, "commissionPercent" | "adminFee">,
): RincianBiaya {
  const subtotal = unitPrice * quantity;
  const adminFee = settings.adminFee;
  const commission = Math.round((subtotal * settings.commissionPercent) / 100);
  return {
    subtotal,
    adminFee,
    commission,
    total: subtotal + adminFee,
    providerPayout: subtotal - commission,
  };
}
