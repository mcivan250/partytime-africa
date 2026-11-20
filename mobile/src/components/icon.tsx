import Svg, { Circle, Path } from 'react-native-svg';

// A small, consistent line-icon set (one stroke, one size) so the app can drop
// emoji from its chrome. lucide-style geometry. Icons take their colour from
// the caller and default to the secondary text role.
export type IconName =
  | 'search' | 'spark' | 'flame' | 'chat' | 'message' | 'bell' | 'glass'
  | 'compass' | 'user' | 'users' | 'ticket';

export function Icon({ name, size = 18, color = '#8FA895', strokeWidth = 1.6 }: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'search' ? (
        <>
          <Circle cx={11} cy={11} r={7} {...p} />
          <Path d="M21 21l-4.3-4.3" {...p} />
        </>
      ) : name === 'spark' ? (
        <Path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" {...p} />
      ) : name === 'flame' ? (
        <Path d="M12 3c2.5 3 4 5 4 8a4 4 0 0 1-8 0c0-1 .4-1.9 1-2.6C9 10 10.5 9 12 9c-1-2-.8-4 0-6z" {...p} />
      ) : name === 'chat' ? (
        <Path d="M21 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19l1.1-3.6A7.5 7.5 0 1 1 21 11.5z" {...p} />
      ) : name === 'message' ? (
        <Path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" {...p} />
      ) : name === 'bell' ? (
        <>
          <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" {...p} />
          <Path d="M10.5 20a1.8 1.8 0 0 0 3 0" {...p} />
        </>
      ) : name === 'compass' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8z" {...p} />
        </>
      ) : name === 'user' ? (
        <>
          <Circle cx={12} cy={8} r={3.6} {...p} />
          <Path d="M5 20c1.4-3.4 4.2-5 7-5s5.6 1.6 7 5" {...p} />
        </>
      ) : name === 'users' ? (
        <>
          <Circle cx={10} cy={8} r={3.2} {...p} />
          <Path d="M4 19c0-2.8 2.7-5 6-5s6 2.2 6 5" {...p} />
          <Path d="M17 7.2a2.6 2.6 0 0 1 0 5.1M18.5 19c0-2-1-3.6-2.8-4.4" {...p} />
        </>
      ) : name === 'ticket' ? (
        <>
          <Path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" {...p} />
          <Path d="M14 7.5v9" {...p} strokeDasharray="1.5 2.5" />
        </>
      ) : (
        <>
          <Path d="M5 4h14l-6 7v6" {...p} />
          <Path d="M9 21h6" {...p} />
        </>
      )}
    </Svg>
  );
}
