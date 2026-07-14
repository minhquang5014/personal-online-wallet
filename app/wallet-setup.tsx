import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
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
import { signOut } from '../lib/api';
import { useWallet } from '../lib/WalletContext';

type Tab = 'create' | 'join';

export default function WalletSetup() {
  const { createWallet, joinWallet } = useWallet();
  const [tab, setTab] = useState<Tab>('create');
  const [name, setName] = useState('Ví gia đình');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Thiếu tên ví', 'Đặt tên cho ví của bạn.');
      return;
    }
    setBusy(true);
    try {
      await createWallet(name.trim());
    } catch (e: any) {
      Alert.alert('Tạo ví thất bại', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) {
      Alert.alert('Mã không hợp lệ', 'Mã mời gồm 6 ký tự.');
      return;
    }
    setBusy(true);
    try {
      await joinWallet(c);
    } catch (e: any) {
      Alert.alert('Không vào được ví', e?.message ?? 'Mã mời không đúng.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="people" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Thiết lập ví</Text>
          <Text style={styles.subtitle}>
            Tạo ví mới, hoặc nhập mã mời để dùng chung ví với người thân.
          </Text>

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, tab === 'create' && styles.tabActive]}
              onPress={() => setTab('create')}
            >
              <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>Tạo ví mới</Text>
            </Pressable>
            <Pressable style={[styles.tab, tab === 'join' && styles.tabActive]} onPress={() => setTab('join')}>
              <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>Vào ví có sẵn</Text>
            </Pressable>
          </View>

          {tab === 'create' ? (
            <>
              <Text style={styles.label}>Tên ví</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Vd: Ví gia đình"
                placeholderTextColor={colors.textFaint}
                maxLength={40}
              />
              <Pressable style={[styles.primaryBtn, busy && styles.dim]} onPress={handleCreate} disabled={busy}>
                <Text style={styles.primaryText}>{busy ? 'Đang tạo…' : 'Tạo ví'}</Text>
              </Pressable>
              <Text style={styles.note}>
                Bạn sẽ là chủ ví. Sau khi tạo, app cho bạn một mã mời 6 ký tự để chia sẻ.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>Mã mời</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                placeholder="ABC123"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
              <Pressable style={[styles.primaryBtn, busy && styles.dim]} onPress={handleJoin} disabled={busy}>
                <Text style={styles.primaryText}>{busy ? 'Đang vào ví…' : 'Tham gia ví'}</Text>
              </Pressable>
              <Text style={styles.note}>
                Xin mã mời từ người đã tạo ví (Cài đặt → Ví &amp; Tài khoản).
              </Text>
            </>
          )}

          <Pressable style={styles.signOut} onPress={() => signOut().catch(() => {})}>
            <Text style={styles.signOutText}>Đăng xuất</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, gap: spacing.sm, flexGrow: 1, justifyContent: 'center' },
  logo: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    ...shadow.card,
  },
  tab: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted },
  tabTextActive: { color: colors.white },

  label: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted, marginTop: spacing.lg },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: font.size.md,
    color: colors.text,
    ...shadow.card,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    letterSpacing: 6,
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadow.card,
  },
  primaryText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold },
  dim: { opacity: 0.6 },
  note: { fontSize: font.size.xs, color: colors.textFaint, marginTop: spacing.md, lineHeight: 18, textAlign: 'center' },

  signOut: { alignItems: 'center', paddingVertical: spacing.xl },
  signOutText: { color: colors.textMuted, fontSize: font.size.sm, fontWeight: font.weight.semibold },
});
