import tokenValuesDark from '../artifacts/atlassian-dark-token-value-for-contrast-check';
import tokenValuesLight from '../artifacts/atlassian-light-token-value-for-contrast-check';
import { additionalChecks } from './custom-theme-token-contrast-check';
import { getContrastRatio } from './get-contrast-ratio';
const getColorFromTokenRaw = (tokenName, mode) => {
  return mode === 'light' ? tokenValuesLight[tokenName] : tokenValuesDark[tokenName];
};
export const additionalContrastChecker = ({
  customThemeTokenMap,
  mode,
  themeRamp
}) => {
  const updatedCustomThemeTokenMap = {};
  const brandTokens = Object.keys(customThemeTokenMap);
  additionalChecks.forEach(pairing => {
    const {
      backgroundLight,
      backgroundDark,
      foreground,
      desiredContrast,
      updatedTokens
    } = pairing;
    const background = mode === 'light' ? backgroundLight : backgroundDark;
    const foregroundTokenValue = customThemeTokenMap[foreground];
    const backgroundTokenValue = customThemeTokenMap[background];
    const foregroundColor = brandTokens.includes(foreground) ? typeof foregroundTokenValue === 'string' ? foregroundTokenValue : themeRamp[foregroundTokenValue] : getColorFromTokenRaw(foreground, mode);
    const backgroundColor = brandTokens.includes(background) ? typeof backgroundTokenValue === 'string' ? backgroundTokenValue : themeRamp[backgroundTokenValue] : getColorFromTokenRaw(background, mode);
    const contrast = getContrastRatio(foregroundColor, backgroundColor);
    if (contrast <= desiredContrast) {
      updatedTokens.forEach(token => {
        const rampValue = customThemeTokenMap[token];
        if (typeof rampValue === 'number') {
          updatedCustomThemeTokenMap[token] = mode === 'light' ? rampValue + 1 : rampValue - 1;
        }
      });
    }
  });
  return updatedCustomThemeTokenMap;
};