import React, { useState, useRef, useEffect } from 'react';
import type { PhotoData, PhotoMarkup } from '../types';
import { XMarkIcon } from './Icons';

interface PhotoViewerModalProps {
    isOpen: boolean;
    photoData: PhotoData | null;
    onClose: () => void;
    onUpdateMarkups: (newMarkups: PhotoMarkup[]) => void;
}

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ isOpen, photoData, onClose, onUpdateMarkups }) => {
    const [markups, setMarkups] = useState<PhotoMarkup[]>([]);
    const [currentMarkup, setCurrentMarkup] = useState<Omit<PhotoMarkup, 'id'> | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const photoContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (photoData) {
            setMarkups(photoData.markups || []);
        }
    }, [photoData]);

    if (!isOpen || !photoData) return null;
    
    const getRelativeCoords = (event: React.MouseEvent): { x: number; y: number } | null => {
        if (!photoContainerRef.current) return null;
        const rect = photoContainerRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        return { x, y };
    };

    const normalizeMarkup = (markup: Omit<PhotoMarkup, 'id'>): Omit<PhotoMarkup, 'id'> => {
        const newMarkup = { ...markup };
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
        if (e.button !== 0) return;
        const coords = getRelativeCoords(e);
        if (!coords) return;
        setIsDrawing(true);
        setStartPoint(coords);
        setCurrentMarkup({ x: coords.x, y: coords.y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !startPoint) return;
        const coords = getRelativeCoords(e);
        if (!coords) return;
        setCurrentMarkup({
            x: startPoint.x,
            y: startPoint.y,
            width: coords.x - startPoint.x,
            height: coords.y - startPoint.y,
        });
    };

    const handleMouseUp = () => {
        if (!currentMarkup || !isDrawing) return;
        const normalized = normalizeMarkup(currentMarkup);
        if (normalized.width > 1 && normalized.height > 1) {
            const newMarkup = { ...normalized, id: Date.now().toString() };
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

    return (
        <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col relative" 
                onClick={e => e.stopPropagation()}
                style={{height: '90vh'}}
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{photoData.title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <div className="flex-grow p-4 overflow-hidden flex items-center justify-center">
                    <div
                        ref={photoContainerRef}
                        className="relative w-full h-full cursor-crosshair"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        <img src={photoData.url} alt={photoData.title} className="w-full h-full object-contain pointer-events-none select-none" />
                        
                        {markups.map(markup => (
                             <div 
                                key={markup.id} 
                                className="absolute border-2 border-red-500 bg-red-500/20 group"
                                style={{
                                    left: `${markup.x}%`,
                                    top: `${markup.y}%`,
                                    width: `${markup.width}%`,
                                    height: `${markup.height}%`,
                                }}
                             >
                                <button 
                                    onClick={(e) => handleDeleteMarkup(e, markup.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                             </div>
                        ))}

                        {currentMarkup && (
                            <div 
                                className="absolute border-2 border-dashed border-red-400 bg-red-400/20 pointer-events-none"
                                style={{
                                    left: `${normalizeMarkup(currentMarkup).x}%`,
                                    top: `${normalizeMarkup(currentMarkup).y}%`,
                                    width: `${normalizeMarkup(currentMarkup).width}%`,
                                    height: `${normalizeMarkup(currentMarkup).height}%`,
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
