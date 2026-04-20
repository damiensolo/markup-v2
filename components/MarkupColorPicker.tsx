
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pipette, X } from 'lucide-react';
import {
  hexToHsv,
  hsvToHex,
  parseHex6,
  parseCssRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  parseFillForPicker,
  DEFAULT_FILL_OPACITY,
} from '../utils/markupColors';

export type MarkupColorMode = 'fill' | 'stroke';

const PRESETS: { value: string; label: string }[] = [
  { value: 'transparent', label: 'No fill' },
  { value: '#EF4444', label: 'Red' },
  { value: '#E89623', label: 'Orange' },
  { value: '#228B22', label: 'Green' },
  { value: '#6B21A8', label: 'Purple' },
  { value: '#EAB308', label: 'Yellow' },
  { value: '#64748B', label: 'Slate' },
  { value: '#000000', label: 'Black' },
];

const STROKE_PRESETS = PRESETS.filter((p) => p.value !== 'transparent');

const HUE_GRADIENT =
  'linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)';

export interface MarkupColorPickerProps {
  activeMode: MarkupColorMode;
  onActiveModeChange: (mode: MarkupColorMode) => void;
  fillValue: string;
  strokeValue: string;
  onChange: (mode: MarkupColorMode, value: string) => void;
  /** Optional dismiss control (e.g. docked panel close). */
  onRequestClose?: () => void;
  className?: string;
  /**
   * When true: hide the Fill tab entirely, show only the stroke color picker
   * with an opacity/see-through slider. Used for line, arrow, pen, highlighter tools.
   */
  strokeOnly?: boolean;
}

function strokeToHex(strokeValue: string): string {
  const ph = parseHex6(strokeValue);
  if (ph) return rgbToHex(ph.r, ph.g, ph.b);
  const rgba = parseCssRgb(strokeValue);
  if (rgba) return rgbToHex(rgba.r, rgba.g, rgba.b);
  return '#EF4444';
}

function parseStrokeOpacity(strokeValue: string): number {
  const rgba = parseCssRgb(strokeValue);
  if (rgba) return Math.max(0, Math.min(1, rgba.a));
  return 1;
}

function cssColorToOutput(rgb: { r: number; g: number; b: number; a: number }): string {
  if (Math.abs(rgb.a - 1) < 0.001) return rgbToHex(rgb.r, rgb.g, rgb.b);
  const a = Math.max(0, Math.min(1, rgb.a));
  return `rgba(${Math.round(rgb.r)},${Math.round(rgb.g)},${Math.round(rgb.b)},${a})`;
}

const MarkupColorPicker: React.FC<MarkupColorPickerProps> = ({
  activeMode,
  onActiveModeChange,
  fillValue,
  strokeValue,
  onChange,
  onRequestClose,
  className = '',
  strokeOnly = false,
}) => {
  // When strokeOnly, always operate in stroke mode regardless of activeMode prop
  const effectiveMode: MarkupColorMode = strokeOnly ? 'stroke' : activeMode;

  const channelValue = effectiveMode === 'fill' ? fillValue : strokeValue;
  const isExplicitNoFill = fillValue === 'transparent';

  const [hsv, setHsv] = useState(() => {
    if (effectiveMode === 'fill') {
      const p = parseFillForPicker(fillValue);
      return { h: p.h, s: p.s, v: p.v };
    }
    return hexToHsv(strokeToHex(strokeValue));
  });
  const [fillOpacity, setFillOpacity] = useState(() => parseFillForPicker(fillValue).opacity);
  const [strokeOpacity, setStrokeOpacity] = useState(() => parseStrokeOpacity(strokeValue));
  const [hexInput, setHexInput] = useState(() => {
    if (effectiveMode === 'fill') {
      const p = parseFillForPicker(fillValue);
      return p.opacity < 0.001 ? '' : hsvToHex(p.h, p.s, p.v);
    }
    return strokeToHex(strokeValue);
  });

  useEffect(() => {
    if (effectiveMode === 'fill') {
      const p = parseFillForPicker(fillValue);
      setHsv({ h: p.h, s: p.s, v: p.v });
      setFillOpacity(p.opacity);
      setHexInput(p.opacity < 0.001 ? '' : hsvToHex(p.h, p.s, p.v));
    } else {
      const hex = strokeToHex(strokeValue);
      const op = parseStrokeOpacity(strokeValue);
      setHsv(hexToHsv(hex));
      setStrokeOpacity(op);
      setHexInput(hex);
    }
  }, [effectiveMode, fillValue, strokeValue]);

  const svAreaRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const opacityTrackRef = useRef<HTMLDivElement>(null);
  const draggingSv = useRef(false);
  const draggingHue = useRef(false);
  const draggingOpacity = useRef(false);

  const emitFill = useCallback(
    (h: number, s: number, v: number, opacity: number) => {
      const { r, g, b } = hsvToRgb(h, s, v);
      const a = Math.round(Math.max(0, Math.min(1, opacity)) * 100) / 100;
      onChange('fill', `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`);
    },
    [onChange]
  );

  const emitStroke = useCallback(
    (h: number, s: number, v: number, opacity: number) => {
      const { r, g, b } = hsvToRgb(h, s, v);
      const a = Math.round(Math.max(0, Math.min(1, opacity)) * 100) / 100;
      if (Math.abs(a - 1) < 0.001) {
        onChange('stroke', rgbToHex(r, g, b));
      } else {
        onChange('stroke', `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`);
      }
    },
    [onChange]
  );

  const applyHsv = useCallback(
    (h: number, s: number, v: number) => {
      setHsv({ h, s, v });
      if (effectiveMode === 'stroke') {
        const hex = hsvToHex(h, s, v);
        setHexInput(hex);
        if (strokeOnly) {
          emitStroke(h, s, v, strokeOpacity);
        } else {
          onChange('stroke', hex);
        }
      } else {
        let op = fillOpacity;
        if (op <= 0.001 && isExplicitNoFill) {
          op = DEFAULT_FILL_OPACITY;
          setFillOpacity(op);
        }
        setHexInput(hsvToHex(h, s, v));
        emitFill(h, s, v, op);
      }
    },
    [effectiveMode, strokeOnly, onChange, emitFill, emitStroke, fillOpacity, strokeOpacity, isExplicitNoFill]
  );

  const applyHexStroke = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
      let p: { r: number; g: number; b: number } | null = parseHex6(withHash);
      if (!p) {
        const rgb = parseCssRgb(trimmed);
        if (rgb) p = { r: rgb.r, g: rgb.g, b: rgb.b };
      }
      if (!p) return;
      const h = rgbToHsv(p.r, p.g, p.b);
      setHsv(h);
      const out = rgbToHex(p.r, p.g, p.b);
      setHexInput(out);
      if (strokeOnly) {
        emitStroke(h.h, h.s, h.v, strokeOpacity);
      } else {
        onChange('stroke', out);
      }
    },
    [onChange, emitStroke, strokeOnly, strokeOpacity]
  );

  const applyHexFillSolid = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
      let p: { r: number; g: number; b: number } | null = parseHex6(withHash);
      if (!p) {
        const rgb = parseCssRgb(trimmed);
        if (rgb) p = { r: rgb.r, g: rgb.g, b: rgb.b };
      }
      if (!p) return;
      const hv = rgbToHsv(p.r, p.g, p.b);
      setHsv({ h: hv.h, s: hv.s, v: hv.v });
      setHexInput(rgbToHex(p.r, p.g, p.b));
      const op = fillOpacity > 0.001 ? fillOpacity : DEFAULT_FILL_OPACITY;
      setFillOpacity(op);
      emitFill(hv.h, hv.s, hv.v, op);
    },
    [emitFill, fillOpacity]
  );

  const pickSv = useCallback(
    (clientX: number, clientY: number) => {
      const el = svAreaRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      const y = Math.max(0, Math.min(1, (clientY - r.top) / r.height));
      applyHsv(hsv.h, x, 1 - y);
    },
    [applyHsv, hsv.h]
  );

  const pickHue = useCallback(
    (clientX: number) => {
      const el = hueRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      applyHsv(x * 360, hsv.s, hsv.v);
    },
    [applyHsv, hsv.s, hsv.v]
  );

  const pickOpacity = useCallback(
    (clientX: number) => {
      const el = opacityTrackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      if (effectiveMode === 'fill' && !strokeOnly) {
        setFillOpacity(x);
        emitFill(hsv.h, hsv.s, hsv.v, x);
      } else {
        setStrokeOpacity(x);
        emitStroke(hsv.h, hsv.s, hsv.v, x);
      }
    },
    [effectiveMode, strokeOnly, emitFill, emitStroke, hsv]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (draggingSv.current) pickSv(e.clientX, e.clientY);
      if (draggingHue.current) pickHue(e.clientX);
      if (draggingOpacity.current) pickOpacity(e.clientX);
    };
    const onUp = () => {
      draggingSv.current = false;
      draggingHue.current = false;
      draggingOpacity.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [pickSv, pickHue, pickOpacity]);

  const pureHue = hsvToHex(hsv.h, 1, 1);
  const solidRgb = hsvToHex(hsv.h, hsv.s, hsv.v);
  const { r: pr, g: pg, b: pb } = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const solidCss = `rgb(${Math.round(pr)},${Math.round(pg)},${Math.round(pb)})`;

  const svMarkerLeft = `${hsv.s * 100}%`;
  const svMarkerTop = `${(1 - hsv.v) * 100}%`;
  const hueThumbLeft = `${(hsv.h / 360) * 100}%`;

  // Which opacity value to show in the slider — fill or stroke depending on mode
  const shownOpacity = effectiveMode === 'fill' && !strokeOnly ? fillOpacity : strokeOpacity;
  const opacityThumbLeft = `${shownOpacity * 100}%`;

  const handleHexBlur = () => {
    if (effectiveMode === 'fill' && isExplicitNoFill) return;
    const raw = hexInput.trim();
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    if (effectiveMode === 'stroke') {
      if (parseHex6(withHash) || parseCssRgb(raw)) applyHexStroke(raw);
      else setHexInput(strokeToHex(strokeValue));
    } else {
      if (parseCssRgb(raw)) {
        const rgba = parseCssRgb(raw)!;
        const { h, s, v } = rgbToHsv(rgba.r, rgba.g, rgba.b);
        setHsv({ h, s, v });
        setFillOpacity(Math.max(0, Math.min(1, rgba.a)));
        const out = cssColorToOutput({ r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a });
        if (rgba.a <= 0.001) onChange('fill', 'transparent');
        else onChange('fill', out);
        setHexInput(rgba.a <= 0.001 ? '' : hsvToHex(h, s, v));
      } else if (parseHex6(withHash)) {
        applyHexFillSolid(raw);
      } else {
        setHexInput(isExplicitNoFill ? '' : hsvToHex(hsv.h, hsv.s, hsv.v));
      }
    }
  };

  const eyeDropperSupported =
    typeof window !== 'undefined' &&
    'EyeDropper' in window &&
    typeof (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } })
      .EyeDropper === 'function';

  const pickFromScreen = async () => {
    if (!eyeDropperSupported) return;
    try {
      const EyeDropperCtor = (
        window as unknown as {
          EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
        }
      ).EyeDropper;
      const ed = new EyeDropperCtor();
      const { sRGBHex } = await ed.open();
      if (!sRGBHex) return;
      const p = parseHex6(sRGBHex);
      if (!p) return;
      const { h, s, v } = rgbToHsv(p.r, p.g, p.b);
      setHsv({ h, s, v });
      setHexInput(rgbToHex(p.r, p.g, p.b));
      if (effectiveMode === 'stroke') {
        if (strokeOnly) {
          emitStroke(h, s, v, strokeOpacity);
        } else {
          onChange('stroke', rgbToHex(p.r, p.g, p.b));
        }
      } else {
        const op = fillOpacity > 0.001 ? fillOpacity : DEFAULT_FILL_OPACITY;
        setFillOpacity(op);
        emitFill(h, s, v, op);
      }
    } catch {
      /* cancelled */
    }
  };

  const presetOpacity = fillOpacity > 0.001 ? fillOpacity : DEFAULT_FILL_OPACITY;
  const activePresets = strokeOnly ? STROKE_PRESETS : PRESETS;

  return (
    <div
      className={`w-full min-w-0 select-none rounded-2xl border border-zinc-200/90 bg-white p-4 text-zinc-900 shadow-xl ring-1 ring-black/5 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10 ${className}`}
    >
      {/* Header */}
      <div className="mb-4 flex gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Markup Color
          </h3>
        </div>
        {onRequestClose && (
          <button
            type="button"
            onClick={onRequestClose}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close color panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Fill / Stroke tab switcher — hidden in strokeOnly mode */}
      {!strokeOnly && (
        <div className="mb-4 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80">
          <button
            type="button"
            onClick={() => onActiveModeChange('fill')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              effectiveMode === 'fill'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Fill
          </button>
          <button
            type="button"
            onClick={() => onActiveModeChange('stroke')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              effectiveMode === 'stroke'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Stroke
          </button>
        </div>
      )}

      {/* Opacity slider — fill opacity in full mode, stroke opacity in strokeOnly mode */}
      {(effectiveMode === 'fill' || strokeOnly) && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {effectiveMode === 'fill' ? 'See-through' : 'Opacity'}
            </span>
            <span className="font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
              {Math.round(shownOpacity * 100)}%
            </span>
          </div>
          <div
            ref={opacityTrackRef}
            className="relative h-9 cursor-pointer rounded-full border border-zinc-200/80 dark:border-zinc-600"
            style={{
              background: `linear-gradient(to right, transparent, ${solidCss}), repeating-conic-gradient(#e4e4e7 0% 25%, #fafafa 0% 50%) 50% / 12px 12px`,
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              draggingOpacity.current = true;
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              pickOpacity(e.clientX);
            }}
          >
            <div
              className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-md ring-2 ring-zinc-900/10 dark:border-zinc-200 dark:ring-white/20"
              style={{
                left: opacityThumbLeft,
                background: `linear-gradient(135deg, ${solidCss}, ${solidCss})`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
            <span>Clear</span>
            <span>Solid</span>
          </div>
        </div>
      )}

      {/* Color presets */}
      <div className="mb-3 grid grid-cols-8 gap-1.5">
        {activePresets.map((p) => {
          const active =
            effectiveMode === 'fill'
              ? p.value === 'transparent'
                ? isExplicitNoFill
                : (() => {
                    if (isExplicitNoFill) return false;
                    const ph = parseHex6(p.value);
                    if (!ph) return false;
                    const q = hsvToRgb(hsv.h, hsv.s, hsv.v);
                    return (
                      Math.abs(ph.r - q.r) < 2 &&
                      Math.abs(ph.g - q.g) < 2 &&
                      Math.abs(ph.b - q.b) < 2
                    );
                  })()
              : channelValue.replace(/\s/g, '').toLowerCase().includes(p.value.toLowerCase().slice(1))
                || channelValue.toUpperCase() === p.value.toUpperCase();
          return (
            <button
              key={p.value}
              type="button"
              title={p.label}
              onClick={() => {
                if (effectiveMode === 'stroke') {
                  if (p.value === 'transparent') return;
                  const { h, s, v } = hexToHsv(p.value);
                  setHsv({ h, s, v });
                  setHexInput(p.value);
                  if (strokeOnly) {
                    emitStroke(h, s, v, strokeOpacity);
                  } else {
                    onChange('stroke', p.value);
                  }
                  return;
                }
                if (p.value === 'transparent') {
                  onChange('fill', 'transparent');
                  setFillOpacity(0);
                  setHexInput('');
                  return;
                }
                const { h, s, v } = hexToHsv(p.value);
                setHsv({ h, s, v });
                setHexInput(p.value);
                setFillOpacity(presetOpacity);
                emitFill(h, s, v, presetOpacity);
              }}
              className={`relative h-7 w-7 shrink-0 rounded-full border-2 transition-transform hover:scale-105 active:scale-95 ${
                active
                  ? 'border-blue-600 ring-2 ring-blue-500/30 dark:ring-blue-400/25'
                  : 'border-zinc-300 dark:border-zinc-600'
              }`}
              style={
                p.value === 'transparent'
                  ? { background: '#fff' }
                  : effectiveMode === 'fill' && p.value !== 'transparent'
                    ? {
                        backgroundColor: p.value,
                        opacity: Math.max(0.35, 0.25 + presetOpacity * 0.5),
                      }
                    : { backgroundColor: p.value }
              }
            >
              {p.value === 'transparent' && (
                <span
                  className="pointer-events-none absolute inset-0.5 rounded-full"
                  style={{
                    background:
                      'linear-gradient(135deg, transparent 44%, #ef4444 44%, #ef4444 56%, transparent 56%)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Hex input */}
      <div className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
        {effectiveMode === 'fill' ? 'Color' : 'Hex'}
      </div>
      <div className="mb-3 flex items-center gap-2">
        {eyeDropperSupported && (
          <button
            type="button"
            title="Pick from screen"
            onClick={pickFromScreen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Pipette className="h-4 w-4" />
          </button>
        )}
        <input
          type="text"
          disabled={effectiveMode === 'fill' && isExplicitNoFill}
          value={effectiveMode === 'fill' && isExplicitNoFill ? 'No fill' : hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={handleHexBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleHexBlur()}
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-mono outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:border-blue-400 dark:disabled:bg-zinc-800/80"
          placeholder={effectiveMode === 'fill' ? '#RRGGBB' : '#EF4444'}
        />
      </div>

      {/* SV color area */}
      <div
        ref={svAreaRef}
        className="relative mb-3 h-[140px] w-full cursor-crosshair overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-600"
        style={{
          background: `
            linear-gradient(to bottom, transparent, #000),
            linear-gradient(to right, #fff, ${pureHue})
          `,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          draggingSv.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          pickSv(e.clientX, e.clientY);
        }}
      >
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/20"
          style={{
            left: svMarkerLeft,
            top: svMarkerTop,
            backgroundColor: solidRgb,
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="relative h-3 w-full cursor-pointer rounded-full border border-zinc-200 dark:border-zinc-600"
        style={{ background: HUE_GRADIENT }}
        onPointerDown={(e) => {
          e.preventDefault();
          draggingHue.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          pickHue(e.clientX);
        }}
      >
        <div
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/15 dark:ring-white/20"
          style={{
            left: hueThumbLeft,
            backgroundColor: pureHue,
          }}
        />
      </div>
    </div>
  );
};

export default MarkupColorPicker;
