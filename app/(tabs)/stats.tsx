import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DonutChart } from '../../components/DonutChart';
import { colors, font, radius, shadow, spacing } from '../../constants/theme';
import { formatCompactVND, formatVND } from '../../lib/format';
import { getMonthlySummary, getSpendByCategory } from '../../lib/mockData';

export default function Stats() {
  const spend = getSpendByCategory();
  const summary = getMonthlySummary();
  const slices = spend.map((s) => ({ value: s.total, color: s.category.color }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Thống kê</Text>
          <View style={styles.monthPill}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.monthText}>Tháng 7, 2026</Text>
          </View>
        </View>

        {/* Donut */}
        <View style={styles.card}>
          <View style={styles.donutWrap}>
            <DonutChart slices={slices}>
              <Text style={styles.donutLabel}>Tổng chi</Text>
              <Text style={styles.donutValue}>{formatCompactVND(summary.expense)}</Text>
            </DonutChart>
          </View>
        </View>

        {/* Legend / breakdown */}
        <View style={styles.card}>
          {spend.map((s, i) => (
            <View key={s.category.id}>
              <View style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: s.category.color }]} />
                <Text style={styles.legendName}>{s.category.name}</Text>
                <Text style={styles.legendPct}>{Math.round(s.ratio * 100)}%</Text>
                <Text style={styles.legendAmount}>{formatVND(s.total)}</Text>
              </View>
              {i < spend.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Income vs Expense */}
        <View style={styles.row}>
          <View style={[styles.miniCard, { flex: 1 }]}>
            <View style={[styles.miniIcon, { backgroundColor: colors.incomeSoft }]}>
              <Ionicons name="arrow-down" size={18} color={colors.income} />
            </View>
            <Text style={styles.miniLabel}>Thu nhập</Text>
            <Text style={[styles.miniValue, { color: colors.income }]}>{formatVND(summary.income)}</Text>
          </View>
          <View style={[styles.miniCard, { flex: 1 }]}>
            <View style={[styles.miniIcon, { backgroundColor: colors.expenseSoft }]}>
              <Ionicons name="arrow-up" size={18} color={colors.expense} />
            </View>
            <Text style={styles.miniLabel}>Chi tiêu</Text>
            <Text style={[styles.miniValue, { color: colors.expense }]}>{formatVND(summary.expense)}</Text>
          </View>
        </View>

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
  donutWrap: { alignItems: 'center', paddingVertical: spacing.md },
  donutLabel: { fontSize: font.size.sm, color: colors.textMuted },
  donutValue: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text },

  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  dot: { width: 12, height: 12, borderRadius: radius.full },
  legendName: { flex: 1, fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  legendPct: { fontSize: font.size.sm, color: colors.textMuted, width: 44, textAlign: 'right' },
  legendAmount: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text, width: 100, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border },

  row: { flexDirection: 'row', gap: spacing.md },
  miniCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLabel: { fontSize: font.size.sm, color: colors.textMuted },
  miniValue: { fontSize: font.size.lg, fontWeight: font.weight.bold },
});
