import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Kho lưu key-value dùng chung (session Supabase, tuỳ chọn, token Google).
 *
 * expo-secure-store KHÔNG có bản cài cho web — module vẫn import được nhưng
 * các hàm là undefined, gọi vào sẽ văng
 * "ExpoSecureStore.default.getValueWithKeyAsync is not a function".
 * Nên trên web ta dùng AsyncStorage (chạy trên localStorage).
 *
 * Trên native dùng SecureStore (Keychain/Keystore). SecureStore giới hạn ~2KB
 * mỗi value, mà session Supabase kèm refresh token có thể lớn hơn, nên value
 * dài được cắt thành nhiều mảnh và ghép lại khi đọc.
 */
const isWeb = Platform.OS === 'web';
const CHUNK_SIZE = 1800;

async function getChunkCount(key: string): Promise<number> {
  const meta = await SecureStore.getItemAsync(`${key}__count`);
  return meta ? parseInt(meta, 10) : 0;
}

const nativeAdapter = {
  async getItem(key: string): Promise<string | null> {
    const count = await getChunkCount(key);
    if (count === 0) {
      // Value ngắn được lưu trực tiếp (không chia mảnh)
      return SecureStore.getItemAsync(key);
    }
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}__${i}`);
      if (part == null) return null; // dữ liệu hỏng -> coi như chưa có
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    await nativeAdapter.removeItem(key); // dọn mảnh cũ trước khi ghi mới

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}__count`, String(count));
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(`${key}__${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
  },

  async removeItem(key: string): Promise<void> {
    const count = await getChunkCount(key);
    await SecureStore.deleteItemAsync(key);
    await SecureStore.deleteItemAsync(`${key}__count`);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}__${i}`);
    }
  },
};

const webAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

const adapter = isWeb ? webAdapter : nativeAdapter;

export default adapter;
