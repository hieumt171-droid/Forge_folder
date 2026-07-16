import { themeIds } from './theme-ids';
export var isThemeIds = function isThemeIds(themeId) {
  return themeIds.find(function (id) {
    return id === themeId;
  }) !== undefined;
};