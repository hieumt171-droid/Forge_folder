import { type ThemeColorModes, type ThemeOptionsSchema } from '../theme-config';
type ThemeAttributeId = 'light' | 'dark';
export declare function findMissingCustomStyleElements(UNSAFE_themeOptions: ThemeOptionsSchema, mode: ThemeColorModes): ThemeAttributeId[];
export {};
