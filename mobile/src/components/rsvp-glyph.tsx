import Svg, { Circle, Path } from 'react-native-svg';

// Quiet line icons for the RSVP states — replaces the emoji so the control
// reads as a designed affordance, not a sticker. One stroke, one size.
export function RsvpGlyph({ status, color, size = 22 }: { status: 'going' | 'maybe' | 'declined'; color: string; size?: number }) {
  const common = { stroke: color, strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {status === 'going' ? (
        <Path d="M20 6 9 17l-5-5" {...common} />
      ) : status === 'maybe' ? (
        <>
          <Path d="M9 9a3 3 0 1 1 4.2 2.75c-.9.5-1.2 1-1.2 1.75" {...common} />
          <Circle cx={12} cy={17} r={0.6} stroke={color} strokeWidth={1.6} fill={color} />
        </>
      ) : (
        <Path d="M6 6l12 12M18 6 6 18" {...common} />
      )}
    </Svg>
  );
}
