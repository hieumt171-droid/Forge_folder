import type { ThemeState } from './theme-state';
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
export declare const themeObjectToString: (themeState: Partial<ThemeState>) => string;
