declare const themeKinds: readonly ["light", "dark", "spacing", "typography", "shape", "motion"];
type ThemeKind = (typeof themeKinds)[number];
export declare const isThemeKind: (themeKind: string) => themeKind is ThemeKind;
export {};
