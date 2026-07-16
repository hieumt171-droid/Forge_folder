import { type ThemeIdsWithOverrides } from '../theme-config';
export declare const loadAndAppendThemeCss: (themeId: ThemeIdsWithOverrides) => Promise<void>;
export declare const darkModeMediaQuery = "(prefers-color-scheme: dark)";
export declare const moreContrastMediaQuery = "(prefers-contrast: more)";
export { loadThemeCss } from './load-theme-css';
