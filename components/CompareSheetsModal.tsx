import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { DrawingData, DrawingVersion } from '../types';
import { XMarkIcon } from './Icons';

export type CompareSheetChoice = {
  drawing: DrawingData;
  version: DrawingVersion;
};

export interface CompareSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allDrawings: DrawingData[];
  currentDrawing: DrawingData | null;
  currentVersion: DrawingVersion | null;
  onCompare: (left: CompareSheetChoice, right: CompareSheetChoice) => void;
}

function defaultPair(
  allDrawings: DrawingData[],
  currentDrawing: DrawingData | null,
  currentVersion: DrawingVersion | null
): { left: CompareSheetChoice | null; right: CompareSheetChoice | null } {
  if (!allDrawings.length) return { left: null, right: null };

  const left: CompareSheetChoice | null =
    currentDrawing && currentVersion
      ? { drawing: currentDrawing, version: currentVersion }
      : allDrawings[0]?.versions[0]
        ? { drawing: allDrawings[0], version: allDrawings[0].versions[0] }
        : null;

  if (!left) return { left: null, right: null };

  let right: CompareSheetChoice | null = null;
  const otherV = left.drawing.versions.find((v) => v.id !== left.version.id);
  if (otherV) {
    right = { drawing: left.drawing, version: otherV };
  } else {
    const otherD = allDrawings.find((d) => d.id !== left.drawing.id);
    if (otherD?.versions[0]) {
      right = { drawing: otherD, version: otherD.versions[0] };
    }
  }

  return { left, right };
}

function sheetLabel(choice: CompareSheetChoice): string {
  return `${choice.drawing.id} · ${choice.version.name}`;
}

type SheetSlotProps = {
  side: 'left' | 'right';
  title: string;
  choice: CompareSheetChoice | null;
  picking: 'left' | 'right' | null;
  pickerSearch: string;
  onPickerSearchChange: (v: string) => void;
  pickerDrawing: DrawingData | null;
  onPickerDrawingChange: (d: DrawingData | null) => void;
  filteredDrawings: DrawingData[];
  onStartPick: () => void;
  onApplyPick: (drawing: DrawingData, version: DrawingVersion) => void;
  onPickerDone: () => void;
};

function CompareSheetSlot({
  side,
  title,
  choice,
  picking,
  pickerSearch,
  onPickerSearchChange,
  pickerDrawing,
  onPickerDrawingChange,
  filteredDrawings,
  onStartPick,
  onApplyPick,
  onPickerDone,
}: SheetSlotProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{title}</p>
          <p
            className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100"
            title={choice ? sheetLabel(choice) : undefined}
          >
            {choice ? sheetLabel(choice) : '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={onStartPick}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
        >
          Change
        </button>
      </div>
      <div className="relative flex min-h-[140px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-zinc-600 dark:bg-zinc-900">
        {choice ? (
          <img src={choice.version.thumbnailUrl} alt="" className="max-h-[200px] w-full object-contain" />
        ) : (
          <span className="px-3 text-center text-sm text-gray-400 dark:text-zinc-500">No sheet selected</span>
        )}
      </div>
      {picking === side && (
        <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-900">
          <div>
            <label htmlFor={`compare-search-${side}`} className="linarc-field-label">
              Drawing
            </label>
            <input
              id={`compare-search-${side}`}
              type="search"
              value={pickerSearch}
              onChange={(e) => onPickerSearchChange(e.target.value)}
              placeholder="Search by ID or title…"
              className="linarc-input"
              autoFocus
            />
          </div>
          <ul className="max-h-28 overflow-y-auto rounded-md border border-gray-100 dark:border-zinc-700">
            {filteredDrawings.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onPickerDrawingChange(d)}
                  className={`w-full px-2 py-1.5 text-left text-xs transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 ${
                    pickerDrawing?.id === d.id ? 'bg-blue-50 font-semibold dark:bg-blue-950/40' : ''
                  }`}
                >
                  <span className="text-gray-900 dark:text-zinc-100">{d.id}</span>
                  <span className="text-gray-500 dark:text-zinc-400"> — {d.title}</span>
                </button>
              </li>
            ))}
          </ul>
          {pickerDrawing && (
            <div>
              <span className="linarc-field-label">Version</span>
              <ul className="max-h-32 overflow-y-auto rounded-md border border-gray-100 dark:border-zinc-700">
                {pickerDrawing.versions.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => onApplyPick(pickerDrawing, v)}
                      className="w-full px-2 py-2 text-left text-xs transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
                    >
                      <span className="font-medium text-gray-900 dark:text-zinc-100">{v.name}</span>
                      <span className="block text-[11px] text-gray-500 dark:text-zinc-500">{v.timestamp}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={onPickerDone}
            className="w-full rounded-lg border border-gray-200 py-1.5 text-xs font-semibold text-gray-600 dark:border-zinc-600 dark:text-zinc-400"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

const CompareSheetsModal: React.FC<CompareSheetsModalProps> = ({
  isOpen,
  onClose,
  allDrawings,
  currentDrawing,
  currentVersion,
  onCompare,
}) => {
  const [left, setLeft] = useState<CompareSheetChoice | null>(null);
  const [right, setRight] = useState<CompareSheetChoice | null>(null);
  const [picking, setPicking] = useState<'left' | 'right' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerDrawing, setPickerDrawing] = useState<DrawingData | null>(null);

  const resetFromProps = useCallback(() => {
    const { left: L, right: R } = defaultPair(allDrawings, currentDrawing, currentVersion);
    setLeft(L);
    setRight(R);
    setPicking(null);
    setPickerSearch('');
    setPickerDrawing(null);
  }, [allDrawings, currentDrawing, currentVersion]);

  useEffect(() => {
    if (isOpen) resetFromProps();
  }, [isOpen, resetFromProps]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const filteredDrawings = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return allDrawings;
    return allDrawings.filter(
      (d) => d.id.toLowerCase().includes(q) || d.title.toLowerCase().includes(q)
    );
  }, [allDrawings, pickerSearch]);

  const startPick = (side: 'left' | 'right') => {
    setPicking(side);
    setPickerSearch('');
    const seed = side === 'left' ? left : right;
    setPickerDrawing(seed?.drawing ?? allDrawings[0] ?? null);
  };

  const applyPick = (drawing: DrawingData, version: DrawingVersion) => {
    const choice: CompareSheetChoice = { drawing, version };
    if (picking === 'left') setLeft(choice);
    if (picking === 'right') setRight(choice);
    setPicking(null);
    setPickerSearch('');
    setPickerDrawing(null);
  };

  const pickerDone = () => {
    setPicking(null);
    setPickerSearch('');
    setPickerDrawing(null);
  };

  const canCompare =
    !!left &&
    !!right &&
    !(left.drawing.id === right.drawing.id && left.version.id === right.version.id);

  const handleCompare = () => {
    if (!left || !right || !canCompare) return;
    onCompare(left, right);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="linarc-modal-overlay" onClick={onClose}>
      <div
        className="linarc-modal-panel max-w-5xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-sheets-title"
      >
        <div className="linarc-modal-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="compare-sheets-title" className="linarc-modal-title">
                Compare sheets
              </h3>
              <p className="linarc-modal-subtitle">
                Choose two drawings to overlay into a single view. Color coding shows what belongs to each drawing.
              </p>
            </div>
            <button type="button" onClick={onClose} className="linarc-modal-close shrink-0" aria-label="Close">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="linarc-modal-body !pt-2">
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-start">
            <CompareSheetSlot
              side="left"
              title="Drawing 1"
              choice={left}
              picking={picking}
              pickerSearch={pickerSearch}
              onPickerSearchChange={setPickerSearch}
              pickerDrawing={pickerDrawing}
              onPickerDrawingChange={setPickerDrawing}
              filteredDrawings={filteredDrawings}
              onStartPick={() => startPick('left')}
              onApplyPick={applyPick}
              onPickerDone={pickerDone}
            />
            <CompareSheetSlot
              side="right"
              title="Drawing 2"
              choice={right}
              picking={picking}
              pickerSearch={pickerSearch}
              onPickerSearchChange={setPickerSearch}
              pickerDrawing={pickerDrawing}
              onPickerDrawingChange={setPickerDrawing}
              filteredDrawings={filteredDrawings}
              onStartPick={() => startPick('right')}
              onApplyPick={applyPick}
              onPickerDone={pickerDone}
            />
          </div>
        </div>

        <div className="linarc-modal-footer">
          <button type="button" onClick={onClose} className="linarc-btn-modal-cancel">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCompare}
            disabled={!canCompare}
            className="linarc-btn-primary py-2.5 px-5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareSheetsModal;
