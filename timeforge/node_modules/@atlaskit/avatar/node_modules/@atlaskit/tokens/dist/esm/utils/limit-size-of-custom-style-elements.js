import { CUSTOM_THEME_ATTRIBUTE, THEME_DATA_ATTRIBUTE } from '../constants';
export function limitSizeOfCustomStyleElements(sizeThreshold) {
  var styleTags = Array.from(document.head.querySelectorAll("style[".concat(CUSTOM_THEME_ATTRIBUTE, "][").concat(THEME_DATA_ATTRIBUTE, "]")));
  if (styleTags.length < sizeThreshold) {
    return;
  }
  styleTags.slice(0, styleTags.length - (sizeThreshold - 1)).forEach(function (element) {
    return element.remove();
  });
}