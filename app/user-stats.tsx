import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategorySplitBar } from '../components/CategorySplitBar';
import { ALL_MONTHS } from '../components/MonthDropdown';
import { colors, font, radius, shadow, spacing } from '../constants/theme';
import { formatVND } from '../lib/format';
import { userBreakdown } from '../lib/selectors';
import { useWallet } from '../lib/WalletContext';

/** '2026-07' -> 'Tháng 7, 2026'; ALL_MONTHS -> 'Tất cả'. */
function monthTitle(key: string): string {
  if (key === ALL_MONTHS) return 'Tất cả';
  const [y, m] = key.split('-');
  return `Tháng ${Number(m)}, ${y}`;
}

export default function UserStats() {
  const router = useRouter();
  const { userId, month } = useLocalSearchParams<{ userId: string; month: string }>();
  const { transactions, members } = useWallet();

  const monthArg = month === ALL_MONTHS ? undefined : month; // undefined = toàn bộ
  const member = members.find((m) => m.id === userId);
  const stat = useMemo(
    () => userBreakdown(transactions, monthArg).find((u) => u.userId === userId),
    [transactions, monthArg, userId]
  );

  const positive = (stat?.balance ?? 0) >= 0;
  const segments = (stat?.byCategory ?? []).map((c) => ({ color: c.category.color, ratio: c.ratio }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết theo người</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Người + tháng */}
        <View style={styles.card}>
          <View style={styles.userHead}>
            <View style={styles.avatar}>
              {member?.avatarUrl ? (
                <Image source={{ uri: member.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={22} color={colors.primary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{member?.name ?? 'Không rõ'}</Text>
              <Text style={styles.monthText}>{month ? monthTitle(month) : ''}</Text>
            </View>
          </View>

          {/* Thu / Chi / Số dư */}
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Thu</Text>
              <Text style={[styles.metricValue, { color: colors.income }]}>{formatVND(stat?.income ?? 0)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Chi</Text>
              <Text style={[styles.metricValue, { color: colors.expense }]}>{formatVND(stat?.expense ?? 0)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Số dư</Text>
              <Text style={[styles.metricValue, { color: positive ? colors.income : colors.expense }]}>
                {formatVND(stat?.balance ?? 0)}
              </Text>
            </View>
          </View>
          <Text style={styles.countText}>{stat?.count ?? 0} giao dịch</Text>
        </View>

        {/* Toàn bộ danh mục chi tiêu */}
        <Text style={styles.groupLabel}>Chi tiêu theo danh mục</Text>
        <View style={styles.card}>
          {!stat || stat.byCategory.length === 0 ? (
            <Text style={styles.empty}>
              {month === ALL_MONTHS ? 'Chưa có chi tiêu nào' : 'Chưa có chi tiêu trong tháng này'}
            </Text>
          ) : (
            <>
              <CategorySplitBar segments={segments} />
              <View style={styles.list}>
                {stat.byCategory.map((c, i) => (
                  <View key={c.category.id}>
                    <Pressable
                      style={styles.catRow}
                      onPress={() =>
                        router.push(`/category-detail?categoryId=${c.category.id}&month=${month}&userId=${userId}`)
                      }
                    >
                      <View style={[styles.catIcon, { backgroundColor: c.category.color }]}>
                        <Ionicons name={c.category.icon as any} size={16} color={colors.white} />
                      </View>
                      <Text style={styles.catName} numberOfLines={1}>
                        {c.category.name}
                      </Text>
                      <Text style={styles.catPct}>{Math.round(c.ratio * 100)}%</Text>
                      <Text style={styles.catAmount}>{formatVND(c.total)}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} style={{ marginLeft: spacing.xs }} />
                    </Pressable>
                    {i < stat.byCategory.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  container: { padding: spacing.lg, gap: spacing.md },

  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  userHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  userName: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  monthText: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },

  metricRow: { flexDirection: 'row' },
  metric: { flex: 1, gap: 2 },
  metricLabel: { fontSize: font.size.xs, color: colors.textMuted },
  metricValue: { fontSize: font.size.sm, fontWeight: font.weight.semibold },
  countText: { fontSize: font.size.xs, color: colors.textFaint, marginTop: spacing.md },

  groupLabel: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginTop: spacing.xs },
  empty: { fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },

  list: { marginTop: spacing.lg },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  catIcon: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  catPct: { fontSize: font.size.sm, color: colors.textMuted, width: 40, textAlign: 'right' },
  catAmount: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text, width: 96, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border },
});
