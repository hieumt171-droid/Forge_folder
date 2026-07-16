import { type ShadowToken } from '../types';
/**
 * Returns a box shadow formatted for CSS from a ShadowToken raw value.
 *
 * @param rawShadow - ShadowToken raw value
 */
export declare const getBoxShadow: (rawShadow: ShadowToken<string>["value"]) => string;
export { hexToRGBAValues } from './hex-to-rgba-values';
