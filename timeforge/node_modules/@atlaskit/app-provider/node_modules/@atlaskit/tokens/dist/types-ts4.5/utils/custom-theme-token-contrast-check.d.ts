import type tokens from '../artifacts/token-names';
type Token = keyof typeof tokens;
interface AdditionalContrastCheck {
    foreground: Token;
    backgroundLight: Token;
    backgroundDark: Token;
    desiredContrast: number;
    updatedTokens: Token[];
}
export declare const additionalChecks: AdditionalContrastCheck[];
export {};
