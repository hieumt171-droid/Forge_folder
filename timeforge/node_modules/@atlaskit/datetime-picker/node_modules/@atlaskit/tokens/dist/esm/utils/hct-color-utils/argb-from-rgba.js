import { clampComponent } from './clamp-component';
/**
 * Return int32 color from a given RGBA component
 *
 * @param rgba RGBA representation of a int32 color.
 * @returns ARGB representation of a int32 color.
 */
export function argbFromRgba(_ref) {
  var r = _ref.r,
    g = _ref.g,
    b = _ref.b,
    a = _ref.a;
  var rValue = clampComponent(r);
  var gValue = clampComponent(g);
  var bValue = clampComponent(b);
  var aValue = clampComponent(a);
  return aValue << 24 | rValue << 16 | gValue << 8 | bValue;
}