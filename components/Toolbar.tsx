

import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointerIcon, PenIcon, BoxIcon, ArrowIcon, TextIcon,
  CloudIcon, EllipseIcon, PhotoPinIcon, SafetyPinIcon, PunchPinIcon,
  ImageIcon, LocationIcon, MeasurementIcon, PolygonIcon, HighlighterIcon,
  CustomPinIcon, FillIcon, StrokeIcon
} from './Icons';

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
}

// Fix: Changed ToolButton to use a standard interface and React.FC for better type inference with special props like 'key'.
interface ToolButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  label,
  icon,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`p-2.5 rounded-lg transition-colors duration-200 text-white ${
      isActive ? 'bg-cyan-600' : 'hover:bg-gray-700'
    }`}
    title={label}
  >
    <div className="w-6 h-6">{icon}</div>
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setActiveTool, activeShape, setActiveShape, activePinType, setActivePinType, activeColor, setActiveColor }) => {
  const [isShapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [isPinMenuOpen, setPinMenuOpen] = useState(false);
  const [isColorMenuOpen, setColorMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const pinMenuRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);

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
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(event.target as Node)) {
        setShapeMenuOpen(false);
      }
      if (pinMenuRef.current && !pinMenuRef.current.contains(event.target as Node)) {
        setPinMenuOpen(false);
      }
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
        setColorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  return (
    <div className="relative">
      <div className="flex flex-row items-center gap-1 bg-gray-900/95 backdrop-blur-sm p-1.5 rounded-lg shadow-xl">
        <ToolButton
            label="Select"
            icon={<MousePointerIcon />}
            isActive={activeTool === 'select'}
            onClick={() => handleToolClick('select')}
        />

        {/* Shape Tool Flyout */}
        <div ref={shapeMenuRef} className="relative">
            <button
                onClick={() => handleToolClick('shape')}
                className={`relative p-2.5 rounded-lg transition-colors duration-200 text-white ${
                    activeTool === 'shape' ? 'bg-cyan-600' : 'hover:bg-gray-700'
                }`}
                title={currentShapeTool.label}
            >
                <div className="w-6 h-6">{currentShapeTool.icon}</div>
                <div className="absolute bottom-1 right-1 pointer-events-none">
                    <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300">
                        <path d="M6 6L0 6L6 0Z" fill="currentColor" />
                    </svg>
                </div>
            </button>
            {isShapeMenuOpen && (
                 <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                    {shapeTools.map(shape => (
                        <button
                            key={shape.id}
                            onClick={() => handleShapeClick(shape.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 ${
                                activeShape === shape.id && activeTool === 'shape' ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700'
                            }`}
                            title={shape.label}
                        >
                            {shape.icon}
                            <span className="text-xs mt-1">{shape.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {/* Pin Tool Flyout */}
        <div ref={pinMenuRef} className="relative">
             <button
                onClick={() => handleToolClick('pin')}
                className={`relative p-2.5 rounded-lg transition-colors duration-200 text-white ${
                    activeTool === 'pin' ? 'bg-cyan-600' : 'hover:bg-gray-700'
                }`}
                title={currentPinTool.label}
            >
                <div className="w-6 h-6">{currentPinTool.icon}</div>
                <div className="absolute bottom-1 right-1 pointer-events-none">
                    <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300">
                        <path d="M6 6L0 6L6 0Z" fill="currentColor" />
                    </svg>
                </div>
            </button>
            {isPinMenuOpen && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                    {pinTools.map(pin => (
                        <button
                            key={pin.id}
                            onClick={() => handlePinClick(pin.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 ${
                                activePinType === pin.id && activeTool === 'pin' ? 'bg-cyan-600' : 'hover:bg-gray-700'
                            }`}
                            title={pin.label}
                        >
                            {pin.icon}
                            <span className="text-xs mt-1">{pin.label}</span>
                        </button>
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
            />
        ))}

        <div className="h-6 w-px bg-gray-600 mx-1" />

        {customPinTools.map((tool) => (
             <ToolButton
                key={tool.id}
                label={tool.label}
                icon={tool.icon}
                isActive={activeTool === tool.id}
                onClick={() => handleToolClick(tool.id as ActiveTool)}
            />
        ))}

        {/* Color Tool Flyout */}
        <div ref={colorMenuRef} className="relative">
            <button
                onClick={handleColorButtonClick}
                className={`relative p-2.5 rounded-lg transition-colors duration-200 text-white ${
                    activeTool === 'fill' || activeTool === 'stroke' ? 'bg-cyan-600' : 'hover:bg-gray-700'
                }`}
                title={currentColorTool.label}
            >
                <div className="w-6 h-6">{currentColorTool.icon}</div>
                <div className="absolute bottom-1 right-1 pointer-events-none">
                    <svg viewBox="0 0 6 6" className="w-1.5 h-1.5 text-gray-300">
                        <path d="M6 6L0 6L6 0Z" fill="currentColor" />
                    </svg>
                </div>
            </button>
            {isColorMenuOpen && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 flex gap-1 bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-lg shadow-lg text-white">
                    {colorTools.map(color => (
                        <button
                            key={color.id}
                            onClick={() => handleColorClick(color.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 ${
                                activeColor === color.id && (activeTool === 'fill' || activeTool === 'stroke') ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700'
                            }`}
                            title={color.label}
                        >
                            <div className="w-6 h-6">{color.icon}</div>
                            <span className="text-xs mt-1">{color.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;