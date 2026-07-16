import { alphaFromArgb } from './alpha-from-argb';
import { blueFromArgb } from './blue-from-argb';
import { greenFromArgb } from './green-from-argb';
import { redFromArgb } from './red-from-argb';
/**
 * Return RGBA from a given int32 color
 *
 * @param argb ARGB representation of a int32 color.
 * @return RGBA representation of a int32 color.
 */
export function rgbaFromArgb(argb) {
  var r = redFromArgb(argb);
  var g = greenFromArgb(argb);
  var b = blueFromArgb(argb);
  var a = alphaFromArgb(argb);
  return {
    r: r,
    g: g,
    b: b,
    a: a
  };
}