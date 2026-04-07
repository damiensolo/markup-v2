/** True when ?menus is in the URL — forces all flyouts/dropdowns open for Figma capture. */
export const MENUS_MODE = new URLSearchParams(window.location.search).has('menus');
