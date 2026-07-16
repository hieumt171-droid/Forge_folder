import { getCustomThemeStyles } from './get-custom-theme-styles';
import { limitSizeOfCustomStyleElements } from './utils/limit-size-of-custom-style-elements';
export const CUSTOM_STYLE_ELEMENTS_SIZE_THRESHOLD = 10;
export function loadAndAppendCustomThemeCss(themeState) {
  const themes = getCustomThemeStyles(themeState);
  limitSizeOfCustomStyleElements(CUSTOM_STYLE_ELEMENTS_SIZE_THRESHOLD);
  themes.map(theme => {
    const styleTag = document.createElement('style');
    document.head.appendChild(styleTag);
    styleTag.dataset.theme = theme.attrs['data-theme'];
    styleTag.dataset.customTheme = theme.attrs['data-custom-theme'];
    styleTag.textContent = theme.css;
  });
}
export { getCustomThemeStyles } from './get-custom-theme-styles';