import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'board' | 'bell' | 'user' | 'plus' | 'search' | 'back' | 'more' | 'lock' | 'unlock'
  | 'db' | 'cloud' | 'git' | 'globe' | 'card' | 'mail' | 'box' | 'chart' | 'dots'
  | 'copy' | 'open' | 'down' | 'chev' | 'link' | 'chat' | 'shield' | 'moon' | 'close' | 'trash' | 'edit' | 'x' | 'check';

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number };

export function Icon({ name, size = 20, color, strokeWidth = 2 }: Props) {
  const s = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {draw(name, s, color)}
    </Svg>
  );
}

function draw(name: IconName, s: Record<string, unknown>, color: string) {
  switch (name) {
    case 'board':
      return (
        <G {...s}>
          <Circle cx={6} cy={7} r={1.6} fill={color} />
          <Path d="M11 7h8" />
          <Circle cx={6} cy={12} r={1.6} fill={color} />
          <Path d="M11 12h6" />
          <Circle cx={6} cy={17} r={1.6} fill={color} />
          <Path d="M11 17h7" />
        </G>
      );
    case 'bell':
      return <Path {...s} d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4" />;
    case 'user':
      return (
        <G {...s}>
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21a8 8 0 0 1 16 0" />
        </G>
      );
    case 'plus':
      return <Path {...s} strokeWidth={2.4} d="M12 5v14M5 12h14" />;
    case 'search':
      return (
        <G {...s}>
          <Circle cx={11} cy={11} r={6.5} />
          <Path d="m16 16 4 4" />
        </G>
      );
    case 'back':
      return <Path {...s} strokeWidth={2.2} d="M15 5 8 12l7 7" />;
    case 'more':
      return (
        <G fill={color}>
          <Circle cx={12} cy={5} r={1.8} />
          <Circle cx={12} cy={12} r={1.8} />
          <Circle cx={12} cy={19} r={1.8} />
        </G>
      );
    case 'lock':
      return (
        <G {...s}>
          <Rect x={5} y={11} width={14} height={10} rx={2} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </G>
      );
    case 'unlock':
      return (
        <G {...s}>
          <Rect x={5} y={11} width={14} height={10} rx={2} />
          <Path d="M8 11V8a4 4 0 0 1 7.5-2" />
        </G>
      );
    case 'db':
      return (
        <G {...s}>
          <Ellipse cx={12} cy={6} rx={7} ry={3} />
          <Path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
        </G>
      );
    case 'cloud':
      return <Path {...s} d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17.5 18H7Z" />;
    case 'git':
      return (
        <G {...s}>
          <Circle cx={6} cy={6} r={2.2} />
          <Circle cx={6} cy={18} r={2.2} />
          <Circle cx={18} cy={9} r={2.2} />
          <Path d="M6 8.2v7.6M18 11.2c0 3-4 3-8.5 5" />
        </G>
      );
    case 'globe':
      return (
        <G {...s}>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
        </G>
      );
    case 'card':
      return (
        <G {...s}>
          <Rect x={3} y={6} width={18} height={13} rx={2} />
          <Path d="M3 10.5h18M7 15h4" />
        </G>
      );
    case 'mail':
      return (
        <G {...s}>
          <Rect x={3} y={5} width={18} height={14} rx={2} />
          <Path d="m4 7 8 6 8-6" />
        </G>
      );
    case 'box':
      return <Path {...s} d="M4 8l8-4 8 4v8l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v8" />;
    case 'chart':
      return <Path {...s} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />;
    case 'dots':
      return (
        <G fill={color}>
          <Circle cx={6} cy={12} r={1.8} />
          <Circle cx={12} cy={12} r={1.8} />
          <Circle cx={18} cy={12} r={1.8} />
        </G>
      );
    case 'copy':
      return (
        <G {...s}>
          <Rect x={9} y={9} width={11} height={11} rx={2} />
          <Path d="M5 15V6a2 2 0 0 1 2-2h8" />
        </G>
      );
    case 'open':
      return <Path {...s} d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />;
    case 'down':
      return <Path {...s} strokeWidth={2.2} d="m6 9 6 6 6-6" />;
    case 'chev':
      return <Path {...s} strokeWidth={2.2} d="m9 6 6 6-6 6" />;
    case 'link':
      return <Path {...s} d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />;
    case 'chat':
      return <Path {...s} d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Z" />;
    case 'shield':
      return <Path {...s} d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z" />;
    case 'moon':
      return <Path {...s} d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />;
    case 'close':
    case 'x':
      return <Path {...s} d="M6 6l12 12M18 6 6 18" />;
    case 'trash':
      return <Path {...s} d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />;
    case 'edit':
      return <Path {...s} d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />;
    case 'check':
      return <Path {...s} strokeWidth={2.4} d="m5 12 5 5 9-10" />;
  }
}

export const kindIcon = (kind: string): IconName =>
  ({ database: 'db', hosting: 'cloud', repo: 'git', domain: 'globe', payments: 'card', email: 'mail', storage: 'box', analytics: 'chart' } as Record<string, IconName>)[kind] ??
  'dots';

/** The KriosityOps mark: a tiny status board, two apps healthy and one due. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={8} fill="#14213D" />
      <Circle cx={9.5} cy={10} r={2.4} fill="#16A36A" />
      <Rect x={14} y={8.6} width={11} height={2.8} rx={1.4} fill="#FFFFFF" />
      <Circle cx={9.5} cy={16} r={2.4} fill="#16A36A" />
      <Rect x={14} y={14.6} width={8} height={2.8} rx={1.4} fill="#FFFFFF" />
      <Circle cx={9.5} cy={22} r={2.4} fill="#F5A524" />
      <Rect x={14} y={20.6} width={10} height={2.8} rx={1.4} fill="#FFFFFF" />
    </Svg>
  );
}
