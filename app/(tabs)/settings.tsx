import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../../constants/theme';

interface Item {
  icon: string;
  label: string;
  color: string;
  hint?: string;
}

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Tài khoản',
    items: [
      { icon: 'person-circle', label: 'Hồ sơ', color: colors.primary },
      { icon: 'cloud-upload', label: 'Đồng bộ đám mây', color: '#0EA5E9', hint: 'Chưa bật' },
      { icon: 'wallet', label: 'Ví & Tài khoản', color: '#16A34A' },
    ],
  },
  {
    title: 'Tùy chỉnh',
    items: [
      { icon: 'pricetags', label: 'Danh mục', color: '#F97316' },
      { icon: 'cash', label: 'Đơn vị tiền tệ', color: '#8B5CF6', hint: 'VND' },
      { icon: 'notifications', label: 'Thông báo', color: '#EC4899' },
    ],
  },
  {
    title: 'Khác',
    items: [
      { icon: 'shield-checkmark', label: 'Bảo mật', color: '#0D9488' },
      { icon: 'help-circle', label: 'Trợ giúp', color: '#6B7280' },
    ],
  },
];

export default function Settings() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Cài đặt</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>Quang</Text>
            <Text style={styles.profileEmail}>minhquang5014@gmail.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
        </View>

        {GROUPS.map((group) => (
          <View key={group.title} style={{ gap: spacing.sm }}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.items.map((item, i) => (
                <View key={item.label}>
                  <View style={styles.itemRow}>
                    <View style={[styles.itemIcon, { backgroundColor: item.color + '22' }]}>
                      <Ionicons name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.hint && <Text style={styles.itemHint}>{item.hint}</Text>}
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                  </View>
                  {i < group.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>Phiên bản 1.0.0 · demo UI</Text>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text },
  profileEmail: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },

  groupTitle: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textMuted, marginLeft: spacing.xs },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    ...shadow.card,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  itemHint: { fontSize: font.size.sm, color: colors.textFaint },
  divider: { height: 1, backgroundColor: colors.border },

  version: { textAlign: 'center', fontSize: font.size.xs, color: colors.textFaint },
});
