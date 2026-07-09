import { Category, Transaction, TransactionWithCategory } from './types';

/**
 * Dữ liệu giả lập để dựng UI. Khi kết nối Supabase, thay các hàm getX() bên dưới
 * bằng query thật — phần UI không cần đổi vì vẫn nhận về cùng kiểu dữ liệu.
 */

export const categories: Category[] = [
  { id: 'c_food', name: 'Ăn uống', icon: 'fast-food', color: '#F97316', type: 'expense' },
  { id: 'c_transport', name: 'Di chuyển', icon: 'car', color: '#0EA5E9', type: 'expense' },
  { id: 'c_shopping', name: 'Mua sắm', icon: 'bag-handle', color: '#EC4899', type: 'expense' },
  { id: 'c_bills', name: 'Hóa đơn', icon: 'receipt', color: '#8B5CF6', type: 'expense' },
  { id: 'c_coffee', name: 'Cà phê', icon: 'cafe', color: '#A16207', type: 'expense' },
  { id: 'c_health', name: 'Sức khỏe', icon: 'medkit', color: '#EF4444', type: 'expense' },
  { id: 'c_fun', name: 'Giải trí', icon: 'game-controller', color: '#14B8A6', type: 'expense' },
  { id: 'c_salary', name: 'Lương', icon: 'cash', color: '#16A34A', type: 'income' },
  { id: 'c_bonus', name: 'Thưởng', icon: 'gift', color: '#22C55E', type: 'income' },
  { id: 'c_invest', name: 'Đầu tư', icon: 'trending-up', color: '#0D9488', type: 'income' },
];

const byId = (id: string) => categories.find((c) => c.id === id)!;

export const transactions: Transaction[] = [
  { id: 't1', amount: 25000000, type: 'income', categoryId: 'c_salary', note: 'Lương tháng 7', date: '2026-07-05T09:00:00Z' },
  { id: 't2', amount: 85000, type: 'expense', categoryId: 'c_food', note: 'Cơm trưa văn phòng', date: '2026-07-09T04:30:00Z' },
  { id: 't3', amount: 45000, type: 'expense', categoryId: 'c_coffee', note: 'Highlands', date: '2026-07-09T02:15:00Z' },
  { id: 't4', amount: 320000, type: 'expense', categoryId: 'c_transport', note: 'Đổ xăng', date: '2026-07-08T11:00:00Z' },
  { id: 't5', amount: 1200000, type: 'expense', categoryId: 'c_shopping', note: 'Áo khoác', date: '2026-07-08T08:20:00Z' },
  { id: 't6', amount: 650000, type: 'expense', categoryId: 'c_bills', note: 'Tiền điện tháng 6', date: '2026-07-07T15:00:00Z' },
  { id: 't7', amount: 180000, type: 'expense', categoryId: 'c_fun', note: 'Vé xem phim', date: '2026-07-06T13:00:00Z' },
  { id: 't8', amount: 2000000, type: 'income', categoryId: 'c_bonus', note: 'Thưởng dự án', date: '2026-07-06T10:00:00Z' },
  { id: 't9', amount: 95000, type: 'expense', categoryId: 'c_food', note: 'Ăn tối', date: '2026-07-05T12:40:00Z' },
  { id: 't10', amount: 450000, type: 'expense', categoryId: 'c_health', note: 'Thuốc + khám', date: '2026-07-04T09:30:00Z' },
  { id: 't11', amount: 60000, type: 'expense', categoryId: 'c_coffee', note: 'Cà phê với bạn', date: '2026-07-03T07:00:00Z' },
  { id: 't12', amount: 3000000, type: 'income', categoryId: 'c_invest', note: 'Cổ tức', date: '2026-07-02T10:00:00Z' },
];

/** Join transaction với category. Sau này Supabase làm việc này bằng foreign key + select. */
export function getTransactionsWithCategory(): TransactionWithCategory[] {
  return transactions
    .map((t) => ({ ...t, category: byId(t.categoryId) }))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

export function getMonthlySummary(): MonthlySummary {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export interface CategorySpend {
  category: Category;
  total: number;
  ratio: number; // 0..1 so với tổng chi
}

export function getSpendByCategory(): CategorySpend[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0) || 1;
  const map = new Map<string, number>();
  for (const t of expenses) {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([catId, total]) => ({ category: byId(catId), total, ratio: total / totalExpense }))
    .sort((a, b) => b.total - a.total);
}
