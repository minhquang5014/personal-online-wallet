import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
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
import { signOut, updateMyProfile, uploadAvatar } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { confirm } from '../lib/confirm';
import { useWallet } from '../lib/WalletContext';

export default function Profile() {
  const router = useRouter();
  const { session, userId } = useAuth();
  const { members, refresh } = useWallet();

  const me = members.find((m) => m.id === userId);
  const [name, setName] = useState(me?.name ?? '');
  const [avatar, setAvatar] = useState(me?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const email = session?.user.email ?? '';

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Cần quyền truy cập ảnh', 'Cho phép app xem thư viện ảnh để đổi ảnh đại diện.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6, // nén cho nhẹ, ảnh đại diện không cần nét cao
      base64: true, // lấy thẳng base64, khỏi phải đọc file
    });
    if (res.canceled || !res.assets[0]?.base64) return;

    setUploading(true);
    try {
      const url = await uploadAvatar(res.assets[0].base64);
      setAvatar(url);
      await refresh(); // để các màn khác thấy ảnh mới
    } catch (e: any) {
      Alert.alert('Tải ảnh thất bại', e?.message ?? String(e));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Thiếu tên', 'Nhập tên hiển thị của bạn.');
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile(trimmedName);
      await refresh(); // để tên người nhập cập nhật ngay trên các màn khác
      router.back();
    } catch (e: any) {
      Alert.alert('Lưu thất bại', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            <Pressable onPress={pickAvatar} disabled={uploading}>
              <View style={styles.avatar}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={36} color={colors.primary} />
                )}
              </View>
              <View style={styles.avatarBadge}>
                <Ionicons name={uploading ? 'hourglass' : 'camera'} size={14} color={colors.white} />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>
              {uploading ? 'Đang tải ảnh…' : 'Chạm để đổi ảnh đại diện'}
            </Text>
          </View>

          <Text style={styles.label}>Tên hiển thị</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tên của bạn"
            placeholderTextColor={colors.textFaint}
            maxLength={40}
          />

          <Text style={styles.label}>Email</Text>
          <View style={[styles.input, styles.readonly]}>
            <Text style={styles.readonlyText}>{email}</Text>
          </View>

          <Text style={styles.note}>
            Tên hiển thị được lưu trên Supabase và hiện ở mục “Người nhập” của mỗi giao dịch, để mọi
            người trong ví biết ai đã nhập khoản nào. Email gắn với tài khoản đăng nhập nên không đổi
            được ở đây.
          </Text>

          <Pressable
            style={styles.signOut}
            onPress={async () => {
              if (!(await confirm('Đăng xuất', 'Bạn chắc chứ?', 'Đăng xuất'))) return;
              try {
                await signOut();
              } catch (e: any) {
                Alert.alert('Đăng xuất thất bại', e?.message ?? String(e));
              }
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.expense} />
            <Text style={styles.signOutText}>Đăng xuất</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  container: { paddingHorizontal: spacing.lg, gap: spacing.md },

  avatarWrap: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarHint: { fontSize: font.size.xs, color: colors.textMuted },

  label: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: font.size.md,
    color: colors.text,
    ...shadow.card,
  },
  readonly: { justifyContent: 'center', backgroundColor: colors.border + '55', shadowOpacity: 0, elevation: 0 },
  readonlyText: { fontSize: font.size.md, color: colors.textMuted },
  note: { fontSize: font.size.xs, color: colors.textFaint, marginTop: spacing.md, lineHeight: 18 },

  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  signOutText: { color: colors.expense, fontSize: font.size.md, fontWeight: font.weight.semibold },

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
  saveText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold },
});
