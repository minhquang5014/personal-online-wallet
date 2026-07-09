import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionRow } from '../../components/TransactionRow';
import { colors, font, radius, shadow, spacing } from '../../constants/theme';
import { formatVND } from '../../lib/format';
import { getMonthlySummary, getSpendByCategory, getTransactionsWithCategory } from '../../lib/mockData';

export default function Dashboard() {
  const summary = getMonthlySummary();
  const recent = getTransactionsWithCategory().slice(0, 5);
  const topSpend = getSpendByCategory().slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Xin chào 👋</Text>
            <Text style={styles.name}>Quang</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư tháng này</Text>
          <Text style={styles.balanceValue}>{formatVND(summary.balance)}</Text>

          <View style={styles.balanceRow}>
            <View style={styles.balancePill}>
              <View style={[styles.pillIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="arrow-down" size={16} color={colors.white} />
              </View>
              <View>
                <Text style={styles.pillLabel}>Thu nhập</Text>
                <Text style={styles.pillValue}>{formatVND(summary.income)}</Text>
              </View>
            </View>
            <View style={styles.balancePill}>
              <View style={[styles.pillIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="arrow-up" size={16} color={colors.white} />
              </View>
              <View>
                <Text style={styles.pillLabel}>Chi tiêu</Text>
                <Text style={styles.pillValue}>{formatVND(summary.expense)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top spending categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chi nhiều nhất</Text>
        </View>
        <View style={styles.card}>
          {topSpend.map((s, i) => (
            <View key={s.category.id}>
              <View style={styles.spendRow}>
                <View style={[styles.spendIcon, { backgroundColor: s.category.color + '22' }]}>
                  <Ionicons name={s.category.icon as any} size={18} color={s.category.color} />
                </View>
                <View style={styles.spendMid}>
                  <View style={styles.spendTop}>
                    <Text style={styles.spendName}>{s.category.name}</Text>
                    <Text style={styles.spendAmount}>{formatVND(s.total)}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, { width: `${Math.round(s.ratio * 100)}%`, backgroundColor: s.category.color }]}
                    />
                  </View>
                </View>
              </View>
              {i < topSpend.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Recent transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gần đây</Text>
          <Link href="/transactions" style={styles.seeAll}>
            Xem tất cả
          </Link>
        </View>
        <View style={styles.card}>
          {recent.map((tx, i) => (
            <View key={tx.id}>
              <TransactionRow tx={tx} />
              {i < recent.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hello: { fontSize: font.size.sm, color: colors.textMuted },
  name: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.card,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: font.size.sm },
  balanceValue: {
    color: colors.white,
    fontSize: font.size.display,
    fontWeight: font.weight.bold,
    marginTop: spacing.xs,
  },
  balanceRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  balancePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: { color: 'rgba(255,255,255,0.8)', fontSize: font.size.xs },
  pillValue: { color: colors.white, fontSize: font.size.sm, fontWeight: font.weight.semibold },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  seeAll: { fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.semibold },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    ...shadow.card,
  },
  divider: { height: 1, backgroundColor: colors.border },

  spendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  spendIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spendMid: { flex: 1, gap: spacing.sm },
  spendTop: { flexDirection: 'row', justifyContent: 'space-between' },
  spendName: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  spendAmount: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: radius.full },
});
