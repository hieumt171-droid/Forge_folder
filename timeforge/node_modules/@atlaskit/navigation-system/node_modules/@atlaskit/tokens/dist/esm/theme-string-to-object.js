import _slicedToArray from "@babel/runtime/helpers/slicedToArray";
import { isColorMode } from './is-color-mode';
import { isThemeIds } from './is-theme-ids';
import { isThemeKind } from './is-theme-kind';
var customThemeOptions = 'UNSAFE_themeOptions';

/**
 * Converts a string that is formatted for the `data-theme` HTML attribute
 * to an object that can be passed to `setGlobalTheme`.
 *
 * @param {string} themes The themes that should be applied.
 *
 * @example
 * ```
 * themeStringToObject('dark:dark light:light spacing:spacing');
 * // returns { dark: 'dark', light: 'light', spacing: 'spacing' }
 * ```
 */
export var themeStringToObject = function themeStringToObject(themeState) {
  return themeState.split(' ')
  // @ts-ignore - TS1501 TypeScript 5.9.2 upgrade
  .map(function (theme) {
    return theme.split(/:([^]*)/);
  }).reduce(function (themeObject, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      kind = _ref2[0],
      id = _ref2[1];
    if (kind === 'colorMode' && isColorMode(id)) {
      themeObject[kind] = id;
    }
    if (isThemeKind(kind) && isThemeIds(id)) {
      // @ts-expect-error FIXME - this is a valid ts error
      themeObject[kind] = id;
    }
    if (kind === customThemeOptions) {
      try {
        themeObject[customThemeOptions] = JSON.parse(id);
      } catch (_unused) {
        new Error('Invalid custom theme string');
      }
    }
    return themeObject;
  }, {});
};