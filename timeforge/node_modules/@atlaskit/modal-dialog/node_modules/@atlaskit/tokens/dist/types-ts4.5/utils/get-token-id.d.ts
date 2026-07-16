/**
 * Transforms a style dictionary token path to a shorthand token id
 * These ids will be typically be how tokens are interacted with via typescript and css
 *
 * All [default] key words will be omitted from the path
 *
 * @example <caption>Passing a path as an array</caption>
 * // Returns color.background.bold
 * getTokenId(['color', 'background', 'bold', '[default]'])
 *
 * @example <caption>Passing a path as a string</caption>
 * // Returns color.background.bold
 * getTokenId('color.background.bold.[default]')
 */
export declare const getTokenId: (path: string | string[]) => string;
