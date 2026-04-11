

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Rectangle, Pin, RfiData, SubmittalData, PunchData, DrawingData, PhotoData } from '../types';
import { ChevronDoubleLeftIcon, EyeIcon, EyeSlashIcon, TrashIcon, CloudIcon, BoxIcon, EllipseIcon, PhotoPinIcon, SafetyPinIcon, PunchPinIcon, ChevronRightIcon, DocumentDuplicateIcon, ClipboardListIcon, PhotoIcon, LockClosedIcon, LockOpenIcon, XMarkIcon } from './Icons';
import Tooltip from './Tooltip';
import { getRectDimensions, getEllipseDimensions, formatFt, formatArea } from '../utils/measurementUtils';
import { MENUS_MODE } from '../utils/showcaseMode';

type LayerItem = (Rectangle & { itemType: 'rect' }) | (Pin & { itemType: 'pin' });

export interface CompareDrawingsInfo {
    left: { label: string; visible: boolean; onToggle: () => void };
    right: { label: string; visible: boolean; onToggle: () => void };
    alignment: {
        status: 'idle' | 'aligning' | 'aligned';
        onAlignSheets: () => void;
        onConfirmAlign: () => void;
        onCancelAlign: () => void;
        onResetAlignment: () => void;
    };
}

interface LayersPanelProps {
    isOpen: boolean;
    onClose: () => void;
    rectangles: Rectangle[];
    pins: Pin[];
    selectedRectIds: string[];
    selectedPinId: string | null;
    expandedIds: string[];
    onToggleExpand: (id: string) => void;
    onSelectRect: (id: string, e: React.MouseEvent) => void;
    onSelectPin: (id: string, e: React.MouseEvent) => void;
    onRenameRect: (id: string, newName: string) => void;
    onRenamePin: (id: string, newName: string) => void;
    onDeleteRect: (id: string) => void;
    onDeletePin: (id: string) => void;
    onToggleRectVisibility: (id: string) => void;
    onTogglePinVisibility: (id: string) => void;
    onOpenRfiPanel: (rectId: string, rfiId: number) => void;
    onOpenPhotoViewer: (photoId: string) => void;
    markupSetNames: Record<string, string>;
    onToggleBatchVisibility: (items: { id: string; type: 'rect' | 'pin' }[], visible: boolean) => void;
    onToggleLock: (id: string, type: 'rect' | 'pin') => void;
    drawingScale?: number | null;
    naturalSize?: { width: number; height: number };
    onRecalibrateDrawingScale?: () => void;
    compareDrawings?: CompareDrawingsInfo;
}

const ItemIcon = ({ item }: { item: LayerItem }) => {
    const iconClass = "w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0";
    if (item.itemType === 'rect') {
        if (item.shape === 'cloud') return <CloudIcon className={iconClass} />;
        if (item.shape === 'ellipse') return <EllipseIcon className={iconClass} />;
        return <BoxIcon className={iconClass} />;
    } else {
        if (item.type === 'photo') return <PhotoPinIcon className={iconClass} />;
        if (item.type === 'safety') return <SafetyPinIcon className={iconClass} />;
        return <PunchPinIcon className={iconClass} />;
    }
};

const LinkedItemIcon = ({ type }: { type: string }) => {
    const iconClass = "w-4 h-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0";
    switch(type) {
        case 'rfi': return <DocumentDuplicateIcon className={iconClass} />;
        case 'submittal': return <DocumentDuplicateIcon className={iconClass} />;
        case 'drawing': return <DocumentDuplicateIcon className={iconClass} />;
        case 'punch': return <ClipboardListIcon className={iconClass} />;
        case 'photo': return <PhotoIcon className={iconClass} />;
        default: return null;
    }
};

const MeasurementChip: React.FC<{ label: string; value: string; emphasized?: boolean }> = ({ label, value, emphasized = false }) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs leading-none ${
            emphasized
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300'
        }`}
    >
        <span className="font-bold uppercase tracking-wide">{label}</span>
        <span className="font-medium">{value}</span>
    </span>
);

const LayersPanel: React.FC<LayersPanelProps> = ({
    isOpen, onClose, rectangles, pins, selectedRectIds, selectedPinId, expandedIds, onToggleExpand,
    onSelectRect, onSelectPin, onRenameRect, onRenamePin, onDeleteRect, onDeletePin,
    onToggleRectVisibility, onTogglePinVisibility, onOpenRfiPanel, onOpenPhotoViewer, markupSetNames, onToggleBatchVisibility, onToggleLock,
    drawingScale, naturalSize, onRecalibrateDrawingScale, compareDrawings,
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [showTakeoff, setShowTakeoff] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    // Resizing logic
    const [panelWidth, setPanelWidth] = useState(256);
    const isResizing = useRef(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const MIN_WIDTH = 256;
    const MAX_WIDTH = 600;

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current || !panelRef.current) return;
            const panelLeft = panelRef.current.getBoundingClientRect().left;
            const newWidth = e.clientX - panelLeft;
            const clampedWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
            setPanelWidth(clampedWidth);
        };
        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);


    const layerItems: LayerItem[] = [
        ...rectangles.map(r => ({ ...r, itemType: 'rect' as const })),
        ...pins.map(p => ({ ...p, itemType: 'pin' as const }))
    ];
    
    // Group items by sourceSetId
    const groupedItems: Record<string, LayerItem[]> = { 'current': [] };
    
    // Initialize groups for known sets to ensure order if we wanted, 
    // but dynamic is fine. 'current' is always first.
    
    layerItems.forEach(item => {
        const key = item.sourceSetId || 'current';
        if (!groupedItems[key]) {
            groupedItems[key] = [];
        }
        groupedItems[key].push(item);
    });
    
    // Sort items within groups by ID (creation time roughly) descending
    Object.keys(groupedItems).forEach(key => {
        groupedItems[key].sort((a, b) => {
            // Heuristic sort: try to parse numeric ID, else string compare
            const aTime = parseInt(a.id.replace(/[^0-9]/g, '')) || 0;
            const bTime = parseInt(b.id.replace(/[^0-9]/g, '')) || 0;
            if (aTime && bTime) return bTime - aTime;
            return a.name.localeCompare(b.name);
        });
    });
    
    // Get keys sorted: current first, then others alphabetically by name
    const sortedGroupKeys = Object.keys(groupedItems).sort((a, b) => {
        if (a === 'current') return -1;
        if (b === 'current') return 1;
        const nameA = markupSetNames[a] || a;
        const nameB = markupSetNames[b] || b;
        return nameA.localeCompare(nameB);
    });

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const handleStartEdit = (item: LayerItem) => {
        setEditingId(item.id);
        setEditingName(item.name);
    };
    
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSaveEdit = () => {
        if (!editingId || !editingName.trim()) {
            handleCancelEdit();
            return;
        }
        const item = layerItems.find(i => i.id === editingId);
        if (item?.itemType === 'rect') {
            onRenameRect(editingId, editingName.trim());
        } else if (item?.itemType === 'pin') {
            onRenamePin(editingId, editingName.trim());
        }
        handleCancelEdit();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };
    
    const handleLinkClick = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const renderMeasurementSummary = (item: LayerItem) => {
        if (!showTakeoff || item.itemType !== 'rect' || !drawingScale || !naturalSize?.width) return null;

        if (item.shape === 'box') {
            const dims = getRectDimensions(item, drawingScale, naturalSize);
            const length = formatFt(dims.length);
            const width = formatFt(dims.width);
            const area = formatArea(dims.area);
            return (
                <div className="mt-1.5 flex flex-nowrap items-center gap-1.5 overflow-x-auto pl-9 pb-0.5">
                    <MeasurementChip label="L" value={length} />
                    <MeasurementChip label="W" value={width} />
                    <MeasurementChip label="A" value={area} />
                </div>
            );
        }

        if (item.shape === 'ellipse') {
            const dims = getEllipseDimensions(item, drawingScale, naturalSize);
            const area = formatArea(dims.area);
            return (
                <div className="mt-1.5 flex flex-nowrap items-center gap-1.5 overflow-x-auto pl-9 pb-0.5">
                    {dims.isCircle ? (
                        <MeasurementChip label="D" value={formatFt(dims.wFt)} />
                    ) : (
                        <>
                            <MeasurementChip label="Dh" value={formatFt(dims.wFt)} />
                            <MeasurementChip label="Dv" value={formatFt(dims.hFt)} />
                        </>
                    )}
                    <MeasurementChip label="A" value={area} />
                </div>
            );
        }

        return null;
    };

    const renderItem = (item: LayerItem) => {
        const isSelected = item.itemType === 'rect' ? selectedRectIds.includes(item.id) : selectedPinId === item.id;
        const isExpanded = expandedIds.includes(item.id);
        const hasChildren = item.itemType === 'rect' && (
            (item.rfi?.length || 0) > 0 ||
            (item.submittals?.length || 0) > 0 ||
            (item.punches?.length || 0) > 0 ||
            (item.drawings?.length || 0) > 0 ||
            (item.photos?.length || 0) > 0
        );

        return (
            <React.Fragment key={item.id}>
                <li
                    onClick={(e) => {
                        if (editingId !== item.id) {
                            if (item.itemType === 'rect') onSelectRect(item.id, e);
                            else onSelectPin(item.id, e);
                        }
                    }}
                    className={`flex flex-col px-1.5 py-1.5 cursor-pointer group transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-gray-100 dark:hover:bg-zinc-700/50'}`}
                >
                    {/* Row 1: chevron + icon + name + actions */}
                    <div className="flex items-center min-w-0">
                        <div className="flex w-5 flex-shrink-0 items-center justify-center mr-0.5">
                            {hasChildren ? (
                                <button onClick={(e) => { e.stopPropagation(); onToggleExpand(item.id); }} className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                                    <ChevronRightIcon className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                            ) : <div className="w-5 h-5" />}
                        </div>
                        <ItemIcon item={item} />
                        {editingId === item.id ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                className="min-w-0 flex-1 bg-transparent border-b border-blue-600 focus:outline-none text-sm text-gray-800 dark:text-zinc-200"
                            />
                        ) : (
                            <span
                                onDoubleClick={() => handleStartEdit(item)}
                                className="min-w-0 flex-1 truncate select-none text-sm text-gray-800 dark:text-gray-200"
                                title={item.name}
                            >
                                {item.name}
                            </span>
                        )}
                        <div className="ml-1 flex flex-shrink-0 items-center">
                            <button onClick={(e) => { e.stopPropagation(); item.itemType === 'rect' ? onDeleteRect(item.id) : onDeletePin(item.id); }} className={`p-1 rounded-full hover:bg-red-500 hover:text-white text-gray-500 dark:text-gray-400 ${MENUS_MODE ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'} transition-opacity`}>
                                <TrashIcon className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onToggleLock(item.id, item.itemType); }} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 ${item.locked ? 'opacity-100' : MENUS_MODE ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'} transition-opacity`}>
                                {item.locked ? <LockClosedIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <LockOpenIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); item.itemType === 'rect' ? onToggleRectVisibility(item.id) : onTogglePinVisibility(item.id); }} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 ${MENUS_MODE ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'} transition-opacity`}>
                                {item.visible ? <EyeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <EyeSlashIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                            </button>
                        </div>
                    </div>
                    {/* Row 2: measurement chips — aligned with name text */}
                    {editingId !== item.id && renderMeasurementSummary(item)}
                </li>
                {isExpanded && hasChildren && item.itemType === 'rect' && (
                    <ul className="pl-8 bg-gray-100/50 dark:bg-gray-900/20">
                        {item.rfi?.map((rfi: RfiData) => (
                            <li key={`rfi-${rfi.id}`} onClick={() => onOpenRfiPanel(item.id, rfi.id)} className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/60">
                                <LinkedItemIcon type="rfi" />
                                <span className="text-sm truncate text-gray-700 dark:text-gray-300">RFI-{rfi.id}: {rfi.title}</span>
                            </li>
                        ))}
                        {item.submittals?.map((sub: SubmittalData) => (
                            <li key={sub.id} onClick={() => handleLinkClick('https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/document/submittals/package/FMVmW4xEe9bcHUTp/registries/Xh6FHaQZ9Dyv6V3i/?tab=response')} className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/60">
                                <LinkedItemIcon type="submittal" />
                                <span className="text-sm truncate text-gray-700 dark:text-gray-300">{sub.id}: {sub.title}</span>
                            </li>
                        ))}
                        {item.punches?.map((punch: PunchData) => (
                            <li key={punch.id} onClick={() => handleLinkClick('https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/quality/punchList/H7SakWBed794KRdU/details?tab=details')} className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/60">
                                <LinkedItemIcon type="punch" />
                                <span className="text-sm truncate text-gray-700 dark:text-gray-300">{punch.id}: {punch.title}</span>
                            </li>
                        ))}
                        {item.drawings?.map((drawing: DrawingData) => (
                            <li key={drawing.id} onClick={() => handleLinkClick('https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/document/newPlans/markup/A-3.2/AHV6vNEm20250627115709/latest')} className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/60">
                                <LinkedItemIcon type="drawing" />
                                <span className="text-sm truncate text-gray-700 dark:text-gray-300">{drawing.id}: {drawing.title}</span>
                            </li>
                        ))}
                        {item.photos?.map((photo: PhotoData) => (
                            <li key={photo.id} onClick={() => onOpenPhotoViewer(photo.id)} className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/60">
                                <LinkedItemIcon type="photo" />
                                <span className="text-sm truncate text-gray-700 dark:text-gray-300">{photo.id}: {photo.title}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </React.Fragment>
        );
    };

    return (
        <div 
            ref={panelRef}
            className={`relative h-full flex-shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-all duration-200 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ width: isOpen ? `${panelWidth}px` : '0px', visibility: isOpen ? 'visible' : 'hidden' }}
        >
            <div className={`h-full w-full flex flex-col transition-opacity duration-150 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="linarc-panel-header">
                    <h2 className="linarc-panel-title">Layers</h2>
                    <Tooltip text="Close" position="left">
                        <button
                            type="button"
                            onClick={onClose}
                            className="linarc-panel-close"
                            aria-label="Close layers panel"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                </div>
                {compareDrawings && (
                    <div className="border-b border-gray-200 dark:border-zinc-800 px-3 py-2.5">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Comparing</p>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-50 dark:hover:bg-zinc-800/60">
                                <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-zinc-200" title={compareDrawings.left.label}>{compareDrawings.left.label}</span>
                                <button
                                    type="button"
                                    onClick={compareDrawings.left.onToggle}
                                    className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                                    title={compareDrawings.left.visible ? 'Hide drawing 1' : 'Show drawing 1'}
                                >
                                    {compareDrawings.left.visible ? <EyeIcon className="h-3.5 w-3.5" /> : <EyeSlashIcon className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-50 dark:hover:bg-zinc-800/60">
                                <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-zinc-200" title={compareDrawings.right.label}>{compareDrawings.right.label}</span>
                                <button
                                    type="button"
                                    onClick={compareDrawings.right.onToggle}
                                    className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                                    title={compareDrawings.right.visible ? 'Hide drawing 2' : 'Show drawing 2'}
                                >
                                    {compareDrawings.right.visible ? <EyeIcon className="h-3.5 w-3.5" /> : <EyeSlashIcon className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Alignment controls */}
                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-zinc-800">
                            {compareDrawings.alignment.status === 'idle' && (
                                <button
                                    type="button"
                                    onClick={compareDrawings.alignment.onAlignSheets}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h12M8 2v12" strokeLinecap="round"/><circle cx="8" cy="8" r="3"/></svg>
                                    Align Sheets
                                </button>
                            )}
                            {compareDrawings.alignment.status === 'aligning' && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-snug">Drag on the canvas to align. Black lines = match.</p>
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={compareDrawings.alignment.onCancelAlign}
                                            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={compareDrawings.alignment.onConfirmAlign}
                                            className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                            {compareDrawings.alignment.status === 'aligned' && (
                                <button
                                    type="button"
                                    onClick={compareDrawings.alignment.onResetAlignment}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
                                >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h3M11 8h3M8 2v3M8 11v3" strokeLinecap="round"/><circle cx="8" cy="8" r="2.5"/></svg>
                                    Reset Alignment
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {drawingScale != null && (
                    <div className="flex items-start justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-zinc-800">
                        <div className="min-w-0 flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Takeoff</span>
                            {onRecalibrateDrawingScale && (
                                <button
                                    type="button"
                                    onClick={() => onRecalibrateDrawingScale()}
                                    className="w-fit text-left text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Recalibrate Scale
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowTakeoff(v => !v)}
                            className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${showTakeoff ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'}`}
                            role="switch"
                            aria-checked={showTakeoff}
                            aria-label="Toggle takeoff measurements"
                        >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${showTakeoff ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                )}
                {!compareDrawings && (
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {layerItems.length > 0 ? (
                        <div className="flex flex-col">
                            {sortedGroupKeys.map(key => {
                                const items = groupedItems[key];
                                if (items.length === 0 && key === 'current') return null;
                                if (items.length === 0) return null;

                                const title = key === 'current' ? 'Current Draft' : (markupSetNames[key] || 'Unknown Set');
                                const areAllVisible = items.every(i => i.visible);

                                return (
                                    <div key={key}>
                                        <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 flex justify-between items-center group/header">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
                                            <button
                                                onClick={() => onToggleBatchVisibility(items.map(i => ({ id: i.id, type: i.itemType === 'rect' ? 'rect' : 'pin' })), !areAllVisible)}
                                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none opacity-0 group-hover/header:opacity-100 transition-opacity"
                                                title={areAllVisible ? "Hide All" : "Show All"}
                                            >
                                                {areAllVisible ? <EyeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <EyeSlashIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                                            </button>
                                        </div>
                                        <ul>
                                            {items.map(renderItem)}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700 dark:text-zinc-300">No layers yet</p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">Markups and pins you add to the canvas will appear here.</p>
                            </div>
                        </div>
                    )}
                </div>
                )}
            </div>

            {isOpen && (
                <div 
                    onMouseDown={handleResizeMouseDown}
                    className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400/50 dark:hover:bg-blue-500/40 transition-colors duration-200 z-20"
                />
            )}
        </div>
    );
};
export default LayersPanel;
