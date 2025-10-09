
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Rectangle, Pin, RfiData, SubmittalData, PunchData, DrawingData, PhotoData } from '../types';
import { ChevronDoubleLeftIcon, EyeIcon, EyeSlashIcon, TrashIcon, CloudIcon, BoxIcon, EllipseIcon, PhotoPinIcon, SafetyPinIcon, PunchPinIcon, ChevronRightIcon, DocumentDuplicateIcon, ClipboardListIcon, PhotoIcon } from './Icons';

type LayerItem = (Rectangle & { itemType: 'rect' }) | (Pin & { itemType: 'pin' });

interface LayersPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    rectangles: Rectangle[];
    pins: Pin[];
    selectedRectIds: string[];
    selectedPinId: string | null;
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
}

const ItemIcon = ({ item }: { item: LayerItem }) => {
    const iconClass = "w-5 h-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0";
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

const LayersPanel: React.FC<LayersPanelProps> = ({ 
    isOpen, onToggle, rectangles, pins, selectedRectIds, selectedPinId, 
    onSelectRect, onSelectPin, onRenameRect, onRenamePin, onDeleteRect, onDeletePin,
    onToggleRectVisibility, onTogglePinVisibility, onOpenRfiPanel, onOpenPhotoViewer
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Resizing logic
    const [panelWidth, setPanelWidth] = useState(320);
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
    ].sort((a, b) => {
        const aTime = parseInt(a.id.replace(/[^0-9]/g, ''));
        const bTime = parseInt(b.id.replace(/[^0-9]/g, ''));
        return bTime - aTime;
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
    
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(expandedId => expandedId !== id) : [...prev, id]);
    };

    return (
        <div 
            ref={panelRef}
            className={`relative h-full bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700/50 transition-all duration-300 ease-in-out flex-shrink-0 ${isOpen ? 'shadow-lg' : ''}`}
            style={{ width: isOpen ? `${panelWidth}px` : '0px' }}
        >
            <div className={`h-full w-full flex flex-col transition-opacity duration-200 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Layers</h2>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {layerItems.length > 0 ? (
                        <ul>
                            {layerItems.map(item => {
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
                                            className={`flex items-center px-3 py-2 cursor-pointer group transition-colors ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                                        >
                                            <div className="w-5 flex items-center justify-center mr-2 flex-shrink-0">
                                            {hasChildren ? (
                                                <button onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }} className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                                    <ChevronRightIcon className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </button>
                                            ) : <div className="w-3 h-3" />}
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
                                                    className="flex-grow bg-transparent border-b border-blue-500 focus:outline-none text-gray-800 dark:text-gray-200"
                                                />
                                            ) : (
                                                <span 
                                                    onDoubleClick={() => handleStartEdit(item)} 
                                                    className="flex-grow truncate select-none text-gray-800 dark:text-gray-200"
                                                    title={item.name}
                                                >
                                                    {item.name}
                                                </span>
                                            )}

                                            <div className="flex items-center ml-2">
                                                <button onClick={(e) => { e.stopPropagation(); item.itemType === 'rect' ? onToggleRectVisibility(item.id) : onTogglePinVisibility(item.id); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                                    {item.visible ? <EyeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <EyeSlashIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); item.itemType === 'rect' ? onDeleteRect(item.id) : onDeletePin(item.id); }} className="p-1 rounded-full hover:bg-red-500 hover:text-white text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </li>
                                        {isExpanded && hasChildren && item.itemType === 'rect' && (
                                            <ul className="pl-10 bg-gray-100/50 dark:bg-gray-900/20">
                                                {item.rfi?.map((rfi: RfiData) => (
                                                    <li key={`rfi-${rfi.id}`} onClick={() => onOpenRfiPanel(item.id, rfi.id)} className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/60">
                                                        <LinkedItemIcon type="rfi" />
                                                        <span className="text-sm truncate text-gray-700 dark:text-gray-300">RFI-{rfi.id}: {rfi.title}</span>
                                                    </li>
                                                ))}
                                                {item.submittals?.map((sub: SubmittalData) => (
                                                    <li key={sub.id} className="flex items-center px-4 py-2 cursor-not-allowed">
                                                        <LinkedItemIcon type="submittal" />
                                                        <span className="text-sm truncate text-gray-700 dark:text-gray-300">{sub.id}: {sub.title}</span>
                                                    </li>
                                                ))}
                                                {item.punches?.map((punch: PunchData) => (
                                                    <li key={punch.id} className="flex items-center px-4 py-2 cursor-not-allowed">
                                                        <LinkedItemIcon type="punch" />
                                                        <span className="text-sm truncate text-gray-700 dark:text-gray-300">{punch.id}: {punch.title}</span>
                                                    </li>
                                                ))}
                                                {item.drawings?.map((drawing: DrawingData) => (
                                                    <li key={drawing.id} className="flex items-center px-4 py-2 cursor-not-allowed">
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
                            })}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No markups yet. Use the toolbar to create one.
                        </div>
                    )}
                </div>
            </div>

            {isOpen && (
                <div 
                    onMouseDown={handleResizeMouseDown}
                    className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400/50 dark:hover:bg-blue-500/50 transition-colors duration-200 z-20"
                />
            )}

            <button 
                onClick={onToggle} 
                className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-8 h-16 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-r-lg flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors z-10"
                title={isOpen ? 'Collapse Panel' : 'Expand Panel'}
            >
                <ChevronDoubleLeftIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
            </button>
        </div>
    );
};
export default LayersPanel;