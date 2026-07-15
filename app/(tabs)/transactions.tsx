import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALL_MONTHS, MonthDropdown } from '../../components/MonthDropdown';
import { TransactionRow } from '../../components/TransactionRow';
import { colors, font, radius, shadow, spacing } from '../../constants/theme';
import { confirm } from '../../lib/confirm';
import { dayHeaderParts, dayKey, formatVND } from '../../lib/format';
import { monthKeyOf } from '../../lib/selectors';
import { TransactionWithCategory, TxType } from '../../lib/types';
import { useWallet } from '../../lib/WalletContext';

/** '2026-07' -> 'Tháng 7, 2026'; ALL_MONTHS -> 'Tất cả'. */
function monthTitle(key: string): string {
  if (key === ALL_MONTHS) return 'Tất cả';
  const [y, m] = key.split('-');
  return `Tháng ${Number(m)}, ${y}`;
}

type Filter = 'all' | TxType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'expense', label: 'Chi tiêu' },
  { key: 'income', label: 'Thu nhập' },
];

interface DayGroup {
  key: string;
  iso: string;
  items: TransactionWithCategory[];
  total: number; // thu - chi trong ngày
}

export default function Transactions() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const { transactions: all, canEdit, removeTransaction } = useWallet();

  // Chọn tháng để xem lịch sử. Mặc định tháng hiện tại.
  const currentMonth = monthKeyOf(new Date().toISOString());
  const [picked, setPicked] = useState('');
  const selected = picked || currentMonth;

  const monthOptions = useMemo(() => {
    const set = new Set(all.map((t) => monthKeyOf(t.date)));
    set.add(currentMonth);
    return [ALL_MONTHS, ...[...set].sort().reverse()];
  }, [all, currentMonth]);

  function openTx(tx: TransactionWithCategory) {
    if (canEdit(tx)) {
      router.push(`/add?id=${tx.id}`);
    } else {
      Alert.alert('Không sửa được', 'Chỉ người nhập hoặc chủ ví mới sửa/xoá giao dịch này.');
    }
  }

  async function deleteTx(tx: TransactionWithCategory) {
    if (!(await confirm('Xoá giao dịch', 'Xoá giao dịch này? Không thể hoàn tác.', 'Xoá'))) return;
    try {
      await removeTransaction(tx.id);
    } catch (e: any) {
      Alert.alert('Xoá thất bại', e?.message ?? String(e));
    }
  }

  const days = useMemo<DayGroup[]>(() => {
    const inMonth =
      selected === ALL_MONTHS ? all : all.filter((t) => monthKeyOf(t.date) === selected);
    const filtered = filter === 'all' ? inMonth : inMonth.filter((t) => t.type === filter);
    const map = new Map<string, TransactionWithCategory[]>();
    for (const t of filtered) {
      const k = dayKey(t.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a)) // ngày mới nhất lên đầu
      .map(([key, items]) => ({
        key,
        iso: items[0].date, // items đã sắp mới -> cũ theo occurred_at
        items,
        total: items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
      }));
  }, [filter, all, selected]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Giao dịch</Text>
        <MonthDropdown value={selected} options={monthOptions} onChange={setPicked} maxVisible={5}>
          <View style={styles.monthPill}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.monthText}>{monthTitle(selected)}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </View>
        </MonthDropdown>
      </View>

      {/* Bộ lọc */}
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

      <FlatList
        data={days}
        keyExtractor={(g) => g.key}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: g }) => (
          <DayCard group={g} onPressTx={openTx} onDeleteTx={deleteTx} canEdit={canEdit} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {selected === ALL_MONTHS ? 'Chưa có giao dịch nào' : 'Chưa có giao dịch trong tháng này'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function DeleteAction({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.deleteAction} onPress={onPress}>
      <Ionicons name="trash" size={22} color={colors.white} />
      <Text style={styles.deleteText}>Xoá</Text>
    </Pressable>
  );
}

function DayCard({
  group,
  onPressTx,
  onDeleteTx,
  canEdit,
}: {
  group: DayGroup;
  onPressTx: (tx: TransactionWithCategory) => void;
  onDeleteTx: (tx: TransactionWithCategory) => void;
  canEdit: (tx: TransactionWithCategory) => boolean;
}) {
  const p = dayHeaderParts(group.iso);
  const net = group.total;
  return (
    <View style={styles.dayCard}>
      {/* Tiêu đề ngày */}
      <View style={styles.dayHead}>
        <Text style={styles.dayNum}>{p.day}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.weekday}>{p.weekday}</Text>
          <Text style={styles.monthYear}>{p.monthYear}</Text>
        </View>
        <Text style={styles.dayTotal}>
          {net < 0 ? '−' : '+'}
          {formatVND(Math.abs(net))}
        </Text>
      </View>
      <View style={styles.headDivider} />

      {group.items.map((tx, i) => {
        const row = (
          <Pressable
            onPress={() => onPressTx(tx)}
            android_ripple={{ color: colors.border }}
            style={{ backgroundColor: colors.card }}
          >
            <TransactionRow tx={tx} />
          </Pressable>
        );
        return (
          <View key={tx.id}>
            {/* Chỉ vuốt-để-xoá được ở giao dịch mình có quyền xoá */}
            {canEdit(tx) ? (
              <Swipeable
                renderRightActions={() => <DeleteAction onPress={() => onDeleteTx(tx)} />}
                overshootRight={false}
              >
                {row}
              </Swipeable>
            ) : (
              row
            )}
            {i < group.items.length - 1 && <View style={styles.rowDivider} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
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

  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    ...shadow.card,
  },
  segmentItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  segmentItemActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted },
  segmentTextActive: { color: colors.white },

  list: { padding: spacing.lg, gap: spacing.lg },

  dayCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow.card,
  },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  dayNum: { fontSize: 40, fontWeight: font.weight.bold, color: colors.text, lineHeight: 44 },
  weekday: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  monthYear: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  dayTotal: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  headDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.xs },
  rowDivider: { height: 1, backgroundColor: colors.border },

  deleteAction: {
    backgroundColor: colors.expense,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    gap: 2,
  },
  deleteText: { color: colors.white, fontSize: font.size.xs, fontWeight: font.weight.semibold },

  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyText: { color: colors.textMuted, fontSize: font.size.md },
});
