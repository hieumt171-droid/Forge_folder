import tokens from '../artifacts/token-names';
type Token = keyof typeof tokens;
export declare function reduceTokenMap(tokenMap: {
    [key in Token]?: number | string;
}, themeRamp: string[]): string;
export {};
