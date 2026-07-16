import { deltaE } from './delta-e';
import { hexToRgb } from './hex-to-rgb';
export var getClosestColorIndex = function getClosestColorIndex(themeRamp, brandColor) {
  // Iterate over themeRamp and find whichever color is closest to brandColor
  var closestColorIndex = 0;
  var closestColorDistance = null;
  themeRamp.forEach(function (value, index) {
    var distance = deltaE(hexToRgb(value), hexToRgb(brandColor));
    if (closestColorDistance === null || distance < closestColorDistance) {
      closestColorIndex = index;
      closestColorDistance = distance;
    }
  });
  return closestColorIndex;
};