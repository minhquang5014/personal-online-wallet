import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../../constants/theme';
import { useAuth } from '../../lib/AuthContext';
import { REMINDER_HOUR, REMINDER_MINUTE, requestNotificationPermission } from '../../lib/notifications';
import { usePrefs } from '../../lib/PrefsContext';
import { useWallet } from '../../lib/WalletContext';

interface Item {
  icon: string;
  label: string;
  color: string;
  hint?: string;
  route: string;
}

export default function Settings() {
  const router = useRouter();
  const { prefs, update } = usePrefs();
  const { userId, session } = useAuth();
  const { members } = useWallet();
  const [busy, setBusy] = useState(false);

  const me = members.find((m) => m.id === userId);

  const accountItems: Item[] = [
    { icon: 'download-outline', label: 'Xuất file CSV', color: '#0EA5E9', route: '/export' },
    {
      icon: 'wallet',
      label: 'Ví & Tài khoản',
      color: '#16A34A',
      hint: `${members.length} người`,
      route: '/wallet',
    },
  ];

  async function toggleReminder(next: boolean) {
    setBusy(true);
    try {
      if (next) {
        const ok = await requestNotificationPermission();
        if (!ok) {
          Alert.alert(
            'Chưa được cấp quyền',
            'Bật quyền thông báo cho app trong Cài đặt của điện thoại rồi thử lại.'
          );
          return;
        }
      }
      // Việc đặt/huỷ lịch nhắc do ReminderSync tự lo khi reminderEnabled đổi.
      await update({ reminderEnabled: next });
    } catch (e: any) {
      Alert.alert('Không đổi được cài đặt', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  const two = (n: number) => String(n).padStart(2, '0');
  const reminderTime = `${two(REMINDER_HOUR)}:${two(REMINDER_MINUTE)}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Cài đặt</Text>

        {/* Hồ sơ */}
        <Pressable style={styles.profileCard} onPress={() => router.push('/profile')}>
          <View style={styles.avatar}>
            {me?.avatarUrl ? (
              <Image source={{ uri: me.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={26} color={colors.primary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{me?.name ?? '…'}</Text>
            <Text style={styles.profileEmail}>{session?.user.email ?? ''}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
        </Pressable>

        {/* Tài khoản */}
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.groupTitle}>Tài khoản</Text>
          <View style={styles.card}>
            {accountItems.map((item, i) => (
              <View key={item.label}>
                <Pressable style={styles.itemRow} onPress={() => router.push(item.route as any)}>
                  <View style={[styles.itemIcon, { backgroundColor: item.color + '22' }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  {item.hint && <Text style={styles.itemHint}>{item.hint}</Text>}
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </Pressable>
                {i < accountItems.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Tùy chỉnh — chỉ còn công tắc thông báo */}
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.groupTitle}>Tùy chỉnh</Text>
          <View style={styles.card}>
            <View style={styles.itemRow}>
              <View style={[styles.itemIcon, { backgroundColor: '#EC489922' }]}>
                <Ionicons name="notifications" size={18} color="#EC4899" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemLabel}>Thông báo</Text>
                <Text style={styles.itemSub}>
                  {prefs.reminderEnabled
                    ? `Nhắc lúc ${reminderTime} nếu cả nhà chưa ghi gì`
                    : 'Nhắc ghi chép hằng ngày'}
                </Text>
              </View>
              <Switch value={prefs.reminderEnabled} onValueChange={toggleReminder} disabled={busy} />
            </View>
          </View>
        </View>

        <Text style={styles.version}>Phiên bản 1.0{'\n'}Design by bố Cá</Text>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  profileName: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  profileEmail: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },

  groupTitle: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    ...shadow.card,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  itemSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  itemHint: { fontSize: font.size.sm, color: colors.textFaint },
  divider: { height: 1, backgroundColor: colors.border },

  version: {
    textAlign: 'center',
    fontSize: font.size.xs,
    color: colors.textFaint,
    lineHeight: 18,
  },
});
