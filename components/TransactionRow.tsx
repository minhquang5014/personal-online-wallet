import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';
import { formatRelativeDate, formatTime, formatVND } from '../lib/format';
import { TransactionWithCategory } from '../lib/types';

export function TransactionRow({ tx }: { tx: TransactionWithCategory }) {
  const isIncome = tx.type === 'income';
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: tx.category.color + '22' }]}>
        <Ionicons name={tx.category.icon as any} size={20} color={tx.category.color} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {tx.category.name}
        </Text>
        <Text style={styles.note} numberOfLines={1}>
          {tx.note || '—'}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: isIncome ? colors.income : colors.text }]}>
          {isIncome ? '+' : '−'}
          {formatVND(tx.amount)}
        </Text>
        <Text style={styles.time}>
          {formatRelativeDate(tx.date)} · {formatTime(tx.date)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1 },
  name: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text,
  },
  note: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: { alignItems: 'flex-end' },
  amount: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
  },
  time: {
    fontSize: font.size.xs,
    color: colors.textFaint,
    marginTop: 2,
  },
});
