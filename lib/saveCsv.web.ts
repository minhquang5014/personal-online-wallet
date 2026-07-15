/**
 * Lưu file CSV trên WEB: tạo Blob rồi kích hoạt link tải của trình duyệt.
 * expo-file-system / expo-sharing không có bản web nên phải làm cách này.
 */
export async function saveCsv(name: string, csv: string): Promise<void> {
  // BOM đã nằm sẵn trong chuỗi csv; charset utf-8 để Excel đọc đúng tiếng Việt.
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Thu hồi URL sau một nhịp để trình duyệt kịp bắt đầu tải.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
