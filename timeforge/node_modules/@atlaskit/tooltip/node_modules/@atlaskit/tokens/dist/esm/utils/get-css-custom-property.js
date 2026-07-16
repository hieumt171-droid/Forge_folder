import _toConsumableArray from "@babel/runtime/helpers/toConsumableArray";
import { CSS_PREFIX, CSS_VAR_FULL } from '../constants';

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
export var getCSSCustomProperty = function getCSSCustomProperty(path) {
  var normalizedPath = typeof path === 'string' ? path.split('.') : path;

  // Opacity and other 'shallow' groups are more readable when not trimmed
  var slice = CSS_VAR_FULL.includes(normalizedPath[0]) ? 0 : 1;
  return "--".concat([CSS_PREFIX].concat(_toConsumableArray(normalizedPath.slice(slice))).filter(function (el) {
    return el !== '[default]';
  }).join('-'));
};