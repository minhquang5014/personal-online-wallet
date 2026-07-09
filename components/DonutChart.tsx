import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export interface DonutSlice {
  value: number;
  color: string;
}

/**
 * Donut chart thuần bằng react-native-svg — vẽ mỗi lát bằng một vòng tròn
 * có strokeDasharray/offset. Không phụ thuộc thư viện chart nặng.
 */
export function DonutChart({
  slices,
  size = 180,
  strokeWidth = 26,
  children,
}: {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;

  let offsetAcc = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {/* Track nền */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EEF1F6"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {slices.map((slice, i) => {
            const fraction = slice.value / total;
            const dash = fraction * circumference;
            const el = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offsetAcc}
                strokeLinecap="butt"
                fill="none"
              />
            );
            offsetAcc += dash;
            return el;
          })}
        </G>
      </Svg>
      {/* Nội dung ở giữa donut */}
      <View style={{ position: 'absolute', alignItems: 'center' }}>{children}</View>
    </View>
  );
}
