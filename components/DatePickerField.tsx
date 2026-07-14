import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../constants/theme';
import { formatPickedDate } from '../lib/format';

/**
 * Ô chọn ngày cho iOS: bọc lịch trong Modal (nếu render inline trực tiếp sẽ
 * chèn thẳng vào layout, trông vỡ). Có nút "Xong" để áp dụng.
 * Bản web nằm ở DatePickerField.web.tsx.
 */
const dayOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function DatePickerField({
  value,
  onChange,
  maximumDate,
}: {
  value: Date;
  onChange: (d: Date) => void;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState(value); // giá trị tạm cho lịch iOS

  function openPicker() {
    setTemp(value);
    setOpen(true);
  }

  return (
    <>
      <Pressable style={styles.row} onPress={openPicker}>
        <View style={styles.left}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.text}>{formatPickedDate(value)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Chọn ngày</Text>
            <DateTimePicker
              value={temp}
              mode="date"
              display="inline"
              maximumDate={maximumDate}
              onChange={(_e, d) => d && setTemp(d)}
            />
            <Pressable
              style={styles.doneBtn}
              onPress={() => {
                onChange(dayOnly(temp));
                setOpen(false);
              }}
            >
              <Text style={styles.doneText}>Xong</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  sheetTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  doneText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold },
});
