/**
 * Transforms a style dictionary token path to a CSS custom property.
 *
 * A css prefix will be prepended and all [default] key words will be omitted
 * from the path
 *
 * @example <caption>Passing a path as an array</caption>
 * // Returns ds-background-bold
 * getCSSCustomProperty(['color', 'background', 'bold', '[default]'])
 *
 * @example <caption>Passing a path as a string</caption>
 * // Returns ds-background-bold
 * getCSSCustomProperty('color.background.bold.[default]')
 */
export declare const getCSSCustomProperty: (path: string | string[]) => string;
