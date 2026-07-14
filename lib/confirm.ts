import { Alert, Platform } from 'react-native';

/**
 * Hộp thoại xác nhận Có/Không, chạy được cả trên web lẫn native.
 *
 * react-native-web KHÔNG hỗ trợ Alert nhiều nút — nó chỉ hiện phần chữ và bỏ
 * qua mảng buttons, nên callback của nút "Đồng ý"/"Huỷ" không bao giờ chạy.
 * Vì thế trên web dùng window.confirm, còn native dùng Alert như thường.
 *
 * @returns true nếu người dùng đồng ý.
 */
export function confirm(title: string, message: string, confirmLabel = 'Đồng ý'): Promise<boolean> {
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true;
    return Promise.resolve(ok);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Huỷ', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
