const themeKinds = ['light', 'dark', 'spacing', 'typography', 'shape', 'motion'];
export const isThemeKind = themeKind => {
  return themeKinds.find(kind => kind === themeKind) !== undefined;
};