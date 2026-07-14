import * as Notifications from 'expo-notifications';
import { dayKey } from './format';
import { Transaction } from './types';

/**
 * Nhắc ghi chép chi tiêu bằng local notification (chạy được trong Expo Go).
 *
 * Điều kiện: chỉ nhắc vào 22:00 nếu HÔM ĐÓ cả nhà chưa nhập giao dịch nào.
 *
 * Hạn chế không thể tránh: thông báo bắn ra ngay cả khi app đóng, mà lúc đó
 * không chạy được code để kiểm tra dữ liệu. Nên quyết định "đã nhập chưa" được
 * lấy ở thời điểm ĐẶT LỊCH — tức mỗi khi mở app / thêm giao dịch (xem
 * syncDailyReminder). Nếu cả ngày không mở app, lịch đặt từ lần trước vẫn bắn.
 */
export const REMINDER_HOUR = 22;
export const REMINDER_MINUTE = 0;

/** Gọi 1 lần lúc app khởi động: quyết định cách hiện thông báo khi app đang mở. */
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Xin quyền thông báo. Trả về true nếu được cấp. */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

/** Huỷ toàn bộ lịch nhắc (app chỉ dùng đúng 1 loại nhắc nhở). */
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Thời điểm bắn thông báo kế tiếp:
 *   - Hôm nay CHƯA ai nhập và chưa tới 22:00  -> tối nay 22:00.
 *   - Hôm nay đã có giao dịch, hoặc đã qua 22:00 -> 22:00 ngày mai.
 * Tách riêng (hàm thuần) để test được mà không cần API notification.
 */
export function nextReminderDate(now: Date, hasToday: boolean): Date {
  const todayAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
  if (!hasToday && now < todayAt) return todayAt;
  return new Date(todayAt.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Đồng bộ lịch nhắc theo dữ liệu hiện có. Gọi mỗi khi: mở app, đổi công tắc,
 * thêm giao dịch. Luôn giữ đúng MỘT thông báo cho lần 22:00 sắp tới.
 */
export async function syncDailyReminder(enabled: boolean, transactions: Transaction[]): Promise<void> {
  await cancelDailyReminder();
  if (!enabled) return;

  const now = new Date();
  const todayKey = dayKey(now.toISOString());
  const hasToday = transactions.some((t) => dayKey(t.date) === todayKey);
  const fireAt = nextReminderDate(now, hasToday);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ghi chép chi tiêu',
      body: 'Hôm nay cả nhà chưa ghi khoản nào. Ghi lại kẻo quên nhé.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
}
