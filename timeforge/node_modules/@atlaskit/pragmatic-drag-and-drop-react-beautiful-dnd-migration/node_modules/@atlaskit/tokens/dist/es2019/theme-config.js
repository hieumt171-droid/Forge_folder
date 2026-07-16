/**
 * This file contains the source of truth for themes and all associated meta data.
 */

import { themeIds } from './theme-ids';

/**
 * Themes: The internal identifier of a theme.
 * These ids are what the actual theme files/folders are called.
 * style-dictionary will attempt to locate these in the file-system.
 */

/**
 * ThemeOverrides: The internal identifier of a theme override. Which are themes that contain
 * a subset of tokens intended to override an existing theme. These ids are what the actual
 * theme files/folders are called. style-dictionary will attempt to locate these in the file-system.
 * Theme overrides are temporary and there may not be any defined at times.
 */

/**
 * Theme kinds: The type of theme.
 * Some themes are entirely focused on Color, whilst others are purely focused on spacing.
 * In the future other types may be introduced such as typography.
 */

/**
 * Contrast preferences: The system contrast preference
 */
const themeContrastModes = ['more', 'no-preference', 'auto'];
/**
 * Theme override ids: the equivalent of themeIds for theme overrides.
 * Theme overrides are temporary and there may not be any defined at times.
 */
const themeOverrideIds = [];
export const themeIdsWithOverrides = [...themeIds, ...themeOverrideIds];

/**
 * Theme to use a base. This will create the theme as
 * an extension with all token values marked as optional
 * to allow tokens to be overridden as required.
 */

/**
 * Palettes: The set of base tokens a given theme may be populated with.
 * For example: legacy light & dark themes use the "legacyPalette" containing colors from our
 * previous color set.
 */

/**
 * ThemeConfig: the source of truth for all theme meta-data.
 * This object should be used whenever interfacing with themes.
 */

const themeConfig = {
  'atlassian-light': {
    id: 'light',
    displayName: 'Light Theme',
    palette: 'defaultPalette',
    attributes: {
      type: 'color',
      mode: 'light'
    }
  },
  'atlassian-light-future': {
    id: 'light-future',
    displayName: 'Future Light Theme',
    palette: 'defaultPalette',
    attributes: {
      type: 'color',
      mode: 'light'
    },
    override: 'light'
  },
  'atlassian-light-increased-contrast': {
    id: 'light-increased-contrast',
    displayName: 'Light Theme (increased contrast)',
    palette: 'defaultPalette',
    attributes: {
      type: 'color',
      mode: 'light'
    },
    extends: 'light',
    increasesContrastFor: 'light'
  },
  'atlassian-dark': {
    id: 'dark',
    displayName: 'Dark Theme',
    palette: 'defaultPalette',
    attributes: {
      type: 'color',
      mode: 'dark'
    }
  },
  'atlassian-dark-future': {
    id: 'dark-future',
    displayName: 'Future Dark Theme',
    palette: 'defaultPalette',
    attributes: {
      type: 'color',
      mode: 'dark'
    },
    override: 'light'
  },
  'atlassian-dark-increased-contrast': {
    id: 'dark-increased-contrast',
    displayName: 'Dark Theme (increased contrast)',
    palette: 'defaultPalette',
    attributes: {
      type: 'color',
      mode: 'dark'
    },
    extends: 'dark',
    increasesContrastFor: 'dark'
  },
  'atlassian-spacing': {
    id: 'spacing',
    displayName: 'Atlassian Spacing',
    palette: 'spacingScale',
    attributes: {
      type: 'spacing'
    }
  },
  'atlassian-typography': {
    id: 'typography',
    displayName: 'Atlassian Typography',
    palette: 'typographyPalette',
    attributes: {
      type: 'typography'
    }
  },
  'atlassian-shape': {
    id: 'shape',
    displayName: 'Shape',
    palette: 'shapePalette',
    attributes: {
      type: 'shape'
    }
  },
  'atlassian-motion': {
    id: 'motion',
    displayName: 'Motion',
    palette: 'motionPalette',
    attributes: {
      type: 'motion'
    }
  }
};

/**
 * Represents theme state once mounted to the page
 * (the page doesn't have an "auto" color mode, it's either light or dark)
 */

// eslint-disable-next-line @atlaskit/volt-strict-mode/no-multiple-exports
export default themeConfig;
export { themeColorModes } from './theme-color-modes';
export { themeIds } from './theme-ids';
export { themeStateDefaults } from './theme-state-defaults';