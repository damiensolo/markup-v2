import React from 'react';
import { LayersIcon, DocumentDuplicateIcon, SafetyPinIcon, PunchPinIcon } from './Icons';
import Tooltip from './Tooltip';

interface SidebarRailProps {
  side: 'left' | 'right';
  activePanel: string | null;
  onTogglePanel: (panel: string) => void;
  isLayersOpen?: boolean;
  onToggleLayers?: () => void;
}

const SidebarRail: React.FC<SidebarRailProps> = ({ side, activePanel, onTogglePanel, isLayersOpen, onToggleLayers }) => {
  const railClasses = `flex flex-col items-center gap-4 py-4 w-12 bg-gray-900 border-gray-700/50 flex-shrink-0 z-30 ${
    side === 'left' ? 'border-r' : 'border-l'
  }`;

  const tooltipPos = side === 'left' ? 'right' : 'left';

  return (
    <div className={railClasses}>
      {side === 'left' ? (
        <Tooltip text="Layers" position={tooltipPos}>
          <button
            onClick={onToggleLayers}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isLayersOpen ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <LayersIcon className="w-6 h-6" />
          </button>
        </Tooltip>
      ) : (
        <>
          <Tooltip text="RFIs" position={tooltipPos}>
            <button
              onClick={() => onTogglePanel('rfi')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                activePanel === 'rfi' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <DocumentDuplicateIcon className="w-6 h-6" />
            </button>
          </Tooltip>
          <Tooltip text="Safety Issues" position={tooltipPos}>
            <button
              onClick={() => onTogglePanel('safety')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                activePanel === 'safety' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <SafetyPinIcon className="w-6 h-6" />
            </button>
          </Tooltip>
          <Tooltip text="Punch List" position={tooltipPos}>
            <button
              onClick={() => onTogglePanel('punch')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                activePanel === 'punch' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <PunchPinIcon className="w-6 h-6" />
            </button>
          </Tooltip>
        </>
      )}
    </div>
  );
};

export default SidebarRail;
