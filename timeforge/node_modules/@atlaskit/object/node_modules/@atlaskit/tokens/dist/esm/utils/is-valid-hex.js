// valid hex color with 4, 6 or 8 digits
export var isValidHex = function isValidHex(hex) {
  return /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex);
};