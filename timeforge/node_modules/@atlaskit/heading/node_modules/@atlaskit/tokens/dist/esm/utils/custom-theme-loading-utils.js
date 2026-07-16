import { CUSTOM_THEME_ATTRIBUTE, THEME_DATA_ATTRIBUTE } from '../constants';
import { hash } from './hash';
export function findMissingCustomStyleElements(UNSAFE_themeOptions, mode) {
  var optionString = JSON.stringify(UNSAFE_themeOptions);
  var uniqueId = hash(optionString);
  var attrOfMissingCustomStyles = [];
  (mode === 'auto' ? ['light', 'dark'] : [mode]).forEach(function (themeId) {
    var element = document.head.querySelector("style[".concat(CUSTOM_THEME_ATTRIBUTE, "=\"").concat(uniqueId, "\"][").concat(THEME_DATA_ATTRIBUTE, "=\"").concat(themeId, "\"]"));
    if (element) {
      // Append the existing custom styles to take precedence over others
      document.head.appendChild(element);
    } else {
      attrOfMissingCustomStyles.push(themeId);
    }
  });
  return attrOfMissingCustomStyles;
}