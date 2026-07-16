import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALL_MONTHS } from '../components/MonthDropdown';
import { colors, font, radius, shadow, spacing } from '../constants/theme';
import { formatRelativeDate, formatVND } from '../lib/format';
import { monthKeyOf } from '../lib/selectors';
import { useWallet } from '../lib/WalletContext';

/** '2026-07' -> 'Tháng 7, 2026'; ALL_MONTHS -> 'Tất cả'. */
function monthTitle(key: string): string {
  if (!key || key === ALL_MONTHS) return 'Tất cả';
  const [y, m] = key.split('-');
  return `Tháng ${Number(m)}, ${y}`;
}

/**
 * Chi tiết một danh mục: liệt kê toàn bộ giao dịch của danh mục đó theo tháng
 * đang chọn. Nếu có `userId` (mở từ màn "theo từng người") thì chỉ lấy giao dịch
 * của người đó.
 */
export default function CategoryDetail() {
  const router = useRouter();
  const { categoryId, month, userId } = useLocalSearchParams<{
    categoryId: string;
    month: string;
    userId?: string;
  }>();
  const { transactions, categories, members } = useWallet();

  const monthArg = month === ALL_MONTHS ? undefined : month;
  const category = categories.find((c) => c.id === categoryId);
  const member = userId ? members.find((m) => m.id === userId) : undefined;

  const list = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.categoryId === categoryId &&
            (!monthArg || monthKeyOf(t.date) === monthArg) &&
            (!userId || t.createdBy === userId)
        )
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [transactions, categoryId, monthArg, userId]
  );

  const total = list.reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {category?.name ?? 'Danh mục'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Tổng quan */}
        <View style={styles.card}>
          <View style={styles.summaryHead}>
            <View style={[styles.icon, { backgroundColor: category?.color ?? colors.primary }]}>
              <Ionicons name={(category?.icon ?? 'pricetag') as any} size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {category?.name ?? 'Danh mục'}
                {member ? ` · ${member.name}` : ''}
              </Text>
              <Text style={styles.summarySub}>
                {monthTitle(month)} · {list.length} giao dịch
              </Text>
            </View>
            <Text
              style={[
                styles.summaryTotal,
                { color: category?.type === 'income' ? colors.income : colors.expense },
              ]}
            >
              {formatVND(total)}
            </Text>
          </View>
        </View>

        {/* Danh sách giao dịch */}
        <View style={styles.card}>
          {list.length === 0 ? (
            <Text style={styles.empty}>Chưa có giao dịch nào</Text>
          ) : (
            list.map((t, i) => (
              <View key={t.id}>
                <View style={styles.txRow}>
                  <Text style={styles.txDate}>{formatRelativeDate(t.date)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txNote} numberOfLines={1}>
                      {t.note || category?.name || '—'}
                    </Text>
                    <Text style={styles.txCreator} numberOfLines={1}>
                      {t.creator.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: t.type === 'income' ? colors.income : colors.expense },
                    ]}
                  >
                    {formatVND(t.amount)}
                  </Text>
                </View>
                {i < list.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <View style={{ height: spacing.xxl }} />
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
    gap: spacing.md,
  },
  headerTitle: { flex: 1, fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  close: { padding: 2 },
  container: { padding: spacing.lg, gap: spacing.md },

  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  summaryName: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  summarySub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  summaryTotal: { fontSize: font.size.lg, fontWeight: font.weight.bold },

  empty: { fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  txDate: { fontSize: font.size.xs, color: colors.textMuted, width: 64 },
  txNote: { fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  txCreator: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: font.size.md, fontWeight: font.weight.semibold },
  divider: { height: 1, backgroundColor: colors.border },
});
