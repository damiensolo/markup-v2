import type { Rectangle } from '../types';

export function formatFt(feet: number): string {
  const wholeFeet = Math.floor(feet);
  let inches = Math.round((feet - wholeFeet) * 12);
  if (inches === 12) return `${wholeFeet + 1}'-0"`;
  if (wholeFeet === 0) return `${inches}"`;
  if (inches === 0) return `${wholeFeet}'-0"`;
  return `${wholeFeet}'-${inches}"`;
}

export function formatArea(sqFt: number): string {
  if (sqFt < 1) return `${(sqFt * 144).toFixed(1)} in²`;
  return `${sqFt.toFixed(1)} ft²`;
}

export interface RectDimensions {
  length: number;   // feet — longer side
  width: number;    // feet — shorter side
  wFt: number;      // horizontal real-world span
  hFt: number;      // vertical real-world span
  area: number;     // sq ft
  perimeter: number; // feet
}

export function getRectDimensions(
  rect: Rectangle,
  drawingScale: number,          // natural pixels per foot
  naturalSize: { width: number; height: number }
): RectDimensions {
  const wPx = (rect.width / 100) * naturalSize.width;
  const hPx = (rect.height / 100) * naturalSize.height;
  const wFt = wPx / drawingScale;
  const hFt = hPx / drawingScale;
  const length = Math.max(wFt, hFt);
  const width = Math.min(wFt, hFt);
  const area = wFt * hFt;
  const perimeter = 2 * (wFt + hFt);
  return { length, width, wFt, hFt, area, perimeter };
}

export interface EllipseDimensions {
  wFt: number;      // horizontal diameter
  hFt: number;      // vertical diameter
  area: number;     // sq ft  (π × a × b)
  perimeter: number; // feet (Ramanujan approximation)
  isCircle: boolean;
}

export function getEllipseDimensions(
  rect: Rectangle,
  drawingScale: number,
  naturalSize: { width: number; height: number }
): EllipseDimensions {
  const wFt = (rect.width / 100) * naturalSize.width / drawingScale;
  const hFt = (rect.height / 100) * naturalSize.height / drawingScale;
  const a = wFt / 2, b = hFt / 2;
  const area = Math.PI * a * b;
  const perimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  const isCircle = Math.abs(wFt - hFt) / Math.max(wFt, hFt) < 0.03;
  return { wFt, hFt, area, perimeter, isCircle };
}
