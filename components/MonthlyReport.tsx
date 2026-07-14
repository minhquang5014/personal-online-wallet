import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { colors, font, radius, spacing } from '../constants/theme';
import { formatCompactVND, formatVND } from '../lib/format';
import { MonthReport } from '../lib/selectors';
import { TxType } from '../lib/types';

const GRAY = '#D1D5DB';

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Báo cáo luỹ kế: tháng này vs trung bình 3 tháng trước. Có tab Chi/Thu. */
export function MonthlyReport({
  type,
  onTypeChange,
  expenseTotal,
  incomeTotal,
  report,
  monthKey,
  chartH = 200,
}: {
  type: TxType;
  onTypeChange: (t: TxType) => void;
  expenseTotal: number;
  incomeTotal: number;
  report: MonthReport;
  monthKey: string;
  chartH?: number;
}) {
  const [width, setWidth] = useState(0);

  const color = type === 'income' ? colors.income : colors.expense;
  const [yStr, mm] = monthKey.split('-');
  const lastDay = String(report.daysInMonth).padStart(2, '0');
  const uptoLabel = `${String(report.upto).padStart(2, '0')}/${mm}/${yStr}`;

  const padL = 4;
  const padR = 4;
  const padT = 12;
  const padB = 6;
  const plotH = chartH - padT - padB;
  const plotW = Math.max(0, width - padL - padR);
  const baseY = padT + plotH;

  const n = report.daysInMonth;
  const yMax = niceMax(Math.max(1, ...report.average, ...report.current));
  const x = (i: number) => padL + (n > 1 ? (i / (n - 1)) * plotW : 0);
  const y = (v: number) => baseY - (v / yMax) * plotH;

  const avgPts = report.average.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const curPts = report.current.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const lastX = x(report.current.length - 1);
  const lastY = y(report.currentAtUpto);
  const showMarkerLine = report.upto < n; // chỉ tháng hiện tại mới có vạch "hôm nay"

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  return (
    <View>
      {/* Tab Chi / Thu */}
      <View style={styles.tabs}>
        <Pressable style={styles.tab} onPress={() => onTypeChange('expense')}>
          <Text style={styles.tabLabel}>Tổng đã chi</Text>
          <Text style={[styles.tabValue, { color: colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatVND(expenseTotal)}
          </Text>
          <View style={[styles.underline, type === 'expense' && { backgroundColor: colors.expense }]} />
        </Pressable>
        <Pressable style={styles.tab} onPress={() => onTypeChange('income')}>
          <Text style={styles.tabLabel}>Tổng thu</Text>
          <Text style={[styles.tabValue, { color: colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatVND(incomeTotal)}
          </Text>
          <View style={[styles.underline, type === 'income' && { backgroundColor: colors.income }]} />
        </Pressable>
      </View>

      {/* Tooltip */}
      <View style={styles.tooltip}>
        <Text style={styles.tipLine}>
          {uptoLabel}: <Text style={[styles.tipStrong, { color }]}>{formatVND(report.currentAtUpto)}</Text>
        </Text>
        <Text style={styles.tipLine}>
          Trung bình 3 tháng trước:{' '}
          <Text style={styles.tipStrong}>{formatVND(Math.round(report.avgAtUpto))}</Text>
        </Text>
      </View>

      {/* Biểu đồ (chỉ hình khối trong SVG; nhãn dùng <Text> thường cho khỏi bị cắt) */}
      <View style={{ height: chartH }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <>
            <Svg width={width} height={chartH}>
              {ticks.map((t, i) => (
                <Line
                  key={'g' + i}
                  x1={padL}
                  y1={y(t)}
                  x2={padL + plotW}
                  y2={y(t)}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="3 5"
                />
              ))}
              {showMarkerLine && (
                <Line x1={lastX} y1={padT} x2={lastX} y2={baseY} stroke={colors.border} strokeWidth={1} />
              )}
              <Polyline points={avgPts} fill="none" stroke={GRAY} strokeWidth={2.5} />
              <Polygon points={`${padL},${baseY} ${curPts} ${lastX},${baseY}`} fill={color} fillOpacity={0.08} />
              <Polyline points={curPts} fill="none" stroke={color} strokeWidth={2.5} />
              <Circle cx={lastX} cy={lastY} r={5} fill={colors.card} stroke={color} strokeWidth={2.5} />
            </Svg>

            {/* Nhãn trục Y: <Text> nền trắng, canh phải mép biểu đồ */}
            {ticks.map((t, i) => (
              <Text key={'yl' + i} style={[styles.yLabel, { top: y(t) - 7 }]} numberOfLines={1}>
                {t === 0 ? '0' : formatCompactVND(t)}
              </Text>
            ))}
          </>
        )}
      </View>

      {/* Nhãn ngày đầu/cuối tháng */}
      <View style={styles.xAxis}>
        <Text style={styles.axisText}>01/{mm}</Text>
        <Text style={styles.axisText}>
          {lastDay}/{mm}
        </Text>
      </View>

      {/* Chú thích */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Tháng này</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: GRAY }]} />
          <Text style={styles.legendText}>Trung bình 3 tháng trước</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingBottom: spacing.sm },
  tabLabel: { fontSize: font.size.sm, color: colors.textMuted },
  tabValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: 2 },
  underline: {
    height: 2,
    alignSelf: 'stretch',
    marginTop: spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: 2,
  },

  tooltip: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  tipLine: { fontSize: font.size.sm, color: colors.textMuted, lineHeight: 20 },
  tipStrong: { fontWeight: font.weight.bold, color: colors.text },

  yLabel: {
    position: 'absolute',
    right: 2,
    fontSize: 10,
    color: colors.textFaint,
    backgroundColor: colors.card, // che đường lưới phía sau cho dễ đọc
    paddingHorizontal: 2,
  },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  axisText: { fontSize: 10, color: colors.textMuted },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  legendText: { fontSize: font.size.xs, color: colors.textMuted },
});
