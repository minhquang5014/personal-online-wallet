import storage from './secureStorageAdapter';

/**
 * Tuỳ chọn của người dùng, lưu cục bộ trên máy (SecureStore).
 * Dùng chung 1 blob JSON cho gọn — dữ liệu nhỏ, đọc/ghi 1 lần.
 */
export interface Prefs {
  /** Bật nhắc ghi chép hằng ngày (giờ nhắc cố định trong lib/notifications.ts). */
  reminderEnabled: boolean;
  /** Ví đang mở trên máy này. */
  walletId: string;
}

export const DEFAULT_PREFS: Prefs = {
  reminderEnabled: false,
  walletId: '',
};

const KEY = 'app_prefs_v1';

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await storage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    // Trộn với mặc định để không vỡ khi thêm field mới ở bản sau.
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  await storage.setItem(KEY, JSON.stringify(prefs));
}
