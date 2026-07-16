import { CUSTOM_THEME_ATTRIBUTE, THEME_DATA_ATTRIBUTE } from '../constants';
import { hash } from './hash';
export function findMissingCustomStyleElements(UNSAFE_themeOptions, mode) {
  const optionString = JSON.stringify(UNSAFE_themeOptions);
  const uniqueId = hash(optionString);
  const attrOfMissingCustomStyles = [];
  (mode === 'auto' ? ['light', 'dark'] : [mode]).forEach(themeId => {
    const element = document.head.querySelector(`style[${CUSTOM_THEME_ATTRIBUTE}="${uniqueId}"][${THEME_DATA_ATTRIBUTE}="${themeId}"]`);
    if (element) {
      // Append the existing custom styles to take precedence over others
      document.head.appendChild(element);
    } else {
      attrOfMissingCustomStyles.push(themeId);
    }
  });
  return attrOfMissingCustomStyles;
}