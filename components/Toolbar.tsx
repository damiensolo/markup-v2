

import React, { useState, useRef, useEffect } from 'react';
import { MENUS_MODE } from '../utils/showcaseMode';
import {
  MousePointerIcon, PenIcon, BoxIcon, ArrowIcon, TextIcon,
  CloudIcon, EllipseIcon, PhotoPinIcon, SafetyPinIcon, PunchPinIcon,
  ImageIcon, LocationIcon, MeasurementIcon, HighlighterIcon,
  CustomPinIcon,
} from './Icons';
import { ToolbarPosition } from '../App';
import Tooltip from './Tooltip';

type ActiveTool = 'select' | 'shape' | 'pen' | 'line' | 'arrow' | 'freeline' | 'text' | 'pin' | 'image' | 'location' | 'measurement' | 'polygon' | 'highlighter' | 'customPin' | 'fill' | 'stroke';
type ActiveLineTool = 'line' | 'arrow' | 'freeline';
type ActiveShape = 'cloud' | 'box' | 'ellipse';
type ActivePinType = 'photo' | 'safety' | 'punch';

interface ToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  activeLineTool: ActiveLineTool;
  setActiveLineTool: (tool: ActiveLineTool) => void;
  activeShape: ActiveShape;
  setActiveShape: (shape: ActiveShape) => void;
  activePinType: ActivePinType;
  setActivePinType: (pinType: ActivePinType) => void;
  markupFillColor: string;
  markupStrokeColor: string;
  markupColorPanelOpen: boolean;
  onMarkupColorPanelToggle: () => void;
  onMarkupColorPanelClose: () => void;
  toolbarPosition: ToolbarPosition;
}

interface ToolButtonProps {
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const ToolButton: React.FC<ToolButtonProps> = ({
  label,
  shortcut,
  icon,
  isActive,
  onClick,
  tooltipPosition = 'top',
}) => (
  <Tooltip text={label} shortcut={shortcut} position={tooltipPosition}>
    <button
      onClick={onClick}
      className={`p-2.5 rounded-lg transition-colors duration-200 text-white ${
        isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
      }`}
    >
      <div className="w-6 h-6">{icon}</div>
    </button>
  </Tooltip>
);

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  {
    activeTool,
    setActiveTool,
    activeLineTool,
    setActiveLineTool,
    activeShape,
    setActiveShape,
    activePinType,
    setActivePinType,
    markupFillColor,
    markupStrokeColor,
    markupColorPanelOpen,
    onMarkupColorPanelToggle,
    onMarkupColorPanelClose,
    toolbarPosition,
  },
  ref
) {
  const [isShapeMenuOpen, setShapeMenuOpen] = useState(MENUS_MODE);
  const [isLineMenuOpen, setLineMenuOpen] = useState(MENUS_MODE);
  const [isPinMenuOpen, setPinMenuOpen] = useState(MENUS_MODE);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const lineMenuRef = useRef<HTMLDivElement>(null);
  const pinMenuRef = useRef<HTMLDivElement>(null);

  const getTooltipPosition = (): 'top' | 'bottom' | 'left' | 'right' => {
    switch (toolbarPosition) {
      case 'top': return 'bottom';
      case 'left': return 'right';
      case 'right': return 'left';
      default: return 'top';
    }
  };

  const tooltipPos = getTooltipPosition();

  const handleToolClick = (tool: ActiveTool) => {
    setActiveTool(tool);
    if (tool === 'shape') {
        setShapeMenuOpen(prev => !prev);
        setLineMenuOpen(false);
        setPinMenuOpen(false);
        onMarkupColorPanelClose();
    } else if (tool === 'arrow') {
        setLineMenuOpen(prev => !prev);
        setShapeMenuOpen(false);
        setPinMenuOpen(false);
        onMarkupColorPanelClose();
    } else if (tool === 'pin') {
        setPinMenuOpen(prev => !prev);
        setShapeMenuOpen(false);
        setLineMenuOpen(false);
        onMarkupColorPanelClose();
    } else {
        setShapeMenuOpen(false);
        setLineMenuOpen(false);
        setPinMenuOpen(false);
        onMarkupColorPanelClose();
    }
  };

  const handleColorButtonClick = () => {
    onMarkupColorPanelToggle();
    setShapeMenuOpen(false);
    setLineMenuOpen(false);
    setPinMenuOpen(false);
  }
  
  const handleShapeClick = (shape: ActiveShape) => {
    setActiveShape(shape);
    setActiveTool('shape');
    setShapeMenuOpen(false);
  };
  
  const handlePinClick = (pinType: ActivePinType) => {
      setActivePinType(pinType);
      setActiveTool('pin');
      setPinMenuOpen(false);
  }
  
  const handleLineToolClick = (tool: ActiveLineTool) => {
    setActiveLineTool(tool);
    setActiveTool(tool);
    setLineMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (MENUS_MODE) return;
      const target = event.target as Node;
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(target)) setShapeMenuOpen(false);
      if (lineMenuRef.current && !lineMenuRef.current.contains(target)) setLineMenuOpen(false);
      if (pinMenuRef.current && !pinMenuRef.current.contains(target)) setPinMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mainTools = [
    { id: 'image', label: 'Image', icon: <ImageIcon /> },
    { id: 'location', label: 'Location', icon: <LocationIcon /> },
    { id: 'pen', label: 'Pen', icon: <PenIcon /> },
    { id: 'highlighter', label: 'Highlighter', icon: <HighlighterIcon /> },
    { id: 'text', label: 'Text', icon: <TextIcon /> },
  ];
  
  const customPinTools = [
    { id: 'customPin', label: 'Custom Pin', icon: <CustomPinIcon /> },
  ];

  const shapeTools: { id: ActiveShape; label: string; shortcut?: string; icon: React.ReactNode }[] = [
      { id: 'cloud', label: 'Cloud', icon: <CloudIcon className="w-6 h-6" /> },
      { id: 'box', label: 'Rectangle', shortcut: 'R', icon: <BoxIcon className="w-6 h-6" /> },
      { id: 'ellipse', label: 'Ellipse', shortcut: 'E', icon: <EllipseIcon className="w-6 h-6" /> },
  ];

  const pinTools: { id: ActivePinType; label: string; icon: React.ReactNode }[] = [
    { id: 'photo', label: 'Photo', icon: <PhotoPinIcon className="w-6 h-6" /> },
    { id: 'safety', label: 'Safety', icon: <SafetyPinIcon className="w-6 h-6" /> },
    { id: 'punch', label: 'Punch', icon: <PunchPinIcon className="w-6 h-6" /> },
  ];

  const currentShapeTool = shapeTools.find(s => s.id === activeShape) || shapeTools[1];
  const lineTools: { id: ActiveLineTool; label: string; icon: React.ReactNode }[] = [
    { id: 'arrow', label: 'Arrow', icon: <ArrowIcon className="w-6 h-6" /> },
    { id: 'line', label: 'Line', icon: <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M4 20L20 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg> },
    {
      id: 'freeline',
      label: 'Freeline',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m10.586 5.414-5.172 5.172" />
          <path d="m18.586 13.414-5.172 5.172" />
          <path d="M6 12h12" />
          <circle cx="12" cy="20" r="2" />
          <circle cx="12" cy="4" r="2" />
          <circle cx="20" cy="12" r="2" />
          <circle cx="4" cy="12" r="2" />
        </svg>
      ),
    },
  ];
  const currentLineTool = lineTools.find(l => l.id === activeLineTool) || lineTools[0];
  const currentPinTool = pinTools.find(p => p.id === activePinType) || pinTools[1];

  const getFlyoutPositionClasses = () => {
    switch (toolbarPosition) {
        case 'top': return 'top-full left-1/2 -translate-x-1/2 mt-2';
        case 'left': return 'left-full top-0 ml-2';
        case 'right': return 'right-full top-0 mr-2';
        default: return 'bottom-full left-1/2 -translate-x-1/2 mb-2'; // bottom
    }
  };

  const isVertical = toolbarPosition === 'left' || toolbarPosition === 'right';

  return (
    <div className="relative">
      <div className={`flex items-center gap-1 bg-gray-900/95 backdrop-blur-sm p-1.5 rounded-lg shadow-xl ${isVertical ? 'flex-col' : 'flex-row'}`}>
        <ToolButton
            label="Select"
            shortcut="V"
            icon={<MousePointerIcon />}
            isActive={activeTool === 'select'}
            onClick={() => handleToolClick('select')}
            tooltipPosition={tooltipPos}
        />

        {/* Shape Tool Flyout */}
        <div ref={shapeMenuRef} className="relative">
            <Tooltip text={currentShapeTool.label} shortcut={currentShapeTool.shortcut} position={tooltipPos}>
                <button
                    onClick={() => handleToolClick('shape')}
                    className={`relative p-2.5 rounded-lg transition-colors duration-200 text-white ${
                        activeTool === 'shape' ? 'bg-blue-600' : 'hover:bg-gray-700'
                    }`}
                >
                    <div className="w-6 h-6">{currentShapeTool.icon}</div>
                    <div className="absolute bottom-1 right-1 pointer-events-none">
                        <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300">
                            <path d="M6 6L0 6L6 0Z" fill="currentColor" />
                        </svg>
                    </div>
                </button>
            </Tooltip>
            {isShapeMenuOpen && (
                 <div className={`absolute flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white ${getFlyoutPositionClasses()} ${isVertical ? 'flex-col' : 'flex-row'}`}>
                    {shapeTools.map(shape => (
                        <Tooltip key={shape.id} text={shape.label} shortcut={shape.shortcut} position={isVertical ? (toolbarPosition === 'left' ? 'right' : 'left') : 'top'}>
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handleShapeClick(shape.id); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 ${
                                    activeShape === shape.id && activeTool === 'shape' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
                                }`}
                            >
                                {shape.icon}
                                <span className="text-xs mt-1">{shape.label}</span>
                            </button>
                        </Tooltip>
                    ))}
                </div>
            )}
        </div>
        
        {/* Pin Tool Flyout */}
        <div ref={pinMenuRef} className="relative">
             <Tooltip text={currentPinTool.label} shortcut="P" position={tooltipPos}>
                <button
                    onClick={() => handleToolClick('pin')}
                    className={`relative p-2.5 rounded-lg transition-colors duration-200 text-white ${
                        activeTool === 'pin'
                            ? activePinType === 'punch'
                                ? 'bg-orange-600'
                                : activePinType === 'safety'
                                  ? 'bg-red-600'
                                  : 'bg-blue-600'
                            : 'hover:bg-gray-700'
                    }`}
                >
                    <div className="w-6 h-6">{currentPinTool.icon}</div>
                    <div className="absolute bottom-1 right-1 pointer-events-none">
                        <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300">
                            <path d="M6 6L0 6L6 0Z" fill="currentColor" />
                        </svg>
                    </div>
                </button>
            </Tooltip>
            {isPinMenuOpen && (
                <div className={`absolute flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white ${getFlyoutPositionClasses()} ${isVertical ? 'flex-col' : 'flex-row'}`}>
                    {pinTools.map(pin => (
                        <Tooltip key={pin.id} text={pin.label} position={isVertical ? (toolbarPosition === 'left' ? 'right' : 'left') : 'top'}>
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handlePinClick(pin.id); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 ${
                                    activePinType === pin.id && activeTool === 'pin'
                                        ? pin.id === 'punch'
                                            ? 'bg-orange-600'
                                            : pin.id === 'safety'
                                              ? 'bg-red-600'
                                              : 'bg-blue-600'
                                        : 'hover:bg-gray-700'
                                }`}
                            >
                                {pin.icon}
                                <span className="text-xs mt-1">{pin.label}</span>
                            </button>
                        </Tooltip>
                    ))}
                </div>
            )}
        </div>

        <div ref={lineMenuRef} className="relative">
            <Tooltip text={currentLineTool.label} position={tooltipPos}>
                <button
                    onClick={() => handleToolClick('arrow')}
                    className={`relative p-2.5 rounded-lg transition-colors duration-200 text-white ${
                        activeTool === 'line' || activeTool === 'arrow' || activeTool === 'freeline' ? 'bg-blue-600' : 'hover:bg-gray-700'
                    }`}
                >
                    <div className="w-6 h-6">{currentLineTool.icon}</div>
                    <div className="absolute bottom-1 right-1 pointer-events-none">
                        <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300">
                            <path d="M6 6L0 6L6 0Z" fill="currentColor" />
                        </svg>
                    </div>
                </button>
            </Tooltip>
            {isLineMenuOpen && (
                <div className={`absolute flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white ${getFlyoutPositionClasses()} ${isVertical ? 'flex-col' : 'flex-row'}`}>
                    {lineTools.map(line => (
                        <Tooltip key={line.id} text={line.label} position={isVertical ? (toolbarPosition === 'left' ? 'right' : 'left') : 'top'}>
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handleLineToolClick(line.id); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 ${
                                    activeLineTool === line.id && (activeTool === 'line' || activeTool === 'arrow' || activeTool === 'freeline') ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
                                }`}
                            >
                                {line.icon}
                                <span className="text-xs mt-1">{line.label}</span>
                            </button>
                        </Tooltip>
                    ))}
                </div>
            )}
        </div>

        <ToolButton
            label="Measurement"
            icon={<MeasurementIcon />}
            isActive={activeTool === 'measurement'}
            onClick={() => handleToolClick('measurement')}
            tooltipPosition={tooltipPos}
        />

        {mainTools.map((tool) => (
             <ToolButton
                key={tool.id}
                label={tool.label}
                icon={tool.icon}
                isActive={activeTool === tool.id}
                onClick={() => handleToolClick(tool.id as ActiveTool)}
                tooltipPosition={tooltipPos}
            />
        ))}

        <div className={`bg-gray-600 ${isVertical ? 'w-6 h-px my-1' : 'h-6 w-px mx-1'}`} />

        {customPinTools.map((tool) => (
             <ToolButton
                key={tool.id}
                label={tool.label}
                icon={tool.icon}
                isActive={activeTool === tool.id}
                onClick={() => handleToolClick(tool.id as ActiveTool)}
                tooltipPosition={tooltipPos}
            />
        ))}

        {/* Fill / stroke — opens docked panel on canvas (ref for anchoring picker above this control) */}
        <div ref={ref} className="relative" data-markup-color-trigger>
            <Tooltip text="Fill & stroke" position={tooltipPos}>
                <button
                    type="button"
                    onClick={handleColorButtonClick}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-200 ${
                        markupColorPanelOpen || activeTool === 'fill' || activeTool === 'stroke' ? 'bg-blue-600' : 'hover:bg-gray-700'
                    }`}
                >
                    <span className="relative h-6 w-6 overflow-hidden rounded-full border border-white/40 shadow-sm">
                      <span
                        className="absolute inset-y-0 left-0 w-1/2"
                        style={{
                          background:
                            markupFillColor === 'transparent'
                              ? 'linear-gradient(135deg, #fff 45%, #ef4444 45%, #ef4444 55%, #fff 55%)'
                              : markupFillColor,
                        }}
                      />
                      <span
                        className="absolute inset-y-0 right-0 w-1/2"
                        style={{ backgroundColor: markupStrokeColor }}
                      />
                    </span>
                    <div className="absolute bottom-1 right-1 pointer-events-none">
                        <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300">
                            <path d="M6 6L0 6L6 0Z" fill="currentColor" />
                        </svg>
                    </div>
                </button>
            </Tooltip>
        </div>
      </div>
    </div>
  );
});

export default Toolbar;