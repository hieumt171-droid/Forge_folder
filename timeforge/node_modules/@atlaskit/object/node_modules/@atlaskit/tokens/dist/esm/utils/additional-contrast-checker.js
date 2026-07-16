import tokenValuesDark from '../artifacts/atlassian-dark-token-value-for-contrast-check';
import tokenValuesLight from '../artifacts/atlassian-light-token-value-for-contrast-check';
import { additionalChecks } from './custom-theme-token-contrast-check';
import { getContrastRatio } from './get-contrast-ratio';
var getColorFromTokenRaw = function getColorFromTokenRaw(tokenName, mode) {
  return mode === 'light' ? tokenValuesLight[tokenName] : tokenValuesDark[tokenName];
};
export var additionalContrastChecker = function additionalContrastChecker(_ref) {
  var customThemeTokenMap = _ref.customThemeTokenMap,
    mode = _ref.mode,
    themeRamp = _ref.themeRamp;
  var updatedCustomThemeTokenMap = {};
  var brandTokens = Object.keys(customThemeTokenMap);
  additionalChecks.forEach(function (pairing) {
    var backgroundLight = pairing.backgroundLight,
      backgroundDark = pairing.backgroundDark,
      foreground = pairing.foreground,
      desiredContrast = pairing.desiredContrast,
      updatedTokens = pairing.updatedTokens;
    var background = mode === 'light' ? backgroundLight : backgroundDark;
    var foregroundTokenValue = customThemeTokenMap[foreground];
    var backgroundTokenValue = customThemeTokenMap[background];
    var foregroundColor = brandTokens.includes(foreground) ? typeof foregroundTokenValue === 'string' ? foregroundTokenValue : themeRamp[foregroundTokenValue] : getColorFromTokenRaw(foreground, mode);
    var backgroundColor = brandTokens.includes(background) ? typeof backgroundTokenValue === 'string' ? backgroundTokenValue : themeRamp[backgroundTokenValue] : getColorFromTokenRaw(background, mode);
    var contrast = getContrastRatio(foregroundColor, backgroundColor);
    if (contrast <= desiredContrast) {
      updatedTokens.forEach(function (token) {
        var rampValue = customThemeTokenMap[token];
        if (typeof rampValue === 'number') {
          updatedCustomThemeTokenMap[token] = mode === 'light' ? rampValue + 1 : rampValue - 1;
        }
      });
    }
  });
  return updatedCustomThemeTokenMap;
};