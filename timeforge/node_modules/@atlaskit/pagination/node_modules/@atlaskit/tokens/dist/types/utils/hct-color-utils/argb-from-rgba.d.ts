import type { Rgba } from './rgba';
/**
 * Return int32 color from a given RGBA component
 *
 * @param rgba RGBA representation of a int32 color.
 * @returns ARGB representation of a int32 color.
 */
export declare function argbFromRgba({ r, g, b, a }: Rgba): number;
