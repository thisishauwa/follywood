import { Platform } from 'react-native';

// Font family type definitions
interface LarsseitFonts {
  regular: string;
  medium: string;
  bold: string;
  extraBold: string;
}

interface RecoletaFonts {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
  black: string;
}

// Font family mappings for different platforms
export const fonts = {
  // Body font family (Larsseit)
  larsseit: {
    regular: Platform.select({
      ios: 'Larsseit_Regular',
      android: 'Larsseit_Regular',
      default: 'Larsseit_Regular',
    }),
    medium: Platform.select({
      ios: 'LarsseitMedium',
      android: 'LarsseitMedium',
      default: 'LarsseitMedium',
    }),
    bold: Platform.select({
      ios: 'LarsseitBold',
      android: 'LarsseitBold',
      default: 'LarsseitBold',
    }),
    extraBold: Platform.select({
      ios: 'LarsseitExtraBold',
      android: 'LarsseitExtraBold',
      default: 'LarsseitExtraBold',
    }),
  } as LarsseitFonts,
  
  // Header font family (Recoleta)
  recoleta: {
    regular: Platform.select({
      ios: 'Recoleta Regular',
      android: 'Recoleta Regular',
      default: 'Recoleta Regular',
    }),
    medium: Platform.select({
      ios: 'Recoleta Medium',
      android: 'Recoleta Medium',
      default: 'Recoleta Medium',
    }),
    semiBold: Platform.select({
      ios: 'Recoleta SemiBold',
      android: 'Recoleta SemiBold',
      default: 'Recoleta SemiBold',
    }),
    bold: Platform.select({
      ios: 'Recoleta Bold',
      android: 'Recoleta Bold',
      default: 'Recoleta Bold',
    }),
    black: Platform.select({
      ios: 'Recoleta Black',
      android: 'Recoleta Black',
      default: 'Recoleta Black',
    }),
  } as RecoletaFonts,
};

// Helper function to get font family based on weight
export const getFontFamily = (family: 'larsseit' | 'recoleta', weight: string = 'regular'): string => {
  if (family === 'larsseit') {
    const fontFamily = fonts.larsseit;
    switch (weight) {
      case '300':
      case 'light':
        return fontFamily.regular;
      case '400':
      case 'normal':
      case 'regular':
        return fontFamily.regular;
      case '500':
      case 'medium':
        return fontFamily.medium;
      case '600':
      case 'semibold':
        return fontFamily.medium;
      case '700':
      case 'bold':
        return fontFamily.bold;
      case '800':
      case 'extrabold':
        return fontFamily.extraBold;
      case '900':
      case 'black':
        return fontFamily.extraBold;
      default:
        return fontFamily.regular;
    }
  } else {
    const fontFamily = fonts.recoleta;
    switch (weight) {
      case '300':
      case 'light':
        return fontFamily.regular;
      case '400':
      case 'normal':
      case 'regular':
        return fontFamily.regular;
      case '500':
      case 'medium':
        return fontFamily.medium;
      case '600':
      case 'semibold':
        return fontFamily.semiBold;
      case '700':
      case 'bold':
        return fontFamily.bold;
      case '800':
      case 'extrabold':
        return fontFamily.bold;
      case '900':
      case 'black':
        return fontFamily.black;
      default:
        return fontFamily.regular;
    }
  }
};

// Default font families for easy import
export const defaultFonts = {
  body: fonts.larsseit.regular,
  bodyMedium: fonts.larsseit.medium,
  bodyBold: fonts.larsseit.bold,
  header: fonts.recoleta.regular,
  headerMedium: fonts.recoleta.medium,
  headerBold: fonts.recoleta.bold,
}; 