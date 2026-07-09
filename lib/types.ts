/**
 * Domain model. Cấu trúc này được thiết kế để map 1-1 với bảng trên Supabase sau này:
 *   - Category  -> bảng `categories`
 *   - Transaction -> bảng `transactions`
 */

export type TxType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string; // Ionicons name, ví dụ: "fast-food"
  color: string; // màu nền icon
  type: TxType;
}

export interface Transaction {
  id: string;
  amount: number; // luôn là số dương, chiều tiền xác định bởi `type`
  type: TxType;
  categoryId: string;
  note: string;
  date: string; // ISO 8601, ví dụ "2026-07-09T10:30:00Z"
}

/** Transaction đã được join với Category để render. */
export interface TransactionWithCategory extends Transaction {
  category: Category;
}
