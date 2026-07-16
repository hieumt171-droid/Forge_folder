/**
 * Returns the red component of a color in ARGB format.
 */
export function redFromArgb(argb) {
  return argb >> 16 & 255;
}