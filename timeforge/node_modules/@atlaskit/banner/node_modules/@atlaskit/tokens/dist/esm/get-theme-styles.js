import _toConsumableArray from "@babel/runtime/helpers/toConsumableArray";
import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import { fg } from '@atlaskit/platform-feature-flags';
import { themeIdsWithOverrides, themeStateDefaults } from './theme-config';
import { getThemeOverridePreferences } from './utils/get-theme-override-preferences';
import { getThemePreferences } from './utils/get-theme-preferences';
import { isValidBrandHex } from './utils/is-valid-brand-hex';
import { loadThemeCss } from './utils/load-theme-css';
/**
 * Takes an object containing theme preferences, and returns an array of objects for use in applying styles to the document head.
 * Only supplies the color themes necessary for initial render, based on the current themeState. I.e. if in light mode, dark mode themes are not returned.
 *
 * @param {Object<string, string>} themeState The themes and color mode that should be applied.
 * @param {string} themeState.colorMode Determines which color theme is applied. If set to `auto`, the theme applied will be determined by the OS setting.
 * @param {string} themeState.dark The color theme to be applied when the color mode resolves to 'dark'.
 * @param {string} themeState.light The color theme to be applied when the color mode resolves to 'light'.
 * @param {string} themeState.motion The motion theme to be applied.
 * @param {string} themeState.shape The shape theme to be applied.
 * @param {string} themeState.spacing The spacing theme to be applied.
 * @param {string} themeState.typography The typography theme to be applied.
 * @param {Object} themeState.UNSAFE_themeOptions The custom branding options to be used for custom theme generation
 *
 * @returns A Promise of an object array, containing theme IDs, data-attributes to attach to the theme, and the theme CSS.
 * If an error is encountered while loading themes, the themes array will be empty.
 */
var getThemeStyles = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(preferences) {
    var themePreferences, themeOverridePreferences, themeState, results;
    return _regeneratorRuntime.wrap(function (_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          themeOverridePreferences = [];
          if (preferences === 'all') {
            themePreferences = themeIdsWithOverrides;

            // CLEANUP: Remove
            if (!fg('platform_increased-contrast-themes')) {
              themePreferences = themePreferences.filter(function (n) {
                return n !== 'light-increased-contrast' && n !== 'dark-increased-contrast';
              });
            }
          } else {
            themeState = {
              colorMode: (preferences === null || preferences === void 0 ? void 0 : preferences.colorMode) || themeStateDefaults['colorMode'],
              contrastMode: (preferences === null || preferences === void 0 ? void 0 : preferences.contrastMode) || themeStateDefaults['contrastMode'],
              dark: (preferences === null || preferences === void 0 ? void 0 : preferences.dark) || themeStateDefaults['dark'],
              light: (preferences === null || preferences === void 0 ? void 0 : preferences.light) || themeStateDefaults['light'],
              motion: (preferences === null || preferences === void 0 ? void 0 : preferences.motion) || themeStateDefaults['motion'](),
              shape: (preferences === null || preferences === void 0 ? void 0 : preferences.shape) || themeStateDefaults['shape'](),
              spacing: (preferences === null || preferences === void 0 ? void 0 : preferences.spacing) || themeStateDefaults['spacing'],
              typography: (preferences === null || preferences === void 0 ? void 0 : preferences.typography) || themeStateDefaults['typography']
            };
            themePreferences = getThemePreferences(themeState);
            themeOverridePreferences = getThemeOverridePreferences(themeState);
          }
          _context3.next = 1;
          return Promise.all([].concat(_toConsumableArray([].concat(_toConsumableArray(themePreferences), _toConsumableArray(themeOverridePreferences)).map( /*#__PURE__*/function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(themeId) {
              var css, _t;
              return _regeneratorRuntime.wrap(function (_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    _context.prev = 0;
                    _context.next = 1;
                    return loadThemeCss(themeId);
                  case 1:
                    css = _context.sent;
                    return _context.abrupt("return", {
                      id: themeId,
                      attrs: {
                        'data-theme': themeId
                      },
                      css: css
                    });
                  case 2:
                    _context.prev = 2;
                    _t = _context["catch"](0);
                    return _context.abrupt("return", undefined);
                  case 3:
                  case "end":
                    return _context.stop();
                }
              }, _callee, null, [[0, 2]]);
            }));
            return function (_x2) {
              return _ref2.apply(this, arguments);
            };
          }())), [
          // Add custom themes if they're present
          _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
            var _preferences$UNSAFE_t;
            var _yield$import, getCustomThemeStyles, customThemeStyles, _t2;
            return _regeneratorRuntime.wrap(function (_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  if (!(preferences !== 'all' && preferences !== null && preferences !== void 0 && preferences.UNSAFE_themeOptions && isValidBrandHex(preferences === null || preferences === void 0 || (_preferences$UNSAFE_t = preferences.UNSAFE_themeOptions) === null || _preferences$UNSAFE_t === void 0 ? void 0 : _preferences$UNSAFE_t.brandColor))) {
                    _context2.next = 5;
                    break;
                  }
                  _context2.prev = 1;
                  _context2.next = 2;
                  return import( /* webpackChunkName: "@atlaskit-internal_atlassian-custom-theme" */
                  './custom-theme');
                case 2:
                  _yield$import = _context2.sent;
                  getCustomThemeStyles = _yield$import.getCustomThemeStyles;
                  _context2.next = 3;
                  return getCustomThemeStyles({
                    colorMode: (preferences === null || preferences === void 0 ? void 0 : preferences.colorMode) || themeStateDefaults['colorMode'],
                    UNSAFE_themeOptions: preferences === null || preferences === void 0 ? void 0 : preferences.UNSAFE_themeOptions
                  });
                case 3:
                  customThemeStyles = _context2.sent;
                  return _context2.abrupt("return", customThemeStyles);
                case 4:
                  _context2.prev = 4;
                  _t2 = _context2["catch"](1);
                  return _context2.abrupt("return", undefined);
                case 5:
                  return _context2.abrupt("return", undefined);
                case 6:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, null, [[1, 4]]);
          }))()]));
        case 1:
          results = _context3.sent;
          return _context3.abrupt("return", results.flat().filter(function (theme) {
            return theme !== undefined;
          }));
        case 2:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function getThemeStyles(_x) {
    return _ref.apply(this, arguments);
  };
}();
export default getThemeStyles;