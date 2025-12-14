

// Fix: Import 'useCallback' from 'react' to resolve 'Cannot find name' errors.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Rectangle, Pin, ViewTransform, InteractionState, HoveredItemInfo, ResizeHandle } from '../types';
import { RectangleTagType, ToolbarPosition, ImageGeom } from '../App';
import { UploadIcon, TrashIcon, LinkIcon, ArrowUpTrayIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowsPointingOutIcon, SunIcon, MoonIcon, SafetyPinIcon, PunchPinIcon, PhotoPinIcon, InformationCircleIcon, FilterIcon, CogIcon } from './Icons';
import Toolbar from './Toolbar';

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
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    handleZoom: (direction: 'in' | 'out' | 'reset') => void;
    handleThemeToggle: () => void;
    setHoveredRectId: (id: string | null) => void;
    setActiveTool: (tool: ActiveTool) => void;
    activeShape: ActiveShape;
    setActiveShape: (shape: ActiveShape) => void;
    activePinType: ActivePinType;
    setActivePinType: (pinType: ActivePinType) => void;
    activeColor: ActiveColor;
    setActiveColor: (color: ActiveColor) => void;
    setDraggingPinId: (id: string | null) => void;
    setSelectedPinId: (id: string | null) => void;
    handlePinDetails: (pin: Pin) => void;
    handleDeletePin: (pinId: string) => void;
    setHoveredItem: (item: HoveredItemInfo | null) => void;
    hidePopupTimer: React.MutableRefObject<number | null>;
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
}

const CanvasView: React.FC<CanvasViewProps> = (props) => {
    const {
        imageSrc, rectangles, pins, filters, viewTransform, interaction, activeTool, hoveredRectId, draggingPinId,
        selectedRectIds, selectedPinId, currentRect, marqueeRect, isMenuVisible, linkMenuRectId, openLinkSubmenu,
        theme, toolbarPosition, setToolbarPosition, isSpacebarDown, imageContainerRef, imageGeom, onImageGeomChange,
        handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel, handleZoom, handleThemeToggle, 
        setHoveredRectId, setActiveTool, activeShape, setActiveShape, activePinType, setActivePinType, activeColor, 
        setActiveColor, setDraggingPinId, setSelectedPinId, handlePinDetails, handleDeletePin, setHoveredItem, 
        hidePopupTimer, handleResizeStart, handlePublishRect, handleLinkRect, onDeleteSelection, setOpenLinkSubmenu,
        handleSubmenuLink, onOpenRfiPanel, onOpenPhotoViewer, mouseDownRef, setSelectedRectIds, getRelativeCoords, setPinDragOffset
    } = props;

    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setNaturalSize({
            width: e.currentTarget.naturalWidth,
            height: e.currentTarget.naturalHeight
        });
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
        className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${toolbarPosition === position ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
      >
        {label}
      </button>
    );

    return (
        <div className="w-full h-full flex flex-col">
            <div className="relative w-full flex-grow">
                <div
                    ref={imageContainerRef}
                    className={`relative w-full h-full overflow-hidden rounded-lg select-none bg-gray-200 dark:bg-gray-900/50 ${getCursorClass()}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                >
                    <div className="absolute top-0 left-0" style={{ transform: `translate(${viewTransform.translateX}px, ${viewTransform.translateY}px) scale(${viewTransform.scale})`, transformOrigin: '0 0', width: `${containerSize.width}px`, height: `${containerSize.height}px` }}>
                         <img ref={imageRef} src={imageSrc} alt="Blueprint" className="w-full h-full object-contain pointer-events-none" onLoad={handleImageLoad} style={{ position: 'absolute', top: 0, left: 0 }} />
                        {rectangles.filter(r => r.visible).map((rect) => {
                            const normalized = normalizeRect(rect);
                            const isSelected = selectedRectIds.includes(rect.id);
                            const strokeColor = isSelected ? '#f87171' : '#ef4444';
                            const shapeProps = { stroke: strokeColor, strokeWidth: 2 / viewTransform.scale, fill: "rgba(0,0,0,0.05)", vectorEffect: "non-scaling-stroke" };
                            const cloudFillColor = isSelected ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)';

                            const pixelWidth = (normalized.width / 100) * imageGeom.width;
                            const pixelHeight = (normalized.height / 100) * imageGeom.height;
                            
                            const left = (normalized.x / 100) * imageGeom.width + imageGeom.x;
                            const top = (normalized.y / 100) * imageGeom.height + imageGeom.y;

                            return (
                                <div key={rect.id} className="absolute" style={{ left: `${left}px`, top: `${top}px`, width: `${pixelWidth}px`, height: `${pixelHeight}px`, pointerEvents: 'none' }}>
                                    {rect.shape === 'box' && (<div className={`w-full h-full ${isSelected ? 'border-2 border-red-400' : 'border-2 border-red-500'} bg-black/5 dark:bg-white/5`} style={{borderWidth: `${2 / viewTransform.scale}px`}} />)}
                                    {(rect.shape === 'ellipse' || rect.shape === 'cloud') && (
                                        <svg width="100%" height="100%" viewBox={`0 0 ${pixelWidth} ${pixelHeight}`} preserveAspectRatio="none" className="overflow-visible">
                                            {rect.shape === 'ellipse' && (<ellipse cx={pixelWidth / 2} cy={pixelHeight / 2} rx={pixelWidth / 2} ry={pixelHeight / 2} {...shapeProps} />)}
                                            {rect.shape === 'cloud' && (<path d={generateCloudPath(pixelWidth, pixelHeight)} {...shapeProps} fill={cloudFillColor} />)}
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Screen-space Overlays */}
                    {pins.filter(pin => pin.visible && filters[pin.type as FilterCategory]).map(pin => {
                      const screenPos = getScreenPoint(pin.x, pin.y);
                      if (!screenPos) return null;
                      const PinIcon = { photo: PhotoPinIcon, safety: SafetyPinIcon, punch: PunchPinIcon }[pin.type];
                      const pinCursor = activeTool === 'select' ? (draggingPinId === pin.id ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer';
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
                                  if (activeTool === 'select') {
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
                                  
                                  if (activeTool !== 'select' && isClick) {
                                       handlePinDetails(pin); 
                                  }
                              }}
                              onMouseEnter={(e) => {
                                  if (draggingPinId || selectedPinId) return;
                                  if (hidePopupTimer.current) clearTimeout(hidePopupTimer.current);
                                  const pinRect = e.currentTarget.getBoundingClientRect();
                                  setHoveredItem({ type: 'pin', pin: pin, itemId: pin.id, position: { top: pinRect.top + pinRect.height / 2, left: pinRect.right } });
                              }}
                              onMouseLeave={() => { hidePopupTimer.current = window.setTimeout(() => setHoveredItem(null), 300); }}
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
                                <button onClick={(e) => selectedRectangle && handlePublishRect(e, selectedRectangle.id)} title="Publish" className="p-2 rounded-md hover:bg-gray-700 transition-colors"><ArrowUpTrayIcon className="w-5 h-5" /></button>
                                <div className="relative">
                                    <button onClick={(e) => selectedRectangle && handleLinkRect(e, selectedRectangle.id)} title="Link" className={`p-2 rounded-md transition-colors ${linkMenuRectId === selectedRectangle?.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-700'}`}><LinkIcon className="w-5 h-5" /></button>
                                    {linkMenuRectId === selectedRectangle?.id && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max" onMouseLeave={() => setOpenLinkSubmenu(null)}>
                                        <div className="flex flex-col gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-sm">
                                            <div className="relative" onMouseEnter={() => setOpenLinkSubmenu('rfi')}>
                                                <div className="flex justify-between items-center px-3 py-1.5 text-white rounded-md hover:bg-blue-500 transition-colors text-left cursor-default">
                                                    <span>RFI</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 ml-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                                </div>
                                                {openLinkSubmenu === 'rfi' && (
                                                    <div className="absolute left-full top-0 ml-1 flex flex-col gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-sm w-max">
                                                        <button onClick={(e) => selectedRectangle && handleSubmenuLink(e, 'New RFI', selectedRectangle.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-500 transition-colors text-left whitespace-nowrap">New RFI</button>
                                                        <button onClick={(e) => selectedRectangle && handleSubmenuLink(e, 'Link RFI', selectedRectangle.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-500 transition-colors text-left whitespace-nowrap">Link RFI</button>
                                                    </div>
                                                )}
                                            </div>
                                            {['Link Submittal', 'Link Punch', 'Link Drawing', 'Link Photo'].map(type => (<button key={type} onClick={(e) => selectedRectangle && handleSubmenuLink(e, type, selectedRectangle.id)} className="px-3 py-1.5 text-white rounded-md hover:bg-blue-500 transition-colors text-left">{type.replace('Link ','')}</button>))}
                                        </div>
                                    </div>
                                    )}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSelection(); }} title="Delete" className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                      </>
                    )}

                    {isMultiSelection && multiSelectionScreenRect && (
                        <div data-interactive-ui="true" className="absolute flex items-center" style={{ left: `${multiSelectionScreenRect.left + multiSelectionScreenRect.width / 2}px`, top: `${multiSelectionScreenRect.top}px`, transform: 'translate(-50%, -100%) translateY(-10px)', pointerEvents: 'auto', zIndex: 30 }}>
                            <div className="flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSelection(); }} title="Delete Selected" className="p-2 rounded-md hover:bg-red-500 hover:text-white transition-colors"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}
                    
                    {currentRect && (() => {
                        const normalized = normalizeRect(currentRect);
                        const screenRect = getScreenRect(normalized);
                        if (normalized.shape === 'box') {
                            return <div className="absolute border-2 border-dashed border-red-400 bg-red-400/20 pointer-events-none" style={screenRect} />;
                        }
                        const svgProps = { stroke: '#f87171', strokeWidth: 2 / viewTransform.scale, fill: "rgba(248, 113, 113, 0.2)", strokeDasharray: `${6 / viewTransform.scale},${4 / viewTransform.scale}`, vectorEffect: "non-scaling-stroke" };
                        return (
                            <svg className="absolute pointer-events-none overflow-visible" style={{ left: screenRect.left, top: screenRect.top, width: screenRect.width, height: screenRect.height }}>
                                {normalized.shape === 'ellipse' && (<ellipse cx={screenRect.width / 2} cy={screenRect.height / 2} rx={screenRect.width / 2} ry={screenRect.height / 2} {...svgProps} />)}
                                {normalized.shape === 'cloud' && (<path d={generateCloudPath(screenRect.width, screenRect.height)} {...svgProps} />)}
                            </svg>
                        );
                    })()}

                    {marqueeScreenRect && (<div className="absolute border-2 border-dashed border-blue-400 bg-blue-400/20 pointer-events-none" style={marqueeScreenRect} />)}

                    {/* Item Tags */}
                    {rectangles.filter(r => r.visible).map(rect => {
                        const screenRect = getScreenRect(rect);
                        if (!screenRect) return null;
                        let tagCount = 0;
                        const renderTag = (type: RectangleTagType, item: any, text: string) => {
                            if (!filters[type]) return null;
                            const tagColorClasses = { rfi: 'bg-cyan-600/85 hover:bg-cyan-500/85', submittal: 'bg-green-600/85 hover:bg-green-500/85', punch: 'bg-orange-600/85 hover:bg-orange-500/85', drawing: 'bg-indigo-600/85 hover:bg-indigo-500/85', photo: 'bg-blue-600/85 hover:bg-blue-500/85' };
                            const positionIndex = tagCount++;
                            return (
                                <div
                                    key={`${type}-tag-${rect.id}-${item.id}`}
                                    className={`absolute text-white text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-md cursor-pointer transition-colors ${tagColorClasses[type]}`}
                                    style={{ left: `${screenRect.left + screenRect.width + 5}px`, top: `${screenRect.top + positionIndex * 24}px`, pointerEvents: 'auto', zIndex: 25 }}
                                    onClick={(e) => { e.stopPropagation(); if(type === 'rfi') onOpenRfiPanel(rect.id, item.id); if(type === 'photo') { onOpenPhotoViewer({ rectId: rect.id, photoId: item.id }); } }}
                                    onMouseEnter={(e) => { if (hidePopupTimer.current) clearTimeout(hidePopupTimer.current); const tagRect = e.currentTarget.getBoundingClientRect(); setHoveredItem({ type: type, rectId: rect.id, itemId: item.id, position: { top: tagRect.top + tagRect.height / 2, left: tagRect.right } }); }}
                                    onMouseLeave={() => { hidePopupTimer.current = window.setTimeout(() => setHoveredItem(null), 300); }}
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

                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-gray-800 dark:text-white">
                        <button onClick={() => handleZoom('in')} title="Zoom In" className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><MagnifyingGlassPlusIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleZoom('out')} title="Zoom Out" className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><MagnifyingGlassMinusIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleZoom('reset')} title="Reset View" className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ArrowsPointingOutIcon className="w-5 h-5"/></button>
                    </div>
                    
                    <div data-interactive-ui="true" ref={settingsMenuRef} className="absolute bottom-4 left-4 flex flex-col items-start gap-2">
                        {isSettingsMenuOpen && (
                            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2 rounded-lg shadow-lg mb-1 w-40">
                               <h4 className="font-semibold text-sm px-2 pb-1.5 mb-1 border-b border-gray-300 dark:border-gray-600">Toolbar Position</h4>
                               <div className="flex flex-col gap-1">
                                   <ToolbarPositionButton position="bottom" label="Footer" />
                                   <ToolbarPositionButton position="top" label="Top" />
                                   <ToolbarPositionButton position="left" label="Left" />
                                   <ToolbarPositionButton position="right" label="Right" />
                               </div>
                            </div>
                        )}
                        <div className="flex gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg">
                            <button onClick={handleThemeToggle} className="p-2 rounded-md transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                                {theme === 'dark' ? (<SunIcon className="w-5 h-5" />) : (<MoonIcon className="w-5 h-5" />)}
                            </button>
                            <button onClick={() => setIsSettingsMenuOpen(p => !p)} className="p-2 rounded-md transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white" title="Settings">
                                <CogIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className={`absolute z-20 ${getToolbarPositionClasses()}`}>
                         <Toolbar 
                             activeTool={activeTool} 
                             setActiveTool={setActiveTool} 
                             activeShape={activeShape} 
                             setActiveShape={setActiveShape} 
                             activePinType={activePinType} 
                             setActivePinType={setActivePinType} 
                             activeColor={activeColor} 
                             setActiveColor={setActiveColor}
                             toolbarPosition={toolbarPosition}
                         />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanvasView;