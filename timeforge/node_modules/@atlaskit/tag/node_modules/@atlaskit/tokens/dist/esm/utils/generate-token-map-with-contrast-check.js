import _defineProperty from "@babel/runtime/helpers/defineProperty";
import _slicedToArray from "@babel/runtime/helpers/slicedToArray";
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
import { additionalContrastChecker } from './additional-contrast-checker';
import { generateColors } from './generate-colors';
import { generateTokenMap } from './generate-token-map';
export var generateTokenMapWithContrastCheck = function generateTokenMapWithContrastCheck(brandColor, mode, themeRamp) {
  var colors = themeRamp || generateColors(brandColor).ramp;
  var tokenMaps = generateTokenMap(brandColor, mode, colors);
  var result = {};
  Object.entries(tokenMaps).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      mode = _ref2[0],
      map = _ref2[1];
    if (mode === 'light' || mode === 'dark') {
      result[mode] = _objectSpread(_objectSpread({}, map), additionalContrastChecker({
        customThemeTokenMap: map,
        mode: mode,
        themeRamp: colors
      }));
    }
  });
  return result;
};