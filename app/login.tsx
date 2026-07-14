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
import { signIn, signUp } from '../lib/api';

type Mode = 'signin' | 'signup';

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  async function handleSubmit() {
    if (!email.trim() || !password) {
      Alert.alert('Thiếu thông tin', 'Nhập email và mật khẩu.');
      return;
    }
    if (isSignup && !name.trim()) {
      Alert.alert('Thiếu tên', 'Nhập tên hiển thị của bạn.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        const res = await signUp(email.trim(), password, name.trim());
        // Nếu project bật xác nhận email thì chưa có session ngay.
        if (!res.session) {
          Alert.alert(
            'Kiểm tra email',
            'Tài khoản đã tạo. Mở email để xác nhận, sau đó quay lại đăng nhập.'
          );
          setMode('signin');
        }
      } else {
        await signIn(email.trim(), password);
      }
      // Đăng nhập thành công -> AuthContext bắt được, router tự chuyển màn.
    } catch (e: any) {
      Alert.alert(isSignup ? 'Đăng ký thất bại' : 'Đăng nhập thất bại', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="wallet" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Quản lý chi tiêu</Text>
          <Text style={styles.subtitle}>
            {isSignup ? 'Tạo tài khoản để bắt đầu' : 'Đăng nhập để tiếp tục'}
          </Text>

          {isSignup && (
            <>
              <Text style={styles.label}>Tên hiển thị</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Vd: Quang"
                placeholderTextColor={colors.textFaint}
                maxLength={40}
              />
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor={colors.textFaint}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Ít nhất 6 ký tự"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable style={[styles.primaryBtn, busy && styles.dim]} onPress={handleSubmit} disabled={busy}>
            <Text style={styles.primaryText}>
              {busy ? 'Đang xử lý…' : isSignup ? 'Đăng ký' : 'Đăng nhập'}
            </Text>
          </Pressable>

          <Pressable style={styles.switchBtn} onPress={() => setMode(isSignup ? 'signin' : 'signup')}>
            <Text style={styles.switchText}>
              {isSignup ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
            </Text>
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
    width: 80,
    height: 80,
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
  },

  label: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: font.size.md,
    color: colors.text,
    ...shadow.card,
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadow.card,
  },
  primaryText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold },
  dim: { opacity: 0.6 },

  switchBtn: { alignItems: 'center', paddingVertical: spacing.lg },
  switchText: { color: colors.primary, fontSize: font.size.sm, fontWeight: font.weight.semibold },
});
