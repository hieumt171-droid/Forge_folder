import { themeIds } from './theme-ids';
export const isThemeIds = themeId => {
  return themeIds.find(id => id === themeId) !== undefined;
};