import { Category, Transaction, TransactionWithCategory, TxType } from './types';

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
  // Tháng 7/2026
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

  // Tháng 6/2026
  { id: 't13', amount: 24000000, type: 'income', categoryId: 'c_salary', note: 'Lương tháng 6', date: '2026-06-05T09:00:00Z' },
  { id: 't14', amount: 5000000, type: 'income', categoryId: 'c_bonus', note: 'Thưởng quý 2', date: '2026-06-20T09:00:00Z' },
  { id: 't15', amount: 3200000, type: 'expense', categoryId: 'c_shopping', note: 'Điện thoại phụ kiện', date: '2026-06-18T08:20:00Z' },
  { id: 't16', amount: 2100000, type: 'expense', categoryId: 'c_food', note: 'Ăn uống cả tháng', date: '2026-06-15T12:40:00Z' },
  { id: 't17', amount: 1500000, type: 'expense', categoryId: 'c_transport', note: 'Xăng + gửi xe', date: '2026-06-12T11:00:00Z' },
  { id: 't18', amount: 800000, type: 'expense', categoryId: 'c_bills', note: 'Điện nước', date: '2026-06-08T15:00:00Z' },
  { id: 't19', amount: 600000, type: 'expense', categoryId: 'c_fun', note: 'Đi chơi cuối tuần', date: '2026-06-07T13:00:00Z' },

  // Tháng 5/2026
  { id: 't20', amount: 24000000, type: 'income', categoryId: 'c_salary', note: 'Lương tháng 5', date: '2026-05-05T09:00:00Z' },
  { id: 't21', amount: 1800000, type: 'income', categoryId: 'c_invest', note: 'Cổ tức', date: '2026-05-22T10:00:00Z' },
  { id: 't22', amount: 2500000, type: 'expense', categoryId: 'c_food', note: 'Ăn uống cả tháng', date: '2026-05-16T12:40:00Z' },
  { id: 't23', amount: 1900000, type: 'expense', categoryId: 'c_health', note: 'Khám sức khỏe định kỳ', date: '2026-05-14T09:30:00Z' },
  { id: 't24', amount: 1200000, type: 'expense', categoryId: 'c_transport', note: 'Sửa xe', date: '2026-05-10T11:00:00Z' },
  { id: 't25', amount: 750000, type: 'expense', categoryId: 'c_bills', note: 'Điện nước', date: '2026-05-08T15:00:00Z' },
  { id: 't26', amount: 500000, type: 'expense', categoryId: 'c_coffee', note: 'Cà phê', date: '2026-05-06T07:00:00Z' },

  // Thói quen: 20.000 -> Ăn uống (đủ 5 lần để bật gợi ý tự động)
  { id: 't27', amount: 20000, type: 'expense', categoryId: 'c_food', note: 'Ăn sáng', date: '2026-07-01T00:30:00Z' },
  { id: 't28', amount: 20000, type: 'expense', categoryId: 'c_food', note: 'Ăn sáng', date: '2026-07-03T00:30:00Z' },
  { id: 't29', amount: 20000, type: 'expense', categoryId: 'c_food', note: 'Ăn sáng', date: '2026-06-03T00:30:00Z' },
  { id: 't30', amount: 20000, type: 'expense', categoryId: 'c_food', note: 'Ăn sáng', date: '2026-05-03T00:30:00Z' },
  { id: 't31', amount: 20000, type: 'expense', categoryId: 'c_food', note: 'Ăn sáng', date: '2026-05-12T00:30:00Z' },

  // Vài mức tiền hay lặp lại -> làm phong phú thanh gợi ý số tiền
  { id: 't32', amount: 50000, type: 'expense', categoryId: 'c_coffee', note: 'Cà phê', date: '2026-07-01T08:00:00Z' },
  { id: 't33', amount: 50000, type: 'expense', categoryId: 'c_food', note: 'Ăn trưa', date: '2026-06-10T05:00:00Z' },
  { id: 't34', amount: 50000, type: 'expense', categoryId: 'c_fun', note: 'Vé gửi xe sự kiện', date: '2026-05-20T10:00:00Z' },
  { id: 't35', amount: 100000, type: 'expense', categoryId: 'c_shopping', note: 'Đồ dùng', date: '2026-07-02T09:00:00Z' },
  { id: 't36', amount: 100000, type: 'expense', categoryId: 'c_food', note: 'Ăn nhóm', date: '2026-06-22T11:00:00Z' },
];

/**
 * Gợi ý danh mục theo thói quen: nếu đúng số tiền này (cùng loại thu/chi) đã từng
 * gắn với một danh mục từ `minCount` lần trở lên thì trả về id danh mục đó.
 * Ví dụ: nhập 20.000 (chi) đã 5 lần là "Ăn uống" -> trả về id "c_food".
 */
export function suggestCategory(amount: number, type: TxType, minCount = 5): string | null {
  if (amount <= 0) return null;
  const counts = new Map<string, number>();
  for (const t of transactions) {
    if (t.type === type && t.amount === amount) {
      counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1);
    }
  }
  let bestId: string | null = null;
  let best = 0;
  for (const [id, n] of counts) {
    if (n >= minCount && n > best) {
      best = n;
      bestId = id;
    }
  }
  return bestId;
}

/**
 * Các số tiền hay nhập nhất theo loại thu/chi (xuất hiện >= 2 lần), sắp theo
 * tần suất giảm dần. Dùng cho thanh gợi ý dưới ô nhập tiền.
 */
export function frequentAmounts(type: TxType, limit = 6): number[] {
  const counts = new Map<number, number>();
  for (const t of transactions) {
    if (t.type === type) counts.set(t.amount, (counts.get(t.amount) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([amt]) => amt);
}

/** Join transaction với category. Sau này Supabase làm việc này bằng foreign key + select. */
export function getTransactionsWithCategory(): TransactionWithCategory[] {
  return transactions
    .map((t) => ({ ...t, category: byId(t.categoryId) }))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

/** 'YYYY-MM' của một ISO date, ví dụ "2026-07-09T..." -> "2026-07". */
export const monthKeyOf = (iso: string) => iso.slice(0, 7);

/** Lọc giao dịch theo tháng ('YYYY-MM'). Bỏ trống -> lấy tất cả. */
const inMonth = (monthKey?: string) =>
  monthKey ? transactions.filter((t) => monthKeyOf(t.date) === monthKey) : transactions;

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

export function getMonthlySummary(monthKey?: string): MonthlySummary {
  const rows = inMonth(monthKey);
  const income = rows.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = rows.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export interface MonthTotals {
  key: string; // '2026-07'
  label: string; // 'T7'
  income: number;
  expense: number;
}

/** Tổng thu/chi theo từng tháng, sắp xếp tăng dần theo thời gian (cho biểu đồ cột). */
export function getMonthlyTotals(): MonthTotals[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const k = monthKeyOf(t.date);
    const cur = map.get(k) ?? { income: 0, expense: 0 };
    if (t.type === 'income') cur.income += t.amount;
    else cur.expense += t.amount;
    map.set(k, cur);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, label: `T${Number(key.slice(5, 7))}`, income: v.income, expense: v.expense }));
}

export interface CategorySpend {
  category: Category;
  total: number;
  ratio: number; // 0..1 so với tổng chi
}

export function getSpendByCategory(monthKey?: string): CategorySpend[] {
  const expenses = inMonth(monthKey).filter((t) => t.type === 'expense');
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0) || 1;
  const map = new Map<string, number>();
  for (const t of expenses) {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([catId, total]) => ({ category: byId(catId), total, ratio: total / totalExpense }))
    .sort((a, b) => b.total - a.total);
}
