# Font System Documentation

## Overview

The Talk to August app uses two custom font families:

1. **Larsseit** (Body font) - Used for most text content
2. **Recoleta** (Header font) - Used for headings and emphasis

## Font Files

### Larsseit (Body Font)
Located in `assets/fonts/bodyfont/`:
- `Larsseit_Regular.ttf` - Regular weight
- `LarsseitMedium.otf` - Medium weight  
- `LarsseitBold.otf` - Bold weight
- `LarsseitExtraBold.otf` - Extra bold weight
- `LarsseitBoldItalic.otf` - Bold italic
- `LarsseitMediumItalic.otf` - Medium italic
- `LarsseitExtraBoldItalic.otf` - Extra bold italic

### Recoleta (Header Font)
Located in `assets/fonts/headerfont/`:
- `Recoleta Regular.otf` - Regular weight
- `Recoleta Medium.otf` - Medium weight
- `Recoleta SemiBold.otf` - Semi-bold weight
- `Recoleta Bold.otf` - Bold weight
- `Recoleta Black.otf` - Black weight
- `Recoleta Light.otf` - Light weight
- `Recoleta Thin.otf` - Thin weight

Plus Recoleta Alt variants with the same weights.

## Usage

### Method 1: Direct Font Family (Current Method)
Most screens currently use this approach:

```typescript
const styles = StyleSheet.create({
  text: {
    fontFamily: "Larsseit", // This will load Larsseit Regular
    fontSize: 16,
    fontWeight: "500", // React Native font weight
  },
});
```

### Method 2: Using Font Utilities (Recommended for New Code)
Import and use the font utilities for better type safety:

```typescript
import { getFontFamily, defaultFonts } from '../utils/fonts';

const styles = StyleSheet.create({
  bodyText: {
    fontFamily: defaultFonts.body, // Larsseit Regular
    fontSize: 16,
  },
  headerText: {
    fontFamily: defaultFonts.header, // Recoleta Regular
    fontSize: 24,
  },
  boldText: {
    fontFamily: getFontFamily('larsseit', 'bold'), // LarsseitBold
    fontSize: 16,
  },
  semiBoldHeader: {
    fontFamily: getFontFamily('recoleta', 'semibold'), // Recoleta SemiBold
    fontSize: 20,
  },
});
```

### Available Font Weights
The `getFontFamily` function accepts these weight values:
- `'300'` or `'light'`
- `'400'`, `'normal'`, or `'regular'` (default)
- `'500'` or `'medium'`
- `'600'` or `'semibold'`
- `'700'` or `'bold'`
- `'800'` or `'extrabold'`
- `'900'` or `'black'`

## Font Loading

Fonts are automatically loaded when the app starts using:
- `src/hooks/useFonts.ts` - Custom hook for loading fonts
- `App.tsx` - Shows loading screen while fonts load
- `app.config.js` - Lists all font files for Expo

## Typography Guidelines

### Body Text (Larsseit)
- Regular body text: Larsseit Regular
- Emphasized text: Larsseit Medium
- Strong emphasis: Larsseit Bold
- Buttons and calls-to-action: Larsseit Medium/Bold

### Headers (Recoleta)
- Main headings: Recoleta Bold/Black
- Subheadings: Recoleta Medium/SemiBold
- Section titles: Recoleta Regular/Medium

## Troubleshooting

### Fonts Not Loading
1. Check that font files exist in `assets/fonts/`
2. Verify font names in `src/hooks/useFonts.ts`
3. Ensure `app.config.js` lists all font files
4. Clear Metro cache: `npx expo start --clear`

### Font Not Displaying
1. Check font family name spelling
2. Verify the font was loaded in `useFonts` hook
3. Check console for font loading errors
4. Fallback to system fonts if custom fonts fail

## Adding New Fonts

1. Add font files to appropriate directory in `assets/fonts/`
2. Update `src/hooks/useFonts.ts` to include new fonts
3. Update `app.config.js` fonts array
4. Update `src/utils/fonts.ts` type definitions and mappings
5. Clear cache and restart app 