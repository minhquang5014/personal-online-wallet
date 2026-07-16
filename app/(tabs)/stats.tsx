import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategorySplitBar } from '../../components/CategorySplitBar';
import { ALL_MONTHS, MonthDropdown } from '../../components/MonthDropdown';
import { MonthlyReport } from '../../components/MonthlyReport';
import { colors, font, radius, shadow, spacing } from '../../constants/theme';
import { formatVND } from '../../lib/format';
import { monthKeyOf, monthlySummary, monthReport, spendByCategory, userBreakdown } from '../../lib/selectors';
import { TxType } from '../../lib/types';
import { useWallet } from '../../lib/WalletContext';

/** '2026-07' -> 'Tháng 7, 2026'; ALL_MONTHS -> 'Tất cả'. */
function monthTitle(key: string): string {
  if (!key) return 'Chưa có dữ liệu';
  if (key === ALL_MONTHS) return 'Tất cả';
  const [y, m] = key.split('-');
  return `Tháng ${Number(m)}, ${y}`;
}

export default function Stats() {
  const router = useRouter();
  const { transactions, members } = useWallet();

  // Mặc định là tháng hiện tại; đổi bằng dropdown chọn tháng ở góc phải.
  const currentMonth = monthKeyOf(new Date().toISOString());
  const [picked, setPicked] = useState('');
  const selected = picked || currentMonth;
  const setSelected = setPicked;
  const isAll = selected === ALL_MONTHS;
  const monthArg = isAll ? undefined : selected; // undefined = toàn bộ

  // Các tháng để chọn: "Tất cả" + những tháng có giao dịch + tháng hiện tại (mới nhất trước).
  const monthOptions = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKeyOf(t.date)));
    set.add(currentMonth);
    return [ALL_MONTHS, ...[...set].sort().reverse()];
  }, [transactions, currentMonth]);

  const [chartTab, setChartTab] = useState<TxType>('expense'); // tab báo cáo: Chi / Thu
  // Báo cáo luỹ kế chỉ có nghĩa cho một tháng cụ thể; khi xem "Tất cả" thì ẩn.
  const report = useMemo(
    () => (isAll ? null : monthReport(transactions, selected, chartTab)),
    [transactions, selected, chartTab, isAll]
  );
  const spend = useMemo(() => spendByCategory(transactions, monthArg), [transactions, monthArg]);
  const summary = useMemo(() => monthlySummary(transactions, monthArg), [transactions, monthArg]);

  // Tổng chi theo từng người, ghép tên/ảnh từ danh sách thành viên.
  const userStats = useMemo(() => userBreakdown(transactions, monthArg), [transactions, monthArg]);
  const memberOf = (id: string) => members.find((m) => m.id === id);
  const nameOf = (id: string) => memberOf(id)?.name ?? 'Không rõ';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Thống kê</Text>
          <MonthDropdown value={selected} options={monthOptions} onChange={setSelected} maxVisible={5}>
            <View style={styles.monthPill}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={styles.monthText}>{monthTitle(selected)}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
            </View>
          </MonthDropdown>
        </View>

        {/* Báo cáo luỹ kế: tháng này vs trung bình 3 tháng trước (ẩn khi xem Tất cả) */}
        {report && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Báo cáo tháng</Text>
            <MonthlyReport
              type={chartTab}
              onTypeChange={setChartTab}
              expenseTotal={summary.expense}
              incomeTotal={summary.income}
              report={report}
              monthKey={selected}
            />
          </View>
        )}

        {/* Danh mục chi tiêu */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Danh mục chi tiêu</Text>
          {spend.length === 0 ? (
            <Text style={styles.empty}>{isAll ? 'Chưa có chi tiêu nào' : 'Chưa có chi tiêu trong tháng này'}</Text>
          ) : (
            spend.map((s, i) => (
              <View key={s.category.id}>
                <Pressable
                  style={styles.legendRow}
                  onPress={() => router.push(`/category-detail?categoryId=${s.category.id}&month=${selected}`)}
                >
                  <View style={[styles.dot, { backgroundColor: s.category.color }]} />
                  <Text style={styles.legendName}>{s.category.name}</Text>
                  <Text style={styles.legendPct}>{Math.round(s.ratio * 100)}%</Text>
                  <Text style={styles.legendAmount}>{formatVND(s.total)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} style={{ marginLeft: spacing.xs }} />
                </Pressable>
                {i < spend.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        {/* Thống kê chi tiết theo từng người */}
        <Text style={styles.groupLabel}>Theo từng người</Text>
        {userStats.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.empty}>{isAll ? 'Chưa có giao dịch nào' : 'Chưa có giao dịch trong tháng này'}</Text>
          </View>
        ) : (
          userStats.map((u) => {
            const m = memberOf(u.userId);
            const segments = u.byCategory.map((c) => ({ color: c.category.color, ratio: c.ratio }));
            return (
              <Pressable
                key={u.userId}
                style={styles.card}
                onPress={() => router.push(`/user-stats?userId=${u.userId}&month=${selected}`)}
              >
                <View style={styles.userHead}>
                  <View style={styles.avatar}>
                    {m?.avatarUrl ? (
                      <Image source={{ uri: m.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person" size={18} color={colors.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userTitle} numberOfLines={1}>
                      {nameOf(u.userId)}
                    </Text>
                    <Text style={styles.metricLabel}>Chi tiêu · chạm để xem chi tiết</Text>
                  </View>
                  <Text style={styles.userExpense}>{formatVND(u.expense)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} style={{ marginLeft: spacing.xs }} />
                </View>

                {/* Chi tiêu theo danh mục */}
                {u.byCategory.length > 0 ? (
                  <>
                    <Text style={styles.splitLabel}>Chi tiêu theo danh mục</Text>
                    <CategorySplitBar segments={segments} />
                    <View style={styles.catLegend}>
                      {u.byCategory.slice(0, 4).map((c) => (
                        <View key={c.category.id} style={styles.catChip}>
                          <View style={[styles.catDot, { backgroundColor: c.category.color }]} />
                          <Text style={styles.catName}>{c.category.name}</Text>
                          <Text style={styles.catPct}>{Math.round(c.ratio * 100)}%</Text>
                        </View>
                      ))}
                      {u.byCategory.length > 4 && (
                        <Text style={styles.catMore}>+{u.byCategory.length - 4} nữa</Text>
                      )}
                    </View>
                  </>
                ) : (
                  <Text style={styles.noSpend}>Chưa có chi tiêu</Text>
                )}
              </Pressable>
            );
          })
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  monthText: { fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.primary },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  cardTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.lg },

  empty: { fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },

  groupLabel: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text, marginTop: spacing.xs },

  userHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  userTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.text },
  userExpense: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.expense },
  metricLabel: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },

  splitLabel: { fontSize: font.size.xs, color: colors.textMuted, marginBottom: spacing.sm },
  catLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  catDot: { width: 8, height: 8, borderRadius: radius.full },
  catName: { fontSize: font.size.xs, color: colors.text },
  catPct: { fontSize: font.size.xs, color: colors.textMuted, fontWeight: font.weight.semibold },
  catMore: { fontSize: font.size.xs, color: colors.textFaint },
  noSpend: { fontSize: font.size.xs, color: colors.textMuted },

  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  dot: { width: 12, height: 12, borderRadius: radius.full },
  legendName: { flex: 1, fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  legendPct: { fontSize: font.size.sm, color: colors.textMuted, width: 44, textAlign: 'right' },
  legendAmount: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text, width: 100, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border },
});
