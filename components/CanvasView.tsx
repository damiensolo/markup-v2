

// Fix: Import 'useCallback' from 'react' to resolve 'Cannot find name' errors.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, ChevronUp, ChevronDown } from 'lucide-react';
import type { Rectangle, Pin, ViewTransform, InteractionState, HoveredItemInfo, ResizeHandle, Measurement } from '../types';
import ScaleDialog from './ScaleDialog';
import { RectangleTagType, ToolbarPosition, ImageGeom } from '../App';
import { UploadIcon, TrashIcon, LinkIcon, ArrowUpTrayIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowsPointingOutIcon, SunIcon, MoonIcon, SafetyPinIcon, PunchPinIcon, PhotoPinIcon, InformationCircleIcon, FilterIcon, CogIcon } from './Icons';
import Toolbar from './Toolbar';
import Tooltip from './Tooltip';
import MarkupColorPicker from './MarkupColorPicker';
import { resolveRectFillColor, resolveRectStrokeColor } from '../utils/markupColors';
import { getRectDimensions, formatFt, formatArea } from '../utils/measurementUtils';

type ActiveTool = 'select' | 'shape' | 'pen' | 'arrow' | 'text' | 'pin' | 'image' | 'location' | 'measurement' | 'polygon' | 'highlighter' | 'customPin' | 'fill' | 'stroke';
type ActiveShape = 'cloud' | 'box' | 'ellipse';
type ActivePinType = 'photo' | 'safety' | 'punch';
type ActiveColor = 'fill' | 'stroke';
type FilterCategory = 'rfi' | 'submittal' | 'punch' | 'drawing' | 'photo' | 'safety';


interface CanvasViewProps {
    imageSrc: string;
    rectangles: Rectangle[];
    pins: Pin[];
    filters: Record<FilterCategory, boolean>;
    viewTransform: ViewTransform;
    interaction: InteractionState;
    activeTool: ActiveTool;
    hoveredRectId: string | null;
    draggingPinId: string | null;
    selectedRectIds: string[];
    selectedPinId: string | null;
    currentRect: Omit<Rectangle, 'id' | 'name' | 'visible'> | null;
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
    handleMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseUp: (event: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseLeave: () => void;
    handleZoom: (direction: 'in' | 'out' | 'reset') => void;
    handleThemeToggle: () => void;
    setHoveredRectId: (id: string | null) => void;
    setActiveTool: (tool: ActiveTool) => void;
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
        imageSrc, rectangles, pins, filters, viewTransform, interaction, activeTool, hoveredRectId, draggingPinId,
        selectedRectIds, selectedPinId, currentRect, marqueeRect, isMenuVisible, linkMenuRectId, setLinkMenuRectId, openLinkSubmenu,
        theme, toolbarPosition, setToolbarPosition, isSpacebarDown, imageContainerRef, imageGeom, onImageGeomChange,
        handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleZoom, handleThemeToggle, 
        setHoveredRectId, setActiveTool, activeShape, setActiveShape, activePinType, setActivePinType, activeColor,
        markupFillColor, markupStrokeColor, onMarkupColorChange, onMarkupActiveModeChange,
        setDraggingPinId, setSelectedPinId, handlePinDetails, handleDeletePin, setHoveredItem,
        hidePopupTimer, showPopupTimer, handleResizeStart, handlePublishRect, handleLinkRect, onDeleteSelection, setOpenLinkSubmenu,
        handleSubmenuLink, onOpenRfiPanel, onOpenPhotoViewer, mouseDownRef, setSelectedRectIds, getRelativeCoords, setPinDragOffset,
        measurements, drawingScale, onMeasurementAdd, onMeasurementDelete, onMeasurementUpdate, onDrawingScaleSet, onNaturalSizeChange,
        drawingScaleClearTick, drawingScaleRecalibrateTick, onBeginScaleRecalibration,
    } = props;

    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [markupColorPanelOpen, setMarkupColorPanelOpen] = useState(false);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const markupColorPanelRef = useRef<HTMLDivElement>(null);
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
        if (!markupColorPanelOpen) return;
        const onDown = (e: MouseEvent) => {
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
        if (interaction.type === 'panning' || draggingPinId) return 'cursor-grabbing';
        if (isSpacebarDown) return 'cursor-grab';
        switch (interaction.type) {
            case 'moving': return 'cursor-grabbing';
            case 'resizing':
                if (interaction.handle === 'tl' || interaction.handle === 'br') return 'cursor-nwse-resize';
                if (interaction.handle === 'tr' || interaction.handle === 'bl') return 'cursor-nesw-resize';
                break;
            case 'drawing':
            case 'marquee':
                return 'cursor-crosshair';
        }
        if (activeTool === 'pin') return 'cursor-crosshair';
        if (draggingMeasId) return 'cursor-grabbing';
        if (activeTool === 'measurement') return 'cursor-crosshair';
        if (activeTool === 'shape') {
            if (hoveredRectId) return 'cursor-move';
            return 'cursor-crosshair';
        }
        if (activeTool === 'select') {
            if (hoveredRectId) return 'cursor-move';
            if (viewTransform.scale > 1) return 'cursor-grab';
        }
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
        handleMouseDown(e);
    };

    const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
        handleMouseMove(e);
    };

    const onCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
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
        if (draggingMeasId) {
            setDraggingMeasId(null);
            setDraggingMeasEndpoint(null);
        }
        if (activeTool === 'measurement' && measStart) {
            setMeasStart(null);
            setMeasCurrent(null);
        }
        handleMouseLeave();
    };

    const isSingleSelection = selectedRectIds.length === 1;
    const isMultiSelection = selectedRectIds.length > 1;
    const selectedRectangle = isSingleSelection ? rectangles.find(r => r.id === selectedRectIds[0]) : null;
    const lastSelectedRectangle = isMultiSelection ? rectangles.find(r => r.id === selectedRectIds[selectedRectIds.length - 1]) : null;
    
    let singleSelectionScreenRect = selectedRectangle ? getScreenRect(selectedRectangle) : null;
    let multiSelectionScreenRect = lastSelectedRectangle ? getScreenRect(lastSelectedRectangle) : null;
    let marqueeScreenRect = marqueeRect ? getScreenRect(normalizeRect(marqueeRect)) : null;

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
                         <img ref={imageRef} src={imageSrc} alt="Blueprint" className="w-full h-full object-contain pointer-events-none" onLoad={handleImageLoad} style={{ position: 'absolute', top: 0, left: 0 }} />
                        {rectangles.filter(r => r.visible).map((rect) => {
                            const normalized = normalizeRect(rect);
                            const isSelected = selectedRectIds.includes(rect.id);
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
                                        <div className="relative w-full h-full box-border" style={{ borderWidth: sw, borderStyle: 'solid', borderColor: strokeColor, backgroundColor: fillColor === 'transparent' ? 'transparent' : fillColor }}>
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
                    </div>

                    {/* Screen-space Overlays */}
                    {pins.filter(pin => pin.visible && filters[pin.type as FilterCategory]).map(pin => {
                      const screenPos = getScreenPoint(pin.x, pin.y);
                      if (!screenPos) return null;
                      const PinIcon = { photo: PhotoPinIcon, safety: SafetyPinIcon, punch: PunchPinIcon }[pin.type];
                      
                      // Allow selecting/dragging pin even in 'shape' mode to avoid confusion
                      const isSelectable = activeTool === 'select' || activeTool === 'shape';
                      
                      const pinCursor = isSelectable ? (draggingPinId === pin.id ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer';
                      const isSelected = selectedPinId === pin.id;
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
                                            setMarkupColorPanelOpen((o) => !o);
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

                    {isMultiSelection && multiSelectionScreenRect && (
                        <div data-interactive-ui="true" className="absolute flex items-center" style={{ left: `${multiSelectionScreenRect.left + multiSelectionScreenRect.width / 2}px`, top: `${multiSelectionScreenRect.top}px`, transform: 'translate(-50%, -100%) translateY(-10px)', pointerEvents: 'auto', zIndex: 30 }}>
                            <div className="flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                                <div className="relative" data-markup-color-trigger>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMarkupColorPanelOpen((o) => !o);
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
                              {/* Label */}
                              <foreignObject x={lx - 36} y={ly - 12} width="72" height="24" style={{ overflow: 'visible' }}>
                                <div
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <span style={{
                                    background: '#1d4ed8',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.02em',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                  }}>
                                    {label}
                                  </span>
                                  {isHovered && activeTool === 'select' && (
                                    <button
                                      data-interactive-ui="true"
                                      onClick={(e) => { e.stopPropagation(); onMeasurementDelete(m.id); setHoveredMeasId(null); }}
                                      style={{
                                        background: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '2px 5px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        lineHeight: 1,
                                      }}
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
                              <foreignObject x={lx - 36} y={ly - 12} width="72" height="24" style={{ overflow: 'visible' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <span style={{
                                    background: '#1d4ed8', color: '#fff', fontSize: '11px', fontWeight: 600,
                                    padding: '2px 7px', borderRadius: '4px', whiteSpace: 'nowrap',
                                    fontFamily: 'monospace', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                  }}>
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
                        const activeSelectionRect = singleSelectionScreenRect || multiSelectionScreenRect;
                        const PICKER_W = 300;
                        const GAP = 12;
                        let pickerStyle: React.CSSProperties;
                        if (activeSelectionRect && containerSize.width > 0) {
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
                            const top = Math.max(8, activeSelectionRect.top - 8);
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
                                />
                            </div>
                        );
                    })()}

                    <div data-interactive-ui="true" className={`absolute z-20 ${getToolbarPositionClasses()}`}>
                         <Toolbar 
                             activeTool={activeTool} 
                             setActiveTool={setActiveTool} 
                             activeShape={activeShape} 
                             setActiveShape={setActiveShape} 
                             activePinType={activePinType} 
                             setActivePinType={setActivePinType} 
                             markupFillColor={markupFillColor}
                             markupStrokeColor={markupStrokeColor}
                             markupColorPanelOpen={markupColorPanelOpen}
                             onMarkupColorPanelToggle={() => setMarkupColorPanelOpen((o) => !o)}
                             onMarkupColorPanelClose={() => setMarkupColorPanelOpen(false)}
                             toolbarPosition={toolbarPosition}
                         />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanvasView;