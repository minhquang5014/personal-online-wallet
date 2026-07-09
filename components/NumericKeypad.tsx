import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';

/**
 * Bàn phím số tự làm cho ô nhập tiền — có sẵn phím "000" và xoá lùi.
 * Không dùng bàn phím hệ thống nên chèn được phím tuỳ ý.
 */
export function NumericKeypad({
  onDigit,
  onTripleZero,
  onBackspace,
}: {
  onDigit: (d: string) => void;
  onTripleZero: () => void;
  onBackspace: () => void;
}) {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={styles.pad}>
      {rows.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map((d) => (
            <Key key={d} label={d} onPress={() => onDigit(d)} />
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <Key label="000" onPress={onTripleZero} />
        <Key label="0" onPress={() => onDigit('0')} />
        <Pressable style={({ pressed }) => [styles.key, pressed && styles.keyPressed]} onPress={onBackspace}>
          <Ionicons name="backspace-outline" size={24} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function Key({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.key, pressed && styles.keyPressed]} onPress={onPress}>
      <Text style={styles.keyText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { gap: spacing.sm, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  key: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyPressed: { backgroundColor: colors.primarySoft },
  keyText: { fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text },
});
