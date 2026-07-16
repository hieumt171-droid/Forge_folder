import { hexToRGBAValues } from './hex-to-rgba-values';
/**
 * Returns a box shadow formatted for CSS from a ShadowToken raw value.
 *
 * @param rawShadow - ShadowToken raw value
 */
export var getBoxShadow = function getBoxShadow(rawShadow) {
  return rawShadow.map(function (_ref) {
    var radius = _ref.radius,
      offset = _ref.offset,
      color = _ref.color,
      opacity = _ref.opacity;
    var _hexToRGBAValues = hexToRGBAValues(color),
      r = _hexToRGBAValues.r,
      g = _hexToRGBAValues.g,
      b = _hexToRGBAValues.b;
    return "".concat(offset.x, "px ").concat(offset.y, "px ").concat(radius, "px rgba(").concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(opacity, ")");
  }).join(',');
};
export { hexToRGBAValues } from './hex-to-rgba-values';