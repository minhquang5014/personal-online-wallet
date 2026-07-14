import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
import { useAuth } from '../lib/AuthContext';
import { confirm } from '../lib/confirm';
import { useWallet } from '../lib/WalletContext';

export default function WalletScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const {
    wallet,
    wallets,
    members,
    myRole,
    selectWallet,
    joinWallet,
    createWallet,
    renameWallet,
    leaveWallet,
    removeMember,
  } = useWallet();

  const [code, setCode] = useState('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'none' | 'join' | 'create'>('none');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');

  function startRename(id: string, name: string) {
    setMode('none');
    setRenameId(id);
    setRenameName(name);
  }

  async function handleRename() {
    const name = renameName.trim();
    if (!name) {
      Alert.alert('Thiếu tên', 'Nhập tên cho ví.');
      return;
    }
    if (!renameId) return;
    setBusy(true);
    try {
      await renameWallet(renameId, name);
      setRenameId(null);
    } catch (e: any) {
      Alert.alert('Đổi tên thất bại', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveMember(memberId: string, name: string) {
    if (!(await confirm('Xoá thành viên', `Xoá ${name} khỏi ví này?`, 'Xoá'))) return;
    setBusy(true);
    try {
      await removeMember(memberId);
    } catch (e: any) {
      Alert.alert('Xoá thất bại', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!(await confirm('Rời ví', `Rời khỏi "${wallet?.name}"? Bạn sẽ không xem được giao dịch của ví này nữa.`, 'Rời ví'))) return;
    setBusy(true);
    try {
      await leaveWallet();
      router.back(); // hết ví -> RootNavigator tự đưa sang màn thiết lập ví
    } catch (e: any) {
      Alert.alert('Rời ví thất bại', e?.message ?? String(e));
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!wallet) return;
    await Clipboard.setStringAsync(wallet.inviteCode);
    Alert.alert('Đã sao chép', `Mã mời ${wallet.inviteCode} đã được chép vào clipboard.`);
  }

  async function handleSwitch(id: string) {
    if (id === wallet?.id) return;
    setBusy(true);
    try {
      await selectWallet(id);
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
      const w = await joinWallet(c);
      setCode('');
      setMode('none');
      Alert.alert('Đã tham gia', `Bạn đã vào ví “${w?.name ?? ''}”.`);
    } catch (e: any) {
      Alert.alert('Không vào được ví', e?.message ?? 'Mã mời không đúng.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      Alert.alert('Thiếu tên ví', 'Đặt tên cho ví mới.');
      return;
    }
    setBusy(true);
    try {
      await createWallet(newName.trim());
      setNewName('');
      setMode('none');
    } catch (e: any) {
      Alert.alert('Tạo ví thất bại', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!wallet) return null;

  // Form đổi tên dùng chung cho card hiện tại và các ví trong danh sách.
  // Chỉ một vị trí khớp `renameId` tại một thời điểm nên không bị vẽ trùng.
  const renameForm = (
    <View>
      <TextInput
        style={styles.nameInput}
        value={renameName}
        onChangeText={setRenameName}
        placeholder="Tên ví"
        placeholderTextColor={colors.textFaint}
        maxLength={40}
        autoFocus
      />
      <View style={styles.inlineActions}>
        <Pressable style={styles.ghostBtn} onPress={() => setRenameId(null)} disabled={busy}>
          <Text style={styles.ghostText}>Huỷ</Text>
        </Pressable>
        <Pressable style={[styles.primaryBtn, busy && styles.dim]} onPress={handleRename} disabled={busy}>
          <Text style={styles.primaryText}>{busy ? 'Đang lưu…' : 'Lưu'}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Ví &amp; Tài khoản</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {renameId === wallet.id ? (
              renameForm
            ) : (
              <View style={styles.walletHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.roleText}>Bạn là {myRole === 'owner' ? 'chủ ví' : 'thành viên'}</Text>
                </View>
                {myRole === 'owner' && (
                  <Pressable onPress={() => startRename(wallet.id, wallet.name)} hitSlop={8}>
                    <Ionicons name="create-outline" size={22} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Chuyển giữa các ví — chỉ hiện khi thuộc nhiều ví */}
          {wallets.length > 1 && (
            <>
              <Text style={styles.sectionLabel}>Ví của bạn ({wallets.length})</Text>
              <View style={styles.card}>
                {wallets.map((w, i) => {
                  const active = w.id === wallet.id;
                  const canRename = w.ownerId === userId && !active; // ví hiện tại đổi tên ở card trên
                  return (
                    <View key={w.id}>
                      {renameId === w.id ? (
                        <View style={{ paddingVertical: spacing.sm }}>{renameForm}</View>
                      ) : (
                        <View style={styles.walletRow}>
                          <Pressable
                            style={styles.walletRowMain}
                            onPress={() => handleSwitch(w.id)}
                            disabled={busy}
                          >
                            <Ionicons
                              name={active ? 'radio-button-on' : 'radio-button-off'}
                              size={20}
                              color={active ? colors.primary : colors.textFaint}
                            />
                            <Text style={[styles.walletRowName, active && { color: colors.primary }]}>{w.name}</Text>
                            {active && <Text style={styles.currentTag}>Đang mở</Text>}
                          </Pressable>
                          {canRename && (
                            <Pressable onPress={() => startRename(w.id, w.name)} hitSlop={8}>
                              <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                            </Pressable>
                          )}
                        </View>
                      )}
                      {i < wallets.length - 1 && <View style={styles.divider} />}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Mã mời của ví hiện tại */}
          <Text style={styles.sectionLabel}>Mã mời ví này</Text>
          <Pressable style={styles.codeCard} onPress={copyCode}>
            <Text style={styles.code}>{wallet.inviteCode}</Text>
            <View style={styles.copyRow}>
              <Ionicons name="copy-outline" size={16} color={colors.primary} />
              <Text style={styles.copyText}>Chạm để sao chép</Text>
            </View>
          </Pressable>
          <Text style={styles.note}>
            Gửi mã này cho người thân để họ vào chung ví này với bạn.
          </Text>

          {/* Thành viên */}
          <Text style={styles.sectionLabel}>Thành viên ({members.length})</Text>
          <View style={styles.card}>
            {members.map((m, i) => (
              <View key={m.id}>
                <View style={styles.memberRow}>
                  <View style={styles.avatar}>
                    {m.avatarUrl ? (
                      <Image source={{ uri: m.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person" size={18} color={colors.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>
                      {m.name}
                      {m.id === userId && <Text style={styles.you}> (bạn)</Text>}
                    </Text>
                    <Text style={styles.memberRole}>{m.role === 'owner' ? 'Chủ ví' : 'Thành viên'}</Text>
                  </View>
                  {m.role === 'owner' ? (
                    <Ionicons name="key" size={16} color="#F59E0B" />
                  ) : (
                    // Chủ ví thấy nút xoá thành viên khác (không xoá chính mình)
                    myRole === 'owner' &&
                    m.id !== userId && (
                      <Pressable onPress={() => handleRemoveMember(m.id, m.name)} hitSlop={8} disabled={busy}>
                        <Ionicons name="remove-circle-outline" size={20} color={colors.expense} />
                      </Pressable>
                    )
                  )}
                </View>
                {i < members.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* Tham gia / tạo ví khác */}
          <Text style={styles.sectionLabel}>Ví khác</Text>
          {mode === 'join' ? (
            <View style={styles.card}>
              <Text style={styles.inlineTitle}>Nhập mã mời</Text>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                placeholder="ABC123"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
              <View style={styles.inlineActions}>
                <Pressable style={styles.ghostBtn} onPress={() => setMode('none')} disabled={busy}>
                  <Text style={styles.ghostText}>Huỷ</Text>
                </Pressable>
                <Pressable style={[styles.primaryBtn, busy && styles.dim]} onPress={handleJoin} disabled={busy}>
                  <Text style={styles.primaryText}>{busy ? 'Đang vào…' : 'Tham gia'}</Text>
                </Pressable>
              </View>
            </View>
          ) : mode === 'create' ? (
            <View style={styles.card}>
              <Text style={styles.inlineTitle}>Tên ví mới</Text>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Vd: Ví du lịch"
                placeholderTextColor={colors.textFaint}
                maxLength={40}
              />
              <View style={styles.inlineActions}>
                <Pressable style={styles.ghostBtn} onPress={() => setMode('none')} disabled={busy}>
                  <Text style={styles.ghostText}>Huỷ</Text>
                </Pressable>
                <Pressable style={[styles.primaryBtn, busy && styles.dim]} onPress={handleCreate} disabled={busy}>
                  <Text style={styles.primaryText}>{busy ? 'Đang tạo…' : 'Tạo ví'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Pressable style={styles.actionRow} onPress={() => setMode('join')}>
                <View style={[styles.actionIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="enter-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>Tham gia ví khác</Text>
                  <Text style={styles.actionSub}>Nhập mã mời của gia đình khác</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.actionRow} onPress={() => setMode('create')}>
                <View style={[styles.actionIcon, { backgroundColor: '#16A34A22' }]}>
                  <Ionicons name="add" size={18} color={colors.income} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>Tạo ví mới</Text>
                  <Text style={styles.actionSub}>Bạn sẽ là chủ ví</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Pressable>
            </View>
          )}

          <View style={styles.permCard}>
            <Text style={styles.permTitle}>Quyền hạn</Text>
            <Text style={styles.permText}>
              • Mọi thành viên đều xem được toàn bộ giao dịch của ví.{'\n'}
              • Thành viên chỉ sửa/xoá được giao dịch do chính mình nhập.{'\n'}
              • Chủ ví sửa/xoá được mọi giao dịch và quản lý danh mục.
            </Text>
          </View>

          {/* Rời ví — chỉ cho thành viên (chủ ví không rời được ví của mình) */}
          {myRole === 'member' && (
            <Pressable style={styles.leaveBtn} onPress={handleLeave} disabled={busy}>
              <Ionicons name="exit-outline" size={18} color={colors.expense} />
              <Text style={styles.leaveText}>Rời ví này</Text>
            </Pressable>
          )}
        </ScrollView>
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
  container: { padding: spacing.lg, gap: spacing.md },

  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  walletHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  walletName: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text },
  roleText: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },

  sectionLabel: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  walletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  walletRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  walletRowName: { flex: 1, fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  currentTag: { fontSize: font.size.xs, color: colors.primary, fontWeight: font.weight.semibold },

  codeCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  code: { fontSize: 34, fontWeight: font.weight.bold, color: colors.primary, letterSpacing: 8 },
  copyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  copyText: { fontSize: font.size.xs, color: colors.primary, fontWeight: font.weight.semibold },
  note: { fontSize: font.size.xs, color: colors.textFaint, lineHeight: 18 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  memberName: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text },
  you: { fontWeight: font.weight.regular, color: colors.textMuted },
  memberRole: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  actionSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },

  inlineTitle: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text, marginBottom: spacing.sm },
  codeInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 6,
  },
  nameInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: font.size.md,
    color: colors.text,
  },
  inlineActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  ghostBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.background },
  ghostText: { fontSize: font.size.md, color: colors.textMuted, fontWeight: font.weight.semibold },
  primaryBtn: { flex: 2, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.primary },
  primaryText: { fontSize: font.size.md, color: colors.white, fontWeight: font.weight.bold },
  dim: { opacity: 0.6 },

  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  leaveText: { color: colors.expense, fontSize: font.size.md, fontWeight: font.weight.semibold },

  permCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  permTitle: { fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.text, marginBottom: spacing.sm },
  permText: { fontSize: font.size.xs, color: colors.textMuted, lineHeight: 20 },
});
