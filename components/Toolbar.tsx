

import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointerIcon, PenIcon, BoxIcon, ArrowIcon, TextIcon,
  CloudIcon, EllipseIcon, PhotoPinIcon, SafetyPinIcon, PunchPinIcon,
  ImageIcon, LocationIcon, MeasurementIcon, PolygonIcon, HighlighterIcon,
  CustomPinIcon, FillIcon, StrokeIcon
} from './Icons';
import { ToolbarPosition } from '../App';
import Tooltip from './Tooltip';

type ActiveTool = 'select' | 'shape' | 'pen' | 'arrow' | 'text' | 'pin' | 'image' | 'location' | 'measurement' | 'polygon' | 'highlighter' | 'customPin' | 'fill' | 'stroke';
type ActiveShape = 'cloud' | 'box' | 'ellipse';
type ActivePinType = 'photo' | 'safety' | 'punch';
type ActiveColor = 'fill' | 'stroke';

interface ToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  activeShape: ActiveShape;
  setActiveShape: (shape: ActiveShape) => void;
  activePinType: ActivePinType;
  setActivePinType: (pinType: ActivePinType) => void;
  activeColor: ActiveColor;
  setActiveColor: (color: ActiveColor) => void;
  toolbarPosition: ToolbarPosition;
}

interface ToolButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const ToolButton: React.FC<ToolButtonProps> = ({
  label,
  icon,
  isActive,
  onClick,
  tooltipPosition = 'top',
}) => (
  <Tooltip text={label} position={tooltipPosition}>
    <button
      onClick={onClick}
      className={`p-2.5 rounded-lg transition-colors duration-200 text-white ${
        isActive ? 'bg-blue-500' : 'hover:bg-gray-700'
      }`}
    >
      <div className="w-6 h-6">{icon}</div>
    </button>
  </Tooltip>
);

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setActiveTool, activeShape, setActiveShape, activePinType, setActivePinType, activeColor, setActiveColor, toolbarPosition }) => {
  const [isShapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [isPinMenuOpen, setPinMenuOpen] = useState(false);
  const [isColorMenuOpen, setColorMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const pinMenuRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);

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
        setPinMenuOpen(false);
        setColorMenuOpen(false);
    } else if (tool === 'pin') {
        setPinMenuOpen(prev => !prev);
        setShapeMenuOpen(false);
        setColorMenuOpen(false);
    } else {
        setShapeMenuOpen(false);
        setPinMenuOpen(false);
        setColorMenuOpen(false);
    }
  };

  const handleColorButtonClick = () => {
    setColorMenuOpen(prev => !prev);
    setShapeMenuOpen(false);
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

  const handleColorClick = (color: ActiveColor) => {
    setActiveColor(color);
    setActiveTool(color);
    setColorMenuOpen(false);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(target)) setShapeMenuOpen(false);
      if (pinMenuRef.current && !pinMenuRef.current.contains(target)) setPinMenuOpen(false);
      if (colorMenuRef.current && !colorMenuRef.current.contains(target)) setColorMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mainTools = [
    { id: 'image', label: 'Image', icon: <ImageIcon /> },
    { id: 'location', label: 'Location', icon: <LocationIcon /> },
    { id: 'measurement', label: 'Measurement', icon: <MeasurementIcon /> },
    { id: 'polygon', label: 'Polygon', icon: <PolygonIcon /> },
    { id: 'pen', label: 'Pen', icon: <PenIcon /> },
    { id: 'highlighter', label: 'Highlighter', icon: <HighlighterIcon /> },
    { id: 'arrow', label: 'Arrow', icon: <ArrowIcon /> },
    { id: 'text', label: 'Text', icon: <TextIcon /> },
  ];
  
  const customPinTools = [
    { id: 'customPin', label: 'Custom Pin', icon: <CustomPinIcon /> },
  ];

  const shapeTools: { id: ActiveShape; label: string; icon: React.ReactNode }[] = [
      { id: 'cloud', label: 'Cloud', icon: <CloudIcon className="w-6 h-6" /> },
      { id: 'box', label: 'Box', icon: <BoxIcon className="w-6 h-6" /> },
      { id: 'ellipse', label: 'Ellipse', icon: <EllipseIcon className="w-6 h-6" /> },
  ];

  const pinTools: { id: ActivePinType; label: string; icon: React.ReactNode }[] = [
    { id: 'photo', label: 'Photo', icon: <PhotoPinIcon className="w-6 h-6" /> },
    { id: 'safety', label: 'Safety', icon: <SafetyPinIcon className="w-6 h-6" /> },
    { id: 'punch', label: 'Punch', icon: <PunchPinIcon className="w-6 h-6" /> },
  ];

  const colorTools: { id: ActiveColor; label: string; icon: React.ReactNode }[] = [
    { id: 'fill', label: 'Fill', icon: <FillIcon /> },
    { id: 'stroke', label: 'Stroke', icon: <StrokeIcon /> },
  ];
  
  const currentShapeTool = shapeTools.find(s => s.id === activeShape) || shapeTools[1];
  const currentPinTool = pinTools.find(p => p.id === activePinType) || pinTools[1];
  const currentColorTool = colorTools.find(c => c.id === activeColor) || colorTools[0];

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
            icon={<MousePointerIcon />}
            isActive={activeTool === 'select'}
            onClick={() => handleToolClick('select')}
            tooltipPosition={tooltipPos}
        />

        {/* Shape Tool Flyout */}
        <div ref={shapeMenuRef} className="relative">
            <Tooltip text={currentShapeTool.label} position={tooltipPos}>
                <button
                    onClick={() => handleToolClick('shape')}
                    className={`relative p-2.5 rounded-lg transition-colors duration-200 text-white ${
                        activeTool === 'shape' ? 'bg-blue-500' : 'hover:bg-gray-700'
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
                        <Tooltip key={shape.id} text={shape.label} position={isVertical ? (toolbarPosition === 'left' ? 'right' : 'left') : 'top'}>
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handleShapeClick(shape.id); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 ${
                                    activeShape === shape.id && activeTool === 'shape' ? 'bg-blue-500 text-white' : 'hover:bg-gray-700'
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
             <Tooltip text={currentPinTool.label} position={tooltipPos}>
                <button
                    onClick={() => handleToolClick('pin')}
                    className={`relative p-2.5 rounded-lg transition-colors duration-200 text-white ${
                        activeTool === 'pin' ? 'bg-blue-500' : 'hover:bg-gray-700'
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
                                    activePinType === pin.id && activeTool === 'pin' ? 'bg-blue-500' : 'hover:bg-gray-700'
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

        {/* Color Tool Flyout */}
        <div ref={colorMenuRef} className="relative">
            <Tooltip text={currentColorTool.label} position={tooltipPos}>
                <button
                    onClick={handleColorButtonClick}
                    className={`relative p-2.5 rounded-lg transition-colors duration-200 text-white ${
                        activeTool === 'fill' || activeTool === 'stroke' ? 'bg-blue-500' : 'hover:bg-gray-700'
                    }`}
                >
                    <div className="w-6 h-6">{currentColorTool.icon}</div>
                    <div className="absolute bottom-1 right-1 pointer-events-none">
                        <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300">
                            <path d="M6 6L0 6L6 0Z" fill="currentColor" />
                        </svg>
                    </div>
                </button>
            </Tooltip>
            {isColorMenuOpen && (
                <div className={`absolute flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white ${getFlyoutPositionClasses()} ${isVertical ? 'flex-col' : 'flex-row'}`}>
                    {colorTools.map(color => (
                        <Tooltip key={color.id} text={color.label} position={isVertical ? (toolbarPosition === 'left' ? 'right' : 'left') : 'top'}>
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handleColorClick(color.id); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 ${
                                    activeColor === color.id && (activeTool === 'fill' || activeTool === 'stroke') ? 'bg-blue-500 text-white' : 'hover:bg-gray-700'
                                }`}
                            >
                                <div className="w-6 h-6">{color.icon}</div>
                                <span className="text-xs mt-1">{color.label}</span>
                            </button>
                        </Tooltip>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;