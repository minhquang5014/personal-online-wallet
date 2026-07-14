/**
 * Domain model. Cấu trúc này được thiết kế để map 1-1 với bảng trên Supabase sau này:
 *   - Category  -> bảng `categories`
 *   - Transaction -> bảng `transactions`
 */

export type TxType = 'income' | 'expense';

/** Vai trò trong ví. `owner` quản lý ví và sửa/xoá được mọi giao dịch. */
export type MemberRole = 'owner' | 'member';

/** Một người dùng chung ví (vd: 2 vợ chồng). Map với bảng `wallet_members`. */
export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  /** URL ảnh đại diện; '' nghĩa là chưa đặt. */
  avatarUrl: string;
}

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
  createdBy: string; // id người đã nhập giao dịch này
}

/** Transaction đã được join với Category + người nhập để render/xuất file. */
export interface TransactionWithCategory extends Transaction {
  category: Category;
  creator: Member;
}
