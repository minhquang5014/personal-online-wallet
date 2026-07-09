import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../constants/theme';
import { formatVND } from '../lib/format';
import { categories } from '../lib/mockData';
import { TxType } from '../lib/types';

export default function AddTransaction() {
  const router = useRouter();
  const [type, setType] = useState<TxType>('expense');
  const [rawAmount, setRawAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const amount = Number(rawAmount.replace(/\D/g, '')) || 0;
  const visibleCategories = useMemo(() => categories.filter((c) => c.type === type), [type]);
  const canSave = amount > 0 && !!categoryId;

  function handleSave() {
    // TODO: khi có Supabase -> insert vào bảng `transactions`.
    // Hiện chỉ đóng modal để demo luồng UI.
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Thêm giao dịch</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Type toggle */}
          <View style={styles.typeToggle}>
            <Pressable
              style={[styles.typeItem, type === 'expense' && styles.typeItemExpense]}
              onPress={() => {
                setType('expense');
                setCategoryId(null);
              }}
            >
              <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Chi tiêu</Text>
            </Pressable>
            <Pressable
              style={[styles.typeItem, type === 'income' && styles.typeItemIncome]}
              onPress={() => {
                setType('income');
                setCategoryId(null);
              }}
            >
              <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Thu nhập</Text>
            </Pressable>
          </View>

          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Số tiền</Text>
            <View style={styles.amountInputRow}>
              <TextInput
                style={[styles.amountInput, { color: type === 'income' ? colors.income : colors.expense }]}
                value={rawAmount ? Number(rawAmount.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                onChangeText={(t) => setRawAmount(t)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textFaint}
              />
              <Text style={styles.currency}>₫</Text>
            </View>
            {amount > 0 && <Text style={styles.amountPreview}>{formatVND(amount)}</Text>}
          </View>

          {/* Categories */}
          <Text style={styles.sectionLabel}>Danh mục</Text>
          <View style={styles.categoryGrid}>
            {visibleCategories.map((c) => {
              const active = c.id === categoryId;
              return (
                <Pressable
                  key={c.id}
                  style={[styles.catItem, active && { borderColor: c.color, backgroundColor: c.color + '14' }]}
                  onPress={() => setCategoryId(c.id)}
                >
                  <View style={[styles.catIcon, { backgroundColor: c.color + '22' }]}>
                    <Ionicons name={c.icon as any} size={22} color={c.color} />
                  </View>
                  <Text style={styles.catName} numberOfLines={1}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Note */}
          <Text style={styles.sectionLabel}>Ghi chú</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Thêm mô tả (không bắt buộc)"
            placeholderTextColor={colors.textFaint}
            multiline
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Save button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={styles.saveText}>Lưu giao dịch</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CAT_GAP = spacing.md;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  container: { paddingHorizontal: spacing.lg, gap: spacing.lg },

  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    ...shadow.card,
  },
  typeItem: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  typeItemExpense: { backgroundColor: colors.expense },
  typeItemIncome: { backgroundColor: colors.income },
  typeText: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textMuted },
  typeTextActive: { color: colors.white },

  amountCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.card,
  },
  amountLabel: { fontSize: font.size.sm, color: colors.textMuted },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  amountInput: {
    fontSize: font.size.display,
    fontWeight: font.weight.bold,
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
  },
  currency: { fontSize: font.size.xl, color: colors.textMuted, fontWeight: font.weight.semibold },
  amountPreview: { fontSize: font.size.sm, color: colors.textFaint, marginTop: spacing.xs },

  sectionLabel: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CAT_GAP },
  catItem: {
    // 4 cột: flexBasis ~22% + gap để vừa khít hàng
    flexBasis: '22%',
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.card,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: { fontSize: font.size.xs, color: colors.text, textAlign: 'center' },

  noteInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: font.size.md,
    color: colors.text,
    minHeight: 56,
    ...shadow.card,
  },

  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  saveBtnDisabled: { backgroundColor: colors.textFaint, shadowOpacity: 0 },
  saveText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold },
});
