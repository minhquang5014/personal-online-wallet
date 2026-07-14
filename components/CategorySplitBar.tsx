import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../constants/theme';

/**
 * Thanh ngang chia theo tỉ lệ danh mục (stacked bar).
 * Mỗi đoạn màu = một danh mục, rộng theo `ratio` (0..1).
 */
export function CategorySplitBar({
  segments,
  height = 12,
}: {
  segments: { color: string; ratio: number }[];
  height?: number;
}) {
  return (
    <View style={[styles.track, { height }]}>
      {segments.map((s, i) => (
        // flex theo ratio; nhân 1000 để giữ tỉ lệ nguyên, tránh đoạn quá nhỏ biến mất.
        <View key={i} style={{ flex: Math.max(1, Math.round(s.ratio * 1000)), backgroundColor: s.color }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
});
