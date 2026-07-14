import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
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
import { DatePickerField } from '../components/DatePickerField';
import { NumericKeypad } from '../components/NumericKeypad';
import { colors, font, radius, shadow, spacing } from '../constants/theme';
import { confirm } from '../lib/confirm';
import { formatVND } from '../lib/format';
import { amountSuggestions, suggestCategory } from '../lib/selectors';
import { TxType } from '../lib/types';
import { useWallet } from '../lib/WalletContext';

const MAX_DIGITS = 12; // ~ hàng trăm tỉ, quá đủ

export default function AddTransaction() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { transactions, categories, addTransaction, updateTransaction, removeTransaction } = useWallet();

  // Chế độ sửa: có `id` và tìm được giao dịch. Đọc 1 lần để khởi tạo state.
  const editingTx = useMemo(() => (id ? transactions.find((t) => t.id === id) : undefined), [id, transactions]);
  const editing = !!editingTx;

  const [type, setType] = useState<TxType>(editingTx?.type ?? 'expense');
  const [rawAmount, setRawAmount] = useState(editingTx ? String(editingTx.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(editingTx?.categoryId ?? null);
  const [note, setNote] = useState(editingTx?.note ?? '');
  const [date, setDate] = useState(editingTx ? new Date(editingTx.date) : new Date());
  const [keypad, setKeypad] = useState(true); // bàn phím số cho ô tiền đang mở?
  const [autoPicked, setAutoPicked] = useState(false); // danh mục vừa được gợi ý tự động?
  const [saving, setSaving] = useState(false);

  const digits = rawAmount.replace(/\D/g, '');
  const amount = Number(digits) || 0;
  const visibleCategories = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const freqAmounts = useMemo(() => amountSuggestions(transactions, type), [transactions, type]);
  const canSave = amount > 0 && !!categoryId;

  // Gợi ý danh mục theo thói quen (chỉ khi THÊM mới, không đè danh mục lúc sửa).
  useEffect(() => {
    if (editing) return;
    const sugg = suggestCategory(transactions, amount, type);
    if (sugg) {
      setCategoryId(sugg);
      setAutoPicked(true);
    }
  }, [editing, transactions, amount, type]);

  function openKeypad() {
    Keyboard.dismiss(); // đóng bàn phím hệ thống (nếu đang gõ ghi chú)
    setKeypad(true);
  }

  function pressDigit(d: string) {
    if (digits.length >= MAX_DIGITS) return;
    // Bỏ số 0 dẫn đầu: "0" + "5" -> "5".
    setRawAmount(digits === '0' ? d : digits + d);
  }

  function pressTripleZero() {
    if (!digits || digits === '0') return; // chưa có số thì "000" vô nghĩa
    setRawAmount((digits + '000').slice(0, MAX_DIGITS));
  }

  function pressBackspace() {
    setRawAmount(digits.slice(0, -1));
  }

  async function handleSave() {
    if (amount <= 0) {
      Alert.alert('Thiếu số tiền', 'Nhập số tiền giao dịch trước khi lưu.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Chưa chọn danh mục', 'Chọn một danh mục cho giao dịch.');
      return;
    }

    setSaving(true);
    try {
      // Date picker trả về 00:00 của ngày đã chọn. Nếu là hôm nay thì lấy giờ
      // hiện tại, để danh sách giao dịch không hiện "00:00" cho mọi dòng.
      // Khi sửa, giữ nguyên giờ gốc nếu ngày không đổi.
      let when: Date;
      if (editing && date.toDateString() === new Date(editingTx!.date).toDateString()) {
        when = new Date(editingTx!.date);
      } else if (date.toDateString() === new Date().toDateString()) {
        when = new Date();
      } else {
        when = date;
      }

      const payload = { amount, type, categoryId, note: note.trim(), date: when.toISOString() };
      if (editing) await updateTransaction(editingTx!.id, payload);
      else await addTransaction(payload); // `createdBy` do server gán = người đăng nhập
      router.back();
    } catch (e: any) {
      Alert.alert(editing ? 'Sửa thất bại' : 'Lưu thất bại', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingTx) return;
    if (!(await confirm('Xoá giao dịch', 'Xoá giao dịch này? Không thể hoàn tác.', 'Xoá'))) return;
    setSaving(true);
    try {
      await removeTransaction(editingTx.id);
      router.back();
    } catch (e: any) {
      Alert.alert('Xoá thất bại', e?.message ?? String(e));
      setSaving(false);
    }
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
          <Text style={styles.headerTitle}>{editing ? 'Sửa giao dịch' : 'Thêm giao dịch'}</Text>
          {editing ? (
            <Pressable onPress={handleDelete} hitSlop={12} disabled={saving}>
              <Ionicons name="trash-outline" size={24} color={colors.expense} />
            </Pressable>
          ) : (
            <View style={{ width: 26 }} />
          )}
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
          <Pressable style={[styles.amountCard, keypad && styles.amountCardActive]} onPress={openKeypad}>
            <Text style={styles.amountLabel}>Số tiền</Text>
            <View style={styles.amountInputRow}>
              <Text
                style={[
                  styles.amountInput,
                  { color: amount > 0 ? (type === 'income' ? colors.income : colors.expense) : colors.textFaint },
                ]}
              >
                {amount > 0 ? amount.toLocaleString('vi-VN') : '0'}
              </Text>
              <Text style={styles.currency}>₫</Text>
            </View>
            {amount > 0 && <Text style={styles.amountPreview}>{formatVND(amount)}</Text>}
          </Pressable>

          {/* Date */}
          <Text style={styles.sectionLabel}>Ngày giao dịch</Text>
          <DatePickerField value={date} onChange={setDate} maximumDate={new Date()} />

          {/* Categories */}
          <View style={styles.catHeader}>
            <Text style={styles.sectionLabel}>Danh mục</Text>
            {autoPicked && !!categoryId && (
              <View style={styles.autoHint}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={styles.autoHintText}>Gợi ý theo thói quen</Text>
              </View>
            )}
          </View>
          <View style={styles.categoryGrid}>
            {visibleCategories.map((c) => {
              const active = c.id === categoryId;
              return (
                <Pressable
                  key={c.id}
                  style={[styles.catItem, active && { borderColor: c.color, backgroundColor: c.color + '14' }]}
                  onPress={() => {
                    setCategoryId(c.id);
                    setAutoPicked(false); // người dùng tự chọn -> bỏ đánh dấu gợi ý
                  }}
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
            onFocus={() => setKeypad(false)}
            placeholder="Thêm mô tả (không bắt buộc)"
            placeholderTextColor={colors.textFaint}
            multiline
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Gợi ý số tiền + bàn phím số (cho ô tiền) + nút Lưu */}
        <View style={styles.footer}>
          {keypad && freqAmounts.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.amtChipRow}
            >
              {freqAmounts.map((amt) => (
                <Pressable key={amt} style={styles.amtChip} onPress={() => setRawAmount(String(amt))}>
                  <Text style={styles.amtChipText}>{amt.toLocaleString('vi-VN')} ₫</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          {keypad && (
            <NumericKeypad
              onDigit={pressDigit}
              onTripleZero={pressTripleZero}
              onBackspace={pressBackspace}
            />
          )}
          <Pressable
            style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDim]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Lưu giao dịch'}
            </Text>
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
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow.card,
  },
  amountCardActive: { borderColor: colors.primary },
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

  amtChipRow: { gap: spacing.sm, paddingBottom: spacing.md },
  amtChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  amtChipText: { fontSize: font.size.sm, color: colors.text, fontWeight: font.weight.semibold },


  sectionLabel: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  catHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  autoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  autoHintText: { fontSize: font.size.xs, color: colors.primary, fontWeight: font.weight.semibold },


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
  saveBtnDim: { opacity: 0.6 },
  saveText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold },
});
