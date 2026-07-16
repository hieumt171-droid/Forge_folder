/**
 * Returns the alpha component of a color in ARGB format.
 */
export function alphaFromArgb(argb) {
  return argb >> 24 & 255;
}