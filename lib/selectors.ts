import { monthKey } from './format';
import type { Category, Transaction, TransactionWithCategory, TxType } from './types';

/**
 * Các hàm dẫn xuất dữ liệu. Đều là hàm thuần — nhận vào danh sách giao dịch
 * và trả về kết quả, không đọc biến toàn cục.
 */

/** 'YYYY-MM' của một ISO date, tính theo giờ địa phương. */
export const monthKeyOf = monthKey;

const inMonth = <T extends Transaction>(txs: T[], monthKey?: string): T[] =>
  monthKey ? txs.filter((t) => monthKeyOf(t.date) === monthKey) : txs;

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

export function monthlySummary(txs: Transaction[], monthKey?: string): MonthlySummary {
  const rows = inMonth(txs, monthKey);
  const income = rows.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = rows.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export interface CategorySpend {
  category: Category;
  total: number;
  ratio: number; // 0..1 so với tổng chi
}

export function spendByCategory(txs: TransactionWithCategory[], monthKey?: string): CategorySpend[] {
  const expenses = inMonth(txs, monthKey).filter((t) => t.type === 'expense');
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0) || 1;
  const map = new Map<string, { category: Category; total: number }>();
  for (const t of expenses) {
    const cur = map.get(t.categoryId) ?? { category: t.category, total: 0 };
    cur.total += t.amount;
    map.set(t.categoryId, cur);
  }
  return [...map.values()]
    .map(({ category, total }) => ({ category, total, ratio: total / totalExpense }))
    .sort((a, b) => b.total - a.total);
}

/** 'YYYY-MM' cộng thêm delta tháng. addMonths('2026-07', -3) -> '2026-04'. */
function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Luỹ kế (cộng dồn) theo ngày của một tháng, cho một loại thu/chi. Dài = số ngày. */
function cumulativeForMonth(txs: Transaction[], key: string, type: TxType): number[] {
  const [y, m] = key.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const perDay = new Array(days).fill(0);
  for (const t of txs) {
    if (t.type !== type || monthKeyOf(t.date) !== key) continue;
    perDay[new Date(t.date).getDate() - 1] += t.amount;
  }
  const cum: number[] = [];
  let run = 0;
  for (let i = 0; i < days; i++) {
    run += perDay[i];
    cum.push(run);
  }
  return cum;
}

export interface MonthReport {
  daysInMonth: number;
  upto: number; // số ngày có dữ liệu (hôm nay nếu là tháng hiện tại, else cả tháng)
  current: number[]; // luỹ kế tháng đang xem, ngày 1..upto
  average: number[]; // luỹ kế trung bình 3 tháng trước, ngày 1..cuối tháng
  currentAtUpto: number; // giá trị luỹ kế tháng này tại ngày `upto`
  avgAtUpto: number; // giá trị luỹ kế trung bình tại ngày `upto`
}

/**
 * Báo cáo luỹ kế: đường luỹ kế của tháng đang xem so với đường trung bình luỹ kế
 * của 3 tháng liền trước (cùng loại thu/chi).
 */
export function monthReport(
  txs: Transaction[],
  monthKey: string,
  type: TxType,
  now: Date = new Date()
): MonthReport {
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const cur = cumulativeForMonth(txs, monthKey, type);
  const isCurrent = monthKey === monthKeyOf(now.toISOString());
  const upto = isCurrent ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

  // Trung bình luỹ kế của 3 tháng trước, căn theo chỉ số ngày; tháng ngắn hơn thì
  // giữ giá trị cuối (đường phẳng ở cuối).
  const prev = [addMonths(monthKey, -1), addMonths(monthKey, -2), addMonths(monthKey, -3)].map((k) =>
    cumulativeForMonth(txs, k, type)
  );
  const average: number[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    let sum = 0;
    for (const pc of prev) sum += i < pc.length ? pc[i] : pc[pc.length - 1] ?? 0;
    average.push(sum / 3);
  }

  const current = cur.slice(0, upto);
  return {
    daysInMonth,
    upto,
    current,
    average,
    currentAtUpto: current.length ? current[current.length - 1] : 0,
    avgAtUpto: average[upto - 1] ?? 0,
  };
}

/**
 * Gợi ý danh mục theo thói quen: nếu đúng số tiền này (cùng loại thu/chi) đã từng
 * gắn với một danh mục từ `minCount` lần trở lên thì trả về id danh mục đó.
 */
export function suggestCategory(
  txs: Transaction[],
  amount: number,
  type: TxType,
  minCount = 5
): string | null {
  if (amount <= 0) return null;
  const counts = new Map<string, number>();
  for (const t of txs) {
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

export interface UserBreakdown {
  userId: string;
  income: number;
  expense: number;
  balance: number; // thu - chi
  count: number; // số giao dịch đã nhập
  byCategory: CategorySpend[]; // chi tiêu tách theo danh mục, giảm dần
}

/**
 * Thống kê chi tiết theo từng người nhập, trong tháng (bỏ trống = tất cả).
 * Gồm thu/chi/số dư, số giao dịch, và chi tiêu tách theo danh mục.
 * Sắp theo chi tiêu giảm dần để người tiêu nhiều đứng trước.
 */
export function userBreakdown(txs: TransactionWithCategory[], monthKey?: string): UserBreakdown[] {
  interface Acc {
    income: number;
    expense: number;
    count: number;
    cats: Map<string, { category: Category; total: number }>;
  }
  const map = new Map<string, Acc>();

  for (const t of inMonth(txs, monthKey)) {
    const u = map.get(t.createdBy) ?? { income: 0, expense: 0, count: 0, cats: new Map() };
    if (t.type === 'income') {
      u.income += t.amount;
    } else {
      u.expense += t.amount;
      const c = u.cats.get(t.categoryId) ?? { category: t.category, total: 0 };
      c.total += t.amount;
      u.cats.set(t.categoryId, c);
    }
    u.count += 1;
    map.set(t.createdBy, u);
  }

  return [...map.entries()]
    .map(([userId, u]) => ({
      userId,
      income: u.income,
      expense: u.expense,
      balance: u.income - u.expense,
      count: u.count,
      byCategory: [...u.cats.values()]
        .map((c) => ({ category: c.category, total: c.total, ratio: u.expense ? c.total / u.expense : 0 }))
        .sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.expense - a.expense);
}

/** Mức tiền gợi ý sẵn khi lịch sử chưa đủ để suy ra thói quen. */
const FALLBACK_AMOUNTS: Record<TxType, number[]> = {
  expense: [20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000],
  income: [500_000, 1_000_000, 5_000_000, 10_000_000, 20_000_000],
};

/**
 * Số tiền gợi ý cho ô nhập, theo loại thu/chi.
 *
 * Xếp hạng: dùng nhiều lần nhất trước, hoà thì cái vừa dùng gần đây hơn thắng.
 * Nếu lịch sử chưa đủ (ví mới), lấp thêm các mức thông dụng để thanh gợi ý
 * không bao giờ rỗng.
 */
export function amountSuggestions(txs: Transaction[], type: TxType, limit = 6): number[] {
  const stats = new Map<number, { count: number; last: number }>();
  for (const t of txs) {
    if (t.type !== type) continue;
    const s = stats.get(t.amount) ?? { count: 0, last: 0 };
    s.count += 1;
    s.last = Math.max(s.last, +new Date(t.date));
    stats.set(t.amount, s);
  }

  const out = [...stats.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].last - a[1].last)
    .slice(0, limit)
    .map(([amt]) => amt);

  for (const amt of FALLBACK_AMOUNTS[type]) {
    if (out.length >= limit) break;
    if (!out.includes(amt)) out.push(amt);
  }
  return out;
}
