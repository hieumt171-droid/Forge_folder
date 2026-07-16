export declare const getTokenUsageGuidelines: (tokenId: string) => {
    usage: string;
    cssProperties: string[];
};
/**
 * Types of tokens. Using path.subpath notation.
 */
export type TokenCategory = 'color.text' | 'color.link' | 'color.icon' | 'color.border' | 'color.background' | 'color.blanket' | 'color.interaction' | 'color.skeleton' | 'color.chart' | 'elevation.surface' | 'elevation.shadow' | 'opacity' | 'utility' | 'space' | 'font.heading' | 'font.body' | 'font.metric' | 'font.code' | 'font.weight' | 'font.family' | 'font.lineHeight' | 'radius' | 'border.width';
