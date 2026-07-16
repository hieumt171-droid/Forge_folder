import { additionalContrastChecker } from './additional-contrast-checker';
import { generateColors } from './generate-colors';
import { generateTokenMap } from './generate-token-map';
export const generateTokenMapWithContrastCheck = (brandColor, mode, themeRamp) => {
  const colors = themeRamp || generateColors(brandColor).ramp;
  const tokenMaps = generateTokenMap(brandColor, mode, colors);
  const result = {};
  Object.entries(tokenMaps).forEach(([mode, map]) => {
    if (mode === 'light' || mode === 'dark') {
      result[mode] = {
        ...map,
        ...additionalContrastChecker({
          customThemeTokenMap: map,
          mode,
          themeRamp: colors
        })
      };
    }
  });
  return result;
};