import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTheme } from '../lib/theme';

/** Area sparkline with a faint grid and an emphasised last point. Nulls are skipped. */
export function Sparkline({ values, height = 64 }: { values: (number | null)[]; height?: number }) {
  const { c } = useTheme();
  const [w, setW] = useState(0);
  const pts = values.map((v, i) => ({ i, v })).filter((p): p is { i: number; v: number } => p.v !== null);
  const max = Math.max(1, ...pts.map((p) => p.v));
  const pad = 5;
  const n = Math.max(1, values.length - 1);
  const x = (i: number) => pad + (i / n) * (w - pad * 2);
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const line = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const area = pts.length > 1 ? `${line} L${x(pts[pts.length - 1].i).toFixed(1)} ${height} L${x(pts[0].i).toFixed(1)} ${height} Z` : '';
  return (
    <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          {[0.25, 0.5, 0.75].map((f) => (
            <Line key={f} x1={0} x2={w} y1={height * f} y2={height * f} stroke={c.line} strokeWidth={1} />
          ))}
          {area ? <Path d={area} fill={c.cobaltWash} /> : null}
          {pts.length > 1 ? <Path d={line} stroke={c.cobalt} strokeWidth={2} fill="none" strokeLinejoin="round" /> : null}
          {last ? <Circle cx={x(last.i)} cy={y(last.v)} r={3.5} fill={c.cobalt} /> : null}
        </Svg>
      ) : null}
    </View>
  );
}
