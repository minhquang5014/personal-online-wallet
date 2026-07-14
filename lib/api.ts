import { base64ToBytes } from './base64';
import { supabase } from './supabase';
import { Category, Member, MemberRole, Transaction, TransactionWithCategory, TxType } from './types';

/** Lớp truy vấn dữ liệu thật từ Supabase. Mọi quyền hạn do RLS ở DB quyết định. */

export interface Wallet {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
}

// Kiểu dữ liệu đúng như cột trong DB (snake_case)
interface CategoryRow {
  id: string;
  wallet_id: string | null; // null = danh mục mặc định dùng chung
  name: string;
  icon: string;
  color: string;
  type: TxType;
}
interface TransactionRow {
  id: string;
  wallet_id: string;
  category_id: string | null;
  amount: number;
  type: TxType;
  note: string;
  occurred_at: string;
  created_by: string;
}

const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  icon: r.icon,
  color: r.color,
  type: r.type,
});

// ---------------------------------------------------------------------
// Ví & thành viên
// ---------------------------------------------------------------------

const toWallet = (r: any): Wallet => ({
  id: r.id,
  name: r.name,
  ownerId: r.owner_id,
  inviteCode: r.invite_code,
});

/** Các ví mà user hiện tại là thành viên (RLS tự lọc). */
export async function fetchMyWallets(): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('wallets')
    .select('id, name, owner_id, invite_code')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toWallet);
}

/** Tạo ví mới; RPC tự thêm người tạo làm chủ ví. */
export async function createWallet(name: string): Promise<Wallet> {
  const { data, error } = await supabase.rpc('create_wallet', { p_name: name });
  if (error) throw error;
  return toWallet(data);
}

/** Tham gia ví bằng mã mời 6 ký tự. */
export async function joinWallet(code: string): Promise<Wallet> {
  const { data, error } = await supabase.rpc('join_wallet', { p_code: code });
  if (error) throw error;
  return toWallet(data);
}

/**
 * Đổi tên ví. RLS `wallets_update_owner` chỉ cho chủ ví sửa; người khác gọi thì
 * update trúng 0 dòng (không lỗi) -> nên yêu cầu `.select()` và kiểm tra kết quả
 * để báo rõ khi không có quyền.
 */
export async function renameWallet(id: string, name: string): Promise<void> {
  const { data, error } = await supabase.from('wallets').update({ name }).eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Chỉ chủ ví mới đổi được tên ví');
}

/** Tự rời ví (xoá dòng thành viên của chính mình). RLS cho phép. */
export async function leaveWallet(walletId: string): Promise<void> {
  const { data: sessionRes } = await supabase.auth.getSession();
  const uid = sessionRes.session?.user.id;
  if (!uid) throw new Error('Chưa đăng nhập');
  const { error } = await supabase
    .from('wallet_members')
    .delete()
    .eq('wallet_id', walletId)
    .eq('user_id', uid);
  if (error) throw error;
}

/** Chủ ví xoá một thành viên. RLS chỉ cho chủ ví -> không đủ quyền thì trúng 0 dòng. */
export async function removeMember(walletId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('wallet_members')
    .delete()
    .eq('wallet_id', walletId)
    .eq('user_id', userId)
    .select('user_id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Không có quyền xoá thành viên này');
}

export async function fetchMembers(walletId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('wallet_members_view')
    .select('user_id, role, display_name, email, avatar_url')
    .eq('wallet_id', walletId);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.user_id,
    name: r.display_name || r.email || 'Không rõ',
    role: r.role as MemberRole,
    avatarUrl: r.avatar_url ?? '',
  }));
}

// ---------------------------------------------------------------------
// Đọc dữ liệu
// ---------------------------------------------------------------------

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, wallet_id, name, icon, color, type')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true }); // tie-break cho danh mục tự tạo (cùng sort_order mặc định)
  if (error) throw error;
  return (data as CategoryRow[]).map(toCategory);
}

/**
 * Giao dịch của một ví, kèm danh mục và người nhập.
 *
 * Đọc từ view `transactions_with_creator` (đã join sẵn tên + vai trò người nhập).
 * View không embed được qua PostgREST nên danh mục ghép ở phía client — vì thế
 * danh mục được TRUYỀN VÀO chứ không tự fetch, tránh gọi mạng thừa.
 */
export async function fetchTransactionsWithCategory(
  walletId: string,
  categories: Category[]
): Promise<TransactionWithCategory[]> {
  const { data, error } = await supabase
    .from('transactions_with_creator')
    .select('*')
    .eq('wallet_id', walletId)
    .order('occurred_at', { ascending: false });
  if (error) throw error;

  const catById = new Map(categories.map((c) => [c.id, c]));

  return (data as any[]).map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    type: r.type,
    categoryId: r.category_id,
    note: r.note,
    date: r.occurred_at,
    createdBy: r.created_by,
    category: catById.get(r.category_id)!,
    creator: {
      id: r.created_by,
      name: r.creator_name || 'Không rõ',
      role: (r.creator_role ?? 'member') as MemberRole,
      avatarUrl: '', // dòng giao dịch không hiện avatar, lấy từ `members` nếu cần
    },
  }));
}

// ---------------------------------------------------------------------
// Ghi dữ liệu
// ---------------------------------------------------------------------

export interface NewTransaction {
  walletId: string;
  amount: number;
  type: TxType;
  categoryId: string;
  note?: string;
  occurredAt?: string; // ISO; mặc định = bây giờ
}

export async function addTransaction(input: NewTransaction): Promise<Transaction> {
  const { data: sessionRes } = await supabase.auth.getSession();
  const userId = sessionRes.session?.user.id;
  if (!userId) throw new Error('Chưa đăng nhập');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      wallet_id: input.walletId,
      created_by: userId, // RLS bắt buộc created_by = auth.uid()
      category_id: input.categoryId,
      amount: input.amount,
      type: input.type,
      note: input.note ?? '',
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  const r = data as TransactionRow;
  return {
    id: r.id,
    amount: Number(r.amount),
    type: r.type,
    categoryId: r.category_id!,
    note: r.note,
    date: r.occurred_at,
    createdBy: r.created_by,
  };
}

export interface EditTransaction {
  amount: number;
  type: TxType;
  categoryId: string;
  note?: string;
  occurredAt?: string;
}

/**
 * Sửa giao dịch. Không đổi `wallet_id`/`created_by`. RLS chỉ cho sửa giao dịch
 * của mình (hoặc bất kỳ nếu là chủ ví); không có quyền -> update trúng 0 dòng.
 */
export async function updateTransaction(id: string, input: EditTransaction): Promise<void> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      category_id: input.categoryId,
      amount: input.amount,
      type: input.type,
      note: input.note ?? '',
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Không có quyền sửa giao dịch này');
}

/** Xoá giao dịch. RLS chỉ cho xoá của mình, hoặc bất kỳ nếu là chủ ví. */
export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Hồ sơ
// ---------------------------------------------------------------------

export async function updateMyProfile(name: string): Promise<void> {
  const { data: sessionRes } = await supabase.auth.getSession();
  const userId = sessionRes.session?.user.id;
  if (!userId) throw new Error('Chưa đăng nhập');

  const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', userId);
  if (error) throw error;
}

/**
 * Upload ảnh đại diện (nhận base64 từ image picker) rồi lưu URL vào profiles.
 * Trả về URL công khai đã kèm tham số phá cache.
 */
export async function uploadAvatar(base64: string): Promise<string> {
  const { data: sessionRes } = await supabase.auth.getSession();
  const userId = sessionRes.session?.user.id;
  if (!userId) throw new Error('Chưa đăng nhập');

  // Path cố định `<uid>/avatar.jpg` để policy kiểm tra thư mục đầu = auth.uid().
  const path = `${userId}/avatar.jpg`;
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, base64ToBytes(base64), { contentType: 'image/jpeg', upsert: true });
  if (upErr) throw upErr;

  // Ghi đè cùng path nên CDN vẫn trả ảnh cũ -> gắn ?v= để ép tải lại.
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
  if (error) throw error;
  return url;
}

// ---------------------------------------------------------------------
// Auth (email + mật khẩu)
// ---------------------------------------------------------------------

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Trigger `handle_new_user` đọc key này để đặt tên cho profiles.
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  // scope: 'local' -> chỉ xoá phiên trên máy, KHÔNG gọi mạng thu hồi token.
  // Mặc định 'global' sẽ ném lỗi khi mất mạng / token hết hạn và để lại phiên
  // trên máy -> bấm "Đăng xuất" như không có tác dụng.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
