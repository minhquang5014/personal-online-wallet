import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Lưu & chia sẻ file CSV trên NATIVE (iOS/Android).
 * Ghi ra bộ nhớ tạm rồi mở bảng chia sẻ để chọn nơi lưu/gửi.
 * (Bản web dùng saveCsv.web.ts — tải thẳng qua trình duyệt.)
 */
export async function saveCsv(name: string, csv: string): Promise<void> {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true }); // ghi đè nếu hôm nay đã xuất một lần
  file.write(csv);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Thiết bị không hỗ trợ chia sẻ file. File đã lưu ở bộ nhớ tạm.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Xuất giao dịch (CSV)',
    UTI: 'public.comma-separated-values-text',
  });
}
