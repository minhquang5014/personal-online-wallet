import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../constants/theme';
import { formatPickedDate } from '../lib/format';

/**
 * Ô chọn ngày cho web.
 *
 * @react-native-community/datetimepicker KHÔNG có bản web — render ra rỗng nên
 * bấm không có gì xảy ra. Ở đây dùng <input type="date"> của trình duyệt, đặt
 * trong suốt phủ lên trên ô, để giữ nguyên giao diện mà vẫn bấm được.
 *
 * Metro tự chọn file này khi build web (đuôi .web.tsx).
 */
const two = (n: number) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' theo giờ địa phương (toISOString sẽ lệch múi giờ). */
const toInputValue = (d: Date) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;

export function DatePickerField({
  value,
  onChange,
  maximumDate,
}: {
  value: Date;
  onChange: (d: Date) => void;
  maximumDate?: Date;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <Text style={styles.text}>{formatPickedDate(value)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />

      <input
        type="date"
        value={toInputValue(value)}
        max={maximumDate ? toInputValue(maximumDate) : undefined}
        onChange={(e) => {
          const [y, m, d] = e.target.value.split('-').map(Number);
          if (y && m && d) onChange(new Date(y, m - 1, d));
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadow.card,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
});
