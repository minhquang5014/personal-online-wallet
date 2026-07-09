import * as SecureStore from 'expo-secure-store';

/**
 * Adapter lưu session Supabase vào expo-secure-store (Keychain/Keystore).
 *
 * SecureStore giới hạn ~2KB mỗi value, trong khi session Supabase (kèm refresh
 * token) có thể lớn hơn. Adapter này tự cắt value thành nhiều mảnh nhỏ và ghép
 * lại khi đọc, nên không bị giới hạn kích thước.
 */
const CHUNK_SIZE = 1800;

async function getChunkCount(key: string): Promise<number> {
  const meta = await SecureStore.getItemAsync(`${key}__count`);
  return meta ? parseInt(meta, 10) : 0;
}

const adapter = {
  async getItem(key: string): Promise<string | null> {
    const count = await getChunkCount(key);
    if (count === 0) {
      // Trường hợp value ngắn được lưu trực tiếp (không chia mảnh)
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
    // Dọn mảnh cũ trước khi ghi mới
    await adapter.removeItem(key);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}__count`, String(count));
    for (let i = 0; i < count; i++) {
      const slice = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(`${key}__${i}`, slice);
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

export default adapter;
