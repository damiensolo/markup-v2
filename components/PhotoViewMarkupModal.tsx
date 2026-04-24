import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Palette } from 'lucide-react';
import type { Rectangle, LineMarkup, TextMarkup, ResizeHandle, RfiData, SubmittalData, PunchData, DrawingData, LinkModalConfig } from '../types';
import type { PhotoData } from '../types';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import Toolbar from './Toolbar';
import MarkupColorPicker from './MarkupColorPicker';
import type { MarkupColorMode } from './MarkupColorPicker';
import LinkModal from './LinkModal';
import PhotoPickerModal from './PhotoPickerModal';
import { DEFAULT_MARKUP_FILL, resolveRectFillColor, resolveRectStrokeColor } from '../utils/markupColors';
import { XMarkIcon, TrashIcon, LinkIcon } from './Icons';
import type { RectangleTagType, ToolbarPosition } from '../App';

const PHOTO_MARKUP_TAG_COLOR_CLASSES: Record<RectangleTagType, string> = {
    rfi: 'bg-blue-600/85 hover:bg-blue-500/85',
    submittal: 'bg-slate-600/85 hover:bg-slate-500/85',
    punch: 'bg-orange-600/90 hover:bg-orange-500/90',
    drawing: 'bg-indigo-600/85 hover:bg-indigo-500/85',
    photo: 'bg-sky-600/85 hover:bg-sky-500/85',
};

// ─── types ────────────────────────────────────────────────────────────────────

export interface PhotoMarkupData {
    rectangles: Rectangle[];
    lineMarkups: LineMarkup[];
    textMarkups: TextMarkup[];
}

interface ImageBounds { x: number; y: number; w: number; h: number }

interface Props {
    isOpen: boolean;
    photo: PhotoData | null;
    initialMarkups?: PhotoMarkupData;
    onSave: (markups: PhotoMarkupData) => void;
    onClose: () => void;
    allRfis?: RfiData[];
    allSubmittals?: SubmittalData[];
    allPunches?: PunchData[];
    allDrawings?: DrawingData[];
}

// ─── cloud path (same algorithm as CanvasView) ────────────────────────────────

function generateCloudPath(w: number, h: number): string {
    if (w <= 0 || h <= 0) return '';
    const r = Math.max(6, Math.min(w / 4, h / 4, 15));
    let path = `M ${r},0`;
    const topScallops = Math.max(1, Math.round((w - 2 * r) / (2 * r)));
    const topStep = (w - 2 * r) / topScallops;
    for (let i = 0; i < topScallops; i++) path += ` a ${topStep / 2},${r} 0 0,1 ${topStep},0`;
    path += ` a ${r},${r} 0 0,1 ${r},${r}`;
    const rightScallops = Math.max(1, Math.round((h - 2 * r) / (2 * r)));
    const rightStep = (h - 2 * r) / rightScallops;
    for (let i = 0; i < rightScallops; i++) path += ` a ${r},${rightStep / 2} 0 0,1 0,${rightStep}`;
    path += ` a ${r},${r} 0 0,1 -${r},${r}`;
    const bottomScallops = Math.max(1, Math.round((w - 2 * r) / (2 * r)));
    const bottomStep = (w - 2 * r) / bottomScallops;
    for (let i = 0; i < bottomScallops; i++) path += ` a ${bottomStep / 2},${r} 0 0,1 -${bottomStep},0`;
    path += ` a ${r},${r} 0 0,1 -${r},-${r}`;
    const leftScallops = Math.max(1, Math.round((h - 2 * r) / (2 * r)));
    const leftStep = (h - 2 * r) / leftScallops;
    for (let i = 0; i < leftScallops; i++) path += ` a ${r},${leftStep / 2} 0 0,1 0,-${leftStep}`;
    path += ` a ${r},${r} 0 0,1 ${r},-${r}`;
    return path;
}

// ─── component ────────────────────────────────────────────────────────────────

const PhotoViewMarkupModal: React.FC<Props> = ({ isOpen, photo, initialMarkups, onSave, onClose, allRfis = [], allSubmittals = [], allPunches = [], allDrawings = [] }) => {

    // ── tool state ──────────────────────────────────────────────────────────
    const [activeTool, setActiveTool]           = useState<any>('select');
    const [activeShape, setActiveShape]         = useState<any>('box');
    const [activeLineTool, setActiveLineTool]   = useState<any>('arrow');
    const [markupFillColor, setMarkupFillColor] = useState(DEFAULT_MARKUP_FILL);
    const [markupStrokeColor, setMarkupStrokeColor] = useState('#EF4444');
    const [activeColorMode, setActiveColorMode] = useState<MarkupColorMode>('fill');
    const [colorPanelOpen, setColorPanelOpen]   = useState(false);
    const [colorPanelSource, setColorPanelSource] = useState<'toolbar' | 'selection' | null>(null);

    // ── markup data ───────────────────────────────────────────────────────
    const [rectangles, setRectangles]                         = useState<Rectangle[]>([]);
    const [lineMarkups, setLineMarkups]                       = useState<LineMarkup[]>([]);
    const [textMarkups, setTextMarkups]                       = useState<TextMarkup[]>([]);
    const [selectedRectIds, setSelectedRectIds]               = useState<string[]>([]);
    const [selectedLineIds, setSelectedLineIds]               = useState<string[]>([]);
    const [selectedLineId, setSelectedLineId]                 = useState<string | null>(null);
    const [selectedLinePointIndex, setSelectedLinePointIndex] = useState<number | null>(null);
    const [selectedTextId, setSelectedTextId]                 = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges]           = useState(false);
    const [isMenuVisible, setIsMenuVisible]                   = useState(false);
    const [linkMenuRectId, setLinkMenuRectId]                 = useState<string | null>(null);
    const [openLinkSubmenu, setOpenLinkSubmenu]               = useState<string | null>(null);
    const [isLinkModalOpen, setIsLinkModalOpen]               = useState(false);
    const [linkModalConfig, setLinkModalConfig]               = useState<LinkModalConfig | null>(null);
    const [linkTargetId, setLinkTargetId]                     = useState<string | null>(null);
    const [isPhotoPickerOpen, setIsPhotoPickerOpen]           = useState(false);

    // ── text tool state ────────────────────────────────────────────────────
    const [textDrawState, setTextDrawState] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
    const [movingTextState, setMovingTextState] = useState<{ textId: string; startMouseX: number; startMouseY: number; startTextX: number; startTextY: number } | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const editingTextContent = useRef<string>('');
    const editingTextCache   = useRef<TextMarkup | null>(null);
    const editingTextRef     = useRef<HTMLTextAreaElement>(null);

    // ── hover / visual state ──────────────────────────────────────────────
    const [hoveredRectId, setHoveredRectId]     = useState<string | null>(null);
    const [containerSize, setContainerSize]     = useState({ width: 0, height: 0 });
    const [imgBounds, setImgBounds]             = useState<ImageBounds>({ x: 0, y: 0, w: 1, h: 1 });

    // ── refs ──────────────────────────────────────────────────────────────
    const containerRef   = useRef<HTMLDivElement>(null);
    const imgRef         = useRef<HTMLImageElement>(null);
    const mouseDownRef   = useRef<{ x: number; y: number } | null>(null);
    const colorPanelRef  = useRef<HTMLDivElement>(null);

    // ── isMenuVisible: mirrors App.tsx pattern ────────────────────────────
    useEffect(() => {
        setIsMenuVisible(false);
        if (selectedRectIds.length === 1 || selectedLineIds.length > 0 || selectedTextId) {
            const t = setTimeout(() => setIsMenuVisible(true), 10);
            return () => clearTimeout(t);
        }
    }, [selectedRectIds, selectedLineIds, selectedTextId]);

    // ── sync colors from selection ────────────────────────────────────────
    const lastSyncedId = useRef<string | null>(null);
    useEffect(() => {
        if (selectedRectIds.length === 0 && selectedLineIds.length === 0 && !selectedTextId) {
            lastSyncedId.current = null; return;
        }
        const id = selectedRectIds[0] || selectedLineIds[0] || selectedTextId;
        if (lastSyncedId.current === id) return;
        lastSyncedId.current = id;
        const r = rectangles.find(x => x.id === id);
        if (r) {
            setMarkupFillColor(r.fillColor !== undefined ? r.fillColor : resolveRectFillColor(r, r.shape, true, 'dark'));
            setMarkupStrokeColor(r.strokeColor !== undefined ? r.strokeColor : resolveRectStrokeColor(r, false));
            return;
        }
        const l = lineMarkups.find(x => x.id === id);
        if (l) { setMarkupFillColor(l.fillColor ?? 'transparent'); setMarkupStrokeColor(l.strokeColor ?? '#EF4444'); return; }
        const t = textMarkups.find(x => x.id === id);
        if (t) {
            setMarkupFillColor(DEFAULT_MARKUP_FILL);
            setMarkupStrokeColor(t.color ?? '#EF4444');
        }
    }, [selectedRectIds, selectedLineIds, selectedTextId, rectangles, lineMarkups, textMarkups]);

    // ── close color panel on linkMenu open ───────────────────────────────
    useEffect(() => { if (linkMenuRectId) setColorPanelOpen(false); }, [linkMenuRectId]);
    useEffect(() => { if (!colorPanelOpen) setColorPanelSource(null); }, [colorPanelOpen]);

    // ── close color panel on outside click ───────────────────────────────
    useEffect(() => {
        if (!colorPanelOpen) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            if (colorPanelRef.current?.contains(t)) return;
            if (t.closest('[data-markup-color-trigger]')) return;
            setColorPanelOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [colorPanelOpen]);

    // ── reset on open ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        setActiveTool('select'); setActiveShape('box'); setActiveLineTool('arrow');
        setMarkupFillColor(DEFAULT_MARKUP_FILL); setMarkupStrokeColor('#EF4444');
        setColorPanelOpen(false);
        setRectangles(initialMarkups?.rectangles ?? []);
        setLineMarkups(initialMarkups?.lineMarkups ?? []);
        setTextMarkups(initialMarkups?.textMarkups ?? []);
        setSelectedRectIds([]); setSelectedLineIds([]);
        setSelectedLineId(null); setSelectedLinePointIndex(null);
        setSelectedTextId(null); setHasUnsavedChanges(false);
        setTextDrawState(null); setMovingTextState(null);
        setEditingTextId(null); setLinkMenuRectId(null);
        setIsLinkModalOpen(false); setLinkModalConfig(null); setLinkTargetId(null); setIsPhotoPickerOpen(false);
        editingTextContent.current = ''; editingTextCache.current = null;
        lastSyncedId.current = null;
    }, [isOpen, initialMarkups]);

    // ── compute image display bounds ──────────────────────────────────────
    const computeImgBounds = useCallback(() => {
        const img = imgRef.current; const container = containerRef.current;
        if (!img || !container || !img.naturalWidth) return;
        const cw = container.clientWidth, ch = container.clientHeight;
        const ia = img.naturalWidth / img.naturalHeight, ca = cw / ch;
        let w: number, h: number, x: number, y: number;
        if (ia > ca) { w = cw; h = cw / ia; x = 0; y = (ch - h) / 2; }
        else         { h = ch; w = ch * ia; y = 0; x = (cw - w) / 2; }
        setImgBounds({ x, y, w, h });
        setContainerSize({ width: cw, height: ch });
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const obs = new ResizeObserver(computeImgBounds);
        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, [isOpen, computeImgBounds]);

    // ── coordinate helpers ────────────────────────────────────────────────
    const getLocalPoint = useCallback((x: number, y: number) => ({
        left: (x / 100) * imgBounds.w + imgBounds.x,
        top:  (y / 100) * imgBounds.h + imgBounds.y,
    }), [imgBounds]);

    const getScreenRect = useCallback((rect: Rectangle | Omit<Rectangle, 'id' | 'name' | 'visible'>) => ({
        left:   (rect.x / 100) * imgBounds.w + imgBounds.x,
        top:    (rect.y / 100) * imgBounds.h + imgBounds.y,
        width:  (rect.width  / 100) * imgBounds.w,
        height: (rect.height / 100) * imgBounds.h,
    }), [imgBounds]);

    const getRelativeCoords = useCallback((event: React.MouseEvent | MouseEvent) => {
        const container = containerRef.current;
        if (!container || imgBounds.w <= 0) return null;
        const cr = container.getBoundingClientRect();
        const cx = event.clientX - cr.left - imgBounds.x;
        const cy = event.clientY - cr.top  - imgBounds.y;
        return {
            x: Math.max(0, Math.min(100, (cx / imgBounds.w) * 100)),
            y: Math.max(0, Math.min(100, (cy / imgBounds.h) * 100)),
        };
    }, [imgBounds]);

    const normalizeRect = (r: Rectangle): Rectangle => {
        const n = { ...r };
        if (n.width < 0)  { n.x += n.width;  n.width  = Math.abs(n.width);  }
        if (n.height < 0) { n.y += n.height; n.height = Math.abs(n.height); }
        return n;
    };

    // ── interaction hook ─────────────────────────────────────────────────
    const noop = useCallback(() => {}, []);
    const { interaction, setInteraction, currentRect, currentLineMarkup, hoveredLineId, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } =
        useCanvasInteraction({
            rectangles, setRectangles, pins: [], setPins: noop,
            activeTool, activeShape, activePinType: 'safety',
            markupFillColor, markupStrokeColor,
            selectedRectIds, setSelectedRectIds,
            setSelectedPinId: noop,
            viewTransform: { scale: 1, translateX: 0, translateY: 0 }, setViewTransform: noop,
            isRfiPanelOpen: false, handleRfiCancel: noop,
            setLinkMenuRectId,
            draggingPinId: null, setDraggingPinId: noop,
            lineMarkups, setLineMarkups,
            selectedLineIds, setSelectedLineIds,
            selectedLineId, setSelectedLineId,
            selectedLinePointIndex, setSelectedLinePointIndex,
            getRelativeCoords,
            handleSubmenuLink: noop,
            setPinTargetCoords: noop,
            setSafetyTargetPinId: noop, setSafetyFormData: noop,
            setPunchTargetPinId: noop,  setPunchFormData: noop, setPunchPanelMode: noop,
            setActivePanel: noop,
            mouseDownRef,
            isSpacebarDown: false,
            setHasUnsavedChanges,
            pinDragOffset: null,
            onDrawingComplete: useCallback(() => setActiveTool('select'), []),
        });

    // ── resize handle ──────────────────────────────────────────────────────
    const handleResizeStart = useCallback((e: React.MouseEvent, rectId: string, handle: ResizeHandle) => {
        e.stopPropagation();
        const startPoint = getRelativeCoords(e);
        const rect = rectangles.find(r => r.id === rectId);
        if (!startPoint || !rect) return;
        setLinkMenuRectId(null);
        setInteraction({ type: 'resizing', startPoint, initialRects: [rect], handle } as any);
    }, [getRelativeCoords, rectangles]);

    // ── text tool helpers ─────────────────────────────────────────────────
    const commitTextEdit = useCallback(() => {
        if (!editingTextId) return;
        const id = editingTextId;
        const raw = editingTextContent.current.trim();
        if (raw) {
            setTextMarkups(prev => prev.map(t => t.id === id ? { ...t, text: raw } : t));
        } else {
            setTextMarkups(prev => prev.filter(t => t.id !== id));
            setSelectedTextId(null);
        }
        setEditingTextId(prev => prev === id ? null : prev);
        editingTextContent.current = '';
        editingTextCache.current = null;
        setHasUnsavedChanges(true);
    }, [editingTextId]);

    useEffect(() => {
        if (!editingTextId) return;
        const t = setTimeout(() => { if (editingTextRef.current) { editingTextRef.current.focus(); editingTextRef.current.select(); } }, 0);
        return () => clearTimeout(t);
    }, [editingTextId]);

    // ── delete selection ───────────────────────────────────────────────────
    const deleteSelected = useCallback(() => {
        if (selectedRectIds.length > 0) {
            setRectangles(prev => prev.filter(r => !selectedRectIds.includes(r.id)));
            setSelectedRectIds([]);
        }
        if (selectedLineIds.length > 0) {
            setLineMarkups(prev => prev.filter(l => !selectedLineIds.includes(l.id)));
            setSelectedLineIds([]); setSelectedLineId(null);
        }
        if (selectedTextId) {
            setTextMarkups(prev => prev.filter(t => t.id !== selectedTextId));
            setSelectedTextId(null);
        }
        setHasUnsavedChanges(true);
    }, [selectedRectIds, selectedLineIds, selectedTextId]);

    // ── color change (applies to selection like App.tsx) ──────────────────
    const handleColorChange = useCallback((mode: MarkupColorMode, value: string) => {
        if (mode === 'fill') setMarkupFillColor(value);
        else setMarkupStrokeColor(value);
        if (selectedRectIds.length > 0) {
            setRectangles(prev => prev.map(r => selectedRectIds.includes(r.id)
                ? { ...r, ...(mode === 'fill' ? { fillColor: value } : { strokeColor: value }) } : r));
        }
        if (selectedLineIds.length > 0) {
            setLineMarkups(prev => prev.map(l => selectedLineIds.includes(l.id)
                ? { ...l, ...(mode === 'fill' ? { fillColor: value } : { strokeColor: value }) } : l));
        }
        if (selectedTextId && selectedRectIds.length === 0 && selectedLineIds.length === 0) {
            setTextMarkups(prev => prev.map(t => (t.id === selectedTextId ? { ...t, color: value } : t)));
            setMarkupStrokeColor(value);
        }
        if (selectedRectIds.length > 0 || selectedLineIds.length > 0 || selectedTextId) setHasUnsavedChanges(true);
    }, [selectedRectIds, selectedLineIds, selectedTextId]);

    // ── link handlers ──────────────────────────────────────────────────────
    const handleLinkButton = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setLinkMenuRectId(prev => prev === id ? null : id);
        setOpenLinkSubmenu(null);
    }, []);

    const handleLocalSubmenuLink = useCallback((e: React.MouseEvent, type: string, targetId: string) => {
        e.stopPropagation();
        setLinkMenuRectId(null);
        setOpenLinkSubmenu(null);
        setLinkTargetId(targetId);
        switch (type) {
            case 'Link RFI':
                setLinkModalConfig({ type: 'rfi', title: 'Link to an Existing RFI', items: allRfis.map(rfi => ({ ...rfi, titleWithId: `RFI-${rfi.id}: ${rfi.title}` })), displayFields: [{ key: 'titleWithId' }], searchFields: ['title', 'question', 'id'] });
                setIsLinkModalOpen(true); break;
            case 'Link Submittal':
                setLinkModalConfig({ type: 'submittal', title: 'Link to a Submittal', items: allSubmittals, displayFields: [{ key: 'id' }, { key: 'title' }], searchFields: ['id', 'title', 'specSection'] });
                setIsLinkModalOpen(true); break;
            case 'Link Punch':
                setLinkModalConfig({ type: 'punch', title: 'Link to a Punch List Item', items: allPunches, displayFields: [{ key: 'id' }, { key: 'title' }], searchFields: ['id', 'title', 'assignee'] });
                setIsLinkModalOpen(true); break;
            case 'Link Drawing':
                setLinkModalConfig({ type: 'drawing', title: 'Link to a Drawing', items: allDrawings.map(d => ({ id: d.id, title: d.title })), displayFields: [{ key: 'id' }, { key: 'title' }], searchFields: ['id', 'title'] });
                setIsLinkModalOpen(true); break;
            case 'Link Photo':
                setIsPhotoPickerOpen(true); break;
        }
    }, [allRfis, allSubmittals, allPunches, allDrawings]);

    const handleSelectLinkItem = useCallback((item: any) => {
        if (!linkTargetId) { setIsLinkModalOpen(false); setLinkModalConfig(null); return; }
        const id = linkTargetId;
        const isLine = lineMarkups.some(l => l.id === id);
        const isText = textMarkups.some(t => t.id === id);

        if (isText) {
            setTextMarkups(prev => prev.map(t => {
                if (t.id !== id) return t;
                const u = { ...t };
                if (linkModalConfig?.type === 'rfi') {
                    if (!u.rfi) u.rfi = [];
                    const orig = allRfis.find(r => r.id === item.id);
                    if (orig && !u.rfi.some(r => r.id === item.id)) u.rfi = [...u.rfi, orig];
                } else if (linkModalConfig?.type === 'submittal') {
                    if (!u.submittals) u.submittals = [];
                    if (!u.submittals.some(s => s.id === item.id)) u.submittals = [...u.submittals, item];
                } else if (linkModalConfig?.type === 'punch') {
                    if (!u.punches) u.punches = [];
                    if (!u.punches.some(p => p.id === item.id)) u.punches = [...u.punches, item];
                } else if (linkModalConfig?.type === 'drawing') {
                    if (!u.drawings) u.drawings = [];
                    const fd = allDrawings.find(d => d.id === item.id);
                    if (fd && !u.drawings.some(d => d.id === item.id)) u.drawings = [...u.drawings, fd];
                }
                return u;
            }));
        } else if (isLine) {
            setLineMarkups(prev => prev.map(l => {
                if (l.id !== id) return l;
                const u = { ...l };
                if (linkModalConfig?.type === 'rfi') {
                    if (!u.rfi) u.rfi = [];
                    const orig = allRfis.find(r => r.id === item.id);
                    if (orig && !u.rfi.some(r => r.id === item.id)) u.rfi = [...u.rfi, orig];
                } else if (linkModalConfig?.type === 'submittal') {
                    if (!u.submittals) u.submittals = [];
                    if (!u.submittals.some(s => s.id === item.id)) u.submittals = [...u.submittals, item];
                } else if (linkModalConfig?.type === 'punch') {
                    if (!u.punches) u.punches = [];
                    if (!u.punches.some(p => p.id === item.id)) u.punches = [...u.punches, item];
                } else if (linkModalConfig?.type === 'drawing') {
                    if (!u.drawings) u.drawings = [];
                    const fd = allDrawings.find(d => d.id === item.id);
                    if (fd && !u.drawings.some(d => d.id === item.id)) u.drawings = [...u.drawings, fd];
                }
                return u;
            }));
        } else {
            setRectangles(prev => prev.map(r => {
                if (r.id !== id) return r;
                const u = { ...r };
                if (linkModalConfig?.type === 'rfi') {
                    if (!u.rfi) u.rfi = [];
                    const orig = allRfis.find(rfi => rfi.id === item.id);
                    if (orig && !u.rfi.some(rfi => rfi.id === item.id)) u.rfi = [...u.rfi, orig];
                } else if (linkModalConfig?.type === 'submittal') {
                    if (!u.submittals) u.submittals = [];
                    if (!u.submittals.some(s => s.id === item.id)) u.submittals = [...u.submittals, item];
                } else if (linkModalConfig?.type === 'punch') {
                    if (!u.punches) u.punches = [];
                    if (!u.punches.some(p => p.id === item.id)) u.punches = [...u.punches, item];
                } else if (linkModalConfig?.type === 'drawing') {
                    if (!u.drawings) u.drawings = [];
                    const fd = allDrawings.find(d => d.id === item.id);
                    if (fd && !u.drawings.some(d => d.id === item.id)) u.drawings = [...u.drawings, fd];
                }
                return u;
            }));
        }
        setHasUnsavedChanges(true);
        setIsLinkModalOpen(false);
        setLinkModalConfig(null);
        setLinkTargetId(null);
    }, [linkTargetId, linkModalConfig, lineMarkups, textMarkups, allRfis, allDrawings]);

    const handlePhotoLinkedToAnnotation = useCallback((photo: PhotoData) => {
        if (!linkTargetId) { setIsPhotoPickerOpen(false); return; }
        const id = linkTargetId;
        const isLine = lineMarkups.some(l => l.id === id);
        const isText = textMarkups.some(t => t.id === id);
        const getExisting = (): PhotoData[] => {
            if (isText) return textMarkups.find(t => t.id === id)?.photos ?? [];
            if (isLine) return lineMarkups.find(l => l.id === id)?.photos ?? [];
            return rectangles.find(r => r.id === id)?.photos ?? [];
        };
        const existing = getExisting();
        if (existing.length > 0 && !existing.some(p => p.id === photo.id)) {
            if (!window.confirm(`This item already has ${existing.length} linked photo${existing.length > 1 ? 's' : ''}. Replace with the selected photo?`)) return;
            const replace = <T extends { photos?: PhotoData[] }>(item: T): T => ({ ...item, photos: [photo] });
            if (isText) setTextMarkups(prev => prev.map(t => t.id === id ? replace(t) : t));
            else if (isLine) setLineMarkups(prev => prev.map(l => l.id === id ? replace(l) : l));
            else setRectangles(prev => prev.map(r => r.id === id ? replace(r) : r));
        } else {
            const push = <T extends { photos?: PhotoData[] }>(item: T): T => {
                if (item.photos?.some(p => p.id === photo.id)) return item;
                return { ...item, photos: [...(item.photos ?? []), photo] };
            };
            if (isText) setTextMarkups(prev => prev.map(t => t.id === id ? push(t) : t));
            else if (isLine) setLineMarkups(prev => prev.map(l => l.id === id ? push(l) : l));
            else setRectangles(prev => prev.map(r => r.id === id ? push(r) : r));
        }
        setHasUnsavedChanges(true);
        setIsPhotoPickerOpen(false);
        setLinkTargetId(null);
    }, [linkTargetId, lineMarkups, textMarkups, rectangles]);

    // ── canvas mouse handlers ──────────────────────────────────────────────
    const onCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[data-interactive-ui="true"]')) return;
        if (selectedTextId) setSelectedTextId(null);

        if (activeTool === 'text') {
            const coords = getRelativeCoords(e);
            if (!coords) return;
            setTextDrawState({ startX: coords.x, startY: coords.y, currentX: coords.x, currentY: coords.y });
            return;
        }
        handleMouseDown(e);
    }, [activeTool, getRelativeCoords, selectedTextId, handleMouseDown]);

    const onCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (textDrawState) {
            const coords = getRelativeCoords(e);
            if (coords) setTextDrawState(s => s ? { ...s, currentX: coords.x, currentY: coords.y } : s);
            return;
        }
        if (movingTextState) {
            const coords = getRelativeCoords(e);
            if (coords) {
                const dx = coords.x - movingTextState.startMouseX;
                const dy = coords.y - movingTextState.startMouseY;
                setTextMarkups(prev => prev.map(t => t.id === movingTextState.textId
                    ? { ...t, x: Math.max(0, Math.min(100, movingTextState.startTextX + dx)), y: Math.max(0, Math.min(100, movingTextState.startTextY + dy)) }
                    : t));
            }
            return;
        }
        // Live rect hover for cursor feedback
        if (interaction.type === 'none') {
            const coords = getRelativeCoords(e);
            if (coords) {
                let hit: string | null = null;
                for (let i = rectangles.length - 1; i >= 0; i--) {
                    const r = normalizeRect(rectangles[i]);
                    if (!r.visible) continue;
                    if (coords.x >= r.x && coords.x <= r.x + r.width && coords.y >= r.y && coords.y <= r.y + r.height) { hit = r.id; break; }
                }
                setHoveredRectId(hit);
            }
        }
        handleMouseMove(e);
    }, [textDrawState, movingTextState, interaction.type, getRelativeCoords, rectangles, handleMouseMove]);

    const onCanvasMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (movingTextState) { setMovingTextState(null); setHasUnsavedChanges(true); return; }
        if (textDrawState) {
            const { startX, startY, currentX, currentY } = textDrawState;
            setTextDrawState(null);
            const dx = Math.abs(currentX - startX), dy = Math.abs(currentY - startY);
            const isDrag = dx > 0.5 || dy > 0.5;
            const newText: TextMarkup = {
                id: `text-${Date.now()}`,
                x: Math.min(startX, currentX), y: Math.min(startY, currentY),
                text: 'Text',
                name: `Text ${textMarkups.length + 1}`,
                visible: true,
                fontSize: 16, fontWeight: 'normal', fontStyle: 'normal',
                color: markupStrokeColor,
                width: isDrag ? dx : undefined,
            };
            setTextMarkups(prev => [...prev, newText]);
            setSelectedTextId(newText.id);
            editingTextContent.current = 'Text';
            editingTextCache.current = newText;
            setEditingTextId(newText.id);
            setActiveTool('select');
            return;
        }
        handleMouseUp(e);
    }, [movingTextState, textDrawState, textMarkups.length, markupStrokeColor, handleMouseUp]);

    const onCanvasMouseLeave = useCallback(() => {
        setHoveredRectId(null);
        if (textDrawState) setTextDrawState(null);
        handleMouseLeave();
    }, [textDrawState, handleMouseLeave]);

    // ── getCursorClass ─────────────────────────────────────────────────────
    const getCursorClass = () => {
        if (movingTextState) return 'cursor-grabbing';
        if (interaction.type === 'moving') return 'cursor-grabbing';
        if (interaction.type === 'resizing') {
            if (interaction.handle === 'tl' || interaction.handle === 'br') return 'cursor-nwse-resize';
            if (interaction.handle === 'tr' || interaction.handle === 'bl') return 'cursor-nesw-resize';
        }
        if (interaction.type === 'drawing' || textDrawState) return 'cursor-crosshair';
        if (activeTool === 'text') return 'cursor-crosshair';
        if (activeTool === 'select') {
            if (hoveredRectId || hoveredLineId) {
                const hoveredIsSelected = (hoveredRectId ? selectedRectIds.includes(hoveredRectId) : false) ||
                    (hoveredLineId ? selectedLineIds.includes(hoveredLineId) : false);
                return hoveredIsSelected ? 'cursor-move' : 'cursor-default';
            }
            return 'cursor-default';
        }
        return 'cursor-crosshair';
    };

    // ── save & close ──────────────────────────────────────────────────────
    const handleSave = () => { onSave({ rectangles, lineMarkups, textMarkups }); setHasUnsavedChanges(false); };
    const handleClose = () => {
        if (hasUnsavedChanges && !window.confirm('You have unsaved markup changes. Close anyway?')) return;
        onClose();
    };

    // ── derived selection values ──────────────────────────────────────────
    const selectedRectangle = selectedRectIds.length === 1 ? rectangles.find(r => r.id === selectedRectIds[0]) ?? null : null;
    const selectedLine      = selectedLineId ? lineMarkups.find(l => l.id === selectedLineId) ?? null : null;
    const singleSelectionScreenRect = selectedRectangle ? getScreenRect(normalizeRect(selectedRectangle)) : null;
    const selectedLineScreenRect = selectedLine ? (() => {
        const pts = selectedLine.points.map(p => getLocalPoint(p.x, p.y));
        if (pts.length === 0) return null;
        const minX = Math.min(...pts.map(p => p.left)), maxX = Math.max(...pts.map(p => p.left));
        const minY = Math.min(...pts.map(p => p.top)),  maxY = Math.max(...pts.map(p => p.top));
        return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    })() : null;

    const selectedTextScreenRect = useMemo(() => {
        if (!selectedTextId || editingTextId) return null;
        const text = textMarkups.find(t => t.id === selectedTextId);
        if (!text) return null;
        const sp = getLocalPoint(text.x, text.y);
        const fs = text.fontSize ?? 14;
        const estW = text.width != null && text.width > 0
            ? (text.width / 100) * imgBounds.w
            : Math.min(fs * 0.58 * Math.max((text.text || 'Text').length, 1), 200);
        const estH = fs * 1.4;
        return { left: sp.left, top: sp.top, width: estW, height: estH };
    }, [selectedTextId, editingTextId, textMarkups, getLocalPoint, imgBounds.w]);

    const selectionIsTextOnly = Boolean(selectedTextId && selectedRectIds.length === 0 && selectedLineIds.length === 0);

    const toolbarPosition: ToolbarPosition = 'bottom';

    if (!isOpen || !photo) return null;

    const ptStr = (pts: { x: number; y: number }[]) =>
        pts.map(p => { const lp = getLocalPoint(p.x, p.y); return `${lp.left},${lp.top}`; }).join(' ');

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onMouseDown={e => e.target === e.currentTarget && handleClose()}
        >
            <div
                className="relative flex h-[92vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-2xl bg-gray-950 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex shrink-0 items-center justify-between border-b border-gray-800 px-5 py-3">
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-white">{photo.title}</h2>
                        <p className="text-xs text-gray-400">{photo.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                            <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                                Unsaved changes
                            </span>
                        )}
                        <button
                            type="button" onClick={handleSave}
                            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                            disabled={!hasUnsavedChanges}
                        >
                            Save
                        </button>
                        <button type="button" onClick={handleClose} className="linarc-modal-close" aria-label="Close">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* ── Canvas area ─────────────────────────────────────────── */}
                <div
                    ref={containerRef}
                    className={`relative min-h-0 flex-1 overflow-hidden bg-gray-900 select-none ${getCursorClass()}`}
                    onMouseDown={onCanvasMouseDown}
                    onMouseMove={onCanvasMouseMove}
                    onMouseUp={onCanvasMouseUp}
                    onMouseLeave={onCanvasMouseLeave}
                >
                    {/* Photo */}
                    <img
                        ref={imgRef}
                        src={photo.url}
                        alt={photo.title}
                        onLoad={computeImgBounds}
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                    />

                    {/* ── Rectangle divs (same pattern as CanvasView) ──────── */}
                    {rectangles.filter(r => r.visible).map(rect => {
                        const normalized = normalizeRect(rect);
                        const isSelected = selectedRectIds.includes(rect.id);
                        const isHovered  = rect.id === hoveredRectId;
                        const strokeColor = resolveRectStrokeColor(rect, isSelected);
                        const fillColor   = resolveRectFillColor(rect, rect.shape, isSelected, 'dark');
                        const sw = 2;
                        const { left, top, width: pw, height: ph } = getScreenRect(normalized);
                        return (
                            <div key={rect.id} className="absolute" style={{ left, top, width: pw, height: ph, pointerEvents: 'none' }}>
                                {rect.shape === 'box' && (
                                    <div className="relative w-full h-full box-border" style={{
                                        borderWidth: sw, borderStyle: 'solid', borderColor: strokeColor,
                                        backgroundColor: fillColor === 'transparent' ? 'transparent' : fillColor,
                                        boxShadow: (isSelected || isHovered)
                                            ? `0 0 0 ${isSelected ? 3 : 2}px rgba(59,130,246,${isSelected ? 0.45 : 0.28})`
                                            : undefined,
                                    }} />
                                )}
                                {(rect.shape === 'ellipse' || rect.shape === 'cloud') && (
                                    <div className="relative w-full h-full">
                                        <svg width="100%" height="100%" viewBox={`0 0 ${pw} ${ph}`} preserveAspectRatio="none" className="overflow-visible">
                                            {(isSelected || isHovered) && rect.shape === 'ellipse' && (
                                                <ellipse cx={pw / 2} cy={ph / 2} rx={pw / 2} ry={ph / 2}
                                                    fill="none" stroke="#3b82f6"
                                                    strokeWidth={isSelected ? 8 : 5} opacity={isSelected ? 0.3 : 0.2} />
                                            )}
                                            {(isSelected || isHovered) && rect.shape === 'cloud' && (
                                                <path d={generateCloudPath(pw, ph)} fill="none" stroke="#3b82f6"
                                                    strokeWidth={isSelected ? 8 : 5} opacity={isSelected ? 0.3 : 0.2} />
                                            )}
                                            {rect.shape === 'ellipse' && (
                                                <ellipse cx={pw / 2} cy={ph / 2} rx={pw / 2} ry={ph / 2}
                                                    fill={fillColor === 'transparent' ? 'none' : fillColor}
                                                    stroke={strokeColor} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
                                            )}
                                            {rect.shape === 'cloud' && (
                                                <path d={generateCloudPath(pw, ph)}
                                                    fill={fillColor === 'transparent' ? 'none' : fillColor}
                                                    stroke={strokeColor} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
                                            )}
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* ── SVG overlay: lines + in-progress ─────────────────── */}
                    <svg className="absolute left-0 top-0 h-full w-full overflow-visible pointer-events-none" style={{ zIndex: 16 }}>
                        <defs>
                            <marker id="ph-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
                                <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
                            </marker>
                        </defs>

                        {/* Committed + in-progress lines */}
                        {[...lineMarkups, ...(currentLineMarkup ? [currentLineMarkup] : [])].filter(l => l.visible).map(l => {
                            const localPts = l.points.map(p => getLocalPoint(p.x, p.y));
                            if (localPts.length < 2 && l.type !== 'freeline') return null;
                            const isSelected = selectedLineIds.includes(l.id);
                            const strokeColor = l.strokeColor ?? markupStrokeColor;
                            const isHighlighter = l.type === 'highlighter';
                            const isArrow = l.type === 'arrow';
                            const sw = l.strokeWidth ?? (isHighlighter ? 16 : 2);
                            const pts = localPts.map(p => `${p.left},${p.top}`).join(' ');
                            return (
                                <g key={l.id}>
                                    {/* Wider invisible hit-test strip */}
                                    {isSelected && (
                                        <polyline points={pts} fill="none" stroke="transparent" strokeWidth={Math.max(sw, 12)} />
                                    )}
                                    <polyline
                                        points={pts}
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth={sw}
                                        strokeOpacity={isHighlighter ? 0.4 : 1}
                                        strokeLinecap="round" strokeLinejoin="round"
                                        markerEnd={isArrow ? 'url(#ph-arrow)' : undefined}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    {/* Selection glow */}
                                    {isSelected && (
                                        <polyline points={pts} fill="none"
                                            stroke="#3b82f6" strokeWidth={sw + 4} strokeOpacity={0.25}
                                            strokeLinecap="round" strokeLinejoin="round"
                                            vectorEffect="non-scaling-stroke" />
                                    )}
                                    {/* Point handles (line/arrow/freeline) */}
                                    {isSelected && l.type !== 'pen' && l.type !== 'highlighter' && l.points.map((p, idx) => {
                                        const lp = getLocalPoint(p.x, p.y);
                                        const isSelectedPoint = selectedLinePointIndex === idx;
                                        return (
                                            <circle key={idx} cx={lp.left} cy={lp.top}
                                                r={isSelectedPoint ? 6 : 4}
                                                fill="#ffffff" stroke={isSelected ? '#3b82f6' : strokeColor} strokeWidth={2} />
                                        );
                                    })}
                                </g>
                            );
                        })}

                        {/* textDrawState rubber band */}
                        {textDrawState && (() => {
                            const lp1 = getLocalPoint(textDrawState.startX, textDrawState.startY);
                            const lp2 = getLocalPoint(textDrawState.currentX, textDrawState.currentY);
                            return (
                                <rect
                                    x={Math.min(lp1.left, lp2.left)} y={Math.min(lp1.top, lp2.top)}
                                    width={Math.abs(lp2.left - lp1.left)} height={Math.abs(lp2.top - lp1.top)}
                                    fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth={1.5}
                                    strokeDasharray="4 3" vectorEffect="non-scaling-stroke"
                                />
                            );
                        })()}

                        {/* in-progress shape */}
                        {currentRect && (() => {
                            const n = normalizeRect({ ...currentRect, id: '', name: '', visible: true });
                            const strokeColor = markupStrokeColor;
                            const fillColor = markupFillColor;
                            const { left, top, width: pw, height: ph } = getScreenRect(n);
                            if (n.shape === 'ellipse') return (
                                <ellipse cx={left + pw / 2} cy={top + ph / 2} rx={pw / 2} ry={ph / 2}
                                    fill={fillColor === 'transparent' ? 'none' : fillColor} stroke={strokeColor}
                                    strokeWidth={2} opacity={0.7} vectorEffect="non-scaling-stroke" />
                            );
                            if (n.shape === 'cloud') {
                                const lp = getLocalPoint(n.x, n.y);
                                return (
                                    <path d={generateCloudPath(pw, ph)} transform={`translate(${lp.left},${lp.top})`}
                                        fill={fillColor === 'transparent' ? 'none' : fillColor} stroke={strokeColor}
                                        strokeWidth={2} opacity={0.7} vectorEffect="non-scaling-stroke" />
                                );
                            }
                            return (
                                <rect x={left} y={top} width={pw} height={ph}
                                    fill={fillColor === 'transparent' ? 'none' : fillColor} stroke={strokeColor}
                                    strokeWidth={2} opacity={0.7} vectorEffect="non-scaling-stroke" />
                            );
                        })()}
                    </svg>

                    {/* ── Text markup divs (same pattern as CanvasView) ────── */}
                    {textMarkups.filter(t => t.visible).map(text => {
                        const sp = getLocalPoint(text.x, text.y);
                        const isSelected = selectedTextId === text.id;
                        const isEditing  = editingTextId === text.id;
                        const fontSize = text.fontSize ?? 14;
                        const textColor = text.color ?? '#ef4444';
                        const content = text.text || (isEditing ? '' : 'Text');
                        const textBoxWidth = text.width != null && text.width > 0
                            ? (text.width / 100) * imgBounds.w : null;
                        return (
                            <div
                                key={text.id}
                                data-text-markup-id={text.id}
                                style={{
                                    position: 'absolute',
                                    left: sp.left, top: sp.top,
                                    width: textBoxWidth != null ? `${textBoxWidth}px` : undefined,
                                    zIndex: isEditing ? 28 : (isSelected ? 25 : 16),
                                    pointerEvents: 'auto',
                                    cursor: isEditing ? 'text' : (isSelected ? 'move' : 'default'),
                                    userSelect: isEditing ? 'text' : 'none',
                                }}
                                onMouseDown={e => {
                                    e.stopPropagation();
                                    if (isEditing) return;
                                    setSelectedRectIds([]); setSelectedLineIds([]); setSelectedLineId(null);
                                    setSelectedLinePointIndex(null);
                                    setSelectedTextId(text.id);
                                    if (activeTool === 'text') {
                                        setMovingTextState(null);
                                        editingTextContent.current = text.text;
                                        editingTextCache.current = text;
                                        setEditingTextId(text.id);
                                    } else {
                                        const coords = getRelativeCoords(e);
                                        if (coords) setMovingTextState({ textId: text.id, startMouseX: coords.x, startMouseY: coords.y, startTextX: text.x, startTextY: text.y });
                                    }
                                }}
                                onMouseUp={e => { if (movingTextState) { setMovingTextState(null); e.stopPropagation(); } }}
                                onDoubleClick={e => {
                                    e.stopPropagation();
                                    setMovingTextState(null);
                                    editingTextContent.current = text.text;
                                    editingTextCache.current = text;
                                    setEditingTextId(text.id);
                                }}
                            >
                                <span style={{
                                    display: 'inline-block',
                                    whiteSpace: textBoxWidth ? 'pre-wrap' : 'pre',
                                    wordBreak: textBoxWidth ? 'break-word' : undefined,
                                    width: textBoxWidth != null ? '100%' : undefined,
                                    fontSize: `${fontSize}px`,
                                    fontWeight: text.fontWeight ?? 'normal',
                                    fontStyle: text.fontStyle ?? 'normal',
                                    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
                                    color: isEditing ? 'transparent' : (text.text ? textColor : `${textColor}55`),
                                    lineHeight: 1.4,
                                    outline: isSelected && !isEditing ? '1.5px solid rgba(59,130,246,0.7)' : 'none',
                                    outlineOffset: '3px',
                                    borderRadius: '2px',
                                    padding: '2px 3px',
                                    boxShadow: isSelected && !isEditing ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
                                    textShadow: '0 0 3px rgba(0,0,0,0.6)',
                                }}>{content}</span>
                            </div>
                        );
                    })}

                    {/* ── Linked record tags (CanvasView parity) ───────────────── */}
                    {rectangles.filter(r => r.visible).map(rect => {
                        const normalized = normalizeRect(rect);
                        const sr = getScreenRect(normalized);
                        let tagCount = 0;
                        const renderTag = (type: RectangleTagType, item: { id: string | number }, label: string) => {
                            const positionIndex = tagCount++;
                            return (
                                <div
                                    key={`${type}-tag-${rect.id}-${item.id}`}
                                    className={`absolute text-white text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-md cursor-default transition-colors ${PHOTO_MARKUP_TAG_COLOR_CLASSES[type]}`}
                                    style={{ left: `${sr.left + sr.width + 5}px`, top: `${sr.top + positionIndex * 24}px`, pointerEvents: 'auto', zIndex: 25 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {label}
                                </div>
                            );
                        };
                        return (
                            <React.Fragment key={`photo-tags-rect-${rect.id}`}>
                                {rect.rfi?.map(rfi => renderTag('rfi', rfi, `RFI-${rfi.id}`))}
                                {rect.submittals?.map(sub => renderTag('submittal', sub, sub.id))}
                                {rect.punches?.map(punch => renderTag('punch', punch, punch.id))}
                                {rect.drawings?.map(drawing => renderTag('drawing', drawing, drawing.id))}
                                {rect.photos?.map(photo => renderTag('photo', photo, photo.id))}
                            </React.Fragment>
                        );
                    })}

                    {lineMarkups.filter(line => line.visible).map(line => {
                        const screenPoints = line.points.map(p => getLocalPoint(p.x, p.y));
                        if (screenPoints.length === 0) return null;
                        const minX = Math.min(...screenPoints.map(p => p.left));
                        const maxX = Math.max(...screenPoints.map(p => p.left));
                        const minY = Math.min(...screenPoints.map(p => p.top));
                        const maxY = Math.max(...screenPoints.map(p => p.top));
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
                        const renderLineTag = (type: RectangleTagType, item: { id: string | number }, label: string) => {
                            const positionIndex = tagCount++;
                            const nextTop = Math.max(6, Math.min(baseTop + positionIndex * TAG_GAP, containerSize.height - TAG_H - 6));
                            return (
                                <div
                                    key={`${type}-line-tag-${line.id}-${item.id}`}
                                    className={`absolute text-white text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-md cursor-default transition-colors ${PHOTO_MARKUP_TAG_COLOR_CLASSES[type]}`}
                                    style={{ left: `${baseLeft}px`, top: `${nextTop}px`, maxWidth: `${TAG_W}px`, pointerEvents: 'auto', zIndex: 25 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <span className="block truncate">{label}</span>
                                </div>
                            );
                        };
                        return (
                            <React.Fragment key={`photo-tags-line-${line.id}`}>
                                {line.rfi?.map(rfi => renderLineTag('rfi', rfi, `RFI-${rfi.id}`))}
                                {line.submittals?.map(sub => renderLineTag('submittal', sub, sub.id))}
                                {line.punches?.map(punch => renderLineTag('punch', punch, punch.id))}
                                {line.drawings?.map(drawing => renderLineTag('drawing', drawing, drawing.id))}
                                {line.photos?.map(photo => renderLineTag('photo', photo, photo.id))}
                            </React.Fragment>
                        );
                    })}

                    {textMarkups.filter(t => t.visible).map(text => {
                        const TAG_W = 132;
                        const TAG_H = 22;
                        const TAG_GAP = 24;
                        const LEADER_V = 18;
                        const LEADER_X = 20;
                        const MARGIN = 8;
                        const allTags: { type: RectangleTagType; item: { id: string | number }; label: string }[] = [
                            ...(text.rfi ?? []).map(item => ({ type: 'rfi' as RectangleTagType, item, label: `RFI-${item.id}` })),
                            ...(text.submittals ?? []).map(item => ({ type: 'submittal' as RectangleTagType, item, label: item.id })),
                            ...(text.punches ?? []).map(item => ({ type: 'punch' as RectangleTagType, item, label: item.id })),
                            ...(text.drawings ?? []).map(item => ({ type: 'drawing' as RectangleTagType, item, label: item.id })),
                            ...(text.photos ?? []).map(item => ({ type: 'photo' as RectangleTagType, item, label: item.id })),
                        ];
                        if (allTags.length === 0) return null;

                        const screenPos = getLocalPoint(text.x, text.y);
                        const cRect = containerRef.current?.getBoundingClientRect();
                        if (!cRect) return null;

                        const scaledFontSize = text.fontSize ?? 16;
                        const estimatedTextWidth = Math.min(scaledFontSize * 0.58 * Math.max(text.text.length, 1), 500);

                        const anchorVX = cRect.left + screenPos.left;
                        const lastCharVX = anchorVX + estimatedTextWidth;
                        const anchorVY = cRect.top + screenPos.top;

                        const WIN_W = window.innerWidth;
                        const WIN_H = window.innerHeight;

                        const stackHeight = allTags.length * TAG_GAP + TAG_H;

                        const rightColVX = lastCharVX + LEADER_X;
                        const leftColVX = anchorVX - LEADER_X - TAG_W;

                        const rightFits = rightColVX + TAG_W + MARGIN <= WIN_W;
                        const leftFits = leftColVX - MARGIN >= 0;

                        const placeRight =
                            rightFits ? true :
                            leftFits ? false :
                            (WIN_W - lastCharVX) >= anchorVX;

                        let colVX: number;
                        if (placeRight) {
                            colVX = Math.min(rightColVX, WIN_W - TAG_W - MARGIN);
                        } else {
                            colVX = Math.max(MARGIN, leftColVX);
                        }
                        const baseLeft = colVX - cRect.left;

                        const textMidVY = anchorVY + (scaledFontSize * 1.4) / 2;
                        const preferredTopVY = textMidVY - LEADER_V - stackHeight;
                        const clampedTopVY = Math.max(MARGIN, Math.min(preferredTopVY, WIN_H - stackHeight - TAG_H - MARGIN));
                        const maxContainerTop = containerSize.height - stackHeight - TAG_H - 4;
                        const baseTop = Math.min(clampedTopVY - cRect.top, maxContainerTop);

                        const tagCenterYs = allTags.map((_, i) => baseTop + i * TAG_GAP + TAG_H / 2);
                        const firstCY = tagCenterYs[0];
                        const lastCY = tagCenterYs[tagCenterYs.length - 1];
                        const junctionY = (firstCY + lastCY) / 2;

                        const dotX = placeRight ? screenPos.left + estimatedTextWidth : screenPos.left;
                        const dotY = screenPos.top + (scaledFontSize * 1.4) / 2;
                        const junctionX = placeRight ? baseLeft - 2 : baseLeft + TAG_W + 2;
                        const leaderColor = text.color ?? '#ef4444';

                        return (
                            <React.Fragment key={`photo-tags-text-${text.id}`}>
                                <svg
                                    style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 24, overflow: 'visible' }}
                                >
                                    <circle cx={dotX} cy={dotY} r={2.5} fill={leaderColor} opacity={0.8} />
                                    <line x1={dotX} y1={dotY} x2={junctionX} y2={junctionY} stroke={leaderColor} strokeWidth={1} strokeOpacity={0.6} strokeDasharray="4 2" />
                                    {allTags.length > 1 && (
                                        <line x1={junctionX} y1={firstCY} x2={junctionX} y2={lastCY} stroke={leaderColor} strokeWidth={1} strokeOpacity={0.5} />
                                    )}
                                    {tagCenterYs.map((cy, i) => (
                                        <line key={i} x1={junctionX} y1={cy} x2={placeRight ? baseLeft : baseLeft + TAG_W} y2={cy} stroke={leaderColor} strokeWidth={1} strokeOpacity={0.5} />
                                    ))}
                                </svg>
                                {allTags.map(({ type, item, label }, i) => (
                                    <div
                                        key={`${type}-text-tag-${text.id}-${item.id}`}
                                        className={`absolute text-white text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-md cursor-default transition-colors ${PHOTO_MARKUP_TAG_COLOR_CLASSES[type]}`}
                                        style={{ left: `${baseLeft}px`, top: `${tagCenterYs[i] - TAG_H / 2}px`, maxWidth: `${TAG_W}px`, pointerEvents: 'auto', zIndex: 25 }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <span className="block truncate">{label}</span>
                                    </div>
                                ))}
                            </React.Fragment>
                        );
                    })}

                    {/* ── Text edit textarea overlay (fixed, like CanvasView) ── */}
                    {editingTextId && (() => {
                        const t = textMarkups.find(x => x.id === editingTextId) ?? editingTextCache.current;
                        if (!t) return null;
                        const containerEl = containerRef.current;
                        if (!containerEl) return null;
                        const cr = containerEl.getBoundingClientRect();
                        const sp = getLocalPoint(t.x, t.y);
                        const fixedLeft = cr.left + sp.left;
                        const fixedTop  = cr.top  + sp.top;
                        const editFontSize = t.fontSize ?? 16;
                        const hasFixedWidth = t.width != null && t.width > 0;
                        const fixedWidthPx = hasFixedWidth ? (t.width! / 100) * imgBounds.w : null;
                        return (
                            <textarea
                                key={editingTextId}
                                ref={editingTextRef}
                                data-interactive-ui="true"
                                defaultValue={t.text}
                                onChange={e => {
                                    editingTextContent.current = e.target.value;
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                    if (!hasFixedWidth) { e.target.style.width = 'auto'; e.target.style.width = `${Math.max(120, e.target.scrollWidth)}px`; }
                                }}
                                onKeyDown={e => {
                                    e.stopPropagation();
                                    if (e.key === 'Escape') { e.preventDefault(); setEditingTextId(null); editingTextContent.current = ''; }
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTextEdit(); }
                                }}
                                onBlur={commitTextEdit}
                                style={{
                                    position: 'fixed', left: fixedLeft, top: fixedTop,
                                    minWidth: hasFixedWidth ? undefined : '120px',
                                    width: fixedWidthPx != null ? `${fixedWidthPx}px` : undefined,
                                    maxWidth: fixedWidthPx != null ? `${fixedWidthPx}px` : undefined,
                                    fontSize: `${editFontSize}px`,
                                    fontWeight: t.fontWeight ?? 'normal', fontStyle: t.fontStyle ?? 'normal',
                                    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
                                    color: t.color ?? '#ef4444', lineHeight: 1.4,
                                    background: 'rgba(255,255,255,0.95)',
                                    border: '2px solid #3b82f6', borderRadius: '4px',
                                    padding: '4px 6px', outline: 'none', resize: 'none', overflow: 'hidden',
                                    zIndex: 9999, pointerEvents: 'auto', userSelect: 'text',
                                    caretColor: '#3b82f6',
                                    boxShadow: '0 0 0 3px rgba(59,130,246,0.25), 0 4px 12px rgba(0,0,0,0.2)',
                                    minHeight: `${editFontSize * 1.4 + 8}px`,
                                    whiteSpace: hasFixedWidth ? 'pre-wrap' : 'pre',
                                    wordBreak: hasFixedWidth ? 'break-word' : undefined,
                                }}
                            />
                        );
                    })()}

                    {/* ── Resize handles (same as CanvasView) ──────────────── */}
                    {singleSelectionScreenRect && !selectedRectangle?.locked && (() => {
                        const strokeColor = resolveRectStrokeColor(selectedRectangle!, true);
                        return (
                        <>
                            {(['tl', 'tr', 'bl', 'br'] as ResizeHandle[]).map(handle => (
                                <div
                                    key={handle}
                                    data-interactive-ui="true"
                                    className="absolute w-3.5 h-3.5 bg-white border-2 rounded-full"
                                    style={{
                                        top:  handle.includes('t') ? singleSelectionScreenRect.top  - 8 : singleSelectionScreenRect.top  + singleSelectionScreenRect.height - 8,
                                        left: handle.includes('l') ? singleSelectionScreenRect.left - 8 : singleSelectionScreenRect.left + singleSelectionScreenRect.width  - 8,
                                        cursor: (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize',
                                        borderColor: '#3b82f6',
                                        pointerEvents: 'auto', zIndex: 20,
                                    }}
                                    onMouseDown={e => handleResizeStart(e, selectedRectangle!.id, handle)}
                                />
                            ))}
                        </>
                        );
                    })()}

                    {/* ── Selection floating menu (rect) ─────────────────────── */}
                    {singleSelectionScreenRect && !selectedRectangle?.locked && (
                        <div
                            data-interactive-ui="true"
                            className={`absolute transition-opacity transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isMenuVisible ? 'opacity-100' : 'opacity-0'}`}
                            style={{
                                left: singleSelectionScreenRect.left + singleSelectionScreenRect.width / 2,
                                top: singleSelectionScreenRect.top,
                                transform: `translate(-50%, -100%) translateY(-10px) scale(${isMenuVisible ? 1 : 0.9})`,
                                transformOrigin: 'bottom center',
                                pointerEvents: isMenuVisible ? 'auto' : 'none', zIndex: 30,
                            }}
                        >
                            <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                                <div className="relative">
                                    <button
                                        onClick={e => selectedRectangle && handleLinkButton(e, selectedRectangle.id)}
                                        title="Link"
                                        className={`p-2 rounded-md transition-colors ${linkMenuRectId === selectedRectangle?.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                                    >
                                        <LinkIcon className="w-5 h-5" />
                                    </button>
                                    {linkMenuRectId === selectedRectangle?.id && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max" onMouseLeave={() => setLinkMenuRectId(null)}>
                                            <div className="flex flex-col gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-sm">
                                                {['Link RFI', 'Link Submittal', 'Link Punch', 'Link Drawing', 'Link Photo'].map(type => (
                                                    <button key={type} onClick={e => selectedRectangle && handleLocalSubmenuLink(e, type, selectedRectangle.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left whitespace-nowrap">
                                                        {type.replace('Link ', '')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="relative" data-markup-color-trigger>
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); setLinkMenuRectId(null); setColorPanelOpen(o => { const n = !o; if (n) setColorPanelSource('selection'); return n; }); }}
                                        title="Markup Color"
                                        className={`p-2 rounded-md transition-colors ${colorPanelOpen && colorPanelSource === 'selection' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                                    >
                                        <Palette className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); deleteSelected(); }}
                                    title="Delete" className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Selection floating menu (line) ──────────────────────── */}
                    {selectedLine && selectedLineScreenRect && !selectedLine.locked && (
                        <div
                            data-interactive-ui="true"
                            className={`absolute transition-opacity transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isMenuVisible ? 'opacity-100' : 'opacity-0'}`}
                            style={{
                                left: selectedLineScreenRect.left + selectedLineScreenRect.width / 2,
                                top: selectedLineScreenRect.top,
                                transform: `translate(-50%, -100%) translateY(-10px) scale(${isMenuVisible ? 1 : 0.9})`,
                                transformOrigin: 'bottom center',
                                pointerEvents: isMenuVisible ? 'auto' : 'none', zIndex: 30,
                            }}
                        >
                            <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                                <div className="relative">
                                    <button
                                        onClick={e => selectedLine && handleLinkButton(e, selectedLine.id)}
                                        title="Link"
                                        className={`p-2 rounded-md transition-colors ${linkMenuRectId === selectedLine?.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                                    >
                                        <LinkIcon className="w-5 h-5" />
                                    </button>
                                    {linkMenuRectId === selectedLine?.id && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max" onMouseLeave={() => setLinkMenuRectId(null)}>
                                            <div className="flex flex-col gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-sm">
                                                {['Link RFI', 'Link Submittal', 'Link Punch', 'Link Drawing', 'Link Photo'].map(type => (
                                                    <button key={type} onClick={e => selectedLine && handleLocalSubmenuLink(e, type, selectedLine.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-600 transition-colors text-left whitespace-nowrap">
                                                        {type.replace('Link ', '')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="relative" data-markup-color-trigger>
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); setLinkMenuRectId(null); setColorPanelOpen(o => { const n = !o; if (n) setColorPanelSource('selection'); return n; }); }}
                                        title="Markup Color"
                                        className={`p-2 rounded-md transition-colors ${colorPanelOpen && colorPanelSource === 'selection' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                                    >
                                        <Palette className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); deleteSelected(); }}
                                    title="Delete" className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Text selection menu ──────────────────────────────────── */}
                    {selectedTextId && !editingTextId && (() => {
                        const text = textMarkups.find(t => t.id === selectedTextId);
                        if (!text) return null;
                        const sp = getLocalPoint(text.x, text.y);
                        return (
                            <div
                                data-interactive-ui="true"
                                className={`absolute transition-opacity transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isMenuVisible ? 'opacity-100' : 'opacity-0'}`}
                                style={{
                                    left: sp.left, top: sp.top,
                                    transform: `translate(-50%, -100%) translateY(-10px) scale(${isMenuVisible ? 1 : 0.9})`,
                                    transformOrigin: 'bottom center',
                                    pointerEvents: isMenuVisible ? 'auto' : 'none', zIndex: 30,
                                }}
                            >
                                <div className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg text-white border border-white/10">
                                    <div className="relative">
                                        <button
                                            onClick={e => { e.stopPropagation(); handleLinkButton(e, text.id); }}
                                            title="Link"
                                            className={`p-2 rounded-lg transition-colors ${linkMenuRectId === text.id ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}
                                        >
                                            <LinkIcon className="w-4 h-4" />
                                        </button>
                                        {linkMenuRectId === text.id && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max" onMouseLeave={() => setLinkMenuRectId(null)}>
                                                <div className="flex flex-col gap-1 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg text-sm border border-white/10">
                                                    {['Link RFI', 'Link Submittal', 'Link Punch', 'Link Drawing', 'Link Photo'].map(type => (
                                                        <button key={type} onClick={e => handleLocalSubmenuLink(e, type, text.id)} className="px-3 py-1.5 text-white rounded-lg hover:bg-blue-600 transition-colors text-left whitespace-nowrap">
                                                            {type.replace('Link ', '')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative" data-markup-color-trigger>
                                        <button
                                            type="button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setLinkMenuRectId(null);
                                                setColorPanelOpen(o => { const n = !o; if (n) setColorPanelSource('selection'); return n; });
                                            }}
                                            title="Markup Color"
                                            className={`p-2 rounded-lg transition-colors ${colorPanelOpen && colorPanelSource === 'selection' ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}
                                        >
                                            <Palette className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteSelected(); }}
                                        title="Delete" className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Color picker panel ───────────────────────────────────── */}
                    {colorPanelOpen && (() => {
                        const PICKER_W = 300, PICKER_H = 520, GAP = 12;
                        let pickerStyle: React.CSSProperties;
                        const activeSelectionRect = singleSelectionScreenRect ?? selectedLineScreenRect ?? selectedTextScreenRect;
                        if (colorPanelSource === 'selection' && activeSelectionRect) {
                            const markupRight = activeSelectionRect.left + activeSelectionRect.width;
                            const markupLeft  = activeSelectionRect.left;
                            let left: number;
                            if (markupRight + GAP + PICKER_W <= containerSize.width - 4) { left = markupRight + GAP; }
                            else if (markupLeft - GAP - PICKER_W >= 4) { left = markupLeft - GAP - PICKER_W; }
                            else { left = containerSize.width - PICKER_W - 12; }
                            const top = Math.max(8, Math.min(activeSelectionRect.top - 8, containerSize.height - PICKER_H - 8));
                            pickerStyle = { left: `${left}px`, top: `${top}px` };
                        } else {
                            pickerStyle = { bottom: '5.5rem', left: '50%', transform: 'translateX(-50%)' };
                        }
                        return (
                            <div
                                ref={colorPanelRef}
                                data-interactive-ui="true"
                                className="pointer-events-auto absolute z-[50] max-h-[min(640px,calc(100%-4rem))] w-[min(300px,calc(100%-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl"
                                style={pickerStyle}
                                onMouseDown={e => e.stopPropagation()}
                            >
                                <MarkupColorPicker
                                    activeMode={activeColorMode}
                                    onActiveModeChange={setActiveColorMode}
                                    fillValue={markupFillColor}
                                    strokeValue={markupStrokeColor}
                                    onChange={handleColorChange}
                                    onRequestClose={() => setColorPanelOpen(false)}
                                    strokeOnly={
                                        activeTool === 'line' || 
                                        activeTool === 'arrow' || 
                                        activeTool === 'pen' || 
                                        activeTool === 'highlighter' || 
                                        activeTool === 'freeline' ||
                                        selectionIsTextOnly ||
                                        (selectedLineIds.length > 0 && selectedRectIds.length === 0)
                                    }
                                />
                            </div>
                        );
                    })()}

                    {/* ── Link modal ───────────────────────────────────────────── */}
                    {isLinkModalOpen && linkModalConfig && (
                        <LinkModal
                            isOpen={isLinkModalOpen}
                            config={linkModalConfig}
                            onSelect={handleSelectLinkItem}
                            onClose={() => { setIsLinkModalOpen(false); setLinkModalConfig(null); setLinkTargetId(null); }}
                        />
                    )}

                    {/* ── Photo picker ──────────────────────────────────────────── */}
                    <PhotoPickerModal
                        isOpen={isPhotoPickerOpen}
                        onClose={() => { setIsPhotoPickerOpen(false); setLinkTargetId(null); }}
                        onPhotoLinked={handlePhotoLinkedToAnnotation}
                    />

                    {/* ── Toolbar ──────────────────────────────────────────────── */}
                    <div
                        data-interactive-ui="true"
                        className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2"
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <Toolbar
                            activeTool={activeTool}
                            setActiveTool={tool => { setActiveTool(tool); if (['line', 'arrow', 'freeline'].includes(tool)) setActiveLineTool(tool); }}
                            activeLineTool={activeLineTool}
                            setActiveLineTool={tool => { setActiveLineTool(tool); setActiveTool(tool); }}
                            activeShape={activeShape}
                            setActiveShape={setActiveShape}
                            activePinType="safety"
                            setActivePinType={noop}
                            markupFillColor={markupFillColor}
                            markupStrokeColor={markupStrokeColor}
                            markupColorPanelOpen={colorPanelOpen && colorPanelSource === 'toolbar'}
                            onMarkupColorPanelToggle={() => setColorPanelOpen(o => { const n = !o; if (n) setColorPanelSource('toolbar'); return n; })}
                            onMarkupColorPanelClose={() => setColorPanelOpen(false)}
                            toolbarPosition={toolbarPosition}
                            hiddenTools={['pin', 'measurement', 'location', 'image', 'customPin']}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoViewMarkupModal;
