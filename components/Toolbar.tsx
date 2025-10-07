

import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointerIcon, PenIcon, BoxIcon, ArrowIcon, TextIcon, DistanceIcon, DrawingIcon,
  CloudIcon, EllipseIcon, PhotoPinIcon, SafetyPinIcon, PunchPinIcon
} from './Icons';

type ActiveTool = 'select' | 'shape' | 'pen' | 'arrow' | 'text' | 'distance' | 'drawing' | 'pin';
type ActiveShape = 'cloud' | 'box' | 'ellipse';
type ActivePinType = 'photo' | 'safety' | 'punch';

interface ToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  activeShape: ActiveShape;
  setActiveShape: (shape: ActiveShape) => void;
  activePinType: ActivePinType;
  setActivePinType: (pinType: ActivePinType) => void;
}

const ToolButton = ({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
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

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setActiveTool, activeShape, setActiveShape, activePinType, setActivePinType }) => {
  const [isShapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [isPinMenuOpen, setPinMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const pinMenuRef = useRef<HTMLDivElement>(null);

  const handleToolClick = (tool: ActiveTool) => {
    setActiveTool(tool);
    if (tool === 'shape') setShapeMenuOpen(prev => !prev);
    else setShapeMenuOpen(false);
    
    if (tool === 'pin') setPinMenuOpen(prev => !prev);
    else setPinMenuOpen(false);
  };
  
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(event.target as Node)) {
        setShapeMenuOpen(false);
      }
      if (pinMenuRef.current && !pinMenuRef.current.contains(event.target as Node)) {
        setPinMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const tools = [
    { id: 'select', label: 'Select', icon: <MousePointerIcon /> },
    { id: 'pen', label: 'Pen', icon: <PenIcon /> },
    // Shape tool is now a flyout, handled separately
    { id: 'arrow', label: 'Arrow', icon: <ArrowIcon /> },
    { id: 'text', label: 'Text', icon: <TextIcon /> },
    { id: 'distance', label: 'Distance', icon: <DistanceIcon /> },
    { id: 'drawing', label: 'Drawing', icon: <DrawingIcon /> },
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
  
  const currentShapeTool = shapeTools.find(s => s.id === activeShape) || shapeTools[1];
  const currentPinTool = pinTools.find(p => p.id === activePinType) || pinTools[1];

  return (
    <div className="relative">
      <div className="flex flex-row items-center gap-1 bg-gray-900/95 backdrop-blur-sm p-1.5 rounded-lg shadow-xl">
        <ToolButton
            label="Select"
            icon={<MousePointerIcon />}
            isActive={activeTool === 'select'}
            onClick={() => handleToolClick('select')}
        />
        <ToolButton
            label="Pen"
            icon={<PenIcon />}
            isActive={activeTool === 'pen'}
            onClick={() => handleToolClick('pen')}
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
        
        {tools.slice(2).map((tool) => (
             <ToolButton
                key={tool.id}
                label={tool.label}
                icon={tool.icon}
                isActive={activeTool === tool.id}
                onClick={() => handleToolClick(tool.id as ActiveTool)}
            />
        ))}
        
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
      </div>
    </div>
  );
};

export default Toolbar;