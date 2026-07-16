import { COLOR_MODE_ATTRIBUTE, CUSTOM_THEME_ATTRIBUTE } from './constants';
import { themeStateDefaults } from './theme-config';
import { generateColors } from './utils/generate-colors';
import { generateTokenMapWithContrastCheck } from './utils/generate-token-map-with-contrast-check';
import { hash } from './utils/hash';
import { reduceTokenMap } from './utils/reduce-token-map';

/**
 * Takes a color mode and custom branding options, and returns an array of objects for use in applying custom styles to the document head.
 * Only supplies the color themes necessary for initial render, based on the current themeState. I.e. if in light mode, dark mode themes are not returned.
 *
 * @param {Object<string, string>} themeState The themes and color mode that should be applied.
 * @param {string} themeState.colorMode Determines which color theme is applied
 * @param {Object} themeState.UNSAFE_themeOptions The custom branding options to be used for custom theme generation
 *
 * @returns An object array, containing theme IDs, data-attributes to attach to the theme, and the theme CSS.
 * If an error is encountered while loading themes, the themes array will be empty.
 */
export function getCustomThemeStyles(themeState) {
  var _themeState$UNSAFE_th;
  var brandColor = themeState === null || themeState === void 0 || (_themeState$UNSAFE_th = themeState.UNSAFE_themeOptions) === null || _themeState$UNSAFE_th === void 0 ? void 0 : _themeState$UNSAFE_th.brandColor;
  var mode = (themeState === null || themeState === void 0 ? void 0 : themeState.colorMode) || themeStateDefaults['colorMode'];
  var optionString = JSON.stringify(themeState === null || themeState === void 0 ? void 0 : themeState.UNSAFE_themeOptions);
  var uniqueId = hash(optionString);
  var themeRamp = generateColors(brandColor).ramp;

  // outputs object to generate to CSS from
  var themes = [];
  var tokenMaps = generateTokenMapWithContrastCheck(brandColor, mode, themeRamp);
  if ((mode === 'light' || mode === 'auto') && tokenMaps.light) {
    // Light mode theming
    themes.push({
      id: 'light',
      attrs: {
        'data-theme': 'light',
        'data-custom-theme': uniqueId
      },
      css: "\nhtml[".concat(CUSTOM_THEME_ATTRIBUTE, "=\"").concat(uniqueId, "\"][").concat(COLOR_MODE_ATTRIBUTE, "=\"light\"][data-theme~=\"light:light\"] {\n  /* Branded tokens */\n    ").concat(reduceTokenMap(tokenMaps.light, themeRamp), "\n}")
    });
  }
  if ((mode === 'dark' || mode === 'auto') && tokenMaps.dark) {
    // Dark mode theming
    themes.push({
      id: 'dark',
      attrs: {
        'data-theme': 'dark',
        'data-custom-theme': uniqueId
      },
      css: "\nhtml[".concat(CUSTOM_THEME_ATTRIBUTE, "=\"").concat(uniqueId, "\"][").concat(COLOR_MODE_ATTRIBUTE, "=\"dark\"][data-theme~=\"dark:dark\"] {\n  /* Branded tokens */\n    ").concat(reduceTokenMap(tokenMaps.dark, themeRamp), "\n}")
    });
  }
  return themes;
}