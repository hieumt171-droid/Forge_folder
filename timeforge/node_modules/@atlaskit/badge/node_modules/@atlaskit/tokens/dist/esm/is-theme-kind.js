var themeKinds = ['light', 'dark', 'spacing', 'typography', 'shape', 'motion'];
export var isThemeKind = function isThemeKind(themeKind) {
  return themeKinds.find(function (kind) {
    return kind === themeKind;
  }) !== undefined;
};