import _slicedToArray from "@babel/runtime/helpers/slicedToArray";
import tokens from '../artifacts/token-names';
export function reduceTokenMap(tokenMap, themeRamp) {
  return Object.entries(tokenMap).reduce(function (acc, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      key = _ref2[0],
      value = _ref2[1];
    var cssVar = tokens[key];
    return cssVar ? "".concat(acc, "\n  ").concat(cssVar, ": ").concat(typeof value === 'string' ? value : themeRamp[value], ";") : acc;
  }, '');
}