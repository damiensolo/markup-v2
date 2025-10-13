import React, { useState, useRef, useEffect } from 'react';
import type { PhotoData, PhotoMarkup, PhotoMarkupShapeType, ShapePhotoMarkup, PenPhotoMarkup, ArrowPhotoMarkup, TextPhotoMarkup } from '../types';
import { XMarkIcon, BoxIcon, EllipseIcon, CloudIcon, PenIcon, ArrowIcon, TextIcon } from './Icons';

interface PhotoViewerModalProps {
    isOpen: boolean;
    photoData: PhotoData | null;
    onClose: () => void;
    onUpdateMarkups: (newMarkups: PhotoMarkup[]) => void;
}

type MarkupTool = 'shape' | 'pen' | 'arrow' | 'text';

const ToolButton: React.FC<{label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void;}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`p-2.5 rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-500 text-white' : 'text-white hover:bg-gray-700'}`}
        title={label}
    >
        <div className="w-5 h-5">{icon}</div>
    </button>
);

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ isOpen, photoData, onClose, onUpdateMarkups }) => {
    const [markups, setMarkups] = useState<PhotoMarkup[]>([]);
    const [currentMarkup, setCurrentMarkup] = useState<PhotoMarkup | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const photoContainerRef = useRef<HTMLDivElement>(null);

    const [activeTool, setActiveTool] = useState<MarkupTool>('shape');
    const [activeShape, setActiveShape] = useState<PhotoMarkupShapeType>('box');
    const [isShapeMenuOpen, setShapeMenuOpen] = useState(false);
    const shapeMenuRef = useRef<HTMLDivElement>(null);

    const [isTexting, setIsTexting] = useState(false);
    const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        if (photoData) {
            const migratedMarkups = (photoData.markups || []).map(m => {
                if ('type' in m) {
                    return m;
                }
                const oldMarkup = m as any;
                return {
                    id: oldMarkup.id,
                    type: 'shape',
                    shape: 'box',
                    x: oldMarkup.x,
                    y: oldMarkup.y,
                    width: oldMarkup.width,
                    height: oldMarkup.height
                } as ShapePhotoMarkup;
            });
            setMarkups(migratedMarkups);
        }
        setActiveTool('shape');
        setActiveShape('box');
        setCurrentMarkup(null);
        setIsDrawing(false);
    }, [photoData]);

    useEffect(() => {
      if (isTexting && textInputRef.current) {
        textInputRef.current.focus();
      }
    }, [isTexting]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shapeMenuRef.current && !shapeMenuRef.current.contains(event.target as Node)) {
                setShapeMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen || !photoData) return null;
    
    const getRelativeCoords = (event: React.MouseEvent): { x: number; y: number } | null => {
        if (!photoContainerRef.current) return null;
        const rect = photoContainerRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    };

    const normalizeShapeMarkup = (markup: ShapePhotoMarkup | (Omit<ShapePhotoMarkup, 'id'> & {id?: string})): ShapePhotoMarkup => {
        const newMarkup = { ...markup, id: markup.id || '' };
        if (newMarkup.width < 0) {
            newMarkup.x = newMarkup.x + newMarkup.width;
            newMarkup.width = Math.abs(newMarkup.width);
        }
        if (newMarkup.height < 0) {
            newMarkup.y = newMarkup.y + newMarkup.height;
            newMarkup.height = Math.abs(newMarkup.height);
        }
        return newMarkup;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0 || isTexting) return;
        const coords = getRelativeCoords(e);
        if (!coords) return;
        setIsDrawing(true);
        setStartPoint(coords);

        switch(activeTool) {
            case 'shape':
                setCurrentMarkup({ id: 'current', type: 'shape', shape: activeShape, x: coords.x, y: coords.y, width: 0, height: 0 });
                break;
            case 'pen':
                setCurrentMarkup({ id: 'current', type: 'pen', points: [coords] });
                break;
            case 'arrow':
                setCurrentMarkup({ id: 'current', type: 'arrow', start: coords, end: coords });
                break;
            case 'text':
                setIsDrawing(false);
                setTextPosition(coords);
                setIsTexting(true);
                break;
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !startPoint || !currentMarkup) return;
        const coords = getRelativeCoords(e);
        if (!coords) return;
        
        switch(currentMarkup.type) {
            case 'shape':
                setCurrentMarkup({ ...currentMarkup, width: coords.x - startPoint.x, height: coords.y - startPoint.y, });
                break;
            case 'pen':
                setCurrentMarkup({ ...currentMarkup, points: [...currentMarkup.points, coords] });
                break;
            case 'arrow':
                setCurrentMarkup({ ...currentMarkup, end: coords });
                break;
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentMarkup) return setIsDrawing(false);

        let newMarkup: PhotoMarkup | null = null;
        switch(currentMarkup.type) {
            case 'shape':
                const normalized = normalizeShapeMarkup(currentMarkup);
                if (normalized.width > 0.5 && normalized.height > 0.5) newMarkup = { ...normalized, id: Date.now().toString() };
                break;
            case 'pen':
                if (currentMarkup.points.length > 1) newMarkup = { ...currentMarkup, id: Date.now().toString() };
                break;
            case 'arrow':
                if (Math.hypot(currentMarkup.end.x - currentMarkup.start.x, currentMarkup.end.y - currentMarkup.start.y) > 0.5) newMarkup = { ...currentMarkup, id: Date.now().toString() };
                break;
        }

        if (newMarkup) {
            const newMarkups = [...markups, newMarkup];
            setMarkups(newMarkups);
            onUpdateMarkups(newMarkups);
        }
        
        setIsDrawing(false);
        setCurrentMarkup(null);
        setStartPoint(null);
    };
    
    const handleDeleteMarkup = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newMarkups = markups.filter(m => m.id !== id);
        setMarkups(newMarkups);
        onUpdateMarkups(newMarkups);
    };

    const handleTextSubmit = (text: string) => {
        if (text.trim() && textPosition) {
            const newMarkup: TextPhotoMarkup = { id: Date.now().toString(), type: 'text', text: text.trim(), x: textPosition.x, y: textPosition.y };
            const newMarkups = [...markups, newMarkup];
            setMarkups(newMarkups);
            onUpdateMarkups(newMarkups);
        }
        setIsTexting(false);
        setTextPosition(null);
    };

    const generateCloudPath = (w: number, h: number) => {
        if (w <= 0 || h <= 0) return '';
        const r = Math.max(4, Math.min(w / 4, h / 4, 12));
        let path = `M ${r},0`;
        const topScallops = Math.max(1, Math.round((w - 2 * r) / (r * 1.5)));
        const topStep = (w - 2 * r) / topScallops;
        for (let i = 0; i < topScallops; i++) path += ` a ${topStep / 2},${r} 0 0,1 ${topStep},0`;
        path += ` a ${r},${r} 0 0,1 ${r},${r}`;
        const rightScallops = Math.max(1, Math.round((h - 2 * r) / (r * 1.5)));
        const rightStep = (h - 2 * r) / rightScallops;
        for (let i = 0; i < rightScallops; i++) path += ` a ${r},${rightStep / 2} 0 0,1 0,${rightStep}`;
        path += ` a ${r},${r} 0 0,1 -${r},${r}`;
        const bottomScallops = Math.max(1, Math.round((w - 2 * r) / (r * 1.5)));
        const bottomStep = (w - 2 * r) / bottomScallops;
        for (let i = 0; i < bottomScallops; i++) path += ` a ${bottomStep / 2},${r} 0 0,1 -${bottomStep},0`;
        path += ` a ${r},${r} 0 0,1 -${r},-${r}`;
        const leftScallops = Math.max(1, Math.round((h - 2 * r) / (r * 1.5)));
        const leftStep = (h - 2 * r) / leftScallops;
        for (let i = 0; i < leftScallops; i++) path += ` a ${r},${leftStep / 2} 0 0,1 0,-${leftStep}`;
        path += ` a ${r},${r} 0 0,1 ${r},-${r}`;
        return path;
    };

    const shapeTools: { id: PhotoMarkupShapeType; label: string; icon: React.ReactNode }[] = [
        { id: 'box', label: 'Box', icon: <BoxIcon className="w-5 h-5" /> },
        { id: 'ellipse', label: 'Ellipse', icon: <EllipseIcon className="w-5 h-5" /> },
        { id: 'cloud', label: 'Cloud', icon: <CloudIcon className="w-5 h-5" /> },
    ];
    const currentShapeTool = shapeTools.find(s => s.id === activeShape) || shapeTools[0];

    const getCursorClass = () => {
        if (isTexting) return 'cursor-text';
        if (activeTool === 'text') return 'cursor-text';
        return 'cursor-crosshair';
    }

    return (
        <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl flex flex-col relative" 
                onClick={e => e.stopPropagation()}
                style={{height: '90vh'}}
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{photoData.title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <div className="flex-grow p-4 overflow-hidden flex items-center justify-center relative">
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                        <div ref={shapeMenuRef} className="relative">
                            <button
                                onClick={() => { setActiveTool('shape'); setShapeMenuOpen(p => !p); }}
                                className={`relative p-2.5 rounded-lg transition-colors duration-200 ${activeTool === 'shape' ? 'bg-blue-500 text-white' : 'text-white hover:bg-gray-700'}`}
                                title={currentShapeTool.label}
                            >
                                <div className="w-5 h-5">{currentShapeTool.icon}</div>
                                <div className="absolute bottom-1 right-1 pointer-events-none">
                                    <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300"><path d="M6 6L0 6L6 0Z" fill="currentColor" /></svg>
                                </div>
                            </button>
                            {isShapeMenuOpen && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg">
                                    {shapeTools.map(shape => (
                                        <button key={shape.id} onClick={() => { setActiveShape(shape.id); setShapeMenuOpen(false); }} title={shape.label} className={`p-2 rounded-lg transition-colors ${activeShape === shape.id ? 'bg-blue-500' : 'hover:bg-gray-700'}`}>{shape.icon}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <ToolButton label="Pen" icon={<PenIcon className="w-5 h-5"/>} isActive={activeTool === 'pen'} onClick={() => setActiveTool('pen')} />
                        <ToolButton label="Arrow" icon={<ArrowIcon className="w-5 h-5"/>} isActive={activeTool === 'arrow'} onClick={() => setActiveTool('arrow')} />
                        <ToolButton label="Text" icon={<TextIcon className="w-5 h-5"/>} isActive={activeTool === 'text'} onClick={() => setActiveTool('text')} />
                    </div>

                    <div
                        ref={photoContainerRef}
                        className={`relative w-full h-full ${getCursorClass()}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img src={photoData.url} alt={photoData.title} className="w-full h-full object-contain pointer-events-none select-none" />
                        
                        {markups.map(markup => {
                            let element = null;
                            switch(markup.type) {
                                case 'shape':
                                    const normalized = normalizeShapeMarkup(markup);
                                    const { x, y, width, height } = normalized;
                                    const pixelWidth = photoContainerRef.current ? (width / 100) * photoContainerRef.current.clientWidth : 0;
                                    const pixelHeight = photoContainerRef.current ? (height / 100) * photoContainerRef.current.clientHeight : 0;
                                    const shapeProps = { stroke: '#ef4444', strokeWidth: 2, fill: "rgba(239, 68, 68, 0.2)" };

                                    if (markup.shape === 'box') {
                                        element = <div className="w-full h-full border-2 border-red-500 bg-red-500/20" />;
                                    } else if (markup.shape === 'ellipse') {
                                        element = <svg width="100%" height="100%" viewBox={`0 0 ${pixelWidth} ${pixelHeight}`} preserveAspectRatio="none"><ellipse cx={pixelWidth / 2} cy={pixelHeight / 2} rx={pixelWidth / 2} ry={pixelHeight / 2} {...shapeProps} /></svg>;
                                    } else if (markup.shape === 'cloud') {
                                        element = <svg width="100%" height="100%" viewBox={`0 0 ${pixelWidth} ${pixelHeight}`} preserveAspectRatio="none"><path d={generateCloudPath(pixelWidth, pixelHeight)} {...shapeProps} /></svg>;
                                    }
                                    return <div key={markup.id} className="absolute group" style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` }}>
                                        {element}
                                        <button onClick={(e) => handleDeleteMarkup(e, markup.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><XMarkIcon className="w-4 h-4" /></button>
                                    </div>;
                                case 'pen':
                                case 'arrow':
                                    return null; // Handled in SVG overlay below
                                case 'text':
                                    return <div key={markup.id} className="absolute group" style={{ left: `${markup.x}%`, top: `${markup.y}%`, transform: 'translateY(-100%)' }}>
                                        <p className="text-red-500 whitespace-pre-wrap text-lg bg-white/50 dark:bg-black/50 px-1 rounded-sm">{markup.text}</p>
                                        <button onClick={(e) => handleDeleteMarkup(e, markup.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><XMarkIcon className="w-4 h-4" /></button>
                                    </div>
                            }
                        })}
                        
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <marker id="photoviewer-arrowhead" markerWidth="5" markerHeight="3.5" refX="5" refY="1.75" orient="auto" markerUnits="userSpaceOnUse">
                                    <polygon points="0 0, 5 1.75, 0 3.5" fill="#ef4444" />
                                </marker>
                            </defs>
                            {markups.map(m => {
                                if (m.type === 'pen') {
                                    const pathData = m.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                    return <path key={m.id} d={pathData} stroke="#ef4444" strokeWidth="0.3" fill="none" vectorEffect="non-scaling-stroke" />;
                                }
                                if (m.type === 'arrow') {
                                    return <line key={m.id} x1={m.start.x} y1={m.start.y} x2={m.end.x} y2={m.end.y} stroke="#ef4444" strokeWidth="0.3" markerEnd="url(#photoviewer-arrowhead)" vectorEffect="non-scaling-stroke" />;
                                }
                                return null;
                            })}
                        </svg>

                        {currentMarkup && (() => {
                            switch (currentMarkup.type) {
                                case 'shape':
                                    const normalized = normalizeShapeMarkup(currentMarkup);
                                    return <div className="absolute border-2 border-dashed border-red-400 bg-red-400/20 pointer-events-none" style={{ left: `${normalized.x}%`, top: `${normalized.y}%`, width: `${normalized.width}%`, height: `${normalized.height}%` }}/>
                                case 'pen':
                                    const pathData = currentMarkup.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                    return <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><path d={pathData} stroke="#ef4444" strokeWidth="0.3" fill="none" vectorEffect="non-scaling-stroke" /></svg>
                                case 'arrow':
                                    return <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1={currentMarkup.start.x} y1={currentMarkup.start.y} x2={currentMarkup.end.x} y2={currentMarkup.end.y} stroke="#ef4444" strokeWidth="0.3" markerEnd="url(#photoviewer-arrowhead)" vectorEffect="non-scaling-stroke" /></svg>
                            }
                        })()}

                        {isTexting && textPosition && (
                            <textarea
                                ref={textInputRef}
                                className="absolute z-20 bg-white dark:bg-gray-900 border border-dashed border-red-400 focus:outline-none p-1 text-red-500"
                                style={{ left: `${textPosition.x}%`, top: `${textPosition.y}%`, transform: 'translateY(-100%)', minWidth: '100px' }}
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
        </div>
    );
};

export default PhotoViewerModal;