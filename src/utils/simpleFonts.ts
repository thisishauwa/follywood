import { Platform } from 'react-native';

// Font family constants that match the fonts loaded in App.tsx
export const FONTS = {
  // Body text fonts (Larsseit family) - exactly as loaded in App.tsx
  BODY_REGULAR: 'Larsseit_Regular',
  BODY_MEDIUM: 'LarsseitMedium', 
  BODY_BOLD: 'LarsseitBold',
  BODY_EXTRA_BOLD: 'LarsseitExtraBold',
  BODY_BOLD_ITALIC: 'LarsseitBoldItalic',
  BODY_MEDIUM_ITALIC: 'LarsseitMediumItalic',
  BODY_EXTRA_BOLD_ITALIC: 'LarsseitExtraBoldItalic',
  
  // Header fonts (Recoleta family) - exactly as loaded in App.tsx
  HEADER_REGULAR: 'Recoleta Regular',
  HEADER_MEDIUM: 'Recoleta Medium',
  HEADER_SEMIBOLD: 'Recoleta SemiBold',
  HEADER_BOLD: 'Recoleta Bold',
  HEADER_LIGHT: 'Recoleta Light',
  HEADER_THIN: 'Recoleta Thin',
  HEADER_BLACK: 'Recoleta Black',
  
  // Header Alt fonts (Recoleta Alt family)
  HEADER_ALT_REGULAR: 'Recoleta Alt Regular',
  HEADER_ALT_MEDIUM: 'Recoleta Alt Medium',
  HEADER_ALT_SEMIBOLD: 'Recoleta Alt SemiBold',
  HEADER_ALT_BOLD: 'Recoleta Alt Bold',
  HEADER_ALT_LIGHT: 'Recoleta Alt Light',
  HEADER_ALT_THIN: 'Recoleta Alt Thin',
  HEADER_ALT_BLACK: 'Recoleta Alt Black',
  
  // Legacy compatibility for existing code
  LARSSEIT: 'Larsseit',
};

// Typography helper functions
export const typography = {
  body: (weight: 'regular' | 'medium' | 'bold' | 'extra-bold' = 'regular') => {
    switch (weight) {
      case 'medium':
        return FONTS.BODY_MEDIUM;
      case 'bold':
        return FONTS.BODY_BOLD;
      case 'extra-bold':
        return FONTS.BODY_EXTRA_BOLD;
      default:
        return FONTS.BODY_REGULAR;
    }
  },
  
  header: (weight: 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'black' = 'regular', alt: boolean = false) => {
    const prefix = alt ? 'HEADER_ALT_' : 'HEADER_';
    switch (weight) {
      case 'thin':
        return alt ? FONTS.HEADER_ALT_THIN : FONTS.HEADER_THIN;
      case 'light':
        return alt ? FONTS.HEADER_ALT_LIGHT : FONTS.HEADER_LIGHT;
      case 'medium':
        return alt ? FONTS.HEADER_ALT_MEDIUM : FONTS.HEADER_MEDIUM;
      case 'semibold':
        return alt ? FONTS.HEADER_ALT_SEMIBOLD : FONTS.HEADER_SEMIBOLD;
      case 'bold':
        return alt ? FONTS.HEADER_ALT_BOLD : FONTS.HEADER_BOLD;
      case 'black':
        return alt ? FONTS.HEADER_ALT_BLACK : FONTS.HEADER_BLACK;
      default:
        return alt ? FONTS.HEADER_ALT_REGULAR : FONTS.HEADER_REGULAR;
    }
  },
};

// Quick access presets
export const fontPresets = {
  // Most common body text combinations
  bodyText: FONTS.BODY_REGULAR,
  bodyMedium: FONTS.BODY_MEDIUM,
  bodyBold: FONTS.BODY_BOLD,
  buttonText: FONTS.BODY_MEDIUM,
  
  // Most common header combinations
  title: FONTS.HEADER_BOLD,
  subtitle: FONTS.HEADER_MEDIUM,
  heading: FONTS.HEADER_SEMIBOLD,
  display: FONTS.HEADER_BLACK,
  
  // Legacy support
  default: FONTS.LARSSEIT,
};

// Default export for easy use
export default FONTS; 