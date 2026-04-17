import React, { useState, useRef, useEffect } from 'react';
import type {
    PhotoData, PhotoMarkup, PhotoMarkupShapeType,
    ShapePhotoMarkup, PenPhotoMarkup, ArrowPhotoMarkup, TextPhotoMarkup,
    LinePhotoMarkup, HighlighterPhotoMarkup,
    RfiData, SubmittalData, PunchData, DrawingData, LinkModalConfig,
} from '../types';
import {
    XMarkIcon, BoxIcon, EllipseIcon, CloudIcon, PenIcon, ArrowIcon,
    TextIcon, HighlighterIcon, LineIcon, LinkIcon, TrashIcon, MousePointerIcon,
} from './Icons';
import LinkModal from './LinkModal';

// ── Props ─────────────────────────────────────────────────────────────────────

interface PhotoViewerModalProps {
    isOpen: boolean;
    photoData: PhotoData | null;
    onClose: () => void;
    onUpdateMarkups: (newMarkups: PhotoMarkup[]) => void;
    allRfis?: RfiData[];
    submittals?: SubmittalData[];
    allPunches?: PunchData[];
    allDrawings?: DrawingData[];
}

type MarkupTool = 'select' | 'shape' | 'pen' | 'arrow' | 'line' | 'text' | 'highlighter';

// ── Color palette (mirrors main viewer defaults) ──────────────────────────────

const PALETTE = [
    '#ef4444', // red   (default)
    '#f97316', // orange
    '#eab308', // yellow (default for highlighter)
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ffffff',  // white
    '#111827',  // black
];
const DEFAULT_COLOR      = '#ef4444';
const HIGHLIGHTER_COLOR  = '#eab308';

// ── Toolbar button ────────────────────────────────────────────────────────────

const ToolBtn: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        title={label}
        className={`p-2.5 rounded-lg transition-colors duration-200 ${
            isActive ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'
        }`}
    >
        <div className="w-5 h-5">{icon}</div>
    </button>
);

// ── Component ─────────────────────────────────────────────────────────────────

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
    isOpen, photoData, onClose, onUpdateMarkups,
    allRfis = [], submittals = [], allPunches = [], allDrawings = [],
}) => {

    // ── Markup state ────────────────────────────────────────────────────────
    const [markups,       setMarkups]       = useState<PhotoMarkup[]>([]);
    const [currentMarkup, setCurrentMarkup] = useState<PhotoMarkup | null>(null);
    const [isDrawing,     setIsDrawing]     = useState(false);
    const [startPoint,    setStartPoint]    = useState<{ x: number; y: number } | null>(null);

    // Refs mirror drawing state for synchronous access inside mouse handlers
    // (avoids stale closure issues when mouse events outpace React re-renders)
    const isDrawingRef     = useRef(false);
    const startPointRef    = useRef<{ x: number; y: number } | null>(null);
    const currentMarkupRef = useRef<PhotoMarkup | null>(null);

    // ── Tool state ──────────────────────────────────────────────────────────
    const [activeTool,     setActiveTool]    = useState<MarkupTool>('shape');
    const [activeShape,    setActiveShape]   = useState<PhotoMarkupShapeType>('box');
    const [isShapeMenuOpen, setShapeMenuOpen] = useState(false);
    const [markupColor,    setMarkupColor]   = useState(DEFAULT_COLOR);
    const shapeMenuRef = useRef<HTMLDivElement>(null);

    // ── Text state ──────────────────────────────────────────────────────────
    const [isTexting,    setIsTexting]    = useState(false);
    const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);

    // ── Selection + link state ──────────────────────────────────────────────
    const [selectedMarkupId,  setSelectedMarkupId]  = useState<string | null>(null);
    const [linkMenuMarkupId,  setLinkMenuMarkupId]  = useState<string | null>(null);
    const [openLinkSubmenu,   setOpenLinkSubmenu]   = useState<string | null>(null);
    const [isLinkModalOpen,   setIsLinkModalOpen]   = useState(false);
    const [linkModalConfig,   setLinkModalConfig]   = useState<LinkModalConfig | null>(null);
    // Capture which markup the link modal was opened for
    const linkTargetId = useRef<string | null>(null);

    const photoContainerRef = useRef<HTMLDivElement>(null);

    // ── Effects ──────────────────────────────────────────────────────────────

    // Reset state when a new photo is opened
    useEffect(() => {
        if (!photoData) return;
        const migrated = (photoData.markups || []).map(m => {
            if ('type' in m) return m;
            const old = m as any;
            return { id: old.id, type: 'shape', shape: 'box', x: old.x, y: old.y, width: old.width, height: old.height } as ShapePhotoMarkup;
        });
        setMarkups(migrated);
        setActiveTool('shape');
        setActiveShape('box');
        setMarkupColor(DEFAULT_COLOR);
        setCurrentMarkup(null);
        currentMarkupRef.current = null;
        setIsDrawing(false);
        isDrawingRef.current = false;
        startPointRef.current = null;
        setStartPoint(null);
        setSelectedMarkupId(null);
        setLinkMenuMarkupId(null);
        setIsTexting(false);
        setTextPosition(null);
    }, [photoData]);

    // Focus textarea when text tool activates
    useEffect(() => {
        if (isTexting && textInputRef.current) textInputRef.current.focus();
    }, [isTexting]);

    // Auto-switch to highlighter yellow when highlighter tool is selected
    useEffect(() => {
        if (activeTool === 'highlighter') setMarkupColor(HIGHLIGHTER_COLOR);
    }, [activeTool]);

    // Close shape dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (shapeMenuRef.current && !shapeMenuRef.current.contains(e.target as Node))
                setShapeMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!isOpen || !photoData) return null;

    // ── Coordinate helpers ────────────────────────────────────────────────────

    const getRelativeCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
        if (!photoContainerRef.current) return null;
        const rect = photoContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    };

    /** Convert percentage coords → pixel position within the container div. */
    const toPixelPos = (x: number, y: number): { left: number; top: number } => {
        if (!photoContainerRef.current) return { left: 0, top: 0 };
        const { width, height } = photoContainerRef.current.getBoundingClientRect();
        return { left: (x / 100) * width, top: (y / 100) * height };
    };

    // ── Shape normalizer ──────────────────────────────────────────────────────

    const normalizeShape = (m: ShapePhotoMarkup): ShapePhotoMarkup => {
        const n = { ...m };
        if (n.width  < 0) { n.x += n.width;  n.width  = Math.abs(n.width); }
        if (n.height < 0) { n.y += n.height; n.height = Math.abs(n.height); }
        return n;
    };

    // ── Markup CRUD ───────────────────────────────────────────────────────────

    const commit = (updated: PhotoMarkup[]) => {
        setMarkups(updated);
        onUpdateMarkups(updated);
    };

    const deleteMarkup = (id: string) => {
        commit(markups.filter(m => m.id !== id));
        if (selectedMarkupId === id) setSelectedMarkupId(null);
        if (linkMenuMarkupId  === id) setLinkMenuMarkupId(null);
    };

    const selectMarkup = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedMarkupId(id);
        setLinkMenuMarkupId(null);
        setOpenLinkSubmenu(null);
    };

    // ── Mouse handlers ────────────────────────────────────────────────────────

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0 || isTexting) return;

        // In select mode: bare canvas click deselects
        if (activeTool === 'select') {
            setSelectedMarkupId(null);
            setLinkMenuMarkupId(null);
            setOpenLinkSubmenu(null);
            return;
        }

        const coords = getRelativeCoords(e);
        if (!coords) return;

        setSelectedMarkupId(null);
        setLinkMenuMarkupId(null);

        const color = markupColor;

        if (activeTool === 'text') {
            setTextPosition(coords);
            setIsTexting(true);
            return;
        }

        let initial: PhotoMarkup | null = null;
        switch (activeTool) {
            case 'shape':
                initial = { id: 'current', type: 'shape', shape: activeShape, x: coords.x, y: coords.y, width: 0, height: 0, color };
                break;
            case 'pen':
                initial = { id: 'current', type: 'pen', points: [coords], color };
                break;
            case 'arrow':
                initial = { id: 'current', type: 'arrow', start: coords, end: coords, color };
                break;
            case 'line':
                initial = { id: 'current', type: 'line', start: coords, end: coords, color };
                break;
            case 'highlighter':
                initial = { id: 'current', type: 'highlighter', points: [coords], color };
                break;
        }

        if (initial) {
            isDrawingRef.current = true;
            startPointRef.current = coords;
            currentMarkupRef.current = initial;
            setIsDrawing(true);
            setStartPoint(coords);
            setCurrentMarkup(initial);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawingRef.current || !startPointRef.current || !currentMarkupRef.current) return;
        const coords = getRelativeCoords(e);
        if (!coords) return;

        const prev = currentMarkupRef.current;
        let next: PhotoMarkup | null = null;

        switch (prev.type) {
            case 'shape':
                next = { ...prev, width: coords.x - startPointRef.current.x, height: coords.y - startPointRef.current.y };
                break;
            case 'pen':
            case 'highlighter':
                next = { ...prev, points: [...prev.points, coords] };
                break;
            case 'arrow':
            case 'line':
                next = { ...prev, end: coords };
                break;
        }

        if (next) {
            currentMarkupRef.current = next;
            setCurrentMarkup(next);
        }
    };

    const handleMouseUp = () => {
        if (!isDrawingRef.current || !currentMarkupRef.current) {
            isDrawingRef.current = false;
            setIsDrawing(false);
            return;
        }

        const snapshot = currentMarkupRef.current;
        let newMarkup: PhotoMarkup | null = null;

        switch (snapshot.type) {
            case 'shape': {
                const n = normalizeShape(snapshot as ShapePhotoMarkup);
                if (n.width > 0.5 && n.height > 0.5) newMarkup = { ...n, id: Date.now().toString() };
                break;
            }
            case 'pen':
            case 'highlighter': {
                const m = snapshot as PenPhotoMarkup | HighlighterPhotoMarkup;
                if (m.points.length > 1) newMarkup = { ...m, id: Date.now().toString() };
                break;
            }
            case 'arrow':
            case 'line': {
                const m = snapshot as ArrowPhotoMarkup | LinePhotoMarkup;
                if (Math.hypot(m.end.x - m.start.x, m.end.y - m.start.y) > 0.5)
                    newMarkup = { ...m, id: Date.now().toString() };
                break;
            }
        }

        // Read markups from state (captured in this render's closure) — fine since
        // markups list only changes on commit, not on every mouse move.
        if (newMarkup) commit([...markups, newMarkup]);

        isDrawingRef.current = false;
        startPointRef.current = null;
        currentMarkupRef.current = null;
        setIsDrawing(false);
        setCurrentMarkup(null);
        setStartPoint(null);
    };

    // ── Text handler ──────────────────────────────────────────────────────────

    const handleTextSubmit = (text: string) => {
        if (text.trim() && textPosition) {
            const m: TextPhotoMarkup = {
                id: Date.now().toString(), type: 'text',
                text: text.trim(), x: textPosition.x, y: textPosition.y, color: markupColor,
            };
            commit([...markups, m]);
        }
        setIsTexting(false);
        setTextPosition(null);
    };

    // ── Link-to-record ────────────────────────────────────────────────────────

    const handleLinkClick = (e: React.MouseEvent, markupId: string) => {
        e.stopPropagation();
        if (linkMenuMarkupId === markupId) {
            setLinkMenuMarkupId(null);
            setOpenLinkSubmenu(null);
        } else {
            setLinkMenuMarkupId(markupId);
            setOpenLinkSubmenu(null);
        }
    };

    const openLinkModal = (markupId: string, type: 'rfi' | 'submittal' | 'punch' | 'drawing') => {
        linkTargetId.current = markupId;
        const cfgs: Record<string, LinkModalConfig> = {
            rfi: {
                type: 'rfi',
                title: 'Link to an RFI',
                items: allRfis.map(r => ({ ...r, titleWithId: `RFI-${r.id}: ${r.title}` })),
                displayFields: [{ key: 'titleWithId' }],
                searchFields: ['title', 'id'],
            },
            submittal: {
                type: 'submittal',
                title: 'Link to a Submittal',
                items: submittals,
                displayFields: [{ key: 'id' }, { key: 'title' }],
                searchFields: ['id', 'title'],
            },
            punch: {
                type: 'punch',
                title: 'Link to a Punch Item',
                items: allPunches,
                displayFields: [{ key: 'id' }, { key: 'title' }],
                searchFields: ['id', 'title'],
            },
            drawing: {
                type: 'drawing',
                title: 'Link to a Drawing',
                items: allDrawings.map(d => ({ id: d.id, title: d.title })),
                displayFields: [{ key: 'id' }, { key: 'title' }],
                searchFields: ['id', 'title'],
            },
        };
        setLinkModalConfig(cfgs[type]);
        setIsLinkModalOpen(true);
        setLinkMenuMarkupId(null);
        setOpenLinkSubmenu(null);
    };

    const handleSelectLinkItem = (item: any) => {
        const targetId = linkTargetId.current;
        if (!targetId || !linkModalConfig) return;

        const updated = markups.map(m => {
            if (m.id !== targetId) return m;
            const mu = { ...m } as any;
            switch (linkModalConfig.type) {
                case 'rfi':
                    if (!mu.rfi) mu.rfi = [];
                    if (!mu.rfi.some((r: RfiData) => r.id === item.id)) {
                        const full = allRfis.find(r => r.id === item.id);
                        if (full) mu.rfi.push(full);
                    }
                    break;
                case 'submittal':
                    if (!mu.submittals) mu.submittals = [];
                    if (!mu.submittals.some((s: SubmittalData) => s.id === item.id)) mu.submittals.push(item);
                    break;
                case 'punch':
                    if (!mu.punches) mu.punches = [];
                    if (!mu.punches.some((p: PunchData) => p.id === item.id)) mu.punches.push(item);
                    break;
                case 'drawing':
                    if (!mu.drawings) mu.drawings = [];
                    if (!mu.drawings.some((d: DrawingData) => d.id === item.id)) mu.drawings.push(item);
                    break;
            }
            return mu as PhotoMarkup;
        });
        commit(updated);
        setIsLinkModalOpen(false);
        setLinkModalConfig(null);
        linkTargetId.current = null;
    };

    // ── Cloud path generator (identical to main viewer) ───────────────────────

    const generateCloudPath = (w: number, h: number) => {
        if (w <= 0 || h <= 0) return '';
        const r = Math.max(4, Math.min(w / 4, h / 4, 12));
        let path = `M ${r},0`;
        const ts = Math.max(1, Math.round((w - 2 * r) / (r * 1.5)));
        const step = (w - 2 * r) / ts;
        for (let i = 0; i < ts; i++) path += ` a ${step / 2},${r} 0 0,1 ${step},0`;
        path += ` a ${r},${r} 0 0,1 ${r},${r}`;
        const rs = Math.max(1, Math.round((h - 2 * r) / (r * 1.5)));
        const rstep = (h - 2 * r) / rs;
        for (let i = 0; i < rs; i++) path += ` a ${r},${rstep / 2} 0 0,1 0,${rstep}`;
        path += ` a ${r},${r} 0 0,1 -${r},${r}`;
        const bs = Math.max(1, Math.round((w - 2 * r) / (r * 1.5)));
        const bstep = (w - 2 * r) / bs;
        for (let i = 0; i < bs; i++) path += ` a ${bstep / 2},${r} 0 0,1 -${bstep},0`;
        path += ` a ${r},${r} 0 0,1 -${r},-${r}`;
        const ls = Math.max(1, Math.round((h - 2 * r) / (r * 1.5)));
        const lstep = (h - 2 * r) / ls;
        for (let i = 0; i < ls; i++) path += ` a ${r},${lstep / 2} 0 0,1 0,-${lstep}`;
        path += ` a ${r},${r} 0 0,1 ${r},-${r}`;
        return path;
    };

    // ── Link submenu — matches main canvas exactly (hover-based RFI flyout) ─────

    const LinkSubMenu: React.FC<{ markupId: string }> = ({ markupId }) => (
        <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max z-50"
            onMouseLeave={() => setOpenLinkSubmenu(null)}
        >
            <div className="flex flex-col gap-1 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg text-sm border border-white/10">
                {/* RFI row with hover flyout */}
                <div className="relative" onMouseEnter={() => setOpenLinkSubmenu('rfi')}>
                    <div className="flex justify-between items-center px-3 py-1.5 text-white rounded-lg hover:bg-blue-600 transition-colors text-left cursor-default">
                        <span>RFI</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 ml-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                    {openLinkSubmenu === 'rfi' && (
                        <div className="absolute left-full top-0 ml-1 flex flex-col gap-1 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg text-sm w-max border border-white/10">
                            <button onClick={(e) => { e.stopPropagation(); openLinkModal(markupId, 'rfi'); }}
                                className="px-3 py-1.5 text-white rounded-lg hover:bg-blue-600 transition-colors text-left whitespace-nowrap">
                                Link RFI
                            </button>
                        </div>
                    )}
                </div>
                {/* Submittal / Punch / Drawing */}
                {(['submittal', 'punch', 'drawing'] as const).map(type => (
                    <button key={type} onClick={(e) => { e.stopPropagation(); openLinkModal(markupId, type); }}
                        className="px-3 py-1.5 text-white rounded-lg hover:bg-blue-600 transition-colors text-left capitalize">
                        {type}
                    </button>
                ))}
            </div>
        </div>
    );

    // ── Tag pills (matching main viewer style) ────────────────────────────────

    const TagPills: React.FC<{ markup: any }> = ({ markup }) => {
        const pills: { cls: string; label: string }[] = [
            ...((markup.rfi        || []) as RfiData[]).map(r        => ({ cls: 'bg-blue-600/85',    label: `RFI-${r.id}` })),
            ...((markup.submittals || []) as SubmittalData[]).map(s  => ({ cls: 'bg-slate-600/85',   label: s.id })),
            ...((markup.punches    || []) as PunchData[]).map(p      => ({ cls: 'bg-orange-600/90',  label: p.id })),
            ...((markup.drawings   || []) as DrawingData[]).map(d    => ({ cls: 'bg-indigo-600/85',  label: d.id })),
        ];
        if (pills.length === 0) return null;
        return (
            <div className="flex flex-col gap-0.5 mt-0.5 pointer-events-none">
                {pills.map((pill, i) => (
                    <span key={i} className={`inline-block text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm ${pill.cls}`}>
                        {pill.label}
                    </span>
                ))}
            </div>
        );
    };

    // ── Shape tool config ─────────────────────────────────────────────────────

    const shapeTools: { id: PhotoMarkupShapeType; label: string; icon: React.ReactNode }[] = [
        { id: 'box',     label: 'Box',     icon: <BoxIcon     className="w-5 h-5" /> },
        { id: 'ellipse', label: 'Ellipse', icon: <EllipseIcon className="w-5 h-5" /> },
        { id: 'cloud',   label: 'Cloud',   icon: <CloudIcon   className="w-5 h-5" /> },
    ];
    const currentShapeTool = shapeTools.find(s => s.id === activeShape) || shapeTools[0];

    const getCursorClass = () => {
        if (activeTool === 'select') return 'cursor-default';
        if (isTexting || activeTool === 'text') return 'cursor-text';
        return 'cursor-crosshair';
    };

    /** Returns the CSS left/top anchor (% strings) for the unified action menu,
     *  positioned at the top-center of the selected markup — same logic as the
     *  main canvas `singleSelectionScreenRect` centre-top placement. */
    const getMenuAnchor = (m: PhotoMarkup): { left: string; top: string } => {
        if (m.type === 'shape') {
            const n = normalizeShape(m as ShapePhotoMarkup);
            return { left: `${n.x + n.width / 2}%`, top: `${n.y}%` };
        }
        if (m.type === 'text') {
            return { left: `${m.x}%`, top: `${m.y}%` };
        }
        if (m.type === 'pen' || m.type === 'highlighter') {
            const pts = (m as PenPhotoMarkup | HighlighterPhotoMarkup).points;
            const xs = pts.map(p => p.x);
            const ys = pts.map(p => p.y);
            return { left: `${(Math.min(...xs) + Math.max(...xs)) / 2}%`, top: `${Math.min(...ys)}%` };
        }
        // line or arrow
        const lm = m as LinePhotoMarkup | ArrowPhotoMarkup;
        return { left: `${(lm.start.x + lm.end.x) / 2}%`, top: `${Math.min(lm.start.y, lm.end.y)}%` };
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="linarc-modal-overlay !z-[110]" onClick={onClose}>
            <div
                className="linarc-modal-panel relative flex max-h-[90vh] w-full max-w-6xl flex-col"
                onClick={e => e.stopPropagation()}
                style={{ height: '90vh' }}
                role="dialog" aria-modal="true"
            >
                {/* Header */}
                <div className="linarc-modal-header !pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="linarc-modal-title truncate">{photoData.title}</h3>
                            <p className="linarc-modal-subtitle">Markup tools · click photo to draw</p>
                        </div>
                        <button type="button" onClick={onClose} className="linarc-modal-close shrink-0" aria-label="Close">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Canvas area */}
                <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-gray-50/80 p-4 dark:bg-zinc-950/40">

                    {/* ── Toolbar ── */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                        {/* Tool row — same button style as main viewer */}
                        <div className="flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">

                            {/* Select */}
                            <ToolBtn label="Select" isActive={activeTool === 'select'} onClick={() => setActiveTool('select')}
                                icon={<MousePointerIcon className="w-5 h-5" />} />

                            {/* Shape (with sub-dropdown) */}
                            <div ref={shapeMenuRef} className="relative">
                                <button
                                    onClick={() => { setActiveTool('shape'); setShapeMenuOpen(p => !p); }}
                                    className={`relative p-2.5 rounded-lg transition-colors duration-200 ${activeTool === 'shape' ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'}`}
                                    title={currentShapeTool.label}
                                >
                                    <div className="w-5 h-5">{currentShapeTool.icon}</div>
                                    {/* Corner pip indicating sub-menu */}
                                    <div className="absolute bottom-1 right-1 pointer-events-none">
                                        <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300"><path d="M6 6L0 6L6 0Z" fill="currentColor" /></svg>
                                    </div>
                                </button>
                                {isShapeMenuOpen && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg">
                                        {shapeTools.map(s => (
                                            <button key={s.id} title={s.label}
                                                onClick={() => { setActiveShape(s.id); setShapeMenuOpen(false); }}
                                                className={`p-2 rounded-lg transition-colors ${activeShape === s.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                                                {s.icon}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Line */}
                            <ToolBtn label="Line"        isActive={activeTool === 'line'}        onClick={() => setActiveTool('line')}        icon={<LineIcon        className="w-5 h-5" />} />
                            {/* Arrow */}
                            <ToolBtn label="Arrow"       isActive={activeTool === 'arrow'}       onClick={() => setActiveTool('arrow')}       icon={<ArrowIcon       className="w-5 h-5" />} />
                            {/* Pen */}
                            <ToolBtn label="Pen"         isActive={activeTool === 'pen'}         onClick={() => setActiveTool('pen')}         icon={<PenIcon         className="w-5 h-5" />} />
                            {/* Highlighter */}
                            <ToolBtn label="Highlighter" isActive={activeTool === 'highlighter'} onClick={() => setActiveTool('highlighter')} icon={<HighlighterIcon className="w-5 h-5" />} />
                            {/* Text */}
                            <ToolBtn label="Text"        isActive={activeTool === 'text'}        onClick={() => setActiveTool('text')}        icon={<TextIcon        className="w-5 h-5" />} />
                        </div>

                        {/* Color row */}
                        <div className="flex gap-1.5 bg-gray-900/80 backdrop-blur-sm px-2.5 py-2 rounded-lg shadow-lg">
                            {PALETTE.map(hex => (
                                <button key={hex} title={hex} onClick={() => setMarkupColor(hex)}
                                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none flex-shrink-0"
                                    style={{
                                        backgroundColor: hex,
                                        borderColor: markupColor === hex ? '#3b82f6' : (hex === '#ffffff' ? '#9ca3af' : hex),
                                        boxShadow: markupColor === hex ? '0 0 0 1.5px #3b82f6' : undefined,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Photo container ── */}
                    <div
                        ref={photoContainerRef}
                        className={`relative w-full h-full ${getCursorClass()}`}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img
                            src={photoData.url}
                            alt={photoData.title}
                            className="w-full h-full object-contain pointer-events-none select-none"
                        />

                        {/* ── Shape & text markups (div-based, match original) ── */}
                        {markups.map(markup => {
                            const isSelected = selectedMarkupId === markup.id;
                            const color = (markup as any).color || DEFAULT_COLOR;

                            if (markup.type === 'shape') {
                                const n = normalizeShape(markup as ShapePhotoMarkup);
                                const pixW = photoContainerRef.current ? (n.width  / 100) * photoContainerRef.current.clientWidth  : 0;
                                const pixH = photoContainerRef.current ? (n.height / 100) * photoContainerRef.current.clientHeight : 0;
                                const fill = color + '33';
                                return (
                                    <div key={markup.id} className="absolute"
                                        style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${n.width}%`, height: `${n.height}%`, outline: isSelected ? '2px solid #3b82f6' : undefined, outlineOffset: 2 }}
                                        onMouseDown={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); setLinkMenuMarkupId(null); setOpenLinkSubmenu(null); }}
                                    >
                                        {markup.shape === 'box' && (
                                            <div className="w-full h-full" style={{ border: `2px solid ${color}`, backgroundColor: fill }} />
                                        )}
                                        {markup.shape === 'ellipse' && (
                                            <svg width="100%" height="100%" viewBox={`0 0 ${pixW} ${pixH}`} preserveAspectRatio="none">
                                                <ellipse cx={pixW/2} cy={pixH/2} rx={pixW/2} ry={pixH/2} stroke={color} strokeWidth={2} fill={fill} />
                                            </svg>
                                        )}
                                        {markup.shape === 'cloud' && (
                                            <svg width="100%" height="100%" viewBox={`0 0 ${pixW} ${pixH}`} preserveAspectRatio="none">
                                                <path d={generateCloudPath(pixW, pixH)} stroke={color} strokeWidth={2} fill={fill} />
                                            </svg>
                                        )}
                                        {/* Linked record tag pills */}
                                        <div className="absolute left-full top-0 ml-1 flex flex-col gap-0.5 pointer-events-none">
                                            <TagPills markup={markup} />
                                        </div>
                                    </div>
                                );
                            }

                            if (markup.type === 'text') {
                                return (
                                    <div key={markup.id} className="absolute"
                                        style={{ left: `${markup.x}%`, top: `${markup.y}%`, transform: 'translateY(-100%)', outline: isSelected ? '2px solid #3b82f6' : undefined, outlineOffset: 2 }}
                                        onMouseDown={(e) => { e.stopPropagation(); setSelectedMarkupId(markup.id); setLinkMenuMarkupId(null); setOpenLinkSubmenu(null); }}
                                    >
                                        <p style={{ color }} className="whitespace-pre-wrap text-lg bg-white/50 dark:bg-black/50 px-1 rounded-sm">{markup.text}</p>
                                    </div>
                                );
                            }

                            return null; // pen / highlighter / arrow / line → handled in the SVG below
                        })}

                        {/* ── Single SVG overlay — committed markups + live in-progress preview ── */}
                        {/* Mirrors main canvas: viewBox 0-100 % coords, vectorEffect keeps strokes at
                            a fixed pixel width regardless of container size, same bezier smoothing,
                            same arrowhead marker, same selection glow + endpoint handles. */}
                        <svg
                            className="absolute top-0 left-0 w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            style={{ pointerEvents: activeTool === 'select' ? 'auto' : 'none', overflow: 'visible' }}
                        >
                            <defs>
                                {/* Same marker as main canvas — markerUnits="strokeWidth" so the head
                                    scales with the line's stroke width automatically */}
                                <marker id="pv-arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5"
                                    orient="auto" markerUnits="strokeWidth">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
                                </marker>
                            </defs>

                            {/* Render all stroke markups + live preview in one pass (same pattern as main canvas) */}
                            {[...markups, ...(currentMarkup && currentMarkup.id === 'current' ? [currentMarkup] : [])].map(m => {
                                if (m.type !== 'pen' && m.type !== 'highlighter' && m.type !== 'arrow' && m.type !== 'line') return null;

                                const color = (m as any).color || DEFAULT_COLOR;
                                const isSelected = selectedMarkupId === m.id;
                                const isCurrent = m.id === 'current';
                                const isFreehand = m.type === 'pen' || m.type === 'highlighter';
                                const isHighlighter = m.type === 'highlighter';
                                // Match main canvas stroke widths exactly
                                const strokeW = isHighlighter ? 16 : 2;

                                // Build path — midpoint quadratic bezier for freehand (smooth curves,
                                // identical algorithm to main canvas), straight M/L for line & arrow.
                                let pathD = '';
                                if (isFreehand) {
                                    const pts = (m as PenPhotoMarkup | HighlighterPhotoMarkup).points;
                                    if (pts.length < 2) return null;
                                    pathD = `M ${pts[0].x} ${pts[0].y}`;
                                    for (let i = 1; i < pts.length - 1; i++) {
                                        const midX = (pts[i].x + pts[i + 1].x) / 2;
                                        const midY = (pts[i].y + pts[i + 1].y) / 2;
                                        pathD += ` Q ${pts[i].x} ${pts[i].y} ${midX} ${midY}`;
                                    }
                                    pathD += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
                                } else {
                                    const lm = m as ArrowPhotoMarkup | LinePhotoMarkup;
                                    pathD = `M ${lm.start.x} ${lm.start.y} L ${lm.end.x} ${lm.end.y}`;
                                }

                                const hitProps = !isCurrent ? {
                                    style: { cursor: activeTool === 'select' ? 'pointer' : 'default', pointerEvents: 'stroke' as const },
                                    onMouseDown: (e: React.MouseEvent<SVGElement>) => { if (activeTool === 'select') selectMarkup(m.id, e); },
                                } : { style: { pointerEvents: 'none' as const } };

                                return (
                                    <g key={m.id} opacity={isHighlighter ? 0.45 : 1}>
                                        {/* Selection glow — wide semi-transparent path behind the stroke */}
                                        {isSelected && (
                                            <path
                                                d={pathD}
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth={strokeW + 8}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                opacity={0.25}
                                                vectorEffect="non-scaling-stroke"
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        )}
                                        {/* Main stroke */}
                                        <path
                                            d={pathD}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={strokeW}
                                            strokeLinecap={isFreehand ? 'round' : 'square'}
                                            strokeLinejoin={isFreehand ? 'round' : 'miter'}
                                            markerEnd={m.type === 'arrow' ? 'url(#pv-arrowhead)' : undefined}
                                            vectorEffect="non-scaling-stroke"
                                            {...hitProps}
                                        />
                                        {/* Endpoint handles for line / arrow when selected (matches main canvas circles) */}
                                        {isSelected && !isCurrent && (m.type === 'line' || m.type === 'arrow') && (() => {
                                            const lm = m as ArrowPhotoMarkup | LinePhotoMarkup;
                                            return (
                                                <>
                                                    <circle cx={lm.start.x} cy={lm.start.y} r="0.9"
                                                        fill="#ffffff" stroke={color}
                                                        vectorEffect="non-scaling-stroke"
                                                        style={{ pointerEvents: 'none' }} />
                                                    <circle cx={lm.end.x} cy={lm.end.y} r="0.9"
                                                        fill="#ffffff" stroke={color}
                                                        vectorEffect="non-scaling-stroke"
                                                        style={{ pointerEvents: 'none' }} />
                                                </>
                                            );
                                        })()}
                                        {/* Start / end handles for freehand when selected */}
                                        {isSelected && !isCurrent && isFreehand && (() => {
                                            const fm = m as PenPhotoMarkup | HighlighterPhotoMarkup;
                                            const first = fm.points[0];
                                            const last = fm.points[fm.points.length - 1];
                                            return (
                                                <>
                                                    <circle cx={first.x} cy={first.y} r="0.9"
                                                        fill="#ffffff" stroke={color}
                                                        vectorEffect="non-scaling-stroke"
                                                        style={{ pointerEvents: 'none' }} />
                                                    {fm.points.length > 1 && (
                                                        <circle cx={last.x} cy={last.y} r="0.9"
                                                            fill="#ffffff" stroke={color}
                                                            vectorEffect="non-scaling-stroke"
                                                            style={{ pointerEvents: 'none' }} />
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </g>
                                );
                            })}
                        </svg>

                        {/* ── Shape preview (div-based, outside SVG) ── */}
                        {currentMarkup?.type === 'shape' && (() => {
                            const n = normalizeShape(currentMarkup as ShapePhotoMarkup);
                            const color = (currentMarkup as any).color || DEFAULT_COLOR;
                            return (
                                <div className="absolute pointer-events-none"
                                    style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${n.width}%`, height: `${n.height}%`, border: `2px dashed ${color}`, backgroundColor: color + '33' }}
                                />
                            );
                        })()}

                        {/* ── Unified action menu — identical to main canvas: appears above any
                            selected markup with spring animation, Link + Delete buttons ── */}
                        {selectedMarkupId && (() => {
                            const m = markups.find(x => x.id === selectedMarkupId);
                            if (!m) return null;
                            const anchor = getMenuAnchor(m);
                            const showLinkMenu = linkMenuMarkupId === m.id;

                            return (
                                <div
                                    data-interactive-ui="true"
                                    className="absolute transition-opacity transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] opacity-100"
                                    style={{
                                        left: anchor.left,
                                        top: anchor.top,
                                        transform: 'translate(-50%, calc(-100% - 10px)) scale(1)',
                                        transformOrigin: 'bottom center',
                                        zIndex: 30,
                                    }}
                                    onMouseDown={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center gap-0.5 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-xl shadow-xl text-white border border-white/10">
                                        {/* Link to record */}
                                        <div className="relative">
                                            <button
                                                onClick={(e) => handleLinkClick(e, m.id)}
                                                title="Link to record"
                                                className={`p-2 rounded-lg transition-colors ${showLinkMenu ? 'bg-blue-600 text-white' : 'hover:bg-white/10'}`}
                                            >
                                                <LinkIcon className="w-4 h-4" />
                                            </button>
                                            {showLinkMenu && <LinkSubMenu markupId={m.id} />}
                                        </div>
                                        {/* Delete */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteMarkup(m.id); }}
                                            title="Delete"
                                            className="p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── Text input ── */}
                        {isTexting && textPosition && (
                            <textarea
                                ref={textInputRef}
                                className="absolute z-20 bg-white dark:bg-gray-900 border border-dashed focus:outline-none p-1"
                                style={{
                                    left: `${textPosition.x}%`,
                                    top: `${textPosition.y}%`,
                                    transform: 'translateY(-100%)',
                                    minWidth: '100px',
                                    borderColor: markupColor,
                                    color: markupColor,
                                }}
                                onBlur={(e) => handleTextSubmit(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit((e.target as HTMLTextAreaElement).value); }
                                    if (e.key === 'Escape') { e.preventDefault(); setIsTexting(false); setTextPosition(null); }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Link modal — rendered outside modal panel so it stacks above it */}
            <LinkModal
                isOpen={isLinkModalOpen}
                config={linkModalConfig}
                onClose={() => { setIsLinkModalOpen(false); setLinkModalConfig(null); linkTargetId.current = null; }}
                onSelect={handleSelectLinkItem}
                onUploadRequest={() => {}}
            />
        </div>
    );
};

export default PhotoViewerModal;
