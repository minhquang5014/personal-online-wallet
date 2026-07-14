import { dayKey } from './format';
import { TransactionWithCategory } from './types';

/** Bọc field CSV nếu có dấu phẩy, nháy kép hoặc xuống dòng. */
function esc(v: string | number): string {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Dựng nội dung CSV cho toàn bộ giao dịch, sắp cũ -> mới.
 * Có BOM UTF-8 để Excel đọc đúng tiếng Việt.
 */
export function buildCsv(txs: TransactionWithCategory[]): string {
  const header = ['Ngày', 'Loại', 'Danh mục', 'Số tiền', 'Ghi chú', 'Người nhập'];
  const sorted = [...txs].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const lines = [header.map(esc).join(',')];
  for (const t of sorted) {
    lines.push(
      [
        dayKey(t.date),
        t.type === 'income' ? 'Thu' : 'Chi',
        t.category.name,
        t.amount, // số thô để Excel tính toán được
        t.note,
        t.creator.name,
      ]
        .map(esc)
        .join(',')
    );
  }
  return '﻿' + lines.join('\r\n');
}
