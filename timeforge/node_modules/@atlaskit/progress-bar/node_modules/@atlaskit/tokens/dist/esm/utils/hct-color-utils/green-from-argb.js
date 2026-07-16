/**
 * Returns the green component of a color in ARGB format.
 */
export function greenFromArgb(argb) {
  return argb >> 8 & 255;
}