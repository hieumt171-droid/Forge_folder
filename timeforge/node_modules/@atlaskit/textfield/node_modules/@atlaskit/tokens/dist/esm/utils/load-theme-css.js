import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import themeImportMap from '../artifacts/theme-import-map';
export var loadThemeCss = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(themeId) {
    var _yield$themeImportMap, themeCss;
    return _regeneratorRuntime.wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.next = 1;
          return themeImportMap[themeId]();
        case 1:
          _yield$themeImportMap = _context.sent;
          themeCss = _yield$themeImportMap.default;
          return _context.abrupt("return", themeCss);
        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function loadThemeCss(_x) {
    return _ref.apply(this, arguments);
  };
}();