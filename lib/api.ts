import { supabase } from './supabase';
import { Category, Transaction, TransactionWithCategory, TxType } from './types';

/**
 * Lớp truy vấn dữ liệu thật từ Supabase.
 *
 * Các hàm ở đây là phiên bản async, cùng "hình dạng" dữ liệu trả về với
 * lib/mockData.ts. Khi đã chạy migration + có .env, chỉ cần đổi import trong
 * các màn hình từ './mockData' sang './api' và bọc trong useEffect/useState.
 */

// Kiểu dữ liệu đúng như cột trong DB (snake_case)
interface CategoryRow {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: TxType;
}
interface TransactionRow {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: TxType;
  note: string;
  occurred_at: string;
}

const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  icon: r.icon,
  color: r.color,
  type: r.type,
});

// ---------------------------------------------------------------------
// Đọc dữ liệu
// ---------------------------------------------------------------------

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, user_id, name, icon, color, type')
    .order('type', { ascending: true });
  if (error) throw error;
  return (data as CategoryRow[]).map(toCategory);
}

export async function fetchTransactionsWithCategory(): Promise<TransactionWithCategory[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, user_id, category_id, amount, type, note, occurred_at, categories(*)')
    .order('occurred_at', { ascending: false });
  if (error) throw error;

  return (data as any[]).map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    type: r.type,
    categoryId: r.category_id,
    note: r.note,
    date: r.occurred_at,
    category: toCategory(r.categories),
  }));
}

// ---------------------------------------------------------------------
// Ghi dữ liệu
// ---------------------------------------------------------------------

export interface NewTransaction {
  amount: number;
  type: TxType;
  categoryId: string;
  note?: string;
  occurredAt?: string; // ISO; mặc định = bây giờ
}

export async function addTransaction(input: NewTransaction): Promise<Transaction> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error('Chưa đăng nhập');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
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
  };
}

// ---------------------------------------------------------------------
// Auth (email + mật khẩu)
// ---------------------------------------------------------------------

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
