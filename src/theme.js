// ── מסה · IRON SURPLUS ───────────────────────────────────────────────────────
// Brutalist-athletic strength aesthetic: warm cast-iron surfaces, bone type,
// and a high-energy fuel system — volt-green (protein / action) + molten-amber
// (calories). Oversized heavy numerals are the hero.

export const colors = {
  // base — cast iron, warm undertone
  bg: '#14110C',
  bgElev: '#1B1710',
  card: '#221D15',
  cardAlt: '#2A2419',
  surface3: '#332C1F',
  border: '#3C3324',
  borderSoft: '#2A2417',

  // text — bone
  text: '#F4EEE0',
  textDim: '#A99E86',
  textFaint: '#8A8068',
  ink: '#0E0B06', // text on bright accents

  // energy
  volt: '#CDF53D', // protein + primary action
  voltDeep: '#9FBE2B',
  voltGlow: 'rgba(205,245,61,0.14)',
  amber: '#FF7A2F', // calories
  amberDeep: '#D85F1C',
  amberGlow: 'rgba(255,122,47,0.16)',
  ember: '#FF4A37', // over goal / danger
};

// Font family keys map to @expo-google-fonts exports loaded in App.js.
export const fonts = {
  display: 'SecularOne_400Regular', // heavy geometric display (Hebrew + Latin)
  light: 'Heebo_300Light',
  regular: 'Heebo_400Regular',
  medium: 'Heebo_500Medium',
  bold: 'Heebo_700Bold',
  extrabold: 'Heebo_800ExtraBold',
  black: 'Heebo_900Black',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const space = (n) => n * 4;

// Reusable text presets.
export const type = {
  overline: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.textDim,
  },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.text },
  heading: { fontFamily: fonts.display, fontSize: 21, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  bodyDim: { fontFamily: fonts.regular, fontSize: 14, color: colors.textDim },
};
