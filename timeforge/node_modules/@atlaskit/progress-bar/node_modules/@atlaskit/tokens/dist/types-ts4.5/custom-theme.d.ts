import { type ThemeOptionsSchema, type ThemeState } from './theme-config';
export declare const CUSTOM_STYLE_ELEMENTS_SIZE_THRESHOLD = 10;
export declare function loadAndAppendCustomThemeCss(themeState: Partial<ThemeState> & {
    UNSAFE_themeOptions: ThemeOptionsSchema;
}): void;
export { getCustomThemeStyles } from './get-custom-theme-styles';
