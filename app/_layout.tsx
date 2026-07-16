import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, AppState, Image, LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { setupNotificationHandler, syncDailyReminder } from '../lib/notifications';
import { PrefsProvider, usePrefs } from '../lib/PrefsContext';
import { WalletProvider, useWallet } from '../lib/WalletContext';

setupNotificationHandler();

// expo-notifications cảnh báo push từ xa không chạy trong Expo Go. App chỉ dùng
// thông báo cục bộ (vẫn chạy tốt), nên tắt cảnh báo này cho đỡ nhiễu.
LogBox.ignoreLogs([
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

/**
 * Đồng bộ lịch nhắc mỗi khi: dữ liệu giao dịch đổi (thêm/đổi ví), công tắc đổi,
 * và khi app quay lại foreground (để tính lại "hôm nay đã ai nhập chưa").
 */
function ReminderSync() {
  const { prefs } = usePrefs();
  const { transactions } = useWallet();

  useEffect(() => {
    syncDailyReminder(prefs.reminderEnabled, transactions).catch(() => {});
  }, [prefs.reminderEnabled, transactions]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') syncDailyReminder(prefs.reminderEnabled, transactions).catch(() => {});
    });
    return () => sub.remove();
  }, [prefs.reminderEnabled, transactions]);

  return null;
}

/** Màn hình chờ chung: logo app + spinner nhỏ. Dùng khi khởi động/đăng nhập. */
function BrandLoading() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        gap: 20,
      }}
    >
      <Image
        source={require('../assets/logo-app.jpg')}
        style={{ width: 96, height: 96, borderRadius: 22 }}
        resizeMode="cover"
      />
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

/**
 * Điều hướng theo trạng thái:
 *   chưa đăng nhập      -> /login
 *   đã đăng nhập, chưa có ví -> /wallet-setup
 *   đủ cả hai           -> app chính
 */
function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const { wallet, ready: walletReady } = useWallet();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  const booting = authLoading || (!!session && !walletReady);

  useEffect(() => {
    // Đợi navigator đăng ký xong route mới điều hướng, nếu không sẽ gặp
    // "REPLACE ... was not handled by any navigator".
    if (!navState?.key) return;
    if (booting) return;

    const route = segments[0];
    const atLogin = route === 'login';
    const atSetup = route === 'wallet-setup';

    if (!session) {
      if (!atLogin) router.replace('/login');
    } else if (!wallet) {
      if (!atSetup) router.replace('/wallet-setup');
    } else if (atLogin || atSetup) {
      router.replace('/');
    }
  }, [navState?.key, booting, session, wallet, segments, router]);

  if (booting) return <BrandLoading />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="wallet-setup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="export" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="wallet" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="user-stats" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="category-detail" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PrefsProvider>
            <WalletProvider>
              <StatusBar style="dark" />
              <ReminderSync />
              <RootNavigator />
            </WalletProvider>
          </PrefsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
