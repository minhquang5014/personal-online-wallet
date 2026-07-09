import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';
import { formatCompactVND } from '../lib/format';
import { MonthTotals } from '../lib/mockData';

/**
 * Biểu đồ cột thu/chi theo từng tháng — thuần View, không cần thư viện chart.
 * Mỗi tháng 2 cột: thu (xanh) và chi (đỏ). Bấm vào cột để chọn tháng.
 */
export function MonthlyBarChart({
  data,
  selectedKey,
  onSelect,
  height = 150,
}: {
  data: MonthTotals[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  height?: number;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));

  return (
    <View>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
          <Text style={styles.legendText}>Thu</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
          <Text style={styles.legendText}>Chi</Text>
        </View>
      </View>

      {/* Bars */}
      <View style={[styles.chart, { height: height + 24 }]}>
        {data.map((d) => {
          const active = d.key === selectedKey;
          return (
            <Pressable
              key={d.key}
              style={styles.col}
              onPress={() => onSelect?.(d.key)}
              hitSlop={6}
            >
              <View style={[styles.bars, { height }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(2, (d.income / max) * height),
                      backgroundColor: active ? colors.income : colors.income + '80',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(2, (d.expense / max) * height),
                      backgroundColor: active ? colors.expense : colors.expense + '80',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.monthLabel, active && styles.monthLabelActive]}>{d.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Số liệu tháng đang chọn */}
      {selectedKey && (() => {
        const sel = data.find((d) => d.key === selectedKey);
        if (!sel) return null;
        return (
          <View style={styles.footer}>
            <Text style={[styles.footerVal, { color: colors.income }]}>
              +{formatCompactVND(sel.income)}
            </Text>
            <Text style={[styles.footerVal, { color: colors.expense }]}>
              -{formatCompactVND(sel.expense)}
            </Text>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: radius.full },
  legendText: { fontSize: font.size.xs, color: colors.textMuted },

  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  col: { flex: 1, alignItems: 'center', gap: spacing.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 12, borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  monthLabel: { fontSize: font.size.xs, color: colors.textMuted },
  monthLabelActive: { color: colors.primary, fontWeight: font.weight.bold },

  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md },
  footerVal: { fontSize: font.size.sm, fontWeight: font.weight.semibold },
});
