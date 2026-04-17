

// Fix: Import 'useCallback' from 'react' to resolve 'Cannot find name' errors.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, ChevronUp, ChevronDown } from 'lucide-react';
import type { Rectangle, Pin, ViewTransform, InteractionState, HoveredItemInfo, ResizeHandle, Measurement, LineMarkup, LineToolType, TextMarkup } from '../types';
import ScaleDialog from './ScaleDialog';
import { RectangleTagType, ToolbarPosition, ImageGeom } from '../App';
import { UploadIcon, TrashIcon, LinkIcon, ArrowUpTrayIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowsPointingOutIcon, SunIcon, MoonIcon, SafetyPinIcon, PunchPinIcon, PhotoPinIcon, InformationCircleIcon, FilterIcon, CogIcon } from './Icons';
import Toolbar from './Toolbar';
import Tooltip from './Tooltip';
import MarkupColorPicker from './MarkupColorPicker';
import { resolveRectFillColor, resolveRectStrokeColor } from '../utils/markupColors';
import { getRectDimensions, formatFt, formatArea } from '../utils/measurementUtils';
import { MENUS_MODE } from '../utils/showcaseMode';

type ActiveTool = 'select' | 'shape' | 'pen' | 'line' | 'arrow' | 'freeline' | 'text' | 'pin' | 'image' | 'location' | 'measurement' | 'polygon' | 'highlighter' | 'customPin' | 'fill' | 'stroke';
type ActiveShape = 'cloud' | 'box' | 'ellipse';
type ActivePinType = 'photo' | 'safety' | 'punch';
type ActiveColor = 'fill' | 'stroke';
type FilterCategory = 'rfi' | 'submittal' | 'punch' | 'drawing' | 'photo' | 'safety';


interface CanvasViewProps {
    imageSrc: string;
    rectangles: Rectangle[];
    pins: Pin[];
    lineMarkups: LineMarkup[];
    textMarkups: TextMarkup[];
    selectedTextId: string | null;
    setSelectedTextId: (id: string | null) => void;
    onCreateTextMarkup: (text: TextMarkup) => void;
    onUpdateTextMarkup: (id: string, changes: Partial<TextMarkup>) => void;
    onDeleteTextMarkup: (id: string) => void;
    filters: Record<FilterCategory, boolean>;
    viewTransform: ViewTransform;
    interaction: InteractionState;
    activeTool: ActiveTool;
    hoveredRectId: string | null;
    hoveredLineId?: string | null;
    draggingPinId: string | null;
    selectedRectIds: string[];
    selectedPinId: string | null;
    selectedLineIds: string[];
    selectedLineId: string | null;
    selectedLinePointIndex: number | null;
    currentRect: Omit<Rectangle, 'id' | 'name' | 'visible'> | null;
    currentLineMarkup?: LineMarkup | null;
    marqueeRect: Omit<Rectangle, 'id' | 'name' | 'visible'> | null;
    isMenuVisible: boolean;
    linkMenuRectId: string | null;
    setLinkMenuRectId: (id: string | null) => void;
    openLinkSubmenu: string | null;
    theme: 'light' | 'dark';
    toolbarPosition: ToolbarPosition;
    setToolbarPosition: (position: ToolbarPosition) => void;
    isSpacebarDown: boolean;
    imageContainerRef: React.RefObject<HTMLDivElement>;
    imageGeom: ImageGeom;
    onImageGeomChange: (geom: ImageGeom) => void;
    setViewTransform: (t: ViewTransform) => void;
    handleMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseUp: (event: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseLeave: () => void;
    handleZoom: (direction: 'in' | 'out' | 'reset') => void;
    handleThemeToggle: () => void;
    setHoveredRectId: (id: string | null) => void;
    setActiveTool: (tool: ActiveTool) => void;
    activeLineTool: LineToolType;
    setActiveLineTool: (tool: LineToolType) => void;
    activeShape: ActiveShape;
    setActiveShape: (shape: ActiveShape) => void;
    activePinType: ActivePinType;
    setActivePinType: (pinType: ActivePinType) => void;
    activeColor: ActiveColor;
    markupFillColor: string;
    markupStrokeColor: string;
    onMarkupColorChange: (mode: ActiveColor, value: string) => void;
    onMarkupActiveModeChange: (mode: ActiveColor) => void;
    setDraggingPinId: (id: string | null) => void;
    setSelectedPinId: (id: string | null) => void;
    setSelectedLineIds: (ids: string[]) => void;
    setSelectedLineId: (id: string | null) => void;
    setSelectedLinePointIndex: (index: number | null) => void;
    handlePinDetails: (pin: Pin) => void;
    handleDeletePin: (pinId: string) => void;
    setHoveredItem: (item: HoveredItemInfo | null) => void;
    hidePopupTimer: React.MutableRefObject<number | null>;
    showPopupTimer: React.MutableRefObject<number | null>;
    handleResizeStart: (event: React.MouseEvent<HTMLDivElement>, rectId: string, handle: ResizeHandle) => void;
    handlePublishRect: (event: React.MouseEvent, id: string) => void;
    handleLinkRect: (event: React.MouseEvent, id: string) => void;
    onDeleteSelection: () => void;
    setOpenLinkSubmenu: (submenu: string | null) => void;
    handleSubmenuLink: (e: React.MouseEvent, type: string, targetId: string | null) => void;
    onOpenRfiPanel: (rectId: string, rfiId: number | null) => void;
    onOpenPhotoViewer: (config: { rectId?: string; photoId: string, pinId?: string }) => void;
    mouseDownRef: React.RefObject<{ x: number, y: number } | null>;
    setSelectedRectIds: (ids: string[]) => void;
    getRelativeCoords: (event: React.MouseEvent | WheelEvent | MouseEvent) => { x: number; y: number } | null;
    setPinDragOffset: (offset: {x: number, y: number} | null) => void;
    measurements: Measurement[];
    drawingScale: number | null;
    onMeasurementAdd: (m: Measurement) => void;
    onMeasurementDelete: (id: string) => void;
    onMeasurementUpdate: (m: Measurement) => void;
    onDrawingScaleSet: (pixelsPerFoot: number) => void;
    onNaturalSizeChange?: (size: { width: number; height: number }) => void;
    /** Incremented from App when user clears scale — syncs calibration UI */
    drawingScaleClearTick: number;
    /** Incremented when user recalibrates — resets UI and opens scale dialog */
    drawingScaleRecalibrateTick: number;
    /** Called when user confirms "Start Calibrating" — clears drawing scale in parent */
    onBeginScaleRecalibration: () => void;
    /** When set, renders two overlaid images for compare mode instead of the single imageSrc */
    compareImages?: {
        leftSrc: string;
        rightSrc: string;
        leftVisible: boolean;
        rightVisible: boolean;
    };
    /** Alignment offset for the right compare image, plus whether alignment drag mode is active */
    compareAlignment?: {
        offset: { x: number; y: number };
        isAligning: boolean;
        onOffsetChange: (offset: { x: number; y: number }) => void;
        onConfirmAlign?: () => void;
    };
}

const calibSpinHidden =
    '[-moz-appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none';

interface CalibStepperFieldProps {
    value: string;
    onChange: (v: string) => void;
    min?: number;
    max?: number;
    step?: number;
    inputMode?: 'decimal' | 'numeric';
    onEnter?: () => void;
    autoFocus?: boolean;
}

/** Native spinners stay hidden; custom chevrons match the dark calibration popover. */
const CalibStepperField: React.FC<CalibStepperFieldProps> = ({
    value,
    onChange,
    min = 0,
    max = Number.POSITIVE_INFINITY,
    step = 1,
    inputMode = 'numeric',
    onEnter,
    autoFocus,
}) => {
    const bump = (direction: 1 | -1) => {
        const n = parseFloat(value);
        const base = Number.isFinite(n) ? n : 0;
        const next = Math.min(max, Math.max(min, base + direction * step));
        onChange(String(next));
    };

    const stepBtn =
        'flex flex-1 items-center justify-center text-gray-400 transition-colors hover:bg-gray-700/90 hover:text-white active:bg-gray-600';

    return (
        <div className="flex overflow-hidden rounded-lg border border-gray-600 bg-gray-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <input
                type="number"
                min={min}
                max={Number.isFinite(max) ? max : undefined}
                step={step}
                inputMode={inputMode}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onEnter?.();
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        bump(1);
                    }
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        bump(-1);
                    }
                }}
                placeholder="0"
                autoFocus={autoFocus}
                className={`min-w-0 w-11 border-0 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 ${calibSpinHidden}`}
            />
            <div className="flex w-7 flex-shrink-0 flex-col border-l border-gray-600">
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Increase"
                    onClick={() => bump(1)}
                    className={`${stepBtn} rounded-none border-b border-gray-600/80`}
                >
                    <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                </button>
                <button type="button" tabIndex={-1} aria-label="Decrease" onClick={() => bump(-1)} className={stepBtn}>
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
                </button>
            </div>
        </div>
    );
};

const CanvasView: React.FC<CanvasViewProps> = (props) => {
    const {
        imageSrc, rectangles, pins, lineMarkups, textMarkups, selectedTextId, setSelectedTextId, onCreateTextMarkup, onUpdateTextMarkup, onDeleteTextMarkup, filters, viewTransform, interaction, activeTool, hoveredRectId, hoveredLineId, draggingPinId,
        selectedRectIds, selectedPinId, selectedLineIds, selectedLineId, selectedLinePointIndex, currentRect, currentLineMarkup, marqueeRect, isMenuVisible, linkMenuRectId, setLinkMenuRectId, openLinkSubmenu,
        theme, toolbarPosition, setToolbarPosition, isSpacebarDown, imageContainerRef, imageGeom, onImageGeomChange,
        setViewTransform, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleZoom, handleThemeToggle,
        setHoveredRectId, setActiveTool, activeLineTool, setActiveLineTool, activeShape, setActiveShape, activePinType, setActivePinType, activeColor,
        markupFillColor, markupStrokeColor, onMarkupColorChange, onMarkupActiveModeChange,
        setDraggingPinId, setSelectedPinId, setSelectedLineIds, setSelectedLineId, setSelectedLinePointIndex, handlePinDetails, handleDeletePin, setHoveredItem,
        hidePopupTimer, showPopupTimer, handleResizeStart, handlePublishRect, handleLinkRect, onDeleteSelection, setOpenLinkSubmenu,
        handleSubmenuLink, onOpenRfiPanel, onOpenPhotoViewer, mouseDownRef, setSelectedRectIds, getRelativeCoords, setPinDragOffset,
        measurements, drawingScale, onMeasurementAdd, onMeasurementDelete, onMeasurementUpdate, onDrawingScaleSet, onNaturalSizeChange,
        drawingScaleClearTick, drawingScaleRecalibrateTick, onBeginScaleRecalibration,
        compareImages, compareAlignment,
    } = props;

    // Compare mode: recolored SVG blob URLs (blue for left, red for right)
    const [compareLeftUrl, setCompareLeftUrl] = useState<string | null>(null);
    const [compareRightUrl, setCompareRightUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!compareImages) {
            setCompareLeftUrl(null);
            setCompareRightUrl(null);
            return;
        }
        let cancelled = false;

        const recolor = (src: string, color: string): Promise<string> =>
            fetch(src)
                .then(r => r.text())
                .then(svg => {
                    // Replace all dark stroke/fill colors with the target color; keep white background
                    const colored = svg
                        .replace(/stroke="#0a0a1a"/g, `stroke="${color}"`)
                        .replace(/stroke="#888"/g, `stroke="${color}55"`)
                        .replace(/stroke="#444"/g, `stroke="${color}88"`)
                        .replace(/stroke="#555"/g, `stroke="${color}66"`)
                        .replace(/fill="#0a0a1a"/g, `fill="${color}"`)
                        .replace(/fill="#2a2a4a"/g, `fill="${color}cc"`)
                        .replace(/fill="#444"/g, `fill="${color}99"`)
                        .replace(/fill="#666"/g, `fill="${color}88"`)
                        .replace(/fill="#f0f4ff"/g, 'fill="white"');
                    const blob = new Blob([colored], { type: 'image/svg+xml' });
                    return URL.createObjectURL(blob);
                });

        recolor(compareImages.leftSrc, '#1a6fff').then(url => { if (!cancelled) setCompareLeftUrl(url); });
        recolor(compareImages.rightSrc, '#e8000a').then(url => { if (!cancelled) setCompareRightUrl(url); });

        return () => {
            cancelled = true;
            setCompareLeftUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
            setCompareRightUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
        };
    }, [compareImages?.leftSrc, compareImages?.rightSrc]);

    // Alignment drag tracking (no re-render needed during drag)
    const alignDragRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);

    // Arrow-key nudge for alignment mode
    useEffect(() => {
        if (!compareAlignment?.isAligning) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                compareAlignment.onConfirmAlign?.();
                return;
            }
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const delta = {
                ArrowUp:    { x: 0, y: -step },
                ArrowDown:  { x: 0, y:  step },
                ArrowLeft:  { x: -step, y: 0 },
                ArrowRight: { x:  step, y: 0 },
            }[e.key]!;
            compareAlignment.onOffsetChange({
                x: compareAlignment.offset.x + delta.x,
                y: compareAlignment.offset.y + delta.y,
            });
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [compareAlignment]);

    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [markupColorPanelOpen, setMarkupColorPanelOpen] = useState(MENUS_MODE);
    /** Where the color panel was opened from — drives anchoring (toolbar vs selection bar). */
    const [markupColorPanelSource, setMarkupColorPanelSource] = useState<'toolbar' | 'selection' | null>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const markupColorPanelRef = useRef<HTMLDivElement>(null);
    const markupToolbarFillStrokeRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Measurement tool state
    const [showScaleDialog, setShowScaleDialog] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [measStart, setMeasStart] = useState<{ x: number; y: number } | null>(null);
    const [measCurrent, setMeasCurrent] = useState<{ x: number; y: number } | null>(null);
    const [calibLine, setCalibLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    const [showCalibInput, setShowCalibInput] = useState(false);
    const [calibFt, setCalibFt] = useState('');
    const [calibIn, setCalibIn] = useState('');
    const [hoveredMeasId, setHoveredMeasId] = useState<string | null>(null);
    const [draggingMeasId, setDraggingMeasId] = useState<string | null>(null);
    const [draggingMeasEndpoint, setDraggingMeasEndpoint] = useState<'p1' | 'p2' | null>(null);
    /** Rubber-band preview from last freeline point to cursor while adding points (%, image space). */
    const [freelinePreviewEnd, setFreelinePreviewEnd] = useState<{ x: number; y: number } | null>(null);

    // ── Local canvas pan state (select tool, empty-canvas drag) ───────────
    /** True while the user is panning by dragging empty canvas with the select tool. */
    const [isLocalPanning, setIsLocalPanning] = useState(false);
    /** Stores the pointer and transform values recorded when the pan started. */
    const panStartRef = useRef<{ clientX: number; clientY: number; tx: number; ty: number; scale: number } | null>(null);

    // ── Text markup interaction state ──────────────────────────────────────
    /** ID of text markup currently being inline-edited. */
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    /** Moving a text markup: tracks start mouse position and text's original x/y. */
    const [movingTextState, setMovingTextState] = useState<{ textId: string; startMouseX: number; startMouseY: number; startTextX: number; startTextY: number } | null>(null);
    /** Drawing a new text area rectangle: tracks start and current drag position (percentages). */
    const [textDrawState, setTextDrawState] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
    /** Whether the text color palette row is open. */
    const [textColorPopoverOpen, setTextColorPopoverOpen] = useState(false);
    /** Whether the font-size dropdown is open. */
    const [textSizeDropdownOpen, setTextSizeDropdownOpen] = useState(false);
    /** Ref to the screen-space textarea overlay used when editing a text markup. */
    const editingTextRef = useRef<HTMLTextAreaElement>(null);
    /** Pending text content while editing (synced on every change event). */
    const editingTextContent = useRef<string>('');
    /**
     * Cached copy of the TextMarkup being edited. Updated whenever edit mode starts
     * so the textarea can render even if textMarkups prop hasn't propagated yet.
     */
    const editingTextCache = useRef<TextMarkup | null>(null);

    const resetMeasurementCalibrationUi = useCallback(() => {
        setIsCalibrating(false);
        setShowCalibInput(false);
        setCalibLine(null);
        setMeasStart(null);
        setMeasCurrent(null);
        setCalibFt('');
        setCalibIn('');
        setHoveredMeasId(null);
        setDraggingMeasId(null);
        setDraggingMeasEndpoint(null);
    }, []);

    /** Commit pending edit to the markup store. Clears editingTextId. */
    const commitTextEdit = useCallback(() => {
        if (!editingTextId) return;
        const capturedId = editingTextId;
        const raw = editingTextContent.current.trim();
        if (raw) {
            onUpdateTextMarkup(capturedId, { text: raw });
        } else {
            // Empty text → delete the markup
            onDeleteTextMarkup(capturedId);
            setSelectedTextId(null);
        }
        // Use functional updater to avoid overriding a new edit session
        setEditingTextId(prev => prev === capturedId ? null : prev);
        editingTextContent.current = '';
        editingTextCache.current = null;
    }, [editingTextId, onUpdateTextMarkup, onDeleteTextMarkup, setSelectedTextId]);

    /** Focus the textarea after all mouse events (mousedown/mouseup) have finished. */
    useEffect(() => {
        if (!editingTextId) return;
        const id = setTimeout(() => {
            const ta = editingTextRef.current;
            if (ta) { ta.focus(); ta.select(); }
        }, 0);
        return () => clearTimeout(id);
    }, [editingTextId]);

    /** Close color/size popovers when text selection changes. */
    useEffect(() => {
        setTextColorPopoverOpen(false);
        setTextSizeDropdownOpen(false);
    }, [selectedTextId]);

    const prevDrawingScaleClearTick = useRef(0);
    const prevDrawingScaleRecalibrateTick = useRef(0);

    useEffect(() => {
        if (drawingScaleClearTick === 0) return;
        if (drawingScaleClearTick === prevDrawingScaleClearTick.current) return;
        prevDrawingScaleClearTick.current = drawingScaleClearTick;
        resetMeasurementCalibrationUi();
        setShowScaleDialog(activeTool === 'measurement');
    }, [drawingScaleClearTick, activeTool, resetMeasurementCalibrationUi]);

    useEffect(() => {
        if (drawingScaleRecalibrateTick === 0) return;
        if (drawingScaleRecalibrateTick === prevDrawingScaleRecalibrateTick.current) return;
        prevDrawingScaleRecalibrateTick.current = drawingScaleRecalibrateTick;
        resetMeasurementCalibrationUi();
        setShowScaleDialog(true);
    }, [drawingScaleRecalibrateTick, resetMeasurementCalibrationUi]);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const size = { width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight };
        setNaturalSize(size);
        onNaturalSizeChange?.(size);
    };

    useEffect(() => {
        const container = imageContainerRef.current;
        if (!container) return;
        const resizeObserver = new ResizeObserver(() => {
            setContainerSize({
                width: container.offsetWidth,
                height: container.offsetHeight,
            });
        });
        resizeObserver.observe(container);
        return () => { if(container) resizeObserver.unobserve(container) };
    }, [imageContainerRef]);

    useEffect(() => {
        if (linkMenuRectId) setMarkupColorPanelOpen(false);
    }, [linkMenuRectId]);

    useEffect(() => {
        if (!markupColorPanelOpen) setMarkupColorPanelSource(null);
    }, [markupColorPanelOpen]);

    useEffect(() => {
        if (activeTool !== 'freeline') {
            setFreelinePreviewEnd(null);
            return;
        }
        const fl = selectedLineId
            ? lineMarkups.find((l) => l.id === selectedLineId && l.type === 'freeline' && !l.closed)
            : null;
        if (!fl || fl.points.length < 1) {
            setFreelinePreviewEnd(null);
        }
    }, [activeTool, selectedLineId, lineMarkups]);

    useEffect(() => {
        if (!markupColorPanelOpen) return;
        const onDown = (e: MouseEvent) => {
            if (MENUS_MODE) return;
            const t = e.target as HTMLElement;
            if (markupColorPanelRef.current?.contains(t)) return;
            if (t.closest('[data-markup-color-trigger]')) return;
            setMarkupColorPanelOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [markupColorPanelOpen]);

    useEffect(() => {
        if (!markupColorPanelOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMarkupColorPanelOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [markupColorPanelOpen]);

    useEffect(() => {
        if (activeTool === 'measurement' && drawingScale === null && !isCalibrating && !showScaleDialog) {
            setShowScaleDialog(true);
        }
    }, [activeTool, drawingScale, isCalibrating, showScaleDialog]);

    useEffect(() => {
        const container = imageContainerRef.current;
        if (!container || !naturalSize.width) {
            onImageGeomChange({ width: 0, height: 0, x: 0, y: 0 });
            return;
        }

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const { width: imageNaturalWidth, height: imageNaturalHeight } = naturalSize;
        const imageAspectRatio = imageNaturalWidth / imageNaturalHeight;
        const containerAspectRatio = containerWidth / containerHeight;

        let renderedImageWidth, renderedImageHeight, offsetX, offsetY;

        if (imageAspectRatio > containerAspectRatio) {
            renderedImageWidth = containerWidth;
            renderedImageHeight = containerWidth / imageAspectRatio;
            offsetX = 0;
            offsetY = (containerHeight - renderedImageHeight) / 2;
        } else {
            renderedImageWidth = containerHeight * imageAspectRatio;
            renderedImageHeight = containerHeight;
            offsetX = (containerWidth - renderedImageWidth) / 2;
            offsetY = 0;
        }
        
        onImageGeomChange({
            width: renderedImageWidth,
            height: renderedImageHeight,
            x: offsetX,
            y: offsetY,
        });
    }, [containerSize, naturalSize, onImageGeomChange, imageContainerRef]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
            setIsSettingsMenuOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCursorClass = () => {
        if (compareAlignment?.isAligning) return 'cursor-grab';

        // Active interactions always take priority
        if (isLocalPanning || interaction.type === 'panning' || draggingPinId) return 'cursor-grabbing';
        if (movingTextState) return 'cursor-grabbing';
        if (interaction.type === 'moving') return 'cursor-grabbing';
        if (interaction.type === 'resizing') {
            if (interaction.handle === 'tl' || interaction.handle === 'br') return 'cursor-nwse-resize';
            if (interaction.handle === 'tr' || interaction.handle === 'bl') return 'cursor-nesw-resize';
        }
        if (interaction.type === 'drawing' || interaction.type === 'marquee' || textDrawState) return 'cursor-crosshair';
        if (draggingMeasId) return 'cursor-grabbing';

        // Spacebar pan mode — closed hand cursor (overrides idle tool cursors)
        if (isSpacebarDown) return 'cursor-grabbing';

        // Hover context: what is under the cursor right now?
        // Rects and lines use pointer-events:none so the container handles their cursor.
        // Text and pin elements set their own cursor via inline style (handled at element level).
        const overRect = !!hoveredRectId;
        const overLine = !!hoveredLineId;
        const overMarkup = overRect || overLine;
        const hoveredIsSelected =
            (overRect && selectedRectIds.includes(hoveredRectId!)) ||
            (overLine && selectedLineIds.includes(hoveredLineId!));

        if (activeTool === 'select') {
            if (overMarkup) return hoveredIsSelected ? 'cursor-move' : 'cursor-default';
            // Empty canvas: open hand (inviting pan)
            return 'cursor-grab';
        }

        // All drawing tools: objects always take priority for selection → show arrow
        if (overMarkup) return 'cursor-default';

        // Empty-canvas cursor per drawing tool
        if (activeTool === 'measurement') return 'cursor-crosshair';
        if (activeTool === 'text') return 'cursor-crosshair';
        if (activeTool === 'pin') return 'cursor-crosshair';
        if (activeTool === 'pen' || activeTool === 'highlighter') return 'cursor-crosshair';
        if (activeTool === 'line' || activeTool === 'arrow' || activeTool === 'freeline') return 'cursor-crosshair';
        if (activeTool === 'shape') return 'cursor-crosshair';

        return 'cursor-default';
    };

    const normalizeRect = (rect: Omit<Rectangle, 'id' | 'name' | 'visible'> | Rectangle): Rectangle => {
      const newRect = { ...rect, id: 'id' in rect ? rect.id : '', shape: 'shape' in rect && rect.shape ? rect.shape : activeShape, name: 'name' in rect ? rect.name : '', visible: 'visible' in rect ? rect.visible : true };
      if (newRect.width < 0) {
        newRect.x = newRect.x + newRect.width;
        newRect.width = Math.abs(newRect.width);
      }
      if (newRect.height < 0) {
        newRect.y = newRect.y + newRect.height;
        newRect.height = Math.abs(newRect.height);
      }
      return newRect;
    };
    
    /**
     * Returns true when the given canvas-percentage coords are over empty space —
     * no visible rect, no line (from last-frame hoveredLineId).
     * Text and pin divs stop propagation on mousedown, so if onCanvasMouseDown
     * fires at all we already know we're not over one of those.
     */
    const isEmptyCanvas = (coords: { x: number; y: number }): boolean => {
        // Rect hit test (they have pointer-events:none so we must check manually)
        for (let i = rectangles.length - 1; i >= 0; i--) {
            const r = rectangles[i];
            if (!r.visible) continue;
            const n = normalizeRect(r);
            if (coords.x >= n.x && coords.x <= n.x + n.width &&
                coords.y >= n.y && coords.y <= n.y + n.height) return false;
        }
        // Line hit — use last-frame hoveredLineId (accurate for the position the user just clicked)
        if (hoveredLineId) return false;
        return true;
    };

    const getScreenPoint = useCallback((x: number, y: number): { left: number; top: number } | null => {
        if (!imageGeom.width) return null;

        const imagePixelX = (x / 100) * imageGeom.width;
        const imagePixelY = (y / 100) * imageGeom.height;
        const containerPixelX = imagePixelX + imageGeom.x;
        const containerPixelY = imagePixelY + imageGeom.y;

        return {
          left: containerPixelX * viewTransform.scale + viewTransform.translateX,
          top: containerPixelY * viewTransform.scale + viewTransform.translateY,
        };
    }, [viewTransform, imageGeom]);

    /**
     * Returns coordinates in the LOCAL space of the CSS-transform div (no viewTransform applied).
     * Use this for SVG elements that live INSIDE the transform div — the CSS transform already
     * handles zoom/pan, so baking viewTransform in again would double-apply it and cause drift.
     * Rectangles use the identical formula for their left/top positioning.
     */
    const getLocalPoint = useCallback((x: number, y: number): { left: number; top: number } | null => {
        if (!imageGeom.width) return null;
        return {
            left: (x / 100) * imageGeom.width + imageGeom.x,
            top:  (y / 100) * imageGeom.height + imageGeom.y,
        };
    }, [imageGeom]);

    const getScreenRect = useCallback((rect: Omit<Rectangle, 'id' | 'name' | 'visible'> | Rectangle): { left: number; top: number; width: number; height: number; } => {
        if (!imageGeom.width) return { left: 0, top: 0, width: 0, height: 0 };

        const imagePixelX = (rect.x / 100) * imageGeom.width;
        const imagePixelY = (rect.y / 100) * imageGeom.height;
        const imagePixelWidth = (rect.width / 100) * imageGeom.width;
        const imagePixelHeight = (rect.height / 100) * imageGeom.height;

        const containerPixelX = imagePixelX + imageGeom.x;
        const containerPixelY = imagePixelY + imageGeom.y;

        return {
          left: containerPixelX * viewTransform.scale + viewTransform.translateX,
          top: containerPixelY * viewTransform.scale + viewTransform.translateY,
          width: imagePixelWidth * viewTransform.scale,
          height: imagePixelHeight * viewTransform.scale,
        };
    }, [viewTransform, imageGeom]);

    const generateCloudPath = (w: number, h: number) => {
        if (w <= 0 || h <= 0) return '';
        const r = Math.max(6, Math.min(w / 4, h / 4, 15));
        let path = `M ${r},0`;
        const topScallops = Math.max(1, Math.round((w - 2 * r) / (2 * r)));
        const topStep = (w - 2 * r) / topScallops;
        for (let i = 0; i < topScallops; i++) {
            path += ` a ${topStep / 2},${r} 0 0,1 ${topStep},0`;
        }
        path += ` a ${r},${r} 0 0,1 ${r},${r}`;
        const rightScallops = Math.max(1, Math.round((h - 2 * r) / (2 * r)));
        const rightStep = (h - 2 * r) / rightScallops;
        for (let i = 0; i < rightScallops; i++) {
            path += ` a ${r},${rightStep / 2} 0 0,1 0,${rightStep}`;
        }
        path += ` a ${r},${r} 0 0,1 -${r},${r}`;
        const bottomScallops = Math.max(1, Math.round((w - 2 * r) / (2 * r)));
        const bottomStep = (w - 2 * r) / bottomScallops;
        for (let i = 0; i < bottomScallops; i++) {
            path += ` a ${bottomStep / 2},${r} 0 0,1 -${bottomStep},0`;
        }
        path += ` a ${r},${r} 0 0,1 -${r},-${r}`;
        const leftScallops = Math.max(1, Math.round((h - 2 * r) / (2 * r)));
        const leftStep = (h - 2 * r) / leftScallops;
        for (let i = 0; i < leftScallops; i++) {
            path += ` a ${r},${leftStep / 2} 0 0,1 0,-${leftStep}`;
        }
        path += ` a ${r},${r} 0 0,1 ${r},-${r}`;
        return path;
    };

    const formatMeasurement = (feet: number): string => {
        const wholeFeet = Math.floor(feet);
        let inches = Math.round((feet - wholeFeet) * 12);
        if (inches === 12) { return `${wholeFeet + 1}'-0"`; }
        if (wholeFeet === 0) return `${inches}"`;
        if (inches === 0) return `${wholeFeet}'-0"`;
        return `${wholeFeet}'-${inches}"`;
    };

    const getMeasureDistancePx = (x1: number, y1: number, x2: number, y2: number): number => {
        if (!naturalSize.width) return 0;
        const dx = (x2 - x1) / 100 * naturalSize.width;
        const dy = (y2 - y1) / 100 * naturalSize.height;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getLiveMeasureLabel = (x1: number, y1: number, x2: number, y2: number): string => {
        if (!drawingScale) return '';
        const px = getMeasureDistancePx(x1, y1, x2, y2);
        return formatMeasurement(px / drawingScale);
    };

    // Returns the measurement and endpoint ('p1'|'p2') if the screen point is within hitRadius px of an endpoint
    const hitTestMeasEndpoint = (screenX: number, screenY: number, hitRadius = 10): { m: Measurement; endpoint: 'p1' | 'p2' } | null => {
        for (const m of measurements) {
            if (!m.visible) continue;
            const p1 = getScreenPoint(m.x1, m.y1);
            const p2 = getScreenPoint(m.x2, m.y2);
            if (p1) {
                const d1 = Math.sqrt((screenX - p1.left) ** 2 + (screenY - p1.top) ** 2);
                if (d1 <= hitRadius) return { m, endpoint: 'p1' };
            }
            if (p2) {
                const d2 = Math.sqrt((screenX - p2.left) ** 2 + (screenY - p2.top) ** 2);
                if (d2 <= hitRadius) return { m, endpoint: 'p2' };
            }
        }
        return null;
    };

    const onCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Universal interactive-UI guard — must be first so action menus / toolbar
        // clicks never accidentally clear state or start new interactions.
        if ((e.target as HTMLElement).closest('[data-interactive-ui="true"]')) return;

        // Clicks that land on the bare canvas clear text selection.
        // (Clicks on a text div are stopped by stopPropagation in the text handler.)
        if (selectedTextId) {
            setSelectedTextId(null);
            setTextColorPopoverOpen(false);
            setTextSizeDropdownOpen(false);
        }

        // Alignment drag mode — intercept all mouse activity
        if (compareAlignment?.isAligning) {
            alignDragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                startOffsetX: compareAlignment.offset.x,
                startOffsetY: compareAlignment.offset.y,
            };
            e.preventDefault();
            return;
        }
        // Endpoint drag: available in both select and measurement tool modes
        if ((activeTool === 'select' || activeTool === 'measurement') && drawingScale !== null && measurements.length > 0) {
            if (!(e.target as HTMLElement).closest('[data-interactive-ui="true"]')) {
                const hit = hitTestMeasEndpoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                if (hit) {
                    setDraggingMeasId(hit.m.id);
                    setDraggingMeasEndpoint(hit.endpoint);
                    return;
                }
            }
        }
        if (activeTool === 'measurement') {
            if ((e.target as HTMLElement).closest('[data-interactive-ui="true"]')) return;
            if (drawingScale !== null || isCalibrating) {
                const coords = getRelativeCoords(e);
                if (!coords) return;
                setMeasStart(coords);
                setMeasCurrent(coords);
                setShowCalibInput(false);
                return;
            }
        }
        if (activeTool === 'text') {
            if ((e.target as HTMLElement).closest('[data-interactive-ui="true"]')) return;
            const coords = getRelativeCoords(e);
            if (!coords) return;
            setTextDrawState({ startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y });
            return;
        }

        // ── Empty-canvas pan (select tool, primary button, no spacebar, no shift) ──
        // Must run before handleMouseDown so it owns the event and nothing else intercepts it.
        // Spacebar panning is handled inside the hook (fires earlier via isSpacebarDown check).
        // Shift+drag is reserved for marquee multi-select (handled by the hook).
        if (activeTool === 'select' && e.button === 0 && !isSpacebarDown && !e.shiftKey) {
            const coords = getRelativeCoords(e);
            if (coords && isEmptyCanvas(coords)) {
                panStartRef.current = {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    tx: viewTransform.translateX,
                    ty: viewTransform.translateY,
                    scale: viewTransform.scale,
                };
                setIsLocalPanning(true);
                return; // don't propagate to handleMouseDown
            }
        }

        handleMouseDown(e);
    };

    const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        // ── Local empty-canvas pan — must be first, nothing else runs ──────────
        if (isLocalPanning && panStartRef.current) {
            const dx = e.clientX - panStartRef.current.clientX;
            const dy = e.clientY - panStartRef.current.clientY;
            setViewTransform({
                scale: panStartRef.current.scale,
                translateX: panStartRef.current.tx + dx,
                translateY: panStartRef.current.ty + dy,
            });
            return;
        }
        // Text area rectangle draw preview
        if (textDrawState) {
            const coords = getRelativeCoords(e);
            if (coords) setTextDrawState(s => s ? { ...s, currentX: coords.x, currentY: coords.y } : s);
            return;
        }
        // Text markup drag
        if (movingTextState) {
            const coords = getRelativeCoords(e);
            if (coords) {
                const dx = coords.x - movingTextState.startMouseX;
                const dy = coords.y - movingTextState.startMouseY;
                onUpdateTextMarkup(movingTextState.textId, {
                    x: Math.max(0, Math.min(100, movingTextState.startTextX + dx)),
                    y: Math.max(0, Math.min(100, movingTextState.startTextY + dy)),
                });
            }
            return;
        }
        // Alignment drag mode
        if (compareAlignment?.isAligning && alignDragRef.current) {
            const dx = (e.clientX - alignDragRef.current.startX) / viewTransform.scale;
            const dy = (e.clientY - alignDragRef.current.startY) / viewTransform.scale;
            compareAlignment.onOffsetChange({
                x: alignDragRef.current.startOffsetX + dx,
                y: alignDragRef.current.startOffsetY + dy,
            });
            return;
        }
        // Endpoint drag runs regardless of active tool
        if (draggingMeasId && draggingMeasEndpoint) {
            const coords = getRelativeCoords(e);
            if (!coords) return;
            const m = measurements.find(x => x.id === draggingMeasId);
            if (!m) return;
            const updated = draggingMeasEndpoint === 'p1'
                ? { ...m, x1: coords.x, y1: coords.y }
                : { ...m, x2: coords.x, y2: coords.y };
            onMeasurementUpdate(updated);
            return;
        }
        if (activeTool === 'measurement' && measStart) {
            const coords = getRelativeCoords(e);
            if (coords) setMeasCurrent(coords);
            return;
        }
        if (activeTool === 'freeline' && interaction.type === 'none') {
            const fl = selectedLineId
                ? lineMarkups.find((l) => l.id === selectedLineId && l.type === 'freeline' && !l.closed)
                : null;
            if (fl && fl.points.length >= 1) {
                const coords = getRelativeCoords(e);
                setFreelinePreviewEnd(coords);
            } else {
                setFreelinePreviewEnd(null);
            }
        } else {
            setFreelinePreviewEnd(null);
        }

        // Live rect hover detection — drives cursor feedback for all tools.
        // Only run when no interaction is in progress (dragging, panning, etc.) so
        // we don't waste work or interfere with active gestures.
        if (!isLocalPanning && interaction.type === 'none' && !textDrawState && !movingTextState && !draggingMeasId) {
            const coords = getRelativeCoords(e);
            if (coords) {
                let hitId: string | null = null;
                for (let i = rectangles.length - 1; i >= 0; i--) {
                    const r = rectangles[i];
                    if (!r.visible) continue;
                    const n = normalizeRect(r);
                    if (coords.x >= n.x && coords.x <= n.x + n.width &&
                        coords.y >= n.y && coords.y <= n.y + n.height) {
                        hitId = r.id;
                        break;
                    }
                }
                setHoveredRectId(hitId);
            }
        }

        handleMouseMove(e);
    };

    const onCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        // ── Local empty-canvas pan end ─────────────────────────────────────────
        if (isLocalPanning) {
            panStartRef.current = null;
            setIsLocalPanning(false);
            return;
        }
        // Text area rectangle draw end
        if (textDrawState) {
            const { startX, startY, currentX, currentY } = textDrawState;
            setTextDrawState(null);
            const dx = Math.abs(currentX - startX);
            const dy = Math.abs(currentY - startY);
            const isDrag = dx > 0.5 || dy > 0.5;
            const x = Math.min(startX, currentX);
            const y = Math.min(startY, currentY);
            const width = isDrag ? dx : undefined;
            const newText: TextMarkup = {
                id: `text-${Date.now()}`,
                x,
                y,
                text: 'Text',
                name: `Text ${textMarkups.length + 1}`,
                visible: true,
                fontSize: 16,
                fontWeight: 'normal',
                fontStyle: 'normal',
                color: '#ef4444',
                width,
            };
            onCreateTextMarkup(newText);
            setSelectedTextId(newText.id);
            editingTextContent.current = 'Text';
            editingTextCache.current = newText;
            setEditingTextId(newText.id);
            return;
        }
        // Text markup drag end
        if (movingTextState) {
            setMovingTextState(null);
            return;
        }
        // Alignment drag mode
        if (compareAlignment?.isAligning) {
            alignDragRef.current = null;
            return;
        }
        // Endpoint drag runs regardless of active tool
        if (draggingMeasId) {
            setDraggingMeasId(null);
            setDraggingMeasEndpoint(null);
            return;
        }
        if (activeTool === 'measurement' && measStart && measCurrent) {
            const dx = measCurrent.x - measStart.x;
            const dy = measCurrent.y - measStart.y;
            const isClick = Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5;
            if (!isClick) {
                const line = { x1: measStart.x, y1: measStart.y, x2: measCurrent.x, y2: measCurrent.y };
                if (isCalibrating) {
                    setCalibLine(line);
                    setShowCalibInput(true);
                    setCalibFt('');
                    setCalibIn('');
                } else {
                    const newM: Measurement = { id: Date.now().toString(), ...line, visible: true };
                    onMeasurementAdd(newM);
                }
            }
            setMeasStart(null);
            setMeasCurrent(null);
            return;
        }
        handleMouseUp(e);
    };

    const onCanvasMouseLeave = () => {
        if (isLocalPanning) {
            panStartRef.current = null;
            setIsLocalPanning(false);
        }
        if (textDrawState) {
            setTextDrawState(null);
        }
        if (movingTextState) {
            setMovingTextState(null);
        }
        if (compareAlignment?.isAligning) {
            alignDragRef.current = null;
            return;
        }
        if (draggingMeasId) {
            setDraggingMeasId(null);
            setDraggingMeasEndpoint(null);
        }
        if (activeTool === 'measurement' && measStart) {
            setMeasStart(null);
            setMeasCurrent(null);
        }
        setFreelinePreviewEnd(null);
        setHoveredRectId(null);
        handleMouseLeave();
    };

    const isSingleSelection = selectedRectIds.length === 1;
    const isMultiSelection = selectedRectIds.length > 1;
    const selectedRectangle = isSingleSelection ? rectangles.find(r => r.id === selectedRectIds[0]) : null;
    const selectedLine = selectedLineId ? lineMarkups.find((line) => line.id === selectedLineId) : null;
    const lastSelectedRectangle = isMultiSelection ? rectangles.find(r => r.id === selectedRectIds[selectedRectIds.length - 1]) : null;
    
    let singleSelectionScreenRect = selectedRectangle ? getScreenRect(selectedRectangle) : null;
    let selectedLineScreenRect = selectedLine && selectedLine.points.length > 0 ? (() => {
        const points = selectedLine.points.map((p) => getScreenPoint(p.x, p.y)).filter(Boolean) as { left: number; top: number }[];
        if (points.length === 0) return null;
        const minX = Math.min(...points.map((p) => p.left));
        const maxX = Math.max(...points.map((p) => p.left));
        const minY = Math.min(...points.map((p) => p.top));
        const maxY = Math.max(...points.map((p) => p.top));
        return { left: minX, top: minY, width: Math.max(18, maxX - minX), height: Math.max(18, maxY - minY) };
    })() : null;
    let multiSelectionScreenRect = lastSelectedRectangle ? getScreenRect(lastSelectedRectangle) : null;
    let marqueeScreenRect = marqueeRect ? getScreenRect(normalizeRect(marqueeRect)) : null;
    const textDrawScreenRect = textDrawState ? (() => {
        const x = Math.min(textDrawState.startX, textDrawState.currentX);
        const y = Math.min(textDrawState.startY, textDrawState.currentY);
        const w = Math.abs(textDrawState.currentX - textDrawState.startX);
        const h = Math.abs(textDrawState.currentY - textDrawState.startY);
        if (w < 0.1 && h < 0.1) return null;
        return getScreenRect({ x, y, width: w, height: h, shape: 'box' } as any);
    })() : null;

    const getToolbarPositionClasses = () => {
        switch (toolbarPosition) {
            case 'top': return 'top-4 left-1/2 -translate-x-1/2';
            case 'left': return 'left-4 top-1/2 -translate-y-1/2';
            case 'right': return 'right-4 top-1/2 -translate-y-1/2';
            default: return 'bottom-4 left-1/2 -translate-x-1/2'; // bottom
        }
    };
    
    const ToolbarPositionButton: React.FC<{position: ToolbarPosition, label: string}> = ({position, label}) => (
      <button 
        onClick={() => setToolbarPosition(position)}
        className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${toolbarPosition === position ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-gray-700'}`}
      >
        {label}
      </button>
    );

    return (
        <div className="w-full h-full flex flex-col">
            <div className="relative w-full flex-grow">
                <div
                    ref={imageContainerRef}
                    className={`relative h-full w-full select-none overflow-hidden bg-neutral-200 dark:bg-zinc-950 ${getCursorClass()}`}
                    onMouseDown={onCanvasMouseDown}
                    onMouseMove={onCanvasMouseMove}
                    onMouseUp={onCanvasMouseUp}
                    onMouseLeave={onCanvasMouseLeave}
                >
                    <div
                        className="absolute top-0 left-0 will-change-transform"
                        style={{
                            transform: `translate3d(${viewTransform.translateX}px, ${viewTransform.translateY}px, 0) scale(${viewTransform.scale})`,
                            transformOrigin: '0 0',
                            width: `${containerSize.width}px`,
                            height: `${containerSize.height}px`,
                        }}
                    >
                        {compareImages ? (
                            <>
                                {compareImages.leftVisible && compareLeftUrl && (
                                    <img
                                        ref={imageRef}
                                        src={compareLeftUrl}
                                        alt="Drawing 1"
                                        className="w-full h-full object-contain pointer-events-none"
                                        onLoad={handleImageLoad}
                                        style={{
                                            position: 'absolute', top: 0, left: 0,
                                            mixBlendMode: 'multiply',
                                        }}
                                    />
                                )}
                                {compareImages.rightVisible && compareRightUrl && (
                                    <img
                                        ref={compareImages.leftVisible ? undefined : imageRef}
                                        src={compareRightUrl}
                                        alt="Drawing 2"
                                        className="w-full h-full object-contain pointer-events-none"
                                        onLoad={compareImages.leftVisible ? undefined : handleImageLoad}
                                        style={{
                                            position: 'absolute', top: 0, left: 0,
                                            transform: compareAlignment && (compareAlignment.offset.x !== 0 || compareAlignment.offset.y !== 0)
                                                ? `translate(${compareAlignment.offset.x}px, ${compareAlignment.offset.y}px)`
                                                : undefined,
                                            mixBlendMode: 'multiply',
                                        }}
                                    />
                                )}
                            </>
                        ) : (
                            <img ref={imageRef} src={imageSrc} alt="Blueprint" className="w-full h-full object-contain pointer-events-none" onLoad={handleImageLoad} style={{ position: 'absolute', top: 0, left: 0 }} />
                        )}
                        {/* Alignment mode hint banner */}
                        {compareAlignment?.isAligning && (
                            <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center">
                                <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
                                    <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a1 1 0 0 1 1 1v1.586l1.293-1.293a1 1 0 1 1 1.414 1.414L9.414 6H11a1 1 0 1 1 0 2H9.414l2.293 2.293a1 1 0 0 1-1.414 1.414L9 10.414V12a1 1 0 1 1-2 0v-1.586l-1.293 1.293a1 1 0 0 1-1.414-1.414L6.586 8H5a1 1 0 0 1 0-2h1.586L4.293 3.707a1 1 0 0 1 1.414-1.414L7 3.586V2a1 1 0 0 1 1-1z"/></svg>
                                    Drag or use arrow keys to align — hold Shift for larger steps — black lines indicate a match
                                </div>
                            </div>
                        )}
                        {rectangles.filter(r => r.visible).map((rect) => {
                            const normalized = normalizeRect(rect);
                            const isSelected = selectedRectIds.includes(rect.id);
                            const isHovered = rect.id === hoveredRectId;
                            const strokeColor = resolveRectStrokeColor(rect, isSelected);
                            const fillColor = resolveRectFillColor(rect, rect.shape, isSelected, theme);
                            const sw = 2 / viewTransform.scale;
                            const shapeProps = {
                              stroke: strokeColor,
                              strokeWidth: sw,
                              fill: fillColor,
                              vectorEffect: 'non-scaling-stroke' as const,
                            };

                            const pixelWidth = (normalized.width / 100) * imageGeom.width;
                            const pixelHeight = (normalized.height / 100) * imageGeom.height;
                            
                            const left = (normalized.x / 100) * imageGeom.width + imageGeom.x;
                            const top = (normalized.y / 100) * imageGeom.height + imageGeom.y;

                            return (
                                <div key={rect.id} className="absolute" style={{ left: `${left}px`, top: `${top}px`, width: `${pixelWidth}px`, height: `${pixelHeight}px`, pointerEvents: 'none' }}>
                                    {rect.shape === 'box' && (() => {
                                      // Compute per-axis real-world dims (wFt = horizontal, hFt = vertical)
                                      const wFt = drawingScale && naturalSize.width
                                        ? (rect.width / 100) * naturalSize.width / drawingScale : null;
                                      const hFt = drawingScale && naturalSize.height
                                        ? (rect.height / 100) * naturalSize.height / drawingScale : null;
                                      const area = wFt != null && hFt != null ? wFt * hFt : null;
                                      // "Length" = longer side, "Width" = shorter side
                                      const hLabel = wFt != null && hFt != null
                                        ? (wFt >= hFt ? `L ${formatFt(wFt)}` : `W ${formatFt(wFt)}`) : null;
                                      const vLabel = wFt != null && hFt != null
                                        ? (hFt > wFt ? `L ${formatFt(hFt)}` : `W ${formatFt(hFt)}`) : null;
                                      const dimTag: React.CSSProperties = {
                                        position: 'absolute',
                                        background: 'rgba(255,255,255,0.92)',
                                        color: '#111',
                                        fontSize: '9px',
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                        letterSpacing: '0.02em',
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                                        border: '0.5px solid rgba(0,0,0,0.1)',
                                        whiteSpace: 'nowrap',
                                        lineHeight: 1.6,
                                        pointerEvents: 'none',
                                      };
                                      return (
                                        <div className="relative w-full h-full box-border" style={{ borderWidth: sw, borderStyle: 'solid', borderColor: strokeColor, backgroundColor: fillColor === 'transparent' ? 'transparent' : fillColor, boxShadow: (isSelected || isHovered) ? `0 0 0 ${(isSelected ? 3 : 2) / viewTransform.scale}px rgba(59,130,246,${isSelected ? 0.45 : 0.28})` : undefined }}>
                                          {isSelected && hLabel && (
                                            // Bottom edge — horizontal dimension (length)
                                            <div style={{ ...dimTag, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }}>
                                              {hLabel}
                                            </div>
                                          )}
                                          {isSelected && vLabel && (
                                            // Left edge — vertical dimension (width), rotated
                                            <div style={{ ...dimTag, left: 0, top: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', transformOrigin: 'center center' }}>
                                              {vLabel}
                                            </div>
                                          )}
                                          {isSelected && area != null && (
                                            // Center — area
                                            <div style={{ ...dimTag, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                              {formatArea(area)}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    {(rect.shape === 'ellipse' || rect.shape === 'cloud') && (() => {
                                        // Ellipse measurements
                                        const eFt = drawingScale && naturalSize.width ? {
                                            w: (rect.width / 100) * naturalSize.width / drawingScale,
                                            h: (rect.height / 100) * naturalSize.height / drawingScale,
                                        } : null;
                                        const eArea = eFt ? Math.PI * (eFt.w / 2) * (eFt.h / 2) : null;
                                        // Ramanujan perimeter approximation
                                        const ePerim = eFt ? (() => {
                                            const a = eFt.w / 2, b = eFt.h / 2;
                                            return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
                                        })() : null;
                                        const isCircle = eFt ? Math.abs(eFt.w - eFt.h) / Math.max(eFt.w, eFt.h) < 0.03 : false;
                                        const dimTag: React.CSSProperties = {
                                            position: 'absolute',
                                            background: 'rgba(255,255,255,0.92)',
                                            color: '#111',
                                            fontSize: '9px',
                                            fontWeight: 600,
                                            fontFamily: 'monospace',
                                            letterSpacing: '0.02em',
                                            padding: '1px 5px',
                                            borderRadius: '3px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                                            border: '0.5px solid rgba(0,0,0,0.1)',
                                            whiteSpace: 'nowrap',
                                            lineHeight: 1.6,
                                            pointerEvents: 'none',
                                        };
                                        return (
                                            <div className="relative w-full h-full">
                                                <svg width="100%" height="100%" viewBox={`0 0 ${pixelWidth} ${pixelHeight}`} preserveAspectRatio="none" className="overflow-visible">
                                                    {/* Selection / hover glow — rendered behind the main shape */}
                                                    {(isSelected || isHovered) && rect.shape === 'ellipse' && (
                                                        <ellipse cx={pixelWidth / 2} cy={pixelHeight / 2} rx={pixelWidth / 2} ry={pixelHeight / 2}
                                                            fill="none" stroke="#3b82f6"
                                                            strokeWidth={(isSelected ? 8 : 5) / viewTransform.scale}
                                                            opacity={isSelected ? 0.3 : 0.2}
                                                        />
                                                    )}
                                                    {(isSelected || isHovered) && rect.shape === 'cloud' && (
                                                        <path d={generateCloudPath(pixelWidth, pixelHeight)}
                                                            fill="none" stroke="#3b82f6"
                                                            strokeWidth={(isSelected ? 8 : 5) / viewTransform.scale}
                                                            opacity={isSelected ? 0.3 : 0.2}
                                                        />
                                                    )}
                                                    {rect.shape === 'ellipse' && (<ellipse cx={pixelWidth / 2} cy={pixelHeight / 2} rx={pixelWidth / 2} ry={pixelHeight / 2} {...shapeProps} />)}
                                                    {rect.shape === 'cloud' && (<path d={generateCloudPath(pixelWidth, pixelHeight)} {...shapeProps} />)}
                                                </svg>
                                                {isSelected && rect.shape === 'ellipse' && eFt && eArea != null && ePerim != null && (<>
                                                    {/* Bottom — horizontal diameter */}
                                                    <div style={{ ...dimTag, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }}>
                                                        {isCircle ? `⌀ ${formatFt(eFt.w)}` : `⌀h ${formatFt(eFt.w)}`}
                                                    </div>
                                                    {/* Left — vertical diameter, rotated */}
                                                    {!isCircle && (
                                                        <div style={{ ...dimTag, left: 0, top: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', transformOrigin: 'center center' }}>
                                                            {`⌀v ${formatFt(eFt.h)}`}
                                                        </div>
                                                    )}
                                                    {/* Center — area + perimeter */}
                                                    <div style={{ ...dimTag, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                                        <div>{formatArea(eArea)}</div>
                                                        <div style={{ opacity: 0.75 }}>P {formatFt(ePerim)}</div>
                                                    </div>
                                                </>)}
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}

                        <svg className="absolute left-0 top-0 h-full w-full overflow-visible pointer-events-none" style={{ zIndex: 16 }}>
                            <defs>
                                <marker id="canvas-arrow-head" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
                                </marker>
                            </defs>
                            {[...lineMarkups, ...(currentLineMarkup ? [currentLineMarkup] : [])].filter((line) => line.visible).map((line) => {
                                // Use LOCAL coords (no viewTransform) — this SVG is inside the CSS-transform
                                // div, so the CSS transform already applies zoom/pan. Using screen coords
                                // here would double-apply the transform and cause drift on zoom/pan.
                                const localPoints = line.points.map((point) => getLocalPoint(point.x, point.y)).filter(Boolean) as { left: number; top: number }[];
                                if (localPoints.length < 1) return null;
                                const isFreehandTool = line.type === 'pen' || line.type === 'highlighter';
                                const isFreelineOpen = line.type === 'freeline' && !line.closed;
                                if (localPoints.length < 2 && !(isFreelineOpen && localPoints.length >= 1)) return null;
                                const isSelectedLine = selectedLineIds.includes(line.id);
                                const strokeColor = line.strokeColor || markupStrokeColor;
                                const fillColor = line.fillColor ?? 'transparent';
                                // Divide by scale so stroke widths are visually constant regardless of zoom
                                // (same approach rectangles use: sw = 2 / viewTransform.scale)
                                const s = viewTransform.scale;
                                const strokeWidth = (line.strokeWidth ?? 2) / s;
                                const handleR = (isSelectedLine ? 6 : 4) / s;
                                const handleStroke = 2 / s;
                                const showFreelinePreview =
                                    activeTool === 'freeline' &&
                                    interaction.type === 'none' &&
                                    selectedLineId === line.id &&
                                    freelinePreviewEnd &&
                                    line.type === 'freeline' &&
                                    !line.closed &&
                                    line.points.length >= 1;
                                const previewLocal = showFreelinePreview
                                    ? getLocalPoint(freelinePreviewEnd.x, freelinePreviewEnd.y)
                                    : null;
                                const firstLocal = localPoints[0];
                                const lastLocal = localPoints[localPoints.length - 1];

                                // Build SVG path — smooth quadratic bezier for pen/highlighter, polyline for others
                                let pathD = '';
                                if (localPoints.length >= 2) {
                                    if (isFreehandTool) {
                                        // Midpoint quadratic bezier: each recorded point is a control point,
                                        // midpoints between consecutive points are the actual curve points.
                                        // This produces very smooth curves matching Figma/Adobe drawing tools.
                                        pathD = `M ${localPoints[0].left} ${localPoints[0].top}`;
                                        for (let i = 1; i < localPoints.length - 1; i++) {
                                            const midX = (localPoints[i].left + localPoints[i + 1].left) / 2;
                                            const midY = (localPoints[i].top + localPoints[i + 1].top) / 2;
                                            pathD += ` Q ${localPoints[i].left} ${localPoints[i].top} ${midX} ${midY}`;
                                        }
                                        const last = localPoints[localPoints.length - 1];
                                        pathD += ` L ${last.left} ${last.top}`;
                                    } else {
                                        pathD = `M ${localPoints.map((p) => `${p.left} ${p.top}`).join(' L ')}${line.type === 'freeline' && line.closed ? ' Z' : ''}`;
                                    }
                                }

                                // Scale-invariant dashes: divide by CSS scale so they appear constant on screen
                                const dashPreview = `${6 / s},${4 / s}`;
                                // Show glow on hover OR selection for every line type
                                const showGlow = isSelectedLine || hoveredLineId === line.id;
                                const isFreehandHovered = isFreehandTool && showGlow;
                                // Compare by value not reference since getLocalPoint creates new objects each render
                                const isOnlyOnePoint = localPoints.length === 1 ||
                                    (Math.abs(lastLocal.left - firstLocal.left) < 0.01 && Math.abs(lastLocal.top - firstLocal.top) < 0.01);

                                return (
                                    <g key={line.id} opacity={line.type === 'highlighter' ? 0.45 : 1}>
                                        {/* Selection / hover glow: wider semi-transparent path rendered beneath the stroke */}
                                        {showGlow && localPoints.length >= 2 && (
                                            <path
                                                d={pathD}
                                                fill="none"
                                                stroke={isSelectedLine ? '#3b82f6' : strokeColor}
                                                strokeWidth={strokeWidth + (isSelectedLine ? 8 : 6) / s}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                opacity={isSelectedLine ? 0.25 : 0.15}
                                            />
                                        )}
                                        {localPoints.length >= 2 && (
                                            <path
                                                d={pathD}
                                                fill={line.type === 'freeline' && line.closed ? fillColor : 'none'}
                                                stroke={strokeColor}
                                                strokeWidth={strokeWidth}
                                                strokeLinecap={isFreehandTool ? 'round' : 'butt'}
                                                strokeLinejoin={isFreehandTool ? 'round' : 'miter'}
                                                markerEnd={line.type === 'arrow' ? 'url(#canvas-arrow-head)' : undefined}
                                            />
                                        )}
                                        {showFreelinePreview && previewLocal && lastLocal && (
                                            <line
                                                x1={lastLocal.left}
                                                y1={lastLocal.top}
                                                x2={previewLocal.left}
                                                y2={previewLocal.top}
                                                stroke={strokeColor}
                                                strokeWidth={2 / s}
                                                strokeDasharray={dashPreview}
                                                opacity={0.85}
                                            />
                                        )}
                                        {/* Freehand strokes: show start + end handles on hover / selection */}
                                        {isFreehandTool && isFreehandHovered && firstLocal && (
                                            <circle
                                                cx={firstLocal.left}
                                                cy={firstLocal.top}
                                                r={handleR}
                                                fill="#ffffff"
                                                stroke={isSelectedLine ? '#3b82f6' : strokeColor}
                                                strokeWidth={handleStroke}
                                                className="pointer-events-none"
                                            />
                                        )}
                                        {isFreehandTool && isFreehandHovered && lastLocal && !isOnlyOnePoint && (
                                            <circle
                                                cx={lastLocal.left}
                                                cy={lastLocal.top}
                                                r={handleR}
                                                fill="#ffffff"
                                                stroke={isSelectedLine ? '#3b82f6' : strokeColor}
                                                strokeWidth={handleStroke}
                                                className="pointer-events-none"
                                            />
                                        )}
                                        {/* Point handles for non-freehand strokes (line, arrow, freeline) */}
                                        {!isFreehandTool && line.points.map((point, index) => {
                                            const localPoint = getLocalPoint(point.x, point.y);
                                            if (!localPoint) return null;
                                            const isSelectedPoint = isSelectedLine && selectedLinePointIndex === index;
                                            return (
                                                <g key={`${line.id}-${index}`} className="pointer-events-none" style={{ cursor: line.locked ? 'default' : 'grab' }}>
                                                    <circle cx={localPoint.left} cy={localPoint.top} r={(isSelectedPoint ? 6 : 4) / s} fill="#ffffff" stroke={strokeColor} strokeWidth={2 / s} />
                                                </g>
                                            );
                                        })}
                                    </g>
                                );
                            })}
                        </svg>

                    </div>

                    {/* Screen-space text edit overlay — rendered outside the transform div so
                        font-size, position, and focus all work without CSS-scale complications. */}
                    {editingTextId && (() => {
                        const editingText = textMarkups.find(t => t.id === editingTextId) ?? editingTextCache.current;
                        if (!editingText) return null;
                        const screenPos = getScreenPoint(editingText.x, editingText.y);
                        if (!screenPos) return null;
                        // Use fixed positioning (viewport-relative) so overflow:hidden on the
                        // container never clips the textarea.
                        const containerRect = imageContainerRef.current?.getBoundingClientRect();
                        if (!containerRect) return null;
                        const fixedLeft = containerRect.left + screenPos.left;
                        const fixedTop = containerRect.top + screenPos.top;
                        const editFontSize = (editingText.fontSize ?? 16) * viewTransform.scale;
                        const hasFixedWidth = editingText.width != null && editingText.width > 0;
                        const fixedWidthPx = hasFixedWidth
                            ? (editingText.width! / 100) * imageGeom.width * viewTransform.scale
                            : null;
                        return (
                            <textarea
                                key={editingTextId}
                                ref={editingTextRef}
                                data-interactive-ui="true"
                                defaultValue={editingText.text}
                                onChange={(e) => {
                                    editingTextContent.current = e.target.value;
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                    if (!hasFixedWidth) {
                                        e.target.style.width = 'auto';
                                        e.target.style.width = `${Math.max(120, e.target.scrollWidth)}px`;
                                    }
                                }}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Escape') { e.preventDefault(); setEditingTextId(null); editingTextContent.current = ''; }
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTextEdit(); }
                                }}
                                onBlur={commitTextEdit}
                                style={{
                                    position: 'fixed',
                                    left: fixedLeft,
                                    top: fixedTop,
                                    minWidth: hasFixedWidth ? undefined : '120px',
                                    width: fixedWidthPx != null ? `${fixedWidthPx}px` : undefined,
                                    maxWidth: fixedWidthPx != null ? `${fixedWidthPx}px` : undefined,
                                    fontSize: `${editFontSize}px`,
                                    fontWeight: editingText.fontWeight ?? 'normal',
                                    fontStyle: editingText.fontStyle ?? 'normal',
                                    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
                                    color: editingText.color ?? '#ef4444',
                                    lineHeight: 1.4,
                                    background: 'rgba(255,255,255,0.95)',
                                    border: '2px solid #3b82f6',
                                    borderRadius: '4px',
                                    padding: '4px 6px',
                                    outline: 'none',
                                    resize: 'none',
                                    overflow: 'hidden',
                                    zIndex: 9999,
                                    pointerEvents: 'auto',
                                    userSelect: 'text',
                                    caretColor: '#3b82f6',
                                    boxShadow: '0 0 0 3px rgba(59,130,246,0.25), 0 4px 12px rgba(0,0,0,0.2)',
                                    minHeight: `${editFontSize * 1.4 + 8}px`,
                                    whiteSpace: hasFixedWidth ? 'pre-wrap' : 'pre',
                                    wordBreak: hasFixedWidth ? 'break-word' : undefined,
                                }}
                            />
                        );
                    })()}

                    {/* ── Text Markup Rendering — screen space (outside CSS-scale div) ──────────
                        Rendering text outside the transform div means the browser re-rasterises
                        glyphs at native resolution for every zoom level, eliminating the
                        pixel-magnification blur caused by CSS scale().
                        Position is computed with getScreenPoint (already accounts for
                        viewTransform), and font-size is multiplied by the scale directly so
                        the visual size matches the logical position on the image. */}
                    {textMarkups.filter(t => t.visible).map(text => {
                        const screenPos = getScreenPoint(text.x, text.y);
                        if (!screenPos) return null;
                        const s = viewTransform.scale;
                        const isSelected = selectedTextId === text.id;
                        const isEditing = editingTextId === text.id;
                        // Font size in physical screen pixels — scales with zoom, renders crisply
                        const fontSize = (text.fontSize ?? 14) * s;
                        const textColor = text.color ?? '#111827';
                        const content = text.text || (isEditing ? '' : 'Text');
                        const textBoxWidth = text.width != null && text.width > 0
                            ? (text.width / 100) * imageGeom.width * s
                            : null;

                        return (
                            <div
                                key={text.id}
                                data-text-markup-id={text.id}
                                style={{
                                    position: 'absolute',
                                    left: screenPos.left,
                                    top: screenPos.top,
                                    width: textBoxWidth != null ? `${textBoxWidth}px` : undefined,
                                    zIndex: isEditing ? 28 : (isSelected ? 25 : 16),
                                    pointerEvents: 'auto',
                                    cursor: isEditing ? 'text' : (isSelected ? 'move' : 'default'),
                                    userSelect: isEditing ? 'text' : 'none',
                                    // Hint to the compositor to keep this layer crisp
                                    willChange: 'transform',
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    if (isEditing) return;
                                    setSelectedRectIds([]);
                                    setSelectedLineIds([]);
                                    setSelectedLineId(null);
                                    setSelectedLinePointIndex(null);
                                    setSelectedPinId(null);
                                    setSelectedTextId(text.id);
                                    if (activeTool === 'text' && !text.locked) {
                                        setMovingTextState(null);
                                        editingTextContent.current = text.text;
                                        editingTextCache.current = text;
                                        setEditingTextId(text.id);
                                    } else if (!text.locked) {
                                        const coords = getRelativeCoords(e);
                                        if (coords) {
                                            setMovingTextState({
                                                textId: text.id,
                                                startMouseX: coords.x,
                                                startMouseY: coords.y,
                                                startTextX: text.x,
                                                startTextY: text.y,
                                            });
                                        }
                                    }
                                }}
                                onMouseUp={(e) => {
                                    if (movingTextState) {
                                        setMovingTextState(null);
                                        e.stopPropagation();
                                    }
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (!text.locked) {
                                        setMovingTextState(null);
                                        editingTextContent.current = text.text;
                                        editingTextCache.current = text;
                                        setEditingTextId(text.id);
                                    }
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        width: textBoxWidth != null ? '100%' : undefined,
                                        fontSize: `${fontSize}px`,
                                        fontWeight: text.fontWeight ?? 'normal',
                                        fontStyle: text.fontStyle ?? 'normal',
                                        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
                                        // @ts-ignore — well-supported, not in all TS DOM libs
                                        textRendering: 'optimizeLegibility',
                                        WebkitFontSmoothing: 'antialiased',
                                        color: isEditing ? 'transparent' : (text.text ? textColor : `${textColor}55`),
                                        lineHeight: 1.4,
                                        outline: isSelected && !isEditing
                                            ? '1.5px solid rgba(59,130,246,0.7)'
                                            : 'none',
                                        outlineOffset: '3px',
                                        borderRadius: '2px',
                                        padding: '2px 3px',
                                        boxShadow: isSelected && !isEditing
                                            ? '0 0 0 3px rgba(59,130,246,0.15)'
                                            : 'none',
                                    }}
                                >
                                    {content}
                                </span>
                            </div>
                        );
                    })}

                    {/* Screen-space Overlays */}
                    {pins.filter(pin => pin.visible && filters[pin.type as FilterCategory]).map(pin => {
                      const screenPos = getScreenPoint(pin.x, pin.y);
                      if (!screenPos) return null;
                      const PinIcon = { photo: PhotoPinIcon, safety: SafetyPinIcon, punch: PunchPinIcon }[pin.type];
                      
                      // Allow selecting/dragging pin even in 'shape' mode to avoid confusion
                      const isSelectable = activeTool === 'select' || activeTool === 'shape';
                      
                      const isSelected = selectedPinId === pin.id;
                      // Selected + dragging → closed hand; selected + idle → move cursor; unselected → arrow
                      const pinCursor = draggingPinId === pin.id
                          ? 'cursor-grabbing'
                          : (isSelectable && isSelected ? 'cursor-move' : 'cursor-default');
                      return (
                          <div
                              key={pin.id}
                              className={`absolute transform -translate-x-1/2 -translate-y-full ${pinCursor}`}
                              style={{ left: screenPos.left, top: screenPos.top, pointerEvents: 'auto', zIndex: isSelected ? 21 : 15, width: '2.75rem', height: '2.75rem' }}
                              onMouseDown={(e) => { 
                                  e.stopPropagation();
                                  e.preventDefault();
                                  mouseDownRef.current = { x: e.clientX, y: e.clientY }; 
                                  if (isSelectable) {
                                       setSelectedRectIds([]);
                                       setSelectedPinId(pin.id);
                                       if (!pin.locked) {
                                           const mouseCoords = getRelativeCoords(e);
                                           if (mouseCoords) {
                                               setPinDragOffset({ x: mouseCoords.x - pin.x, y: mouseCoords.y - pin.y });
                                           }
                                           setDraggingPinId(pin.id); 
                                       }
                                  }
                              }}
                              onClick={(e) => {
                                  e.stopPropagation();
                                  const isClick = mouseDownRef.current && Math.abs(e.clientX - mouseDownRef.current.x) < 5 && Math.abs(e.clientY - mouseDownRef.current.y) < 5;
                                  
                                  // Open details if tool is NOT select/shape (e.g. some other tool or default)
                                  if (!isSelectable && isClick) {
                                       handlePinDetails(pin); 
                                  }
                              }}
                              onMouseEnter={(e) => {
                                  if (draggingPinId || selectedPinId) return;
                                  if (hidePopupTimer.current) { clearTimeout(hidePopupTimer.current); hidePopupTimer.current = null; }
                                  const pinRect = e.currentTarget.getBoundingClientRect();
                                  const item = { type: 'pin' as const, pin: pin, itemId: pin.id, position: { top: pinRect.top + pinRect.height / 2, left: pinRect.right } };
                                  if (showPopupTimer.current) clearTimeout(showPopupTimer.current);
                                  showPopupTimer.current = window.setTimeout(() => setHoveredItem(item), 180);
                              }}
                              onMouseLeave={() => {
                                  if (showPopupTimer.current) { clearTimeout(showPopupTimer.current); showPopupTimer.current = null; }
                                  hidePopupTimer.current = window.setTimeout(() => setHoveredItem(null), 500);
                              }}
                          >
                              <PinIcon className="w-full h-full drop-shadow-lg" />
                              {isSelected && !pin.locked && (
                                  <div data-interactive-ui="true" className="absolute flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white" style={{ left: '50%', top: '-10px', transform: 'translate(-50%, -100%)', zIndex: 30 }}>
                                      <button onClick={(e) => { e.stopPropagation(); handlePinDetails(pin); }} title="Details" className="p-2 rounded-md hover:bg-gray-700 transition-colors"><InformationCircleIcon className="w-5 h-5" /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id); }} title="Delete" className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                  </div>
                              )}
                          </div>
                      );
                    })}

                    {singleSelectionScreenRect && !selectedRectangle?.locked && (
                      <>
                        {(['tl', 'tr', 'bl', 'br'] as ResizeHandle[]).map(handle => (
                          <div
                            key={handle}
                            className="absolute w-3.5 h-3.5 bg-red-400 border-2 border-white dark:border-gray-900 rounded-full"
                            style={{
                              top: handle.includes('t') ? singleSelectionScreenRect.top - 8 : singleSelectionScreenRect.top + singleSelectionScreenRect.height - 8,
                              left: handle.includes('l') ? singleSelectionScreenRect.left - 8 : singleSelectionScreenRect.left + singleSelectionScreenRect.width - 8,
                              cursor: (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize',
                              pointerEvents: 'auto', zIndex: 20
                            }}
                            onMouseDown={(e) => selectedRectangle && handleResizeStart(e, selectedRectangle.id, handle)}
                          />
                        ))}
                        <div data-interactive-ui="true" className={`absolute flex transition-opacity transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isMenuVisible ? 'opacity-100' : 'opacity-0'}`} style={{ left: `${singleSelectionScreenRect.left + singleSelectionScreenRect.width / 2}px`, top: `${singleSelectionScreenRect.top}px`, transform: `translate(-50%, -100%) translateY(-10px) scale(${isMenuVisible ? 1 : 0.9})`, transformOrigin: 'bottom center', pointerEvents: isMenuVisible ? 'auto' : 'none', zIndex: 30 }}>
                            <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                                <div className="relative">
                                    <button onClick={(e) => selectedRectangle && handleLinkRect(e, selectedRectangle.id)} title="Link" className={`p-2 rounded-md transition-colors ${linkMenuRectId === selectedRectangle?.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}><LinkIcon className="w-5 h-5" /></button>
                                    {linkMenuRectId === selectedRectangle?.id && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max" onMouseLeave={() => setOpenLinkSubmenu(null)}>
                                        <div className="flex flex-col gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-sm">
                                            <div className="relative" onMouseEnter={() => setOpenLinkSubmenu('rfi')}>
                                                <div className="flex justify-between items-center px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left cursor-default">
                                                    <span>RFI</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 ml-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                                </div>
                                                {openLinkSubmenu === 'rfi' && (
                                                    <div className="absolute left-full top-0 ml-1 flex flex-col gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-sm w-max">
                                                        <button onClick={(e) => selectedRectangle && handleSubmenuLink(e, 'New RFI', selectedRectangle.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left whitespace-nowrap">New RFI</button>
                                                        <button onClick={(e) => selectedRectangle && handleSubmenuLink(e, 'Link RFI', selectedRectangle.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left whitespace-nowrap">Link RFI</button>
                                                    </div>
                                                )}
                                            </div>
                                            {['Link Submittal', 'Link Punch', 'Link Drawing', 'Link Photo'].map(type => (<button key={type} onClick={(e) => selectedRectangle && handleSubmenuLink(e, type, selectedRectangle.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left">{type.replace('Link ','')}</button>))}
                                        </div>
                                    </div>
                                    )}
                                </div>
                                <div className="relative" data-markup-color-trigger>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLinkMenuRectId(null);
                                            setMarkupColorPanelOpen((o) => {
                                                const next = !o;
                                                if (next) setMarkupColorPanelSource('selection');
                                                return next;
                                            });
                                        }}
                                        title="Fill & stroke"
                                        className={`p-2 rounded-md transition-colors ${markupColorPanelOpen ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                                    >
                                        <Palette className="w-5 h-5" />
                                    </button>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSelection(); }} title="Delete" className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                      </>
                    )}

                    {selectedLine && selectedLineScreenRect && !selectedLine.locked && (
                        <div data-interactive-ui="true" className={`absolute flex transition-opacity transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isMenuVisible ? 'opacity-100' : 'opacity-0'}`} style={{ left: `${selectedLineScreenRect.left + selectedLineScreenRect.width / 2}px`, top: `${selectedLineScreenRect.top}px`, transform: `translate(-50%, -100%) translateY(-10px) scale(${isMenuVisible ? 1 : 0.9})`, transformOrigin: 'bottom center', pointerEvents: isMenuVisible ? 'auto' : 'none', zIndex: 30 }}>
                            <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                                <div className="relative">
                                    <button onClick={(e) => selectedLine && handleLinkRect(e, selectedLine.id)} title="Link" className={`p-2 rounded-md transition-colors ${linkMenuRectId === selectedLine?.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}><LinkIcon className="w-5 h-5" /></button>
                                    {linkMenuRectId === selectedLine?.id && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max" onMouseLeave={() => setOpenLinkSubmenu(null)}>
                                        <div className="flex flex-col gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-sm">
                                            <div className="relative" onMouseEnter={() => setOpenLinkSubmenu('rfi')}>
                                                <div className="flex justify-between items-center px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left cursor-default">
                                                    <span>RFI</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 ml-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                                </div>
                                                {openLinkSubmenu === 'rfi' && (
                                                    <div className="absolute left-full top-0 ml-1 flex flex-col gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-sm w-max">
                                                        <button onClick={(e) => selectedLine && handleSubmenuLink(e, 'New RFI', selectedLine.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left whitespace-nowrap">New RFI</button>
                                                        <button onClick={(e) => selectedLine && handleSubmenuLink(e, 'Link RFI', selectedLine.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left whitespace-nowrap">Link RFI</button>
                                                    </div>
                                                )}
                                            </div>
                                            {['Link Submittal', 'Link Punch', 'Link Drawing', 'Link Photo'].map(type => (<button key={type} onClick={(e) => selectedLine && handleSubmenuLink(e, type, selectedLine.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left">{type.replace('Link ','')}</button>))}
                                        </div>
                                    </div>
                                    )}
                                </div>
                                <div className="relative" data-markup-color-trigger>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLinkMenuRectId(null);
                                            setMarkupColorPanelOpen((o) => {
                                                const next = !o;
                                                if (next) setMarkupColorPanelSource('selection');
                                                return next;
                                            });
                                        }}
                                        title="Fill & stroke"
                                        className={`p-2 rounded-md transition-colors ${markupColorPanelOpen ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                                    >
                                        <Palette className="w-5 h-5" />
                                    </button>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSelection(); }} title="Delete" className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}

                    {/* Text Markup Action Menu */}
                    {selectedTextId && (() => {
                        const selectedText = textMarkups.find(t => t.id === selectedTextId);
                        if (!selectedText || selectedText.locked) return null;
                        const screenPos = getScreenPoint(selectedText.x, selectedText.y);
                        if (!screenPos) return null;

                        const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

                        // Two-row color palette: warm/neutral top, cool/accent bottom
                        const COLOR_ROW1 = [
                            { hex: '#000000', label: 'Black' },
                            { hex: '#6b7280', label: 'Gray' },
                            { hex: '#ffffff', label: 'White' },
                            { hex: '#dc2626', label: 'Red' },
                            { hex: '#ea580c', label: 'Orange' },
                            { hex: '#ca8a04', label: 'Amber' },
                            { hex: '#16a34a', label: 'Green' },
                            { hex: '#0d9488', label: 'Teal' },
                        ];
                        const COLOR_ROW2 = [
                            { hex: '#1e40af', label: 'Navy' },
                            { hex: '#2563eb', label: 'Blue' },
                            { hex: '#7c3aed', label: 'Violet' },
                            { hex: '#db2777', label: 'Pink' },
                            { hex: '#f87171', label: 'Light Red' },
                            { hex: '#fbbf24', label: 'Yellow' },
                            { hex: '#4ade80', label: 'Light Green' },
                            { hex: '#60a5fa', label: 'Sky Blue' },
                        ];

                        const currentColor = selectedText.color ?? '#ef4444';
                        const currentSize = selectedText.fontSize ?? 16;
                        const isBold = selectedText.fontWeight === 'bold';
                        const isItalic = selectedText.fontStyle === 'italic';
                        const isColorActive = textColorPopoverOpen;
                        const isSizeActive = textSizeDropdownOpen;

                        return (
                            <div
                                data-interactive-ui="true"
                                className={`absolute transition-opacity transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isMenuVisible ? 'opacity-100' : 'opacity-0'}`}
                                style={{
                                    left: screenPos.left,
                                    top: screenPos.top,
                                    transform: `translate(-50%, calc(-100% - 10px)) scale(${isMenuVisible ? 1 : 0.9})`,
                                    transformOrigin: 'bottom center',
                                    pointerEvents: isMenuVisible ? 'auto' : 'none',
                                    zIndex: 35,
                                }}
                            >
                                {/* ── Color palette panel (appears below main bar, above text) ── */}
                                {isColorActive && (
                                    <div className="mb-1.5 px-2 py-2 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/10 flex flex-col gap-1.5">
                                        {[COLOR_ROW1, COLOR_ROW2].map((row, ri) => (
                                            <div key={ri} className="flex gap-1.5">
                                                {row.map(({ hex, label }) => {
                                                    const isActive = currentColor === hex;
                                                    return (
                                                        <button
                                                            key={hex}
                                                            title={label}
                                                            onClick={() => {
                                                                onUpdateTextMarkup(selectedText.id, { color: hex });
                                                                setTextColorPopoverOpen(false);
                                                            }}
                                                            className="relative flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
                                                            style={{ width: 26, height: 26 }}
                                                        >
                                                            <span
                                                                className="block w-full h-full rounded-lg"
                                                                style={{
                                                                    backgroundColor: hex,
                                                                    boxShadow: isActive
                                                                        ? '0 0 0 2px #fff, 0 0 0 4px #3b82f6'
                                                                        : hex === '#ffffff' ? 'inset 0 0 0 1px rgba(255,255,255,0.25)' : 'none',
                                                                    border: hex === '#ffffff' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                                                }}
                                                            />
                                                            {isActive && (
                                                                <svg className="absolute inset-0 m-auto w-3.5 h-3.5 pointer-events-none" viewBox="0 0 14 14" fill="none">
                                                                    <path d="M2.5 7L5.5 10L11.5 4" stroke={hex === '#ffffff' || hex === '#fbbf24' || hex === '#4ade80' ? '#111827' : '#ffffff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Main toolbar ── */}
                                <div className="flex items-center gap-0.5 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-xl shadow-xl text-white border border-white/10">

                                    {/* Link */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleLinkRect(e, selectedText.id); }}
                                            title="Attach"
                                            className={`p-2 rounded-lg transition-colors ${linkMenuRectId === selectedText.id ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}
                                        >
                                            <LinkIcon className="w-4 h-4" />
                                        </button>
                                        {linkMenuRectId === selectedText.id && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max" onMouseLeave={() => setOpenLinkSubmenu(null)}>
                                                <div className="flex flex-col gap-1 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg text-sm border border-white/10">
                                                    <div className="relative" onMouseEnter={() => setOpenLinkSubmenu('rfi')}>
                                                        <div className="flex justify-between items-center px-3 py-1.5 text-white rounded-lg hover:bg-blue-600 transition-colors text-left cursor-default">
                                                            <span>RFI</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 ml-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                                        </div>
                                                        {openLinkSubmenu === 'rfi' && (
                                                            <div className="absolute left-full top-0 ml-1 flex flex-col gap-1 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg text-sm w-max border border-white/10">
                                                                <button onClick={(e) => handleSubmenuLink(e, 'New RFI', selectedText.id)} className="px-3 py-1.5 text-white rounded-lg hover:bg-blue-600 transition-colors text-left whitespace-nowrap">New RFI</button>
                                                                <button onClick={(e) => handleSubmenuLink(e, 'Link RFI', selectedText.id)} className="px-3 py-1.5 text-white rounded-lg hover:bg-blue-600 transition-colors text-left whitespace-nowrap">Link RFI</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {['Link Submittal', 'Link Punch', 'Link Drawing', 'Link Photo'].map(type => (
                                                        <button key={type} onClick={(e) => handleSubmenuLink(e, type, selectedText.id)} className="px-3 py-1.5 text-white rounded-lg hover:bg-blue-600 transition-colors text-left">
                                                            {type.replace('Link ', '')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-px h-5 bg-white/20 mx-0.5" />

                                    {/* Bold */}
                                    <button
                                        onClick={() => onUpdateTextMarkup(selectedText.id, { fontWeight: isBold ? 'normal' : 'bold' })}
                                        title="Bold"
                                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${isBold ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}
                                    >
                                        B
                                    </button>

                                    {/* Italic */}
                                    <button
                                        onClick={() => onUpdateTextMarkup(selectedText.id, { fontStyle: isItalic ? 'normal' : 'italic' })}
                                        title="Italic"
                                        className={`w-8 h-8 rounded-lg text-sm italic transition-colors ${isItalic ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}
                                    >
                                        I
                                    </button>

                                    <div className="w-px h-5 bg-white/20 mx-0.5" />

                                    {/* Font size dropdown */}
                                    <div className="relative">
                                        <button
                                            title="Font size"
                                            onClick={() => { setTextSizeDropdownOpen(o => !o); setTextColorPopoverOpen(false); }}
                                            className={`flex items-center gap-1 h-8 px-2 rounded-lg text-sm font-medium transition-colors ${isSizeActive ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-gray-200'}`}
                                        >
                                            <span className="w-6 text-center tabular-nums">{currentSize}</span>
                                            <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isSizeActive ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isSizeActive && (
                                            <div
                                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/10 overflow-hidden"
                                                style={{ zIndex: 45 }}
                                            >
                                                <div className="flex flex-col py-1 max-h-56 overflow-y-auto">
                                                    {FONT_SIZES.map(size => (
                                                        <button
                                                            key={size}
                                                            onClick={() => { onUpdateTextMarkup(selectedText.id, { fontSize: size }); setTextSizeDropdownOpen(false); }}
                                                            className={`flex items-center justify-between px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${currentSize === size ? 'bg-blue-600 text-white font-medium' : 'text-gray-200 hover:bg-white/10'}`}
                                                        >
                                                            <span>{size}</span>
                                                            <span className="ml-4 text-xs opacity-50">px</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-px h-5 bg-white/20 mx-0.5" />

                                    {/* Color button — shows current color, toggles palette panel */}
                                    <button
                                        title="Text color"
                                        onClick={() => { setTextColorPopoverOpen(o => !o); setTextSizeDropdownOpen(false); }}
                                        className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center gap-1 flex-col ${isColorActive ? 'bg-white/15 ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-900' : 'hover:bg-white/10'}`}
                                    >
                                        {/* "A" glyph in current color */}
                                        <span
                                            className="text-xs font-bold leading-none"
                                            style={{ color: currentColor === '#ffffff' ? '#d1d5db' : currentColor }}
                                        >
                                            A
                                        </span>
                                        {/* Color underbar */}
                                        <span
                                            className="block h-0.5 w-4 rounded-full"
                                            style={{ backgroundColor: currentColor === '#ffffff' ? '#d1d5db' : currentColor }}
                                        />
                                    </button>

                                    <div className="w-px h-5 bg-white/20 mx-0.5" />

                                    {/* Edit (enter edit mode) */}
                                    {!editingTextId && (
                                        <button
                                            title="Edit text"
                                            onClick={(e) => { e.stopPropagation(); editingTextContent.current = selectedText.text; editingTextCache.current = selectedText; setEditingTextId(selectedText.id); }}
                                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Delete */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteTextMarkup(selectedText.id); }}
                                        title="Delete"
                                        className="p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    {isMultiSelection && multiSelectionScreenRect && (
                        <div data-interactive-ui="true" className="absolute flex items-center" style={{ left: `${multiSelectionScreenRect.left + multiSelectionScreenRect.width / 2}px`, top: `${multiSelectionScreenRect.top}px`, transform: 'translate(-50%, -100%) translateY(-10px)', pointerEvents: 'auto', zIndex: 30 }}>
                            <div className="flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                                <div className="relative" data-markup-color-trigger>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMarkupColorPanelOpen((o) => {
                                                const next = !o;
                                                if (next) setMarkupColorPanelSource('selection');
                                                return next;
                                            });
                                        }}
                                        title="Fill & stroke"
                                        className={`p-2 rounded-md transition-colors ${markupColorPanelOpen ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                                    >
                                        <Palette className="w-5 h-5" />
                                    </button>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSelection(); }} title="Delete Selected" className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}
                    
                    {currentRect && (() => {
                        const normalized = normalizeRect(currentRect);
                        const screenRect = getScreenRect(normalized);
                        const previewStroke = markupStrokeColor;
                        const previewFill = markupFillColor === 'transparent' ? 'transparent' : markupFillColor;
                        const dash = `${6 / viewTransform.scale},${4 / viewTransform.scale}`;
                        const sw = 2 / viewTransform.scale;
                        if (normalized.shape === 'box') {
                            return (
                              <div
                                className="absolute pointer-events-none box-border"
                                style={{
                                  ...screenRect,
                                  borderWidth: sw,
                                  borderStyle: 'dashed',
                                  borderColor: previewStroke,
                                  backgroundColor: previewFill === 'transparent' ? 'transparent' : previewFill,
                                  opacity: previewFill === 'transparent' ? 1 : 0.85,
                                }}
                              />
                            );
                        }
                        const fillDraw =
                          previewFill === 'transparent' ? 'rgba(248, 113, 113, 0.08)' : previewFill;
                        const svgProps = {
                          stroke: previewStroke,
                          strokeWidth: sw,
                          fill: fillDraw,
                          strokeDasharray: dash,
                          vectorEffect: 'non-scaling-stroke' as const,
                        };
                        return (
                            <svg className="absolute pointer-events-none overflow-visible" style={{ left: screenRect.left, top: screenRect.top, width: screenRect.width, height: screenRect.height }}>
                                {normalized.shape === 'ellipse' && (<ellipse cx={screenRect.width / 2} cy={screenRect.height / 2} rx={screenRect.width / 2} ry={screenRect.height / 2} {...svgProps} />)}
                                {normalized.shape === 'cloud' && (<path d={generateCloudPath(screenRect.width, screenRect.height)} {...svgProps} />)}
                            </svg>
                        );
                    })()}

                    {marqueeScreenRect && (<div className="absolute border-2 border-dashed border-blue-400 bg-blue-400/15 pointer-events-none" style={marqueeScreenRect} />)}

                    {textDrawScreenRect && (<div className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none" style={textDrawScreenRect} />)}

                    {/* Measurement lines overlay */}
                    {(measurements.length > 0 || (measStart && measCurrent) || calibLine) && (
                      <svg
                        className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-visible"
                        style={{ zIndex: 22 }}
                      >
                        {/* Saved measurements */}
                        {measurements.filter(m => m.visible).map(m => {
                          const p1 = getScreenPoint(m.x1, m.y1);
                          const p2 = getScreenPoint(m.x2, m.y2);
                          if (!p1 || !p2) return null;
                          const label = getLiveMeasureLabel(m.x1, m.y1, m.x2, m.y2);
                          const mx = (p1.left + p2.left) / 2;
                          const my = (p1.top + p2.top) / 2;
                          const dx = p2.left - p1.left;
                          const dy = p2.top - p1.top;
                          const len = Math.sqrt(dx * dx + dy * dy) || 1;
                          const perpX = -dy / len;
                          const perpY = dx / len;
                          const sign = perpY <= 0 ? 1 : -1;
                          const lx = mx + sign * perpX * 20;
                          const ly = my + sign * perpY * 20;
                          const isHovered = hoveredMeasId === m.id;
                          const isDraggingThis = draggingMeasId === m.id;
                          const showHandles = (activeTool === 'measurement' || activeTool === 'select') && drawingScale !== null && (isHovered || isDraggingThis);
                          return (
                            <g key={m.id}
                              className="pointer-events-auto"
                              onMouseEnter={() => setHoveredMeasId(m.id)}
                              onMouseLeave={() => setHoveredMeasId(null)}
                            >
                              {/* Wider invisible hit area for hover */}
                              <line x1={p1.left} y1={p1.top} x2={p2.left} y2={p2.top} stroke="transparent" strokeWidth="16" />
                              {/* Main line */}
                              <line x1={p1.left} y1={p1.top} x2={p2.left} y2={p2.top} stroke="#3B82F6" strokeWidth={isHovered || isDraggingThis ? 2.5 : 2} />
                              {/* Tick marks at endpoints (hidden when handles are shown) */}
                              {!showHandles && <>
                                <line x1={p1.left - perpX * 6} y1={p1.top - perpY * 6} x2={p1.left + perpX * 6} y2={p1.top + perpY * 6} stroke="#3B82F6" strokeWidth="2" />
                                <line x1={p2.left - perpX * 6} y1={p2.top - perpY * 6} x2={p2.left + perpX * 6} y2={p2.top + perpY * 6} stroke="#3B82F6" strokeWidth="2" />
                              </>}
                              {/* Draggable endpoint handles */}
                              {showHandles && <>
                                <circle cx={p1.left} cy={p1.top} r="7" fill="white" stroke="#3B82F6" strokeWidth="2" style={{ cursor: 'grab' }} />
                                <circle cx={p1.left} cy={p1.top} r="3" fill="#3B82F6" style={{ cursor: 'grab' }} />
                                <circle cx={p2.left} cy={p2.top} r="7" fill="white" stroke="#3B82F6" strokeWidth="2" style={{ cursor: 'grab' }} />
                                <circle cx={p2.left} cy={p2.top} r="3" fill="#3B82F6" style={{ cursor: 'grab' }} />
                              </>}
                              {/* Label + delete — foreignObject must be large enough and centered on (lx, ly) */}
                              <foreignObject
                                x={lx - 100}
                                y={ly - 16}
                                width="200"
                                height="32"
                                style={{ overflow: 'visible' }}
                              >
                                <div
                                  xmlns="http://www.w3.org/1999/xhtml"
                                  style={{
                                    display: 'flex',
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    pointerEvents: 'auto',
                                  }}
                                >
                                  <span
                                    style={{
                                      background: '#1d4ed8',
                                      color: '#fff',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      whiteSpace: 'nowrap',
                                      fontFamily: 'ui-monospace, monospace',
                                      letterSpacing: '0.02em',
                                      lineHeight: 1.25,
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                    }}
                                  >
                                    {label}
                                  </span>
                                  {isHovered && activeTool === 'select' && (
                                    <button
                                      type="button"
                                      data-interactive-ui="true"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onMeasurementDelete(m.id);
                                        setHoveredMeasId(null);
                                      }}
                                      style={{
                                        display: 'flex',
                                        flexShrink: 0,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '22px',
                                        height: '22px',
                                        padding: 0,
                                        background: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        lineHeight: 1,
                                      }}
                                      aria-label="Delete measurement"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </foreignObject>
                            </g>
                          );
                        })}

                        {/* Live measurement preview */}
                        {measStart && measCurrent && drawingScale !== null && !isCalibrating && (() => {
                          const p1 = getScreenPoint(measStart.x, measStart.y);
                          const p2 = getScreenPoint(measCurrent.x, measCurrent.y);
                          if (!p1 || !p2) return null;
                          const label = getLiveMeasureLabel(measStart.x, measStart.y, measCurrent.x, measCurrent.y);
                          const dx = p2.left - p1.left;
                          const dy = p2.top - p1.top;
                          const len = Math.sqrt(dx * dx + dy * dy) || 1;
                          const perpX = -dy / len;
                          const perpY = dx / len;
                          const sign = perpY <= 0 ? 1 : -1;
                          const lx = (p1.left + p2.left) / 2 + sign * perpX * 20;
                          const ly = (p1.top + p2.top) / 2 + sign * perpY * 20;
                          return (
                            <g>
                              <line x1={p1.left} y1={p1.top} x2={p2.left} y2={p2.top} stroke="#3B82F6" strokeWidth="2" strokeDasharray="6 3" />
                              <circle cx={p1.left} cy={p1.top} r="4" fill="#3B82F6" />
                              <circle cx={p2.left} cy={p2.top} r="4" fill="#3B82F6" />
                              <foreignObject x={lx - 56} y={ly - 14} width="112" height="28" style={{ overflow: 'visible' }}>
                                <div
                                  xmlns="http://www.w3.org/1999/xhtml"
                                  style={{
                                    display: 'flex',
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <span
                                    style={{
                                      background: '#1d4ed8',
                                      color: '#fff',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      whiteSpace: 'nowrap',
                                      fontFamily: 'ui-monospace, monospace',
                                      lineHeight: 1.25,
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                    }}
                                  >
                                    {label}
                                  </span>
                                </div>
                              </foreignObject>
                            </g>
                          );
                        })()}

                        {/* Calibration line preview (while drawing) */}
                        {measStart && measCurrent && isCalibrating && (() => {
                          const p1 = getScreenPoint(measStart.x, measStart.y);
                          const p2 = getScreenPoint(measCurrent.x, measCurrent.y);
                          if (!p1 || !p2) return null;
                          return (
                            <g>
                              <line x1={p1.left} y1={p1.top} x2={p2.left} y2={p2.top} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" />
                              <circle cx={p1.left} cy={p1.top} r="4" fill="#f59e0b" />
                              <circle cx={p2.left} cy={p2.top} r="4" fill="#f59e0b" />
                            </g>
                          );
                        })()}

                        {/* Drawn calibration line (after release, awaiting input) */}
                        {calibLine && !measStart && (() => {
                          const p1 = getScreenPoint(calibLine.x1, calibLine.y1);
                          const p2 = getScreenPoint(calibLine.x2, calibLine.y2);
                          if (!p1 || !p2) return null;
                          return (
                            <g>
                              <line x1={p1.left} y1={p1.top} x2={p2.left} y2={p2.top} stroke="#f59e0b" strokeWidth="2" />
                              <circle cx={p1.left} cy={p1.top} r="4" fill="#f59e0b" />
                              <circle cx={p2.left} cy={p2.top} r="4" fill="#f59e0b" />
                            </g>
                          );
                        })()}
                      </svg>
                    )}

                    {/* Calibration input popup */}
                    {showCalibInput && calibLine && (() => {
                      const p1 = getScreenPoint(calibLine.x1, calibLine.y1);
                      const p2 = getScreenPoint(calibLine.x2, calibLine.y2);
                      if (!p1 || !p2) return null;
                      const mx = (p1.left + p2.left) / 2;
                      const my = Math.min(p1.top, p2.top) - 16;

                      const confirmCalibration = () => {
                        const ft = parseFloat(calibFt) || 0;
                        const inches = parseFloat(calibIn) || 0;
                        const totalFeet = ft + inches / 12;
                        if (totalFeet <= 0) return;
                        const pixelDist = getMeasureDistancePx(calibLine.x1, calibLine.y1, calibLine.x2, calibLine.y2);
                        onDrawingScaleSet(pixelDist / totalFeet);
                        setIsCalibrating(false);
                        setShowCalibInput(false);
                        setCalibLine(null);
                        setCalibFt('');
                        setCalibIn('');
                      };

                      return (
                        <div
                          data-interactive-ui="true"
                          style={{
                            position: 'absolute',
                            left: mx,
                            top: my,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 50,
                          }}
                          className="bg-gray-900/95 backdrop-blur-sm text-white rounded-xl shadow-xl p-3 min-w-[220px]"
                        >
                          <p className="text-xs font-semibold text-gray-300 mb-2">Enter reference length</p>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              <CalibStepperField
                                value={calibFt}
                                onChange={setCalibFt}
                                min={0}
                                step={1}
                                inputMode="decimal"
                                onEnter={confirmCalibration}
                                autoFocus
                              />
                              <span className="text-xs text-gray-400">ft</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CalibStepperField
                                value={calibIn}
                                onChange={setCalibIn}
                                min={0}
                                max={11}
                                step={1}
                                inputMode="numeric"
                                onEnter={confirmCalibration}
                              />
                              <span className="text-xs text-gray-400">in</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setShowCalibInput(false); setCalibLine(null); setIsCalibrating(false); }}
                              className="flex-1 rounded-lg border border-gray-600 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={confirmCalibration}
                              className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
                            >
                              Set Scale
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ScaleDialog */}
                    <ScaleDialog
                      isOpen={showScaleDialog}
                      onStartCalibrating={() => {
                        resetMeasurementCalibrationUi();
                        setShowScaleDialog(false);
                        setIsCalibrating(true);
                        onBeginScaleRecalibration();
                      }}
                      onClose={() => {
                        setShowScaleDialog(false);
                        if (activeTool === 'measurement' && drawingScale === null) {
                          setActiveTool('select');
                        }
                      }}
                    />

                    {/* Item Tags */}
                    {rectangles.filter(r => r.visible).map(rect => {
                        const screenRect = getScreenRect(rect);
                        if (!screenRect) return null;
                        let tagCount = 0;
                        const renderTag = (type: RectangleTagType, item: any, text: string) => {
                            if (!filters[type]) return null;
                            const tagColorClasses = { rfi: 'bg-blue-600/85 hover:bg-blue-500/85', submittal: 'bg-slate-600/85 hover:bg-slate-500/85', punch: 'bg-orange-600/90 hover:bg-orange-500/90', drawing: 'bg-indigo-600/85 hover:bg-indigo-500/85', photo: 'bg-sky-600/85 hover:bg-sky-500/85' };
                            const positionIndex = tagCount++;
                            return (
                                <div
                                    key={`${type}-tag-${rect.id}-${item.id}`}
                                    className={`absolute text-white text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-md cursor-pointer transition-colors ${tagColorClasses[type]}`}
                                    style={{ left: `${screenRect.left + screenRect.width + 5}px`, top: `${screenRect.top + positionIndex * 24}px`, pointerEvents: 'auto', zIndex: 25 }}
                                    onClick={(e) => { e.stopPropagation(); if(type === 'rfi') onOpenRfiPanel(rect.id, item.id); if(type === 'photo') { onOpenPhotoViewer({ rectId: rect.id, photoId: item.id }); } }}
                                    onMouseEnter={(e) => {
                                        if (hidePopupTimer.current) { clearTimeout(hidePopupTimer.current); hidePopupTimer.current = null; }
                                        const tagRect = e.currentTarget.getBoundingClientRect();
                                        const hoverInfo = { type: type, rectId: rect.id, itemId: item.id, position: { top: tagRect.top + tagRect.height / 2, left: tagRect.right } };
                                        if (showPopupTimer.current) clearTimeout(showPopupTimer.current);
                                        showPopupTimer.current = window.setTimeout(() => setHoveredItem(hoverInfo), 180);
                                    }}
                                    onMouseLeave={() => {
                                        if (showPopupTimer.current) { clearTimeout(showPopupTimer.current); showPopupTimer.current = null; }
                                        hidePopupTimer.current = window.setTimeout(() => setHoveredItem(null), 500);
                                    }}
                                >
                                    {text}
                                </div>
                            );
                        };
                        return (
                            <React.Fragment key={`tags-for-${rect.id}`}>
                                {rect.rfi?.map(rfi => renderTag('rfi', rfi, `RFI-${rfi.id}`))}
                                {rect.submittals?.map(sub => renderTag('submittal', sub, sub.id))}
                                {rect.punches?.map(punch => renderTag('punch', punch, punch.id))}
                                {rect.drawings?.map(drawing => renderTag('drawing', drawing, drawing.id))}
                                {rect.photos?.map(photo => renderTag('photo', photo, photo.id))}
                            </React.Fragment>
                        );
                    })}

                    {/* Line Markup Tags */}
                    {lineMarkups.filter(line => line.visible).map(line => {
                        const screenPoints = line.points.map((p) => getScreenPoint(p.x, p.y)).filter(Boolean) as { left: number; top: number }[];
                        if (screenPoints.length === 0) return null;
                        const minX = Math.min(...screenPoints.map((p) => p.left));
                        const maxX = Math.max(...screenPoints.map((p) => p.left));
                        const minY = Math.min(...screenPoints.map((p) => p.top));
                        const maxY = Math.max(...screenPoints.map((p) => p.top));
                        const centerY = (minY + maxY) / 2;
                        const TAG_W = 132;
                        const TAG_H = 22;
                        const TAG_GAP = 24;
                        const rightRoom = containerSize.width - (maxX + 5);
                        const leftRoom = minX - 5;
                        const placeRight = rightRoom >= TAG_W || rightRoom >= leftRoom;
                        const baseLeft = placeRight
                            ? Math.min(maxX + 5, Math.max(6, containerSize.width - TAG_W - 6))
                            : Math.max(6, minX - TAG_W - 5);
                        const baseTop = Math.max(6, Math.min(centerY - TAG_H / 2, containerSize.height - TAG_H - 6));
                        let tagCount = 0;
                        const renderLineTag = (type: RectangleTagType, item: any, text: string) => {
                            if (!filters[type]) return null;
                            const tagColorClasses = { rfi: 'bg-blue-600/85 hover:bg-blue-500/85', submittal: 'bg-slate-600/85 hover:bg-slate-500/85', punch: 'bg-orange-600/90 hover:bg-orange-500/90', drawing: 'bg-indigo-600/85 hover:bg-indigo-500/85', photo: 'bg-sky-600/85 hover:bg-sky-500/85' };
                            const positionIndex = tagCount++;
                            const nextTop = Math.max(6, Math.min(baseTop + positionIndex * TAG_GAP, containerSize.height - TAG_H - 6));
                            return (
                                <div
                                    key={`${type}-line-tag-${line.id}-${item.id}`}
                                    className={`absolute text-white text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-md cursor-pointer transition-colors ${tagColorClasses[type]}`}
                                    style={{ left: `${baseLeft}px`, top: `${nextTop}px`, maxWidth: `${TAG_W}px`, pointerEvents: 'auto', zIndex: 25 }}
                                    onClick={(e) => { e.stopPropagation(); if(type === 'rfi') onOpenRfiPanel(line.id, item.id); if(type === 'photo') { onOpenPhotoViewer({ rectId: line.id, photoId: item.id }); } }}
                                    onMouseEnter={(e) => {
                                        if (hidePopupTimer.current) { clearTimeout(hidePopupTimer.current); hidePopupTimer.current = null; }
                                        const tagRect = e.currentTarget.getBoundingClientRect();
                                        const hoverInfo = { type: type, rectId: line.id, itemId: item.id, position: { top: tagRect.top + tagRect.height / 2, left: tagRect.right } };
                                        if (showPopupTimer.current) clearTimeout(showPopupTimer.current);
                                        showPopupTimer.current = window.setTimeout(() => setHoveredItem(hoverInfo), 180);
                                    }}
                                    onMouseLeave={() => {
                                        if (showPopupTimer.current) { clearTimeout(showPopupTimer.current); showPopupTimer.current = null; }
                                        hidePopupTimer.current = window.setTimeout(() => setHoveredItem(null), 500);
                                    }}
                                >
                                    <span className="block truncate">{text}</span>
                                </div>
                            );
                        };

                        return (
                            <React.Fragment key={`line-tags-for-${line.id}`}>
                                {line.rfi?.map(rfi => renderLineTag('rfi', rfi, `RFI-${rfi.id}`))}
                                {line.submittals?.map(sub => renderLineTag('submittal', sub, sub.id))}
                                {line.punches?.map(punch => renderLineTag('punch', punch, punch.id))}
                                {line.drawings?.map(drawing => renderLineTag('drawing', drawing, drawing.id))}
                                {line.photos?.map(photo => renderLineTag('photo', photo, photo.id))}
                            </React.Fragment>
                        );
                    })}

                    {/* Text Markup Tags — upper-right / upper-left with diagonal leader lines */}
                    {textMarkups.filter(t => t.visible).map(text => {
                        const TAG_W = 132;
                        const TAG_H = 22;
                        const TAG_GAP = 24;
                        // How far above the text baseline the tag stack sits (tight but clear)
                        const LEADER_V = 18;
                        // Horizontal gap from text edge to the tag column
                        const LEADER_X = 20;
                        const MARGIN = 8; // min distance from browser edge

                        // Collect all visible linked items in order
                        const tagColorClasses: Record<RectangleTagType, string> = { rfi: 'bg-blue-600/85 hover:bg-blue-500/85', submittal: 'bg-slate-600/85 hover:bg-slate-500/85', punch: 'bg-orange-600/90 hover:bg-orange-500/90', drawing: 'bg-indigo-600/85 hover:bg-indigo-500/85', photo: 'bg-sky-600/85 hover:bg-sky-500/85' };
                        const allTags: { type: RectangleTagType; item: any; label: string }[] = [
                            ...(filters['rfi'] ? (text.rfi ?? []).map(item => ({ type: 'rfi' as RectangleTagType, item, label: `RFI-${item.id}` })) : []),
                            ...(filters['submittal'] ? (text.submittals ?? []).map(item => ({ type: 'submittal' as RectangleTagType, item, label: item.id })) : []),
                            ...(filters['punch'] ? (text.punches ?? []).map(item => ({ type: 'punch' as RectangleTagType, item, label: item.id })) : []),
                            ...(filters['drawing'] ? (text.drawings ?? []).map(item => ({ type: 'drawing' as RectangleTagType, item, label: item.id })) : []),
                            ...(filters['photo'] ? (text.photos ?? []).map(item => ({ type: 'photo' as RectangleTagType, item, label: item.id })) : []),
                        ];
                        if (allTags.length === 0) return null;

                        const screenPos = getScreenPoint(text.x, text.y);
                        if (!screenPos) return null;

                        // Container rect gives us the viewport origin of the canvas container
                        const cRect = imageContainerRef.current?.getBoundingClientRect();
                        if (!cRect) return null;

                        // Estimate rendered text width (scaled font size × avg char width × char count)
                        const scaledFontSize = (text.fontSize ?? 16) * viewTransform.scale;
                        const estimatedTextWidth = Math.min(scaledFontSize * 0.58 * text.text.length, 500);

                        // Text anchor positions in viewport coords
                        const anchorVX = cRect.left + screenPos.left;      // first char (left edge)
                        const lastCharVX = anchorVX + estimatedTextWidth;  // last char (right edge)
                        const anchorVY = cRect.top + screenPos.top;

                        const WIN_W = window.innerWidth;
                        const WIN_H = window.innerHeight;

                        // Stack height for all tags
                        const stackHeight = allTags.length * TAG_GAP + TAG_H;

                        // Preferred tag column left edge in viewport coords for each direction
                        const rightColVX = lastCharVX + LEADER_X;
                        const leftColVX  = anchorVX - LEADER_X - TAG_W;

                        const rightFits = rightColVX + TAG_W + MARGIN <= WIN_W;
                        const leftFits  = leftColVX  - MARGIN >= 0;

                        // Prefer right (tags grow rightward from last char); fallback to left;
                        // if neither fits choose whichever has more room.
                        const placeRight =
                            rightFits ? true :
                            leftFits  ? false :
                            (WIN_W - lastCharVX) >= anchorVX;

                        // Clamp tag column to viewport, then convert back to container coords
                        let colVX: number;
                        if (placeRight) {
                            colVX = Math.min(rightColVX, WIN_W - TAG_W - MARGIN);
                        } else {
                            colVX = Math.max(MARGIN, leftColVX);
                        }
                        const baseLeft = colVX - cRect.left;

                        // Tags sit just above the text mid-line
                        // anchorVY is the top of the text div; add half a line-height to get the visual centre
                        const textMidVY = anchorVY + (scaledFontSize * 1.4) / 2;
                        const preferredTopVY = textMidVY - LEADER_V - stackHeight;
                        const clampedTopVY   = Math.max(MARGIN, Math.min(preferredTopVY, WIN_H - stackHeight - TAG_H - MARGIN));
                        // Also clamp so tags don't go below the container bottom
                        const maxContainerTop = containerSize.height - stackHeight - TAG_H - 4;
                        const baseTop = Math.min(clampedTopVY - cRect.top, maxContainerTop);

                        // Tag centre Y values in container coords
                        const tagCenterYs = allTags.map((_, i) => baseTop + i * TAG_GAP + TAG_H / 2);
                        const firstCY = tagCenterYs[0];
                        const lastCY  = tagCenterYs[tagCenterYs.length - 1];
                        const junctionY = (firstCY + lastCY) / 2;

                        // Leader endpoints in container coords:
                        // Dot sits right at the text edge (last char right / first char left)
                        const dotX      = placeRight ? screenPos.left + estimatedTextWidth : screenPos.left;
                        const dotY      = screenPos.top + (scaledFontSize * 1.4) / 2; // vertically centred on cap-height
                        const junctionX = placeRight ? baseLeft - 2 : baseLeft + TAG_W + 2;
                        const leaderColor = text.color ?? '#ef4444';

                        return (
                            <React.Fragment key={`text-tags-for-${text.id}`}>
                                {/* Leader line SVG — full-container overlay, pointer-events none */}
                                <svg
                                    style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 24, overflow: 'visible' }}
                                >
                                    {/* Anchor dot at text edge */}
                                    <circle cx={dotX} cy={dotY} r={2.5} fill={leaderColor} opacity={0.8} />
                                    {/* Diagonal leader: dot → junction */}
                                    <line x1={dotX} y1={dotY} x2={junctionX} y2={junctionY} stroke={leaderColor} strokeWidth={1} strokeOpacity={0.6} strokeDasharray="4 2" />
                                    {/* Vertical spine connecting all tags (only when >1) */}
                                    {allTags.length > 1 && (
                                        <line x1={junctionX} y1={firstCY} x2={junctionX} y2={lastCY} stroke={leaderColor} strokeWidth={1} strokeOpacity={0.5} />
                                    )}
                                    {/* Horizontal tick from spine to each tag */}
                                    {tagCenterYs.map((cy, i) => (
                                        <line key={i} x1={junctionX} y1={cy} x2={placeRight ? baseLeft : baseLeft + TAG_W} y2={cy} stroke={leaderColor} strokeWidth={1} strokeOpacity={0.5} />
                                    ))}
                                </svg>

                                {/* Tag pills */}
                                {allTags.map(({ type, item, label }, i) => (
                                    <div
                                        key={`${type}-text-tag-${text.id}-${item.id}`}
                                        className={`absolute text-white text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-md cursor-pointer transition-colors ${tagColorClasses[type]}`}
                                        style={{ left: `${baseLeft}px`, top: `${tagCenterYs[i] - TAG_H / 2}px`, maxWidth: `${TAG_W}px`, pointerEvents: 'auto', zIndex: 25 }}
                                        onClick={(e) => { e.stopPropagation(); if (type === 'rfi') onOpenRfiPanel(text.id, item.id); if (type === 'photo') onOpenPhotoViewer({ rectId: text.id, photoId: item.id }); }}
                                        onMouseEnter={(e) => {
                                            if (hidePopupTimer.current) { clearTimeout(hidePopupTimer.current); hidePopupTimer.current = null; }
                                            const tagRect = e.currentTarget.getBoundingClientRect();
                                            if (showPopupTimer.current) clearTimeout(showPopupTimer.current);
                                            showPopupTimer.current = window.setTimeout(() => setHoveredItem({ type, rectId: text.id, itemId: item.id, position: { top: tagRect.top + tagRect.height / 2, left: tagRect.right } }), 180);
                                        }}
                                        onMouseLeave={() => {
                                            if (showPopupTimer.current) { clearTimeout(showPopupTimer.current); showPopupTimer.current = null; }
                                            hidePopupTimer.current = window.setTimeout(() => setHoveredItem(null), 500);
                                        }}
                                    >
                                        <span className="block truncate">{label}</span>
                                    </div>
                                ))}
                            </React.Fragment>
                        );
                    })}

                    <div data-interactive-ui="true" className="absolute bottom-4 right-4 flex flex-col gap-2 bg-gray-900/95 backdrop-blur-sm p-1.5 rounded-lg shadow-xl text-white">
                        <Tooltip text="Zoom In" shortcut="+" position="left"><button onClick={() => handleZoom('in')} className="p-2 rounded-md hover:bg-gray-700 transition-colors"><MagnifyingGlassPlusIcon className="w-5 h-5"/></button></Tooltip>
                        <Tooltip text="Zoom Out" shortcut="-" position="left"><button onClick={() => handleZoom('out')} className="p-2 rounded-md hover:bg-gray-700 transition-colors"><MagnifyingGlassMinusIcon className="w-5 h-5"/></button></Tooltip>
                        <Tooltip text="Reset View" shortcut="0" position="left"><button onClick={() => handleZoom('reset')} className="p-2 rounded-md hover:bg-gray-700 transition-colors"><ArrowsPointingOutIcon className="w-5 h-5"/></button></Tooltip>
                    </div>
                    
                    <div data-interactive-ui="true" ref={settingsMenuRef} className="absolute bottom-4 left-4 flex flex-col items-start gap-2">
                        {isSettingsMenuOpen && (
                            <div className="bg-gray-900/95 backdrop-blur-sm p-2 rounded-lg shadow-xl mb-1 w-40">
                               <h4 className="font-semibold text-sm px-2 pb-1.5 mb-1 border-b border-gray-600 text-white">Toolbar Position</h4>
                               <div className="flex flex-col gap-1">
                                   <ToolbarPositionButton position="bottom" label="Footer" />
                                   <ToolbarPositionButton position="top" label="Top" />
                                   <ToolbarPositionButton position="left" label="Left" />
                                   <ToolbarPositionButton position="right" label="Right" />
                               </div>
                            </div>
                        )}
                        <div className="flex gap-2 bg-gray-900/95 backdrop-blur-sm p-1.5 rounded-lg shadow-xl text-white">
                            <Tooltip text={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} position="top">
                                <button onClick={handleThemeToggle} className="p-2 rounded-md transition-colors duration-200 hover:bg-gray-700">
                                    {theme === 'dark' ? (<SunIcon className="w-5 h-5" />) : (<MoonIcon className="w-5 h-5" />)}
                                </button>
                            </Tooltip>
                            <Tooltip text="Toolbar Position" position="top">
                                <button onClick={() => setIsSettingsMenuOpen(p => !p)} className="p-2 rounded-md transition-colors duration-200 hover:bg-gray-700">
                                    <CogIcon className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    {markupColorPanelOpen && (() => {
                        const activeSelectionRect = singleSelectionScreenRect || selectedLineScreenRect || multiSelectionScreenRect;
                        const PICKER_W = 300;
                        const PICKER_H = 520;
                        const GAP = 12;
                        let pickerStyle: React.CSSProperties;
                        const containerEl = imageContainerRef.current;
                        const toolbarAnchor = markupToolbarFillStrokeRef.current;
                        if (
                            markupColorPanelSource === 'toolbar' &&
                            containerEl &&
                            toolbarAnchor &&
                            containerSize.width > 0
                        ) {
                            const cr = containerEl.getBoundingClientRect();
                            const ar = toolbarAnchor.getBoundingClientRect();
                            const relLeft = ar.left - cr.left;
                            const relTop = ar.top - cr.top;
                            const W = containerSize.width;
                            const H = containerSize.height;
                            const left = Math.max(8, Math.min(relLeft + ar.width / 2 - PICKER_W / 2, W - PICKER_W - 8));
                            const bottom = H - relTop + GAP;
                            pickerStyle = { left: `${left}px`, bottom: `${bottom}px` };
                        } else if (activeSelectionRect && containerSize.width > 0) {
                            const markupRight = activeSelectionRect.left + activeSelectionRect.width;
                            const markupLeft = activeSelectionRect.left;
                            let left: number;
                            if (markupRight + GAP + PICKER_W <= containerSize.width - 4) {
                                left = markupRight + GAP;
                            } else if (markupLeft - GAP - PICKER_W >= 4) {
                                left = markupLeft - GAP - PICKER_W;
                            } else {
                                left = toolbarPosition === 'right' ? 12 : containerSize.width - PICKER_W - 12;
                            }
                            const preferredTop = activeSelectionRect.top - 8;
                            const top = Math.max(8, Math.min(preferredTop, Math.max(8, containerSize.height - PICKER_H - 8)));
                            pickerStyle = { left: `${left}px`, top: `${top}px` };
                        } else {
                            pickerStyle = toolbarPosition === 'right'
                                ? { left: '12px', top: '50%', transform: 'translateY(-50%)' }
                                : { right: '12px', top: '50%', transform: 'translateY(-50%)' };
                        }
                        return (
                            <div
                                ref={markupColorPanelRef}
                                data-interactive-ui="true"
                                className="pointer-events-auto absolute z-[50] max-h-[min(640px,calc(100%-4rem))] w-[min(300px,calc(100%-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl"
                                style={pickerStyle}
                                role="dialog"
                                aria-label="Markup fill and outline"
                            >
                                <MarkupColorPicker
                                    activeMode={activeColor}
                                    onActiveModeChange={onMarkupActiveModeChange}
                                    fillValue={markupFillColor}
                                    strokeValue={markupStrokeColor}
                                    onChange={onMarkupColorChange}
                                    onRequestClose={() => setMarkupColorPanelOpen(false)}
                                    strokeOnly={activeTool === 'line' || activeTool === 'arrow' || activeTool === 'pen' || activeTool === 'highlighter'}
                                />
                            </div>
                        );
                    })()}

                    {!compareImages && (
                        <div data-interactive-ui="true" className={`absolute z-20 ${getToolbarPositionClasses()}`}>
                             <Toolbar
                                 activeTool={activeTool}
                                 setActiveTool={setActiveTool}
                                 activeLineTool={activeLineTool}
                                 setActiveLineTool={setActiveLineTool}
                                 activeShape={activeShape}
                                 setActiveShape={setActiveShape}
                                 activePinType={activePinType}
                                 setActivePinType={setActivePinType}
                                 markupFillColor={markupFillColor}
                                 markupStrokeColor={markupStrokeColor}
                                 markupColorPanelOpen={markupColorPanelOpen}
                                 onMarkupColorPanelToggle={() => {
                                     setMarkupColorPanelOpen((o) => {
                                         const next = !o;
                                         if (next) setMarkupColorPanelSource('toolbar');
                                         return next;
                                     });
                                 }}
                                 onMarkupColorPanelClose={() => setMarkupColorPanelOpen(false)}
                                 toolbarPosition={toolbarPosition}
                                 ref={markupToolbarFillStrokeRef}
                             />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CanvasView;