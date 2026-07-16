import { argbFromRgb } from './argb-from-rgb';
import { delinearized } from './delinearized';

/**
 * Converts a color from linear RGB components to ARGB format.
 */
export function argbFromLinrgb(linrgb) {
  var r = delinearized(linrgb[0]);
  var g = delinearized(linrgb[1]);
  var b = delinearized(linrgb[2]);
  return argbFromRgb(r, g, b);
}