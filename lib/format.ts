/** Định dạng tiền VND, ví dụ 85000 -> "85.000 ₫". */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Rút gọn số lớn: 25000000 -> "25 tr", 3200000 -> "3,2 tr", 650000 -> "650 N". */
export function formatCompactVND(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    const v = amount / 1_000_000;
    return `${trim(v)} tr`;
  }
  if (abs >= 1_000) {
    const v = amount / 1_000;
    return `${trim(v)} N`;
  }
  return `${amount}`;
}

function trim(v: number): string {
  return v
    .toFixed(1)
    .replace(/\.0$/, '')
    .replace('.', ',');
}

/** "2026-07-09T04:30:00Z" -> "Hôm nay", "Hôm qua", hoặc "09/07". */
export function formatRelativeDate(iso: string, now: Date = new Date('2026-07-09T12:00:00Z')): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} ngày trước`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

const WEEKDAYS_VI = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/** Date -> "Thứ Năm, 09/07/2026" cho ô chọn ngày. Tự build để không phụ thuộc locale của Hermes. */
export function formatPickedDate(d: Date): string {
  const wd = WEEKDAYS_VI[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${wd}, ${dd}/${mm}/${d.getFullYear()}`;
}

/** "2026-07-09T04:30:00Z" -> "11:30" (giờ VN, UTC+7). */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(d);
}
