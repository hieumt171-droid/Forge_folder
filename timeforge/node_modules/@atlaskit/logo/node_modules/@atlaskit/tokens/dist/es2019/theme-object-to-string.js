import { isColorMode } from './is-color-mode';
import { isThemeIds } from './is-theme-ids';
import { isThemeKind } from './is-theme-kind';
const customThemeOptions = 'UNSAFE_themeOptions';

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
export const themeObjectToString = themeState => Object.entries(themeState).reduce((themeString, [kind, id]) => {
  if (
  // colorMode theme state
  kind === 'colorMode' && typeof id === 'string' && isColorMode(id) ||
  // custom theme state
  kind === customThemeOptions && typeof id === 'object' ||
  // other theme states
  isThemeKind(kind) && typeof id === 'string' && isThemeIds(id)) {
    return themeString + `${themeString ? ' ' : ''}` + `${kind}:${typeof id === 'object' ? JSON.stringify(id) : id}`;
  }
  return themeString;
}, '');