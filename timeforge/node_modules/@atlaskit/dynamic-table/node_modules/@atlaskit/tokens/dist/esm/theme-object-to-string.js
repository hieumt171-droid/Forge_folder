import _typeof from "@babel/runtime/helpers/typeof";
import _slicedToArray from "@babel/runtime/helpers/slicedToArray";
import { isColorMode } from './is-color-mode';
import { isThemeIds } from './is-theme-ids';
import { isThemeKind } from './is-theme-kind';
var customThemeOptions = 'UNSAFE_themeOptions';

/**
 * Converts a theme object to a string formatted for the `data-theme` HTML attribute.
 *
 * @param {object} themes The themes that should be applied.
 *
 * @example
 * ```
 * themeObjectToString({ dark: 'dark', light: 'light', spacing: 'spacing' });
 * // returns 'dark:dark light:light spacing:spacing'
 * ```
 */
export var themeObjectToString = function themeObjectToString(themeState) {
  return Object.entries(themeState).reduce(function (themeString, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      kind = _ref2[0],
      id = _ref2[1];
    if (
    // colorMode theme state
    kind === 'colorMode' && typeof id === 'string' && isColorMode(id) ||
    // custom theme state
    kind === customThemeOptions && _typeof(id) === 'object' ||
    // other theme states
    isThemeKind(kind) && typeof id === 'string' && isThemeIds(id)) {
      return themeString + "".concat(themeString ? ' ' : '') + "".concat(kind, ":").concat(_typeof(id) === 'object' ? JSON.stringify(id) : id);
    }
    return themeString;
  }, '');
};