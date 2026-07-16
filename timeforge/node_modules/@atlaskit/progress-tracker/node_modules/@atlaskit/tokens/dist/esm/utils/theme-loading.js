import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import { CUSTOM_THEME_ATTRIBUTE, THEME_DATA_ATTRIBUTE } from '../constants';
import { loadThemeCss } from './load-theme-css';
export var loadAndAppendThemeCss = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(themeId) {
    var themeCss, style;
    return _regeneratorRuntime.wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          if (!document.head.querySelector("style[".concat(THEME_DATA_ATTRIBUTE, "=\"").concat(themeId, "\"]:not([").concat(CUSTOM_THEME_ATTRIBUTE, "])"))) {
            _context.next = 1;
            break;
          }
          return _context.abrupt("return");
        case 1:
          if (themeId) {
            _context.next = 2;
            break;
          }
          return _context.abrupt("return");
        case 2:
          _context.next = 3;
          return loadThemeCss(themeId);
        case 3:
          themeCss = _context.sent;
          style = document.createElement('style');
          style.textContent = themeCss;
          style.dataset.theme = themeId;
          document.head.appendChild(style);
        case 4:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function loadAndAppendThemeCss(_x) {
    return _ref.apply(this, arguments);
  };
}();
export var darkModeMediaQuery = '(prefers-color-scheme: dark)';
export var moreContrastMediaQuery = '(prefers-contrast: more)';
export { loadThemeCss } from './load-theme-css';