import tokens from '../artifacts/token-names';
export function reduceTokenMap(tokenMap, themeRamp) {
  return Object.entries(tokenMap).reduce((acc, [key, value]) => {
    const cssVar = tokens[key];
    return cssVar ? `${acc}\n  ${cssVar}: ${typeof value === 'string' ? value : themeRamp[value]};` : acc;
  }, '');
}