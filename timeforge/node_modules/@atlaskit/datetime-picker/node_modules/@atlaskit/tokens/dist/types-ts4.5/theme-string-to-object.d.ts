import type { ThemeState } from './theme-config';
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
export declare const themeStringToObject: (themeState: string) => Partial<ThemeState>;
