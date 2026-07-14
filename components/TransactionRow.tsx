import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';
import { formatVND } from '../lib/format';
import { TransactionWithCategory } from '../lib/types';

export function TransactionRow({ tx }: { tx: TransactionWithCategory }) {
  const isIncome = tx.type === 'income';
  // Dòng phụ: ghi chú + người nhập (giữ thông tin ai nhập cho ví chung).
  const subtitle = [tx.note, tx.creator.name].filter(Boolean).join(' · ');

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: tx.category.color }]}>
        <Ionicons name={tx.category.icon as any} size={20} color={colors.white} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {tx.category.name}
        </Text>
        {!!subtitle && (
          <Text style={styles.note} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {formatVND(tx.amount)}
      </Text>
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
    borderRadius: radius.full, // tròn
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1 },
  name: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  note: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: font.size.md, fontWeight: font.weight.semibold },
});
