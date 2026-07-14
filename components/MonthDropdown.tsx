import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../constants/theme';

/** Giá trị đặc biệt: xem toàn bộ các tháng. */
export const ALL_MONTHS = 'all';

/** '2026-07' -> 'Tháng 7, 2026'; ALL_MONTHS -> 'Tất cả'. */
function label(key: string): string {
  if (key === ALL_MONTHS) return 'Tất cả';
  const [y, m] = key.split('-');
  return `Tháng ${Number(m)}, ${y}`;
}

/**
 * Bọc quanh 1 phần tử (pill tháng), bấm vào sổ danh sách tháng để chọn.
 * Dùng Modal + danh sách nên chạy giống nhau trên web/iOS/Android.
 */
export function MonthDropdown({
  value,
  options,
  onChange,
  children,
  title = 'Chọn tháng',
  renderLabel = label,
}: {
  value: string;
  options: string[];
  onChange: (key: string) => void;
  children: ReactNode;
  title?: string;
  renderLabel?: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={6}>
        {children}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>{title}</Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const active = opt === value;
                return (
                  <Pressable
                    key={opt}
                    style={styles.row}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.rowText, active && styles.rowTextActive]}>{renderLabel(opt)}</Text>
                    {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  title: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowText: { fontSize: font.size.md, color: colors.text },
  rowTextActive: { color: colors.primary, fontWeight: font.weight.bold },
});
