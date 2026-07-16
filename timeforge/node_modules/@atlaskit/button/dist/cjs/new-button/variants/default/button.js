"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _react = _interopRequireDefault(require("react"));
var _buttonBase = _interopRequireDefault(require("../shared/button-base"));
var _content = _interopRequireDefault(require("../shared/content"));
var _iconRenderer = _interopRequireDefault(require("../shared/icon-renderer"));
var _excluded = ["analyticsContext", "appearance", "aria-label", "aria-labelledby", "autoFocus", "children", "iconAfter", "iconBefore", "interactionName", "isDisabled", "isLoading", "isSelected", "onClick", "onClickCapture", "onKeyDownCapture", "onKeyUpCapture", "onMouseDownCapture", "onMouseUpCapture", "onPointerDownCapture", "onPointerUpCapture", "onTouchEndCapture", "onTouchStartCapture", "shouldFitContainer", "spacing", "testId", "type"],
  _excluded2 = ["className", "css", "as", "style"];
/**
 * __Button__
 *
 * A button triggers an event or action.
 *
 * - [Examples](https://atlassian.design/components/button/examples)
 * - [Code](https://atlassian.design/components/button/code)
 * - [Usage](https://atlassian.design/components/button/usage)
 */
var Button = /*#__PURE__*/_react.default.memo( /*#__PURE__*/_react.default.forwardRef(function Button(_ref, ref) {
  var analyticsContext = _ref.analyticsContext,
    appearance = _ref.appearance,
    ariaLabel = _ref['aria-label'],
    ariaLabelledBy = _ref['aria-labelledby'],
    autoFocus = _ref.autoFocus,
    children = _ref.children,
    iconAfter = _ref.iconAfter,
    iconBefore = _ref.iconBefore,
    interactionName = _ref.interactionName,
    isDisabled = _ref.isDisabled,
    _ref$isLoading = _ref.isLoading,
    isLoading = _ref$isLoading === void 0 ? false : _ref$isLoading,
    isSelected = _ref.isSelected,
    onClick = _ref.onClick,
    onClickCapture = _ref.onClickCapture,
    onKeyDownCapture = _ref.onKeyDownCapture,
    onKeyUpCapture = _ref.onKeyUpCapture,
    onMouseDownCapture = _ref.onMouseDownCapture,
    onMouseUpCapture = _ref.onMouseUpCapture,
    onPointerDownCapture = _ref.onPointerDownCapture,
    onPointerUpCapture = _ref.onPointerUpCapture,
    onTouchEndCapture = _ref.onTouchEndCapture,
    onTouchStartCapture = _ref.onTouchStartCapture,
    shouldFitContainer = _ref.shouldFitContainer,
    spacing = _ref.spacing,
    testId = _ref.testId,
    _ref$type = _ref.type,
    type = _ref$type === void 0 ? 'button' : _ref$type,
    unsafeRest = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  // @ts-expect-error
  var _className = unsafeRest.className,
    _css = unsafeRest.css,
    _as = unsafeRest.as,
    _style = unsafeRest.style,
    saferRest = (0, _objectWithoutProperties2.default)(unsafeRest, _excluded2);
  return /*#__PURE__*/_react.default.createElement(_buttonBase.default, (0, _extends2.default)({
    analyticsContext: analyticsContext,
    ref: ref,
    appearance: appearance,
    autoFocus: autoFocus,
    isDisabled: isDisabled,
    isLoading: isLoading,
    isSelected: isSelected,
    hasIconBefore: Boolean(iconBefore),
    hasIconAfter: Boolean(iconAfter),
    shouldFitContainer: shouldFitContainer,
    spacing: spacing,
    ariaLabel: ariaLabel,
    ariaLabelledBy: ariaLabelledBy,
    onClick: onClick,
    onClickCapture: onClickCapture,
    onKeyDownCapture: onKeyDownCapture,
    onKeyUpCapture: onKeyUpCapture,
    onMouseDownCapture: onMouseDownCapture,
    onMouseUpCapture: onMouseUpCapture,
    onPointerDownCapture: onPointerDownCapture,
    onPointerUpCapture: onPointerUpCapture,
    onTouchStartCapture: onTouchStartCapture,
    onTouchEndCapture: onTouchEndCapture,
    testId: testId,
    componentName: "Button",
    type: type,
    interactionName: interactionName
  }, saferRest), iconBefore && /*#__PURE__*/_react.default.createElement(_content.default, {
    type: "icon",
    position: "before",
    isLoading: isLoading
  }, /*#__PURE__*/_react.default.createElement(_iconRenderer.default, {
    icon: iconBefore
  })), children && /*#__PURE__*/_react.default.createElement(_content.default, {
    isLoading: isLoading
  }, children), iconAfter && /*#__PURE__*/_react.default.createElement(_content.default, {
    type: "icon",
    position: "after",
    isLoading: isLoading
  }, /*#__PURE__*/_react.default.createElement(_iconRenderer.default, {
    icon: iconAfter
  })));
}));
Button.displayName = 'Button';
var _default = exports.default = Button;