import themeImportMap from '../artifacts/theme-import-map';
export const loadThemeCss = async themeId => {
  const {
    default: themeCss
  } = await themeImportMap[themeId]();
  return themeCss;
};