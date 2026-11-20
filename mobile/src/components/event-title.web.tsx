import { StyleSheet, type TextStyle } from 'react-native';

import { normalizeFx, type TitleFx } from '@/constants/title-effects';

// Web build gets the full treatment: gradient-filled text, sweeping shine,
// flicker, neon glow and twinkling sparkles — the living-invite feel Partiful
// is loved for, in Party Time's palette (no purple).
const STYLE_ID = 'pt-title-fx';

function ensureStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
  .pt-fx { position: relative; display: inline-block; font-family: 'Unbounded_900Black', var(--font-display), system-ui, sans-serif; }
  .pt-fx-glow { color: #EAFBF1; animation: ptGlow 2.4s ease-in-out infinite; }
  @keyframes ptGlow {
    0%,100% { text-shadow: 0 0 10px rgba(61,220,151,0.55), 0 0 22px rgba(61,220,151,0.30); }
    50%     { text-shadow: 0 0 18px rgba(61,220,151,0.95), 0 0 40px rgba(61,220,151,0.55); }
  }
  .pt-fx-chrome {
    background: linear-gradient(100deg,#8f9f95 0%,#ffffff 42%,#cdd8d1 50%,#ffffff 58%,#8f9f95 100%);
    background-size: 220% 100%;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation: ptChrome 3.6s linear infinite;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
  }
  @keyframes ptChrome { 0% { background-position: 0% 50%; } 100% { background-position: 220% 50%; } }
  .pt-fx-fire {
    background: linear-gradient(10deg,#FF2D1F 0%,#FF5A2C 32%,#FF9C3D 62%,#FFD24A 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation: ptFire 1.6s ease-in-out infinite;
    filter: drop-shadow(0 0 14px rgba(255,90,44,0.65));
  }
  @keyframes ptFire { 0%,100% { filter: drop-shadow(0 0 12px rgba(255,90,44,0.55)); } 50% { filter: drop-shadow(0 0 20px rgba(255,156,61,0.9)); } }
  .pt-fx-electric {
    background: linear-gradient(90deg,#FF3D6E 0%,#FF7AA0 50%,#FF3D6E 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation: ptElectric 1.1s ease-in-out infinite;
  }
  @keyframes ptElectric {
    0%,100% { filter: drop-shadow(0 0 8px rgba(255,61,110,0.6)); }
    50%     { filter: drop-shadow(0 0 20px rgba(255,61,110,1)) drop-shadow(0 0 34px rgba(255,61,110,0.5)); }
  }
  .pt-fx-sparkle { color: #FFF4CF; text-shadow: 0 0 14px rgba(212,175,55,0.55); }
  .pt-spark { position: absolute; color: #FFE08A; pointer-events: none; animation: ptTwinkle 1.5s ease-in-out infinite; }
  .pt-spark.s1 { top: -0.35em; left: -0.4em; font-size: 0.5em; animation-delay: 0s; }
  .pt-spark.s2 { top: 0.1em; right: -0.5em; font-size: 0.42em; animation-delay: 0.5s; }
  .pt-spark.s3 { bottom: -0.1em; left: 35%; font-size: 0.34em; animation-delay: 1s; }
  @keyframes ptTwinkle { 0%,100% { opacity: 0.25; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.15); } }
  @media (prefers-reduced-motion: reduce) {
    .pt-fx-glow,.pt-fx-chrome,.pt-fx-fire,.pt-fx-electric,.pt-spark { animation: none !important; }
  }
  `;
  document.head.appendChild(el);
}

const CLASS: Record<TitleFx, string> = {
  none: '',
  glow: 'pt-fx-glow',
  chrome: 'pt-fx-chrome',
  fire: 'pt-fx-fire',
  electric: 'pt-fx-electric',
  sparkle: 'pt-fx-sparkle',
};

export function EventTitle({
  title,
  fx,
  style,
}: {
  title: string;
  fx?: string | null;
  style?: TextStyle | TextStyle[];
}) {
  ensureStyles();
  const key = normalizeFx(fx);
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const px = (v: unknown) => (typeof v === 'number' ? `${v}px` : (v as string | undefined));

  const inline: React.CSSProperties = {
    fontSize: px(flat.fontSize) ?? '42px',
    lineHeight: px(flat.lineHeight) ?? '1.02',
    letterSpacing: px(flat.letterSpacing) ?? '-1px',
    color: key === 'none' ? (flat.color as string) ?? '#F2F7F1' : undefined,
    margin: 0,
    fontWeight: 900,
    display: 'inline-block',
  };

  return (
    <h1 className={`pt-fx ${CLASS[key]}`} style={inline}>
      {key === 'sparkle' ? (
        <>
          <span className="pt-spark s1">✦</span>
          <span className="pt-spark s2">✦</span>
          <span className="pt-spark s3">✦</span>
        </>
      ) : null}
      {title}
    </h1>
  );
}
