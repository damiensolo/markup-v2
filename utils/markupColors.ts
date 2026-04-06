/**
 * Helpers for markup fill/stroke colors (hex, transparent, legacy fallbacks).
 */

import type { Rectangle } from '../types';

export const LEGACY_STROKE = '#ef4444';
export const LEGACY_STROKE_SELECTED = '#f87171';
/** Default new-shape fill: warm highlight so the sheet stays readable underneath. */
export const DEFAULT_MARKUP_FILL = 'rgba(232,150,35,0.14)';
export const DEFAULT_FILL_OPACITY = 0.14;
export const LEGACY_FILL_FLAT = 'rgba(0,0,0,0.05)';
export const LEGACY_CLOUD_FILL = 'rgba(239, 68, 68, 0.1)';
export const LEGACY_CLOUD_FILL_SELECTED = 'rgba(248, 113, 113, 0.1)';

export function parseHex6(input: string): { r: number; g: number; b: number } | null {
  const m = input.trim().match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Best-effort RGB(A) from `rgb(...)` / `rgba(...)` for picker display. */
export function parseCssRgb(input: string): { r: number; g: number; b: number; a: number } | null {
  const m = input
    .trim()
    .match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+)\s*)?\)/i);
  if (!m) return null;
  const a = m[4] !== undefined && m[4] !== '' ? Number(m[4]) : 1;
  return { r: +m[1], g: +m[2], b: +m[3], a: Number.isFinite(a) ? a : 1 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h: h * 360, s, v };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360 / 60;
  const c = v * s;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let rp = 0,
    gp = 0,
    bp = 0;
  if (hh < 1) [rp, gp, bp] = [c, x, 0];
  else if (hh < 2) [rp, gp, bp] = [x, c, 0];
  else if (hh < 3) [rp, gp, bp] = [0, c, x];
  else if (hh < 4) [rp, gp, bp] = [0, x, c];
  else if (hh < 5) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  const m = v - c;
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const rgb = parseHex6(hex);
  if (!rgb) return { h: 30, s: 0.75, v: 0.91 };
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

export function lightenHex(hex: string, amount: number): string {
  const rgb = parseHex6(hex);
  if (!rgb) return LEGACY_STROKE_SELECTED;
  const lift = (c: number) => Math.round(c + (255 - c) * amount);
  return rgbToHex(lift(rgb.r), lift(rgb.g), lift(rgb.b));
}

export function resolveRectStrokeColor(rect: Rectangle, isSelected: boolean): string {
  const base = rect.strokeColor ?? LEGACY_STROKE;
  if (!isSelected) return base;
  if (parseHex6(base)) return lightenHex(base, 0.18);
  return LEGACY_STROKE_SELECTED;
}

/** Parse fill string into HSV + opacity (0–1). Transparent → opacity 0, white HSV default. */
export function parseFillForPicker(fillValue: string): {
  h: number;
  s: number;
  v: number;
  opacity: number;
} {
  if (fillValue === 'transparent') {
    return { ...hexToHsv('#E89623'), opacity: 0 };
  }
  const hex = parseHex6(fillValue);
  if (hex) {
    const { h, s, v } = rgbToHsv(hex.r, hex.g, hex.b);
    return { h, s, v, opacity: 1 };
  }
  const rgba = parseCssRgb(fillValue);
  if (rgba) {
    const { h, s, v } = rgbToHsv(rgba.r, rgba.g, rgba.b);
    return { h, s, v, opacity: Math.max(0, Math.min(1, rgba.a)) };
  }
  return { ...hexToHsv('#E89623'), opacity: DEFAULT_FILL_OPACITY };
}

export function resolveRectFillColor(
  rect: Rectangle,
  shape: 'box' | 'ellipse' | 'cloud',
  isSelected: boolean,
  theme: 'light' | 'dark'
): string {
  if (rect.fillColor === 'transparent') return 'transparent';
  if (rect.fillColor !== undefined && rect.fillColor !== '') return rect.fillColor;
  if (shape === 'cloud') return isSelected ? LEGACY_CLOUD_FILL_SELECTED : LEGACY_CLOUD_FILL;
  if (shape === 'ellipse') return LEGACY_FILL_FLAT;
  return theme === 'dark' ? 'rgba(255,255,255,0.05)' : LEGACY_FILL_FLAT;
}
