import { argbFromRgb } from './argb-from-rgb';
import { delinearized } from './delinearized';
import { yFromLstar } from './y-from-lstar';

/**
 * Converts an L* value to an ARGB representation.
 *
 * @param lstar L* in L*a*b*
 * @return ARGB representation of grayscale color with lightness
 * matching L*
 */
export function argbFromLstar(lstar) {
  var y = yFromLstar(lstar);
  var component = delinearized(y);
  return argbFromRgb(component, component, component);
}