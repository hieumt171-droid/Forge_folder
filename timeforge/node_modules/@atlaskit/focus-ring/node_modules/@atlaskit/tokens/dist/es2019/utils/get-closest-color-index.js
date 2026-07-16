import { deltaE } from './delta-e';
import { hexToRgb } from './hex-to-rgb';
export const getClosestColorIndex = (themeRamp, brandColor) => {
  // Iterate over themeRamp and find whichever color is closest to brandColor
  let closestColorIndex = 0;
  let closestColorDistance = null;
  themeRamp.forEach((value, index) => {
    const distance = deltaE(hexToRgb(value), hexToRgb(brandColor));
    if (closestColorDistance === null || distance < closestColorDistance) {
      closestColorIndex = index;
      closestColorDistance = distance;
    }
  });
  return closestColorIndex;
};