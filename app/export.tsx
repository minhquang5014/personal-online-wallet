import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../constants/theme';
import { buildCsv } from '../lib/csv';
import { dayKey } from '../lib/format';
import { saveCsv } from '../lib/saveCsv';
import { useWallet } from '../lib/WalletContext';

export default function ExportScreen() {
  const router = useRouter();
  const { wallet, transactions } = useWallet();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    if (transactions.length === 0) {
      Alert.alert('Chưa có dữ liệu', 'Ví chưa có giao dịch nào để xuất.');
      return;
    }
    setBusy(true);
    try {
      const csv = buildCsv(transactions);
      const name = `giao-dich-${dayKey(new Date().toISOString())}.csv`;
      await saveCsv(name, csv);
    } catch (e: any) {
      Alert.alert('Xuất thất bại', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Xuất file CSV</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{wallet?.name ?? 'Ví'}</Text>
              <Text style={styles.rowHint}>{transactions.length} giao dịch (toàn bộ)</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.primaryBtn, (busy || transactions.length === 0) && styles.dim]}
          onPress={handleExport}
          disabled={busy || transactions.length === 0}
        >
          <Ionicons name="download-outline" size={18} color={colors.white} />
          <Text style={styles.primaryText}>{busy ? 'Đang tạo file…' : 'Xuất file CSV'}</Text>
        </Pressable>

        <Text style={styles.note}>
          File CSV gồm <Text style={styles.bold}>toàn bộ giao dịch</Text> của ví từ trước đến nay: ngày,
          loại, danh mục, số tiền, ghi chú và người nhập. Sau khi tạo, chọn nơi lưu/gửi (Drive, Zalo,
          Gmail…) từ bảng chia sẻ. Mở bằng Excel hoặc Google Sheets đều được.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  container: { padding: spacing.lg, gap: spacing.lg },

  card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.lg, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: font.size.md, color: colors.text, fontWeight: font.weight.semibold },
  rowHint: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    ...shadow.card,
  },
  primaryText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold },
  dim: { opacity: 0.5 },

  note: { fontSize: font.size.xs, color: colors.textFaint, lineHeight: 18 },
  bold: { fontWeight: font.weight.bold, color: colors.textMuted },
});
