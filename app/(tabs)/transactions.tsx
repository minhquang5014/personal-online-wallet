import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionRow } from '../../components/TransactionRow';
import { colors, font, radius, shadow, spacing } from '../../constants/theme';
import { formatRelativeDate, formatVND } from '../../lib/format';
import { getTransactionsWithCategory } from '../../lib/mockData';
import { TransactionWithCategory, TxType } from '../../lib/types';

type Filter = 'all' | TxType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'expense', label: 'Chi tiêu' },
  { key: 'income', label: 'Thu nhập' },
];

export default function Transactions() {
  const [filter, setFilter] = useState<Filter>('all');
  const all = getTransactionsWithCategory();

  const sections = useMemo(() => {
    const filtered = filter === 'all' ? all : all.filter((t) => t.type === filter);
    const groups = new Map<string, TransactionWithCategory[]>();
    for (const t of filtered) {
      const key = formatRelativeDate(t.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return [...groups.entries()].map(([title, data]) => ({
      title,
      data,
      total: data.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
    }));
  }, [filter, all]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Giao dịch</Text>
      </View>

      {/* Segmented filter */}
      <View style={styles.segment}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={[styles.sectionTotal, { color: section.total >= 0 ? colors.income : colors.expense }]}>
              {section.total >= 0 ? '+' : '−'}
              {formatVND(Math.abs(section.total))}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View style={styles.card}>
            <TransactionRow tx={item} />
            {index < section.data.length - 1 && <View style={styles.divider} />}
          </View>
        )}
        renderSectionFooter={() => <View style={{ height: spacing.lg }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text },

  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    ...shadow.card,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted },
  segmentTextActive: { color: colors.white },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted },
  sectionTotal: { fontSize: font.size.sm, fontWeight: font.weight.semibold },

  card: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    // bo góc đầu/cuối được xử lý mềm bằng cách nhóm — ở đây giữ card phẳng cho đơn giản
  },
  divider: { height: 1, backgroundColor: colors.border },

  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyText: { color: colors.textMuted, fontSize: font.size.md },
});
