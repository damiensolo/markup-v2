
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { MENUS_MODE } from './utils/showcaseMode';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Rectangle, RfiData, RfiFormState, SubmittalData, PunchData, DrawingData, PhotoData, Pin, SafetyIssueData, LinkModalConfig, HoveredItemInfo, ViewTransform, InteractionState, DrawingVersion, MarkupSet, Measurement, LineMarkup, LineToolType, TextMarkup } from './types';
import LinkModal from './components/LinkModal';
import PhotoPickerModal from './components/PhotoPickerModal';
import PhotoViewMarkupModal from './components/PhotoViewMarkupModal';
import type { PhotoMarkupData } from './components/PhotoViewMarkupModal';
import ShareModal from './components/ShareModal';
import DownloadOptionsModal from './components/DownloadOptionsModal';
import CompareSheetsModal, { type CompareSheetChoice } from './components/CompareSheetsModal';
import PublishWarningModal from './components/PublishWarningModal';
import RfiPanel from './components/RfiPanel';
import SafetyPanel from './components/SafetyPanel';
import PunchPanel from './components/PunchPanel';
import HoverPopup from './components/HoverPopup';
import Tooltip from './components/Tooltip';
import WelcomeScreen from './components/WelcomeScreen';
import CanvasView from './components/CanvasView';
import { useZoomPan } from './hooks/useZoomPan';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import {
  resolveRectFillColor,
  resolveRectStrokeColor,
  DEFAULT_MARKUP_FILL,
} from './utils/markupColors';
import LayersPanel, { type CompareDrawingsInfo } from './components/LayersPanel';
import { LinarcAppShell } from './components/linarcShell/LinarcAppShell';
import { FilterIcon, ChevronLeftIcon, ShareIcon, SnapshotIcon, DocumentDuplicateIcon, FolderOpenIcon, SquarePenIcon, PanelLeftIcon, PanelRightIcon } from './components/Icons';

type FilterCategory = 'rfi' | 'submittal' | 'punch' | 'drawing' | 'photo' | 'safety';
export type RectangleTagType = Exclude<FilterCategory, 'safety'>;
type ActiveTool = 'select' | 'shape' | 'pen' | 'line' | 'arrow' | 'freeline' | 'text' | 'pin' | 'image' | 'location' | 'measurement' | 'polygon' | 'highlighter' | 'customPin' | 'fill' | 'stroke';
export type ToolbarPosition = 'bottom' | 'top' | 'left' | 'right';
export interface ImageGeom {
    width: number;
    height: number;
    x: number;
    y: number;
}

const mockRfis: RfiData[] = [
    { id: 101, title: 'Clarification on beam specification', type: 'Design Clarification', question: 'The structural drawing S-2.1 specifies a W12x26 beam, but the architectural drawing A-5.0 shows a W14x22. Please clarify which is correct.', priority: 'High', scheduleImpact: 'Yes', costImpact: 'No' },
    { id: 102, title: 'Permission to use alternative sealant', type: 'Material Substitution', question: 'The specified sealant Dow Corning 795 is unavailable with a 6-week lead time. Can we substitute with Pecora 890, which has equivalent performance characteristics? Datasheet attached.', priority: 'Medium', scheduleImpact: 'Yes', costImpact: 'Yes' },
    { id: 103, title: 'Unexpected conduit in wall cavity', type: 'Field Condition', question: 'During demolition of the partition wall in Room 204, we discovered an undocumented electrical conduit. Please advise on whether it is live and if it needs to be relocated.', priority: 'High', scheduleImpact: 'No', costImpact: 'No' },
    { id: 104, title: 'Location of thermostat in Lobby', type: 'General Inquiry', question: 'The MEP drawings do not specify the exact mounting location for the main lobby thermostat. Please provide a location.', priority: 'Low', scheduleImpact: 'No', costImpact: 'No' },
];

const DEFAULT_RFI_FORM: RfiFormState = {
  title: '',
  type: '',
  question: '',
  priority: '',
  sequence: '',
  location: '',
  scheduleImpact: 'Yes',
  costImpact: 'Yes',
  answer: '',
};

const mockSubmittals: SubmittalData[] = [
    { id: 'SUB-001', title: 'Structural Steel Shop Drawings', specSection: '05 12 00', status: 'In Review' },
    { id: 'SUB-002', title: 'Concrete Mix Design', specSection: '03 30 00', status: 'Open' },
    { id: 'SUB-003', title: 'HVAC Unit Data Sheets', specSection: '23 73 00', status: 'Closed' },
    { id: 'SUB-004', title: 'Glazing Samples', specSection: '08 80 00', status: 'In Review' },
    { id: 'SUB-005', title: 'Fireproofing Material Certificate', specSection: '07 81 00', status: 'Open' },
];
  
const mockPunches: PunchData[] = [
    { id: 'PUNCH-101', title: 'Drywall crack in Corridor A', status: 'Open', assignee: 'John Doe' },
    { id: 'PUNCH-102', title: 'Incorrect paint color in Room 203', status: 'Ready for Review', assignee: 'Jane Smith' },
    { id: 'PUNCH-103', 'title': 'Missing light fixture in Lobby', status: 'Closed', assignee: 'John Doe' },
    { id: 'PUNCH-104', title: 'Leaky faucet in Restroom 1B', status: 'Open', assignee: 'Mike Ross' },
    { id: 'PUNCH-105', title: 'Damaged floor tile near entrance', status: 'Ready for Review', assignee: 'Jane Smith' },
];

const mockDrawings: DrawingData[] = [
    {
        id: 'A-1.0',
        title: 'Floor Plan — Level 1',
        versions: [
            { id: 'v3', name: 'Revision 3', timestamp: '2024-07-20', thumbnailUrl: '/blueprint-fp-r3.svg' },
            { id: 'v2', name: 'Revision 2', timestamp: '2024-07-15', thumbnailUrl: '/blueprint-fp-r2.svg' },
            { id: 'v1', name: 'Initial Release', timestamp: '2024-07-10', thumbnailUrl: '/blueprint-fp-r1.svg' },
        ]
    },
    {
        id: 'A-2.1',
        title: 'Floor Plan — Level 2',
        versions: [
            { id: 'v1', name: 'Initial Release', timestamp: '2024-06-01', thumbnailUrl: '/blueprint-fp-r2.svg' },
        ]
    },
    {
        id: 'S-5.0',
        title: 'Structural Details — Column Connections',
        versions: [
            { id: 'v2', name: 'As-Built', timestamp: '2024-08-01', thumbnailUrl: '/blueprint-structural.svg' },
            { id: 'v1', name: 'For Construction', timestamp: '2024-05-20', thumbnailUrl: '/blueprint-structural.svg' },
        ]
    },
    {
        id: 'A-5.1',
        title: 'Building Section A-A',
        versions: [
            { id: 'v1', name: 'Initial Release', timestamp: '2024-06-15', thumbnailUrl: '/blueprint-structural.svg' },
        ]
    },
];

const mockSafetyIssues: SafetyIssueData[] = [
    { id: 'SAFE-1759781996802', title: 'asdfasdf', description: 'Large opening in the floor on the west side of Level 2, near column B-4. Needs immediate covering.', status: 'Open', severity: 'Medium' },
    { id: 'SAFE-001', title: 'Uncovered floor opening', description: 'Large opening in the floor on the west side of Level 2, near column B-4. Needs immediate covering.', status: 'Open', severity: 'High' },
    { id: 'SAFE-002', title: 'Missing guardrail on 2nd floor', description: 'The entire southern balcony on the second floor is missing its guardrail.', status: 'In Progress', severity: 'High' },
    { id: 'SAFE-003', title: 'Improperly stored flammable materials', description: 'Gasoline cans and other flammable materials stored next to an active welding station.', status: 'Closed', severity: 'Medium' },
];

const mockCompanies = [
    { id: 'comp-1', name: 'Martinez Developments', role: 'Building Contractor', projectManager: 'Charles Carter' },
    { id: 'comp-2', name: 'Mora Specialty Contractors', role: 'Concrete', projectManager: 'Roy Cook' },
    { id: 'comp-3', name: 'Elliott Subcontractors', role: 'Electrical', projectManager: 'Michael Schmidt' },
    { id: 'comp-4', name: 'Jenkins Subcontractors', role: 'HVAC', projectManager: 'Ana Lewis' },
    { id: 'comp-5', name: 'Farley Structures', role: 'Plumbing', projectManager: 'Yvonne Shea' },
    { id: 'comp-6', name: 'Pham Interior Designs', role: 'Construction Architect', projectManager: 'Dustin Jennings' },
    { id: 'comp-7', name: 'Camacho Contractors', role: 'Doors & Windows', projectManager: 'John James' },
    { id: 'comp-8', name: 'Mccoy Construction Group', role: 'Owner', projectManager: 'Danielle Taylor' },
];

const mockEmployees = [
  { id: 'emp-1', name: 'Charles Carter', role: 'Project Manager', company: 'Martinez Developments' },
  { id: 'emp-2', name: 'Roy Cook', role: 'Superintendent', company: 'Mora Specialty Contractors' },
  { id: 'emp-3', name: 'Michael Schmidt', role: 'Foreman', company: 'Elliott Subcontractors' },
  { id: 'emp-4', name: 'Ana Lewis', role: 'Engineer', company: 'Jenkins Subcontractors' },
  { id: 'emp-5', name: 'Yvonne Shea', role: 'Plumber', company: 'Farley Structures' },
  { id: 'emp-6', name: 'Dustin Jennings', role: 'Architect', company: 'Pham Interior Designs' },
  { id: 'emp-7', name: 'John James', role: 'Installer', company: 'Camacho Contractors' },
  { id: 'emp-8', name: 'Danielle Taylor', role: 'Owner Rep', company: 'Mccoy Construction Group' },
  { id: 'emp-9', name: 'Sarah Wilson', role: 'Safety Inspector', company: 'Martinez Developments' },
  { id: 'emp-10', name: 'Tom Clark', role: 'Electrician', company: 'Elliott Subcontractors' },
];

const mockMarkupSets: MarkupSet[] = [
    {
        id: 'set-1',
        name: 'Structural Review - John',
        drawingId: 'A-1.0',
        versionId: 'v3',
        timestamp: '2024-07-21 10:00 AM',
        author: 'John Doe',
        rectangles: [
            { id: 'rect-101', shape: 'box', x: 20, y: 20, width: 15, height: 10, name: 'Beam Issue', visible: true, rfi: [mockRfis[0]] },
            { id: 'rect-102', shape: 'cloud', x: 50, y: 50, width: 20, height: 15, name: 'Revision Cloud', visible: true }
        ],
        pins: [
            { id: 'pin-101', type: 'safety', x: 30, y: 30, linkedId: mockSafetyIssues[1].id, name: 'Safety 1', visible: true }
        ]
    },
    {
        id: 'set-2',
        name: 'Architectural Notes - Sarah',
        drawingId: 'A-1.0',
        versionId: 'v3',
        timestamp: '2024-07-22 02:30 PM',
        author: 'Sarah Wilson',
        rectangles: [
            { id: 'rect-201', shape: 'ellipse', x: 60, y: 20, width: 10, height: 10, name: 'Door Swing', visible: true, submittals: [mockSubmittals[0]] }
        ],
        pins: [
            { id: 'pin-201', type: 'punch', x: 70, y: 60, linkedId: mockPunches[0].id, name: 'Punch 1', visible: true }
        ]
    },
    {
        id: 'set-3',
        name: 'Initial Review',
        drawingId: 'A-2.1',
        versionId: 'v1',
        timestamp: '2024-06-02 09:00 AM',
        author: 'Michael Schmidt',
        rectangles: [
            { id: 'rect-301', shape: 'cloud', x: 40, y: 40, width: 30, height: 20, name: 'Zone A', visible: true }
        ],
        pins: []
    }
];

// Sub-components defined inside App.tsx to avoid creating new files
interface DrawingSelectorProps {
    drawings: DrawingData[];
    value: DrawingData | null;
    onChange: (drawing: DrawingData) => void;
    className?: string;
}
const DrawingSelector: React.FC<DrawingSelectorProps> = ({ drawings, value, onChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(MENUS_MODE);
    const [searchTerm, setSearchTerm] = useState('');
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (MENUS_MODE) return;
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredDrawings = drawings.filter(d =>
        d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative min-w-0 ${className}`} ref={selectorRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="linarc-toolbar-select-trigger"
            >
                <span className="min-w-0 flex-1 truncate">{value ? `${value.id} - ${value.title}` : 'Select a drawing'}</span>
                <svg className={`linarc-toolbar-icon shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 min-w-full w-max max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2">
                    <input
                        type="text"
                        placeholder="Search drawings..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <ul className="max-h-60 overflow-y-auto">
                        {filteredDrawings.map(d => (
                            <li key={d.id}>
                                <button
                                    onClick={() => {
                                        onChange(d);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                                >
                                    {d.id} - {d.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

interface DrawingVersionSelectorProps {
    versions: DrawingVersion[];
    value: DrawingVersion | null;
    onChange: (version: DrawingVersion) => void;
    disabled: boolean;
    className?: string;
}
const DrawingVersionSelector: React.FC<DrawingVersionSelectorProps> = ({ versions, value, onChange, disabled, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (MENUS_MODE) return;
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative min-w-0 ${className}`} ref={selectorRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="linarc-toolbar-select-trigger disabled:text-gray-400 dark:disabled:text-zinc-500"
            >
                <span className="min-w-0 flex-1 truncate">{value ? `${value.name} (${value.timestamp})` : 'Select version'}</span>
                <svg className={`linarc-toolbar-icon shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 min-w-full w-max max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2">
                    <ul className="max-h-60 overflow-y-auto">
                        {versions.map(v => (
                            <li key={v.id}>
                                <button
                                    onClick={() => {
                                        onChange(v);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <p className="font-semibold">{v.name}</p>
                                    <p className="text-xs text-gray-500">{v.timestamp}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

interface MarkupSetSelectorProps {
    markupSets: MarkupSet[];
    loadedSetIds: string[];
    onToggle: (set: MarkupSet) => void;
    disabled: boolean;
}

const MarkupSetSelector: React.FC<MarkupSetSelectorProps> = ({ markupSets, loadedSetIds, onToggle, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (MENUS_MODE) return;
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSets = markupSets.filter(set => 
        set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const loadedCount = loadedSetIds.length;

    return (
        <div className="relative" ref={selectorRef}>
             <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="linarc-toolbar-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Load Markup Sets"
                type="button"
            >
                <SquarePenIcon className="linarc-toolbar-icon" aria-hidden />
                <span className="hidden sm:inline shrink-0 leading-none">Load Markup</span>
                {loadedCount > 0 && (
                    <span
                        className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-medium leading-none text-white tabular-nums"
                        aria-hidden
                    >
                        {loadedCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search markups..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 pr-7 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                                autoFocus
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    aria-label="Clear search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="p-2">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">Available Markups</h4>
                        {filteredSets.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1">No saved markups found.</p>
                        ) : (
                            <ul className="max-h-60 overflow-y-auto space-y-1">
                                {filteredSets.map(set => {
                                    const isLoaded = loadedSetIds.includes(set.id);
                                    return (
                                        <li key={set.id}>
                                            <button
                                                onClick={() => onToggle(set)}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-start gap-3 ${isLoaded ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                                            >
                                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isLoaded ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400 dark:border-zinc-500'}`}>
                                                    {isLoaded && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7L5.5 9.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                </div>
                                                <div className="flex-grow">
                                                    <p className={`font-semibold ${isLoaded ? 'text-blue-800 dark:text-blue-300' : 'text-gray-800 dark:text-zinc-200'}`}>{set.name}</p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <p className="text-xs text-gray-500">{set.author}</p>
                                                        <p className="text-xs text-gray-400">{set.timestamp}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

interface HeaderProps {
    onBack: () => void;
    currentDrawing: DrawingData | null;
    allDrawings: DrawingData[];
    onDrawingChange: (drawing: DrawingData) => void;
    currentVersion: DrawingVersion | null;
    onVersionChange: (version: DrawingVersion) => void;
    hasUnsavedChanges: boolean;
    onSave: () => void;
    onShare: () => void;
    onDownload: () => void;
    filters: Record<FilterCategory, boolean>;
    areFiltersActive: boolean;
    isFilterMenuOpen: boolean;
    setIsFilterMenuOpen: (isOpen: boolean) => void;
    handleFilterChange: (filter: FilterCategory) => void;
    handleToggleAllFilters: () => void;
    markupSets: MarkupSet[];
    loadedSetIds: string[];
    onToggleMarkupSet: (set: MarkupSet) => void;
    onCompare: () => void;
    compareMode?: { left: CompareSheetChoice; right: CompareSheetChoice } | null;
    onExitCompare?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    onBack,
    currentDrawing,
    allDrawings,
    onDrawingChange,
    currentVersion,
    onVersionChange,
    hasUnsavedChanges,
    onSave,
    onShare,
    onDownload,
    filters,
    areFiltersActive,
    isFilterMenuOpen,
    setIsFilterMenuOpen,
    handleFilterChange,
    handleToggleAllFilters,
    markupSets,
    loadedSetIds,
    onToggleMarkupSet,
    onCompare,
    compareMode,
    onExitCompare,
}) => {
    const filterMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (MENUS_MODE) return;
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setIsFilterMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsFilterMenuOpen]);

    if (compareMode) {
        return (
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/95">
                <Tooltip text="Exit compare mode" position="bottom">
                    <button
                        type="button"
                        onClick={onExitCompare}
                        className="linarc-toolbar-btn-secondary flex flex-shrink-0 items-center gap-1.5 px-3 text-sm font-medium"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Back
                    </button>
                </Tooltip>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate max-w-[14rem]" title={`${compareMode.left.drawing.id} · ${compareMode.left.version.name}`}>
                            {compareMode.left.drawing.id} <span className="font-normal text-gray-500 dark:text-zinc-400">· {compareMode.left.version.name}</span>
                        </span>
                    </div>
                    <span className="text-xs font-medium text-gray-400 dark:text-zinc-500 flex-shrink-0">vs</span>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate max-w-[14rem]" title={`${compareMode.right.drawing.id} · ${compareMode.right.version.name}`}>
                            {compareMode.right.drawing.id} <span className="font-normal text-gray-500 dark:text-zinc-400">· {compareMode.right.version.name}</span>
                        </span>
                    </div>
                    <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex-shrink-0">
                        Compare Mode
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/95">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <button type="button" onClick={onBack} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-200 dark:text-zinc-400 dark:hover:bg-zinc-800" title="Back to drawings">
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <DrawingSelector drawings={allDrawings} value={currentDrawing} onChange={onDrawingChange} className="w-auto min-w-[8rem] max-w-[22rem] shrink" />
                <DrawingVersionSelector versions={currentDrawing?.versions || []} value={currentVersion} onChange={onVersionChange} disabled={!currentDrawing} className="w-auto min-w-[8rem] max-w-[13rem] flex-shrink-0" />
                <MarkupSetSelector
                    markupSets={currentDrawing ? markupSets.filter(s => s.drawingId === currentDrawing?.id && s.versionId === currentVersion?.id) : markupSets}
                    loadedSetIds={loadedSetIds}
                    onToggle={onToggleMarkupSet}
                    disabled={false}
                />
            </div>
            <div className="flex items-center gap-1.5">
                 <div ref={filterMenuRef} className="relative">
                    <Tooltip text="Filter items" position="bottom">
                    <button type="button" onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className="linarc-toolbar-btn-secondary relative">
                        <FilterIcon className="linarc-toolbar-icon" />
                        {areFiltersActive && <span className="absolute -right-0.5 -top-0.5 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-800" />}
                    </button>
                    </Tooltip>
                    {isFilterMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-linarc-md z-50 p-4">
                           <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-zinc-700 mb-2">
                                <h4 className="font-semibold">Filter Items</h4>
                                <button onClick={handleToggleAllFilters} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                    {Object.values(filters).every(v => v) ? 'Hide All' : 'Show All'}
                                </button>
                           </div>
                           <div className="space-y-2">
                                {(Object.keys(filters) as FilterCategory[]).map(key => (
                                    <label key={key} className="flex items-center justify-between cursor-pointer">
                                        <span className="capitalize text-sm text-gray-700 dark:text-gray-300">{key.replace('punch', 'Punch Item').replace('safety', 'Safety Issue')}</span>
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={filters[key]} onChange={() => handleFilterChange(key)} />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${filters[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${filters[key] ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                    </label>
                                ))}
                           </div>
                        </div>
                    )}
                </div>
                <Tooltip text="Share drawing" position="bottom">
                    <button type="button" onClick={onShare} className="linarc-toolbar-btn-secondary">
                        <ShareIcon className="linarc-toolbar-icon" />
                    </button>
                </Tooltip>
                <Tooltip text="Download snapshot" position="bottom">
                    <button type="button" onClick={onDownload} className="linarc-toolbar-btn-secondary">
                        <SnapshotIcon className="linarc-toolbar-icon" />
                    </button>
                </Tooltip>
                <Tooltip text="Compare two sheets" position="bottom">
                    <button type="button" onClick={onCompare} className="linarc-toolbar-btn-secondary">
                        <DocumentDuplicateIcon className="linarc-toolbar-icon" />
                    </button>
                </Tooltip>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={!hasUnsavedChanges}
                    className="linarc-toolbar-btn-primary"
                >
                    Save Markup
                </button>
            </div>
        </div>
    );
};

/** Floats over the canvas to open a panel only. Close uses panel chrome (layers header / right panel header). */
const CanvasSidebarFloatToggles: React.FC<{
    isLayersOpen: boolean;
    onToggleLayers: () => void;
    isRightPanelOpen: boolean;
    onToggleRightPanel: () => void;
}> = ({ isLayersOpen, onToggleLayers, isRightPanelOpen, onToggleRightPanel }) => {
    const reduceMotion = useReducedMotion();
    const [showLeftFloat, setShowLeftFloat] = useState(false);
    const [showRightFloat, setShowRightFloat] = useState(false);

    useEffect(() => {
        if (isLayersOpen) {
            setShowLeftFloat(false);
            return;
        }
        setShowLeftFloat(true);
    }, [isLayersOpen]);

    useEffect(() => {
        if (isRightPanelOpen) {
            setShowRightFloat(false);
            return;
        }
        setShowRightFloat(true);
    }, [isRightPanelOpen]);

    const introSpring = reduceMotion
        ? { duration: 0.12, delay: 0 }
        : {
              type: 'spring' as const,
              stiffness: 520,
              damping: 22,
              mass: 0.65,
              delay: 0,
          };
    const exitEase = reduceMotion ? { duration: 0.1, delay: 0 } : { duration: 0.18, delay: 0, ease: [0.32, 0.72, 0, 1] as const };

    const openPill =
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300/90 bg-gray-100/95 text-gray-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-gray-200/90 dark:border-zinc-600 dark:bg-zinc-800/95 dark:text-zinc-200 dark:hover:bg-zinc-700/90';

    const hidden = reduceMotion
        ? { opacity: 0, scale: 0.96 }
        : { opacity: 0, scale: 0.78, y: 6, filter: 'blur(8px)' };
    const visible = reduceMotion
        ? { opacity: 1, scale: 1 }
        : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' };
    const exit = reduceMotion
        ? { opacity: 0, scale: 0.96 }
        : { opacity: 0, scale: 0.9, y: 3, filter: 'blur(3px)' };

    return (
        <div className="pointer-events-none absolute inset-0 z-30" role="toolbar" aria-label="Open side panels">
            <AnimatePresence mode="sync">
                {showLeftFloat && (
                    <motion.div
                        key="sidebar-float-left"
                        className="pointer-events-auto absolute left-3 top-3 will-change-transform"
                        style={{ transformOrigin: '20% 50%' }}
                        initial={hidden}
                        animate={{ ...visible, transition: introSpring }}
                        exit={{ ...exit, transition: exitEase }}
                    >
                        <Tooltip text="Layers" position="right">
                            <button
                                type="button"
                                onClick={onToggleLayers}
                                className={openPill}
                                aria-label="Open layers panel"
                            >
                                <PanelLeftIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    </motion.div>
                )}
                {showRightFloat && (
                    <motion.div
                        key="sidebar-float-right"
                        className="pointer-events-auto absolute right-3 top-3 will-change-transform"
                        style={{ transformOrigin: '80% 50%' }}
                        initial={hidden}
                        animate={{ ...visible, transition: introSpring }}
                        exit={{ ...exit, transition: exitEase }}
                    >
                        <Tooltip text="Details" position="left">
                            <button
                                type="button"
                                onClick={onToggleRightPanel}
                                className={openPill}
                                aria-label="Open details panel"
                            >
                                <PanelRightIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const App: React.FC = () => {
  const isLineMarkup = (id: string, lines: LineMarkup[]) => lines.some((line) => line.id === id);
  const isTextMarkup = (id: string, texts: TextMarkup[]) => texts.some((t) => t.id === id);
  // Core Data State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [lineMarkups, setLineMarkups] = useState<LineMarkup[]>([]);
  const [textMarkups, setTextMarkups] = useState<TextMarkup[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [drawingScale, setDrawingScale] = useState<number | null>(null); // natural img pixels per foot
  /** Bumped when user clears scale from UI so CanvasView resets calibration state */
  const [drawingScaleClearTick, setDrawingScaleClearTick] = useState(0);
  /** Bumped when user recalibrates; CanvasView resets UI and reopens scale dialog */
  const [drawingScaleRecalibrateTick, setDrawingScaleRecalibrateTick] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [allRfis, setAllRfis] = useState<RfiData[]>(mockRfis);
  const [allPunches, setAllPunches] = useState<PunchData[]>(mockPunches);
  const [allSafetyIssues, setAllSafetyIssues] = useState<SafetyIssueData[]>(mockSafetyIssues);
  
  // Selection & Interaction State
  const [selectedRectIds, setSelectedRectIds] = useState<string[]>(MENUS_MODE ? ['rect-101'] : []);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedLinePointIndex, setSelectedLinePointIndex] = useState<number | null>(null);
  const [hoveredRectId, setHoveredRectId] = useState<string | null>(null);
  const [linkMenuRectId, setLinkMenuRectId] = useState<string | null>(MENUS_MODE ? 'rect-101' : null);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [pinDragOffset, setPinDragOffset] = useState<{x: number, y: number} | null>(null);
  const [hoveredItem, setHoveredItem] = useState<HoveredItemInfo | null>(null);
  const [pinTargetCoords, setPinTargetCoords] = useState<{x: number, y: number} | null>(null);
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  const [imageGeom, setImageGeom] = useState<ImageGeom>({ width: 0, height: 0, x: 0, y: 0 });

  // Tool State
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [activeLineTool, setActiveLineTool] = useState<LineToolType>('arrow');
  const [activeShape, setActiveShape] = useState<'cloud' | 'box' | 'ellipse'>('box');
  const [activePinType, setActivePinType] = useState<'safety' | 'punch'>('safety');
  const [activeColor, setActiveColor] = useState<'fill' | 'stroke'>('fill');
  const [markupFillColor, setMarkupFillColor] = useState<string>(DEFAULT_MARKUP_FILL);
  const [markupStrokeColor, setMarkupStrokeColor] = useState<string>('#EF4444');

  // Panel & Modal State
  const [activePanel, setActivePanel] = useState<'rfi' | 'safety' | 'punch' | 'empty' | null>(null);

  const [rfiTargetRectId, setRfiTargetRectId] = useState<string | null>(null);
  const [rfiTargetRfiId, setRfiTargetRfiId] = useState<number | null>(null);
  const [rfiFormData, setRfiFormData] = useState<RfiFormState>(DEFAULT_RFI_FORM);
  const [isRfiEditMode, setIsRfiEditMode] = useState(false);

  const [safetyTargetPinId, setSafetyTargetPinId] = useState<string | null>(null);
  const [safetyFormData, setSafetyFormData] = useState<Omit<SafetyIssueData, 'id'>>({ title: '', description: '', status: 'Open', severity: 'Medium' });

  const [punchTargetPinId, setPunchTargetPinId] = useState<string | null>(null);
  const [punchFormData, setPunchFormData] = useState<Omit<PunchData, 'id'>>({ title: '', status: 'Open', assignee: '' });
  const [punchPanelMode, setPunchPanelMode] = useState<'create' | 'link'>('create');
  const [punchSearchTerm, setPunchSearchTerm] = useState('');
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalConfig, setLinkModalConfig] = useState<LinkModalConfig | null>(null);
  const [linkTargetRectId, setLinkTargetRectId] = useState<string | null>(null);
  
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [photoPickerTargetId, setPhotoPickerTargetId] = useState<string | null>(null);

  const [isPhotoMarkupOpen, setIsPhotoMarkupOpen] = useState(false);
  const [photoMarkupTarget, setPhotoMarkupTarget] = useState<PhotoData | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareMode, setCompareMode] = useState<{
    left: CompareSheetChoice;
    right: CompareSheetChoice;
    leftVisible: boolean;
    rightVisible: boolean;
  } | null>(null);
  const [compareAlignment, setCompareAlignment] = useState<{
    offset: { x: number; y: number };
    status: 'idle' | 'aligning' | 'aligned';
  }>({ offset: { x: 0, y: 0 }, status: 'idle' });
  const [isPublishWarningOpen, setIsPublishWarningOpen] = useState(false);
  const pendingNavCallback = useRef<(() => void) | null>(null);

  // UI State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>('bottom');
  const [isMenuVisible, setIsMenuVisible] = useState(MENUS_MODE);
  const [openLinkSubmenu, setOpenLinkSubmenu] = useState<string | null>(MENUS_MODE ? 'rfi' : null);
  const [filters, setFilters] = useState<Record<FilterCategory, boolean>>({
    rfi: true,
    submittal: true,
    punch: true,
    drawing: true,
    photo: true,
    safety: true,
  });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(MENUS_MODE);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(true);
  const [expandedLayerIds, setExpandedLayerIds] = useState<string[]>([]);

  // Drawing and Save State
  const [allDrawings, setAllDrawings] = useState<DrawingData[]>(mockDrawings);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingData | null>(null);
  const [currentVersion, setCurrentVersion] = useState<DrawingVersion | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [allMarkupSets, setAllMarkupSets] = useState<MarkupSet[]>(mockMarkupSets);
  
  // New State for Markup Sets
  const [loadedSetIds, setLoadedSetIds] = useState<string[]>([]);


  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hidePopupTimer = useRef<number | null>(null);
  const showPopupTimer = useRef<number | null>(null);
  const mouseDownRef = useRef<{x: number, y: number} | null>(null);
  const lastMarkupSyncedRectId = useRef<string | null>(null);

  // Custom Hooks for complex logic
  const canvasVisible = !!(imageSrc || currentDrawing);
  const { viewTransform, setViewTransform, handleZoom } = useZoomPan(imageContainerRef, canvasVisible);

  const defaultDownloadFileName = useMemo(() => {
    if (currentDrawing) return `${currentDrawing.id}_markup`;
    return 'Drawing_markup';
  }, [currentDrawing]);

  useEffect(() => {
    if (currentDrawing) {
        const latestVersion = currentDrawing.versions[0];
        setCurrentVersion(latestVersion);
        setImageSrc(latestVersion.thumbnailUrl);
        setRectangles([]);
        setPins([]);
        setLineMarkups([]);
        setTextMarkups([]);
        setSelectedTextId(null);
        setMeasurements([]);
        setDrawingScale(null);
        setDrawingScaleClearTick((t) => t + 1);
        setNaturalSize({ width: 0, height: 0 });
        setSelectedRectIds([]);
        setSelectedLineId(null);
        setSelectedLinePointIndex(null);
        setHoveredRectId(null);
        setLinkMenuRectId(null);
        setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
        setHasUnsavedChanges(false);
        setLoadedSetIds([]); // Reset loaded sets when switching drawing
    } else {
        setCurrentVersion(null);
    }
  }, [currentDrawing, setViewTransform]);

  const handleImageGeomChange = useCallback((geom: ImageGeom) => {
    setImageGeom(geom);
  }, []);

  const getRelativeCoords = useCallback((event: React.MouseEvent | WheelEvent | MouseEvent): { x: number; y: number } | null => {
    if (!imageContainerRef.current || !imageGeom.width) return null;

    const containerRect = imageContainerRef.current.getBoundingClientRect();

    // Mouse position relative to the container
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;

    // Undo the pan/zoom transformation
    const transformedMouseX = (mouseX - viewTransform.translateX) / viewTransform.scale;
    const transformedMouseY = (mouseY - viewTransform.translateY) / viewTransform.scale;

    // Mouse position relative to the actual rendered image
    const imageCoordX = transformedMouseX - imageGeom.x;
    const imageCoordY = transformedMouseY - imageGeom.y;

    // Calculate percentage relative to the rendered image dimensions
    let x = (imageCoordX / imageGeom.width) * 100;
    let y = (imageCoordY / imageGeom.height) * 100;

    // Clamp to image bounds
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    return { x, y };
  }, [viewTransform, imageGeom]);
  
    const handleRfiCancel = useCallback(() => {
    setActivePanel(null);
    setRfiTargetRectId(null);
    setRfiTargetRfiId(null);
    setRfiFormData(DEFAULT_RFI_FORM);
    setIsRfiEditMode(false);
    if (activeTool === 'pin') {
        setActiveTool('select');
    }
  }, [activeTool]);
  
  const handleOpenRfiPanel = useCallback((rectId: string, rfiId: number | null) => {
    if (rfiId !== null) {
        const rfiToEdit = allRfis.find(r => r.id === rfiId);
        if (rfiToEdit) {
            setRfiFormData({
              title: rfiToEdit.title,
              type: rfiToEdit.type,
              question: rfiToEdit.question,
              priority: rfiToEdit.priority ?? '',
              sequence: rfiToEdit.sequence ?? '',
              location: rfiToEdit.location ?? '',
              scheduleImpact: rfiToEdit.scheduleImpact ?? 'Yes',
              costImpact: rfiToEdit.costImpact ?? 'Yes',
              answer: rfiToEdit.answer ?? '',
            });
            setIsRfiEditMode(true);
        } else {
            return;
        }
    } else {
        setRfiFormData(DEFAULT_RFI_FORM);
        setIsRfiEditMode(false);
    }
    
    setRfiTargetRectId(rectId);
    setRfiTargetRfiId(rfiId);
    setActivePanel('rfi');
    setLinkMenuRectId(null);
  }, [allRfis]);

  const handleSubmenuLink = useCallback((e: React.MouseEvent, type: string, targetId: string | null) => {
    e.stopPropagation();
    setLinkMenuRectId(null);
    if(targetId !== 'pin') {
        setLinkTargetRectId(targetId);
    } else {
        setLinkTargetRectId(null);
    }

    switch (type) {
        case 'New RFI':
            if (targetId) handleOpenRfiPanel(targetId, null);
            break;
        case 'Link RFI':
            setLinkModalConfig({
                type: 'rfi',
                title: 'Link to an Existing RFI',
                items: allRfis.map(rfi => ({ ...rfi, titleWithId: `RFI-${rfi.id}: ${rfi.title}` })),
                displayFields: [{ key: 'titleWithId' }],
                searchFields: ['title', 'question', 'id'],
            });
            setIsLinkModalOpen(true);
            break;
        case 'Link Submittal':
            setLinkModalConfig({
                type: 'submittal',
                title: 'Link to a Submittal',
                items: mockSubmittals,
                displayFields: [{ key: 'id' }, { key: 'title' }],
                searchFields: ['id', 'title', 'specSection'],
            });
            setIsLinkModalOpen(true);
            break;
        case 'Link Punch':
            setLinkModalConfig({
                type: 'punch',
                title: 'Link to a Punch List Item',
                items: allPunches,
                displayFields: [{ key: 'id' }, { key: 'title' }],
                searchFields: ['id', 'title', 'assignee'],
            });
            setIsLinkModalOpen(true);
            break;
        case 'Link Drawing':
            setLinkModalConfig({
                type: 'drawing',
                title: 'Link to a Drawing',
                items: allDrawings.map(d => ({id: d.id, title: d.title})),
                displayFields: [{ key: 'id' }, { key: 'title' }],
                searchFields: ['id', 'title'],
            });
            setIsLinkModalOpen(true);
            break;
        case 'Link Photo':
            setPhotoPickerTargetId(targetId);
            setIsPhotoPickerOpen(true);
            break;
        default:
            alert(`Linking ${type} for rectangle ${targetId}`);
            break;
    }
  }, [allRfis, allPunches, allDrawings, handleOpenRfiPanel]);

  const handleSetActiveTool = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
    if (tool === 'line' || tool === 'arrow' || tool === 'freeline') {
      setActiveLineTool(tool);
    }
    setActivePanel(null);
  }, []);

  /** Clears scale only after user clicks "Start Calibrating" in the modal (see CanvasView). */
  const handleBeginScaleRecalibration = useCallback(() => {
    setDrawingScale(null);
  }, []);

  /** Opens scale modal without clearing scale — measurements stay valid until user starts calibrating or cancels. */
  const handleRecalibrateDrawingScale = useCallback(() => {
    setDrawingScaleRecalibrateTick((t) => t + 1);
    handleSetActiveTool('measurement');
  }, [handleSetActiveTool]);

  const handleMarkupColorChange = useCallback(
    (mode: 'fill' | 'stroke', value: string) => {
      if (mode === 'fill') setMarkupFillColor(value);
      else setMarkupStrokeColor(value);
      setRectangles((prev) => {
        if (selectedRectIds.length === 0) return prev;
        return prev.map((r) =>
          selectedRectIds.includes(r.id)
            ? { ...r, ...(mode === 'fill' ? { fillColor: value } : { strokeColor: value }) }
            : r
        );
      });
      if (selectedLineIds.length > 0) {
        setLineMarkups((prev) => prev.map((line) => selectedLineIds.includes(line.id) ? { ...line, ...(mode === 'fill' ? { fillColor: value } : { strokeColor: value }) } : line));
      }
      if (selectedRectIds.length > 0 || selectedLineIds.length > 0) setHasUnsavedChanges(true);
    },
    [selectedRectIds, selectedLineIds]
  );

  const handleMarkupActiveModeChange = useCallback((mode: 'fill' | 'stroke') => {
    setActiveColor(mode);
    setActivePanel(null);
  }, []);

  useEffect(() => {
    if (selectedRectIds.length === 0 && selectedLineIds.length === 0) {
      lastMarkupSyncedRectId.current = null;
      return;
    }
    const id = selectedRectIds[0] || selectedLineIds[0];
    if (lastMarkupSyncedRectId.current === id) return;
    lastMarkupSyncedRectId.current = id;
    const r = rectangles.find((x) => x.id === id);
    if (r) {
      setMarkupFillColor(
        r.fillColor !== undefined ? r.fillColor : resolveRectFillColor(r, r.shape, true, theme)
      );
      setMarkupStrokeColor(
        r.strokeColor !== undefined ? r.strokeColor : resolveRectStrokeColor(r, false)
      );
      return;
    }
    const l = lineMarkups.find((x) => x.id === id);
    if (l) {
      setMarkupFillColor(l.fillColor ?? 'transparent');
      setMarkupStrokeColor(l.strokeColor ?? '#EF4444');
    }
  }, [selectedRectIds, selectedLineIds, rectangles, lineMarkups, theme]);

  const handleToggleItemLock = useCallback((id: string, type: 'rect' | 'pin' | 'line') => {
    if (type === 'rect') {
        setRectangles(prev => prev.map(r => r.id === id ? { ...r, locked: !r.locked } : r));
    } else if (type === 'pin') {
        setPins(prev => prev.map(p => p.id === id ? { ...p, locked: !p.locked } : p));
    } else {
        setLineMarkups(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
    }
    setHasUnsavedChanges(true);
  }, []);

  const {
    interaction,
    currentRect,
    currentLineMarkup,
    marqueeRect,
    hoveredLineId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useCanvasInteraction({
    rectangles, setRectangles,
    pins, setPins,
    activeTool, activeShape, activePinType,
    selectedRectIds, setSelectedRectIds,
    setSelectedPinId,
    viewTransform, setViewTransform,
    isRfiPanelOpen: activePanel === 'rfi', handleRfiCancel,
    setLinkMenuRectId,
    draggingPinId, setDraggingPinId,
    lineMarkups, setLineMarkups,
    selectedLineIds, setSelectedLineIds,
    selectedLineId, setSelectedLineId,
    selectedLinePointIndex, setSelectedLinePointIndex,
    getRelativeCoords,
    handleSubmenuLink,
    setPinTargetCoords,
    setSafetyTargetPinId, setSafetyFormData,
    setPunchTargetPinId, setPunchFormData, setPunchPanelMode,
    setActivePanel,
    mouseDownRef,
    isSpacebarDown,
    setHasUnsavedChanges,
    pinDragOffset,
    markupFillColor,
    markupStrokeColor,
    onDrawingComplete: () => setActiveTool('select'),
  });

  const deleteSelection = useCallback(() => {
    let changed = false;
    if (selectedRectIds.length > 0) {
        // Filter out locked items
        const lockedIds = rectangles.filter(r => selectedRectIds.includes(r.id) && r.locked).map(r => r.id);
        const idsToDelete = selectedRectIds.filter(id => !lockedIds.includes(id));
        
        if (idsToDelete.length > 0) {
             setRectangles(rects => rects.filter(r => !idsToDelete.includes(r.id)));
             // Keep locked items selected
             setSelectedRectIds(lockedIds); 
             setLinkMenuRectId(null);
             changed = true;
        }
    }
    if (selectedPinId) {
        const pin = pins.find(p => p.id === selectedPinId);
        if (pin && !pin.locked) {
            setPins(pins => pins.filter(p => p.id !== selectedPinId));
            setSelectedPinId(null);
            changed = true;
        }
    }
    if (selectedLineId) {
      const selectedLine = lineMarkups.find((line) => line.id === selectedLineId);
      if (selectedLine?.locked) {
        return;
      }
      if (selectedLinePointIndex === null) {
        setLineMarkups((prev) => prev.filter((line) => line.id !== selectedLineId));
        setSelectedLineId(null);
      } else {
        setLineMarkups((prev) => prev.map((line) => {
          if (line.id !== selectedLineId) return line;
          return {
            ...line,
            points: line.points.filter((_, idx) => idx !== selectedLinePointIndex),
          };
        }).filter((line) => line.points.length >= 2));
        setSelectedLinePointIndex(null);
      }
      changed = true;
    }
    if (selectedLineIds.length > 1) {
      const unlockedLineIds = selectedLineIds.filter((id) => !lineMarkups.find((line) => line.id === id)?.locked);
      if (unlockedLineIds.length > 0) {
        setLineMarkups((prev) => prev.filter((line) => !unlockedLineIds.includes(line.id)));
        setSelectedLineIds([]);
        setSelectedLineId(null);
        setSelectedLinePointIndex(null);
        changed = true;
      }
    }
    if (selectedTextId) {
      const text = textMarkups.find(t => t.id === selectedTextId);
      if (text && !text.locked) {
        setTextMarkups(prev => prev.filter(t => t.id !== selectedTextId));
        setSelectedTextId(null);
        changed = true;
      }
    }
    if (changed) setHasUnsavedChanges(true);
  }, [selectedRectIds, selectedPinId, rectangles, pins, selectedLineId, selectedLinePointIndex, lineMarkups, selectedLineIds, selectedTextId, textMarkups]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable || isLinkModalOpen || isShareModalOpen || isDownloadModalOpen || isCompareModalOpen) {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'v':
                e.preventDefault();
                handleSetActiveTool('select');
                break;
            case 'r':
                e.preventDefault();
                setActiveShape('box');
                handleSetActiveTool('shape');
                break;
            case 'e':
                e.preventDefault();
                setActiveShape('ellipse');
                handleSetActiveTool('shape');
                break;
            case 'p':
                e.preventDefault();
                handleSetActiveTool('pin');
                break;
            case 't':
                e.preventDefault();
                handleSetActiveTool('text');
                break;
            case 'delete':
            case 'backspace':
                e.preventDefault();
                deleteSelection();
                break;
            case 'escape':
                e.preventDefault();
                setSelectedRectIds([]);
                setSelectedLineIds([]);
                setSelectedLineId(null);
                setSelectedLinePointIndex(null);
                setSelectedPinId(null);
                setSelectedTextId(null);
                break;
        }
        
        if (e.code === 'Space' && !isSpacebarDown) {
            e.preventDefault();
            setIsSpacebarDown(true);
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            e.preventDefault();
            setIsSpacebarDown(false);
            if (interaction.type === 'panning') {
                handleMouseUp({} as React.MouseEvent<HTMLDivElement>);
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
      handleSetActiveTool,
      setActiveShape,
      deleteSelection,
      isSpacebarDown,
      isLinkModalOpen,
      isShareModalOpen,
      isDownloadModalOpen,
      isCompareModalOpen,
      interaction,
      handleMouseUp
  ]);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = ''; // Required for Chrome
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  
  useEffect(() => {
    setIsMenuVisible(false);
    if (selectedRectIds.length === 1 || selectedLineIds.length > 0 || selectedTextId) {
      const timer = setTimeout(() => setIsMenuVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [selectedRectIds, selectedLineIds, selectedTextId]);

  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const resetState = (src: string) => {
        setRectangles([]);
        setPins([]);
        setLineMarkups([]);
        setSelectedRectIds([]);
        setHoveredRectId(null);
        setLinkMenuRectId(null);
        setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
        setImageSrc(src);
        setCurrentDrawing(null);
        setCurrentVersion(null);
        setHasUnsavedChanges(false);
        setLoadedSetIds([]);
    };

    if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
                // @ts-ignore
                const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
                const page = await pdf.getPage(1);
                
                // Use a high scale for blueprint clarity
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context!, viewport }).promise;
                resetState(canvas.toDataURL());
            } catch (err) {
                console.error("Error rendering PDF:", err);
                alert("Could not load PDF. Please ensure it is a valid document.");
            }
        };
        reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            resetState(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  const handleSelectLinkItem = (item: any) => {
    if (linkTargetRectId) {
        if (isTextMarkup(linkTargetRectId, textMarkups)) {
          setTextMarkups((prevTexts) => prevTexts.map((t) => {
            if (t.id !== linkTargetRectId) return t;
            const updated = { ...t };
            switch (linkModalConfig?.type) {
              case 'rfi':
                if (!updated.rfi) updated.rfi = [];
                if (!updated.rfi.some((r) => r.id === item.id)) {
                  const originalRfi = allRfis.find((rfi) => rfi.id === item.id);
                  if (originalRfi) updated.rfi.push(originalRfi);
                }
                break;
              case 'submittal':
                if (!updated.submittals) updated.submittals = [];
                if (!updated.submittals.some((s) => s.id === item.id)) updated.submittals.push(item);
                break;
              case 'punch':
                if (!updated.punches) updated.punches = [];
                if (!updated.punches.some((p) => p.id === item.id)) updated.punches.push(item);
                break;
              case 'drawing':
                if (!updated.drawings) updated.drawings = [];
                const fullDrawing = allDrawings.find((d) => d.id === item.id);
                if (fullDrawing && !updated.drawings.some((d) => d.id === item.id)) updated.drawings.push(fullDrawing);
                break;
            }
            return updated;
          }));
        } else if (isLineMarkup(linkTargetRectId, lineMarkups)) {
          setLineMarkups((prevLines) => prevLines.map((line) => {
            if (line.id !== linkTargetRectId) return line;
            const updated = { ...line };
            switch (linkModalConfig?.type) {
              case 'rfi':
                if (!updated.rfi) updated.rfi = [];
                if (!updated.rfi.some((r) => r.id === item.id)) {
                  const originalRfi = allRfis.find((rfi) => rfi.id === item.id);
                  if (originalRfi) updated.rfi.push(originalRfi);
                }
                break;
              case 'submittal':
                if (!updated.submittals) updated.submittals = [];
                if (!updated.submittals.some((s) => s.id === item.id)) updated.submittals.push(item);
                break;
              case 'punch':
                if (!updated.punches) updated.punches = [];
                if (!updated.punches.some((p) => p.id === item.id)) updated.punches.push(item);
                break;
              case 'drawing':
                if (!updated.drawings) updated.drawings = [];
                const fullDrawing = allDrawings.find((d) => d.id === item.id);
                if (fullDrawing && !updated.drawings.some((d) => d.id === item.id)) updated.drawings.push(fullDrawing);
                break;
            }
            return updated;
          }));
        } else {
          setRectangles(prevRects => prevRects.map(rect => {
              if (rect.id === linkTargetRectId) {
                  const newRect = { ...rect };
                  switch (linkModalConfig?.type) {
                      case 'rfi':
                          if (!newRect.rfi) newRect.rfi = [];
                          if (!newRect.rfi.some(r => r.id === item.id)) {
                              const originalRfi = allRfis.find(rfi => rfi.id === item.id);
                              if(originalRfi) newRect.rfi.push(originalRfi);
                          }
                          break;
                      case 'submittal':
                          if (!newRect.submittals) newRect.submittals = [];
                          if (!newRect.submittals.some(s => s.id === item.id)) newRect.submittals.push(item);
                          break;
                      case 'punch':
                          if (!newRect.punches) newRect.punches = [];
                          if (!newRect.punches.some(p => p.id === item.id)) newRect.punches.push(item);
                          break;
                      case 'drawing':
                          if (!newRect.drawings) newRect.drawings = [];
                          const fullDrawing = allDrawings.find(d => d.id === item.id);
                          if (fullDrawing && !newRect.drawings.some(d => d.id === item.id)) newRect.drawings.push(fullDrawing);
                          break;
                  }
                  return newRect;
              }
              return rect;
          }));
        }
        setExpandedLayerIds(prev => [...new Set([...prev, linkTargetRectId])]);
        setHasUnsavedChanges(true);
    }

    setIsLinkModalOpen(false);
    setLinkModalConfig(null);
    setLinkTargetRectId(null);
  };

  const handlePhotoLinked = (photo: PhotoData) => {
    if (!photoPickerTargetId) return;
    const targetId = photoPickerTargetId;

    const getExistingPhotos = (): PhotoData[] => {
      const txt = textMarkups.find(t => t.id === targetId);
      if (txt) return txt.photos ?? [];
      const line = lineMarkups.find(l => l.id === targetId);
      if (line) return line.photos ?? [];
      const rect = rectangles.find(r => r.id === targetId);
      return rect?.photos ?? [];
    };

    const existing = getExistingPhotos();
    if (existing.length > 0 && !existing.some(p => p.id === photo.id)) {
      if (!window.confirm(`This item already has ${existing.length} linked photo${existing.length > 1 ? 's' : ''}. Replace with the selected photo?`)) return;
      const replace = <T extends { photos?: PhotoData[] }>(item: T): T => ({ ...item, photos: [photo] });
      if (isTextMarkup(targetId, textMarkups)) {
        setTextMarkups(prev => prev.map(t => t.id === targetId ? replace(t) : t));
      } else if (isLineMarkup(targetId, lineMarkups)) {
        setLineMarkups(prev => prev.map(l => l.id === targetId ? replace(l) : l));
      } else {
        setRectangles(prev => prev.map(r => r.id === targetId ? replace(r) : r));
      }
    } else {
      const push = <T extends { photos?: PhotoData[] }>(item: T): T => {
        if (item.photos?.some(p => p.id === photo.id)) return item;
        return { ...item, photos: [...(item.photos ?? []), photo] };
      };
      if (isTextMarkup(targetId, textMarkups)) {
        setTextMarkups(prev => prev.map(t => t.id === targetId ? push(t) : t));
      } else if (isLineMarkup(targetId, lineMarkups)) {
        setLineMarkups(prev => prev.map(l => l.id === targetId ? push(l) : l));
      } else {
        setRectangles(prev => prev.map(r => r.id === targetId ? push(r) : r));
      }
    }
    setExpandedLayerIds(prev => [...new Set([...prev, targetId])]);
    setHasUnsavedChanges(true);
    setIsPhotoPickerOpen(false);
    setPhotoPickerTargetId(null);
  };

  const handleRfiFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const el = e.target;
    const name = el.name as keyof RfiFormState;
    if (el instanceof HTMLInputElement && el.type === 'radio') {
      setRfiFormData((prev) => ({ ...prev, [name]: el.value as RfiFormState[typeof name] }));
      return;
    }
    setRfiFormData((prev) => ({ ...prev, [name]: el.value }));
  };

  const handleRfiHeaderTrash = useCallback(() => {
    if (isRfiEditMode && rfiTargetRfiId !== null) {
      if (!window.confirm('Delete this RFI? It will be removed from the drawing and the list.')) return;
      setAllRfis((prev) => prev.filter((r) => r.id !== rfiTargetRfiId));
      setRectangles((prev) =>
        prev.map((rect) => ({
          ...rect,
          rfi: rect.rfi?.filter((r) => r.id !== rfiTargetRfiId),
        }))
      );
      setHasUnsavedChanges(true);
      handleRfiCancel();
    } else {
      setRfiFormData({ ...DEFAULT_RFI_FORM });
    }
  }, [isRfiEditMode, rfiTargetRfiId, handleRfiCancel]);

  const handleRfiDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(rfiFormData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safe = (rfiFormData.title || 'draft').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 48);
    a.download = `rfi-${safe || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rfiFormData]);

  const handleRfiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    if (isRfiEditMode && rfiTargetRfiId !== null) {
      // Editing an existing RFI
      const updatedRfiData = { id: rfiTargetRfiId, ...rfiFormData };
      
      // Update the master list
      setAllRfis(prev => prev.map(rfi => rfi.id === rfiTargetRfiId ? updatedRfiData : rfi));

      // Update it in any rectangle that might have it linked
      setRectangles(prevRects => prevRects.map(rect => ({
          ...rect,
          rfi: rect.rfi?.map(r => r.id === rfiTargetRfiId ? updatedRfiData : r)
      })));
      setHasUnsavedChanges(true);
    } else if (rfiTargetRectId) {
      // Creating a new RFI and linking it
      const newRfiId = (allRfis.reduce((maxId, rfi) => Math.max(maxId, rfi.id), 0)) + 1;
      const newRfiData: RfiData = { id: newRfiId, ...rfiFormData };
      
      // Add to the master list
      setAllRfis(prev => [...prev, newRfiData]);

      // Add to the target rectangle/line/text
      if (isTextMarkup(rfiTargetRectId, textMarkups)) {
        setTextMarkups((prevTexts) => prevTexts.map((t) => {
          if (t.id !== rfiTargetRectId) return t;
          const updated = { ...t };
          if (!updated.rfi) updated.rfi = [];
          updated.rfi.push(newRfiData);
          return updated;
        }));
      } else if (isLineMarkup(rfiTargetRectId, lineMarkups)) {
        setLineMarkups((prevLines) => prevLines.map((line) => {
          if (line.id !== rfiTargetRectId) return line;
          const updated = { ...line };
          if (!updated.rfi) updated.rfi = [];
          updated.rfi.push(newRfiData);
          return updated;
        }));
      } else {
        setRectangles(prevRects =>
          prevRects.map(rect => {
            if (rect.id === rfiTargetRectId) {
              const newRect = { ...rect };
              if (!newRect.rfi) newRect.rfi = [];
              newRect.rfi.push(newRfiData);
              return newRect;
            }
            return rect;
          })
        );
      }
      setExpandedLayerIds(prev => [...new Set([...prev, rfiTargetRectId])]);
      setHasUnsavedChanges(true);
    }
    
    handleRfiCancel();
  };
  
  const handlePinDetails = (pin: Pin) => {
      setSelectedPinId(null);
      if (pin.type === 'safety') {
          const issue = allSafetyIssues.find(i => i.id === pin.linkedId);
          if (issue) {
              setSafetyFormData(issue);
              setSafetyTargetPinId(pin.id);
              setActivePanel('safety');
          }
      } else if (pin.type === 'punch') {
          const punchItem = allPunches.find(p => p.id === pin.linkedId);
          if (punchItem) {
              setPunchFormData(punchItem);
              setPunchTargetPinId(pin.id);
              setPunchPanelMode('create');
              setActivePanel('punch');
          }
      }
  };

  const handleDeletePin = (pinId: string) => {
      setPins(prev => prev.filter(p => p.id !== pinId));
      setSelectedPinId(null);
      setHasUnsavedChanges(true);
  };

  const handleDeleteLine = useCallback((lineId: string) => {
      setLineMarkups(prev => prev.filter(l => l.id !== lineId));
      setSelectedLineIds(prev => prev.filter((id) => id !== lineId));
      setSelectedLineId(null);
      setSelectedLinePointIndex(null);
      setHasUnsavedChanges(true);
  }, []);

  const handleCreateTextMarkup = useCallback((text: TextMarkup) => {
      setTextMarkups(prev => [...prev, text]);
      setHasUnsavedChanges(true);
  }, []);

  const handleUpdateTextMarkup = useCallback((id: string, changes: Partial<TextMarkup>) => {
      setTextMarkups(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
      setHasUnsavedChanges(true);
  }, []);

  const handleDeleteTextMarkup = useCallback((id: string) => {
      setTextMarkups(prev => prev.filter(t => t.id !== id));
      setSelectedTextId(null);
      setHasUnsavedChanges(true);
  }, []);

  const handleSafetyPanelCancel = () => {
      setActivePanel(null);
      setSafetyTargetPinId(null);
      setSafetyFormData({ title: '', description: '', status: 'Open', severity: 'Medium' });
      if (pinTargetCoords || activeTool === 'pin') {
          setActiveTool('select');
      }
      setPinTargetCoords(null);
  };

  const handlePunchPanelCancel = () => {
      setActivePanel(null);
      setPunchTargetPinId(null);
      setPunchFormData({ title: '', status: 'Open', assignee: '' });
      if (pinTargetCoords || activeTool === 'pin') {
          setActiveTool('select');
      }
      setPinTargetCoords(null);
      setPunchSearchTerm('');
  };

  const handleSafetyFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setSafetyFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePunchFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPunchFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSafetySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (safetyTargetPinId) { // Editing existing
          const issueToUpdate = allSafetyIssues.find(i => i.id === pins.find(p => p.id === safetyTargetPinId)?.linkedId);
          if(issueToUpdate) {
              const updatedIssue = {...issueToUpdate, ...safetyFormData};
              setAllSafetyIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
          }
      } else if (pinTargetCoords) { // Creating new
          const newIssue: SafetyIssueData = { id: `SAFE-${Date.now()}`, ...safetyFormData };
          setAllSafetyIssues(prev => [...prev, newIssue]);
          const newPinName = `Safety ${pins.filter(p => p.type === 'safety').length + 1}`;
          const newPin: Pin = { id: `pin-${Date.now()}`, type: 'safety', x: pinTargetCoords.x, y: pinTargetCoords.y, linkedId: newIssue.id, name: newPinName, visible: true };
          setPins(prev => [...prev, newPin]);
          setActiveTool('select');
      }
      setHasUnsavedChanges(true);
      handleSafetyPanelCancel();
  };

  const handlePunchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (punchTargetPinId) { // Editing existing
          const itemToUpdate = allPunches.find(p => p.id === pins.find(pin => pin.id === punchTargetPinId)?.linkedId);
          if(itemToUpdate) {
              const updatedItem = {...itemToUpdate, ...punchFormData};
              setAllPunches(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));
          }
      } else if (pinTargetCoords) { // Creating new
          const newItem: PunchData = { id: `PUNCH-${Date.now()}`, ...punchFormData };
          setAllPunches(prev => [...prev, newItem]);
          const newPinName = `Punch ${pins.filter(p => p.type === 'punch').length + 1}`;
          const newPin: Pin = { id: `pin-${Date.now()}`, type: 'punch', x: pinTargetCoords.x, y: pinTargetCoords.y, linkedId: newItem.id, name: newPinName, visible: true };
          setPins(prev => [...prev, newPin]);
          setActiveTool('select');
      }
      setHasUnsavedChanges(true);
      handlePunchPanelCancel();
  };

  const handleLinkExistingPunch = (punch: PunchData) => {
    if (pinTargetCoords) {
      const newPinName = `Punch ${pins.filter(p => p.type === 'punch').length + 1}`;
      const newPin: Pin = { id: `pin-${Date.now()}`, type: 'punch', x: pinTargetCoords.x, y: pinTargetCoords.y, linkedId: punch.id, name: newPinName, visible: true };
      setPins((prev) => [...prev, newPin]);
      setHasUnsavedChanges(true);
      setActiveTool('select');
    }
    handlePunchPanelCancel();
  };
  
  const handleFilterChange = (filter: FilterCategory) => {
    setFilters(prev => ({...prev, [filter]: !prev[filter]}));
  };

  const handleToggleAllFilters = () => {
    const areAllOn = Object.values(filters).every(v => v);
    const newFilters: Record<FilterCategory, boolean> = { ...filters };
    for (const key in newFilters) {
        newFilters[key as FilterCategory] = !areAllOn;
    }
    setFilters(newFilters);
  };

  const handleSaveMarkup = () => {
    if (!hasUnsavedChanges) return;
    console.log("Saving markup...", { rectangles, pins });
    // In a real app, this would be an API call.
    alert("Markup saved successfully!");
    setHasUnsavedChanges(false);
  };

  const handleShareConfirm = (settings: { visibility: 'public' | 'restricted' | 'private'; ids: string[] }) => {
    console.log("Sharing with settings:", settings);
    alert(`Markup shared with visibility: ${settings.visibility}. Selected items: ${settings.ids.length}`);
    setIsShareModalOpen(false);
  };

  const handleDrawingChange = (drawing: DrawingData) => {
    if (hasUnsavedChanges) {
        if (!window.confirm("You have unsaved changes that will be lost. Are you sure you want to switch drawings?")) {
            return;
        }
    }
    setCurrentDrawing(drawing);
  };

  const handleVersionChange = (version: DrawingVersion) => {
      if (hasUnsavedChanges) {
          if (!window.confirm("You have unsaved changes that will be lost. Are you sure you want to switch versions?")) {
              return;
          }
      }
      setCurrentVersion(version);
      setImageSrc(version.thumbnailUrl);
      setRectangles([]);
      setPins([]);
      setLineMarkups([]);
      setTextMarkups([]);
      setSelectedTextId(null);
      setMeasurements([]);
      setDrawingScale(null);
      setDrawingScaleClearTick((t) => t + 1);
      setSelectedRectIds([]);
      setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
      setHasUnsavedChanges(false);
      setLoadedSetIds([]);
  };

  const handleToggleMarkupSet = (set: MarkupSet) => {
    if (loadedSetIds.includes(set.id)) {
        // Unload — remove all items belonging to this set
        setRectangles(prev => prev.filter(r => r.sourceSetId !== set.id));
        setPins(prev => prev.filter(p => p.sourceSetId !== set.id));
        setLoadedSetIds(prev => prev.filter(id => id !== set.id));
    } else {
        // Load — deep-clone each item so the source data is never mutated,
        // guaranteeing locked:true is applied fresh every time the set is re-toggled on.
        const newRects = set.rectangles.map(r => ({
            ...JSON.parse(JSON.stringify(r)),
            sourceSetId: set.id,
            locked: true,
        }));
        const newPins = set.pins.map(p => ({
            ...JSON.parse(JSON.stringify(p)),
            sourceSetId: set.id,
            locked: true,
        }));
        setRectangles(prev => [...prev, ...newRects]);
        setPins(prev => [...prev, ...newPins]);
        setLoadedSetIds(prev => [...prev, set.id]);
    }
  };
  
  const performGoBack = useCallback(() => {
      setImageSrc(null);
      setCurrentDrawing(null);
      setRectangles([]);
      setPins([]);
      setLineMarkups([]);
      setTextMarkups([]);
      setSelectedTextId(null);
      setSelectedRectIds([]);
      setHasUnsavedChanges(false);
      setLoadedSetIds([]);
  }, []);

  const handleGoBack = useCallback(() => {
      if (hasUnsavedChanges) {
          pendingNavCallback.current = performGoBack;
          setIsPublishWarningOpen(true);
          return;
      }
      performGoBack();
  }, [hasUnsavedChanges, performGoBack]);

  const handlePublishWarningCancel = useCallback(() => {
      setIsPublishWarningOpen(false);
      pendingNavCallback.current = null;
  }, []);

  const handlePublishWarningDiscard = useCallback(() => {
      setIsPublishWarningOpen(false);
      setHasUnsavedChanges(false);
      const action = pendingNavCallback.current;
      pendingNavCallback.current = null;
      action?.();
  }, []);

  const handlePublishWarningPublish = useCallback((name: string) => {
      if (!name) return;
      const newSet: MarkupSet = {
          id: `set-${Date.now()}`,
          name,
          drawingId: currentDrawing?.id ?? '',
          versionId: currentVersion?.id ?? '',
          timestamp: new Date().toLocaleString(),
          author: 'Current User',
          rectangles: rectangles.filter(r => !r.sourceSetId),
          pins: pins.filter(p => !p.sourceSetId),
      };
      setAllMarkupSets(prev => [...prev, newSet]);
      setHasUnsavedChanges(false);
      setIsPublishWarningOpen(false);
      const action = pendingNavCallback.current;
      pendingNavCallback.current = null;
      action?.();
  }, [currentDrawing, currentVersion, rectangles, pins]);

  // Handle browser back button when canvas is visible
  useEffect(() => {
      if (!canvasVisible) return;
      // Push a sentinel state so we can intercept the browser back button
      history.pushState({ markupSentinel: true }, '');

      const handlePopState = () => {
          // Re-push the sentinel to keep intercepting future back presses
          history.pushState({ markupSentinel: true }, '');
          if (hasUnsavedChanges) {
              pendingNavCallback.current = performGoBack;
              setIsPublishWarningOpen(true);
          } else {
              performGoBack();
          }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasVisible, hasUnsavedChanges, performGoBack]);

  const areFiltersActive = Object.values(filters).some(v => !v);

  // Handlers for Layers Panel
  const handleRenameRect = useCallback((id: string, newName: string) => {
    setRectangles(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r));
    setHasUnsavedChanges(true);
  }, []);

  const handleToggleRectVisibility = useCallback((id: string) => {
    setRectangles(prev => prev.map(r => r.id === id ? { ...r, visible: !r.visible } : r));
    // Not considered a "savable" change
  }, []);

  const handleDeleteRect = useCallback((id: string) => {
    setRectangles(prev => prev.filter(r => r.id !== id));
    setSelectedRectIds(prev => prev.filter(selectedId => selectedId !== id));
    setHasUnsavedChanges(true);
  }, []);

  const handleSelectRect = useCallback((id: string, e: React.MouseEvent) => {
    setSelectedPinId(null);
    setSelectedLineIds([]);
    setSelectedLineId(null);
    setSelectedLinePointIndex(null);
    if (e.shiftKey) {
        setSelectedRectIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    } else {
        setSelectedRectIds([id]);
    }
  }, []);
  
  const handleRenamePin = useCallback((id: string, newName: string) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    setHasUnsavedChanges(true);
  }, []);

  const handleRenameLine = useCallback((id: string, newName: string) => {
    setLineMarkups(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
    setHasUnsavedChanges(true);
  }, []);

  const handleTogglePinVisibility = useCallback((id: string) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
    // Not considered a "savable" change
  }, []);
  
  const handleToggleLineVisibility = useCallback((id: string) => {
    setLineMarkups(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }, []);
  
  const handleSelectPin = useCallback((id: string, e: React.MouseEvent) => {
    setSelectedRectIds([]);
    setSelectedLineIds([]);
    setSelectedLineId(null);
    setSelectedLinePointIndex(null);
    setSelectedPinId(prev => (prev === id ? null : id));
  }, []);

  const handleSelectLine = useCallback((id: string, e: React.MouseEvent) => {
    setSelectedRectIds([]);
    setSelectedPinId(null);
    setSelectedLineIds(prev => {
      if (e.shiftKey) {
        return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      }
      return [id];
    });
    setSelectedLineId(id);
    setSelectedLinePointIndex(null);
    handleSetActiveTool('select');
  }, [handleSetActiveTool]);

  const toggleLayerExpand = (id: string) => {
    setExpandedLayerIds(prev => prev.includes(id) ? prev.filter(expandedId => expandedId !== id) : [...prev, id]);
  };
  
  // Create a map of set IDs to names for LayersPanel
  const markupSetNames = React.useMemo(() => {
    const names: Record<string, string> = {};
    allMarkupSets.forEach(set => {
        names[set.id] = set.name;
    });
    return names;
  }, [allMarkupSets]);

  const handleToggleBatchVisibility = useCallback((items: { id: string; type: 'rect' | 'pin' | 'line' }[], visible: boolean) => {
    const rectIds = new Set(items.filter(i => i.type === 'rect').map(i => i.id));
    const pinIds = new Set(items.filter(i => i.type === 'pin').map(i => i.id));
    const lineIds = new Set(items.filter(i => i.type === 'line').map(i => i.id));

    if (rectIds.size > 0) {
        setRectangles(prev => prev.map(r => rectIds.has(r.id) ? { ...r, visible } : r));
    }
    if (pinIds.size > 0) {
        setPins(prev => prev.map(p => pinIds.has(p.id) ? { ...p, visible } : p));
    }
    if (lineIds.size > 0) {
        setLineMarkups(prev => prev.map(l => lineIds.has(l.id) ? { ...l, visible } : l));
    }
  }, []);

  return (
    <LinarcAppShell>
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-gray-900 dark:text-zinc-100">
      <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
        {!imageSrc && !currentDrawing ? (
          <WelcomeScreen onUploadClick={triggerFileUpload} />
        ) : (
          <>
                <Header
                    onBack={handleGoBack}
                    currentDrawing={currentDrawing}
                    allDrawings={allDrawings}
                    onDrawingChange={handleDrawingChange}
                    currentVersion={currentVersion}
                    onVersionChange={handleVersionChange}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onSave={handleSaveMarkup}
                    onShare={() => setIsShareModalOpen(true)}
                    onDownload={() => setIsDownloadModalOpen(true)}
                    filters={filters}
                    areFiltersActive={areFiltersActive}
                    isFilterMenuOpen={isFilterMenuOpen}
                    setIsFilterMenuOpen={setIsFilterMenuOpen}
                    handleFilterChange={handleFilterChange}
                    handleToggleAllFilters={handleToggleAllFilters}
                    markupSets={allMarkupSets}
                    loadedSetIds={loadedSetIds}
                    onToggleMarkupSet={handleToggleMarkupSet}
                    onCompare={() => setIsCompareModalOpen(true)}
                    compareMode={compareMode ? { left: compareMode.left, right: compareMode.right } : null}
                    onExitCompare={() => { setCompareMode(null); setCompareAlignment({ offset: { x: 0, y: 0 }, status: 'idle' }); }}
                />
            <div className="flex min-h-0 min-w-0 flex-1 flex-row items-stretch overflow-hidden">
                <LayersPanel
                  isOpen={isLayersPanelOpen}
                  onClose={() => setIsLayersPanelOpen(false)}
                  rectangles={rectangles}
                  pins={pins}
                  lineMarkups={lineMarkups}
                  selectedRectIds={selectedRectIds}
                  selectedPinId={selectedPinId}
                  selectedLineIds={selectedLineIds}
                  selectedLineId={selectedLineId}
                  expandedIds={expandedLayerIds}
                  onToggleExpand={toggleLayerExpand}
                  onSelectRect={handleSelectRect}
                  onSelectPin={handleSelectPin}
                  onSelectLine={handleSelectLine}
                  onRenameRect={handleRenameRect}
                  onRenamePin={handleRenamePin}
                  onRenameLine={handleRenameLine}
                  onDeleteRect={handleDeleteRect}
                  onDeletePin={handleDeletePin}
                  onDeleteLine={handleDeleteLine}
                  onToggleRectVisibility={handleToggleRectVisibility}
                  onTogglePinVisibility={handleTogglePinVisibility}
                  onToggleLineVisibility={handleToggleLineVisibility}
                  onOpenRfiPanel={handleOpenRfiPanel}
                  markupSetNames={markupSetNames}
                  onToggleBatchVisibility={handleToggleBatchVisibility}
                  onToggleLock={handleToggleItemLock}
                  drawingScale={drawingScale}
                  naturalSize={naturalSize}
                  onRecalibrateDrawingScale={handleRecalibrateDrawingScale}
                  compareDrawings={compareMode ? {
                    left: {
                      label: `${compareMode.left.drawing.id} · ${compareMode.left.version.name}`,
                      visible: compareMode.leftVisible,
                      onToggle: () => setCompareMode(prev => prev ? { ...prev, leftVisible: !prev.leftVisible } : null),
                    },
                    right: {
                      label: `${compareMode.right.drawing.id} · ${compareMode.right.version.name}`,
                      visible: compareMode.rightVisible,
                      onToggle: () => setCompareMode(prev => prev ? { ...prev, rightVisible: !prev.rightVisible } : null),
                    },
                    alignment: {
                      status: compareAlignment.status,
                      onAlignSheets: () => setCompareAlignment(prev => ({ ...prev, status: 'aligning' })),
                      onConfirmAlign: () => setCompareAlignment(prev => ({ ...prev, status: 'aligned' })),
                      onCancelAlign: () => setCompareAlignment({ offset: { x: 0, y: 0 }, status: 'idle' }),
                      onResetAlignment: () => setCompareAlignment({ offset: { x: 0, y: 0 }, status: 'idle' }),
                    },
                  } : undefined}
                />
                <div className="relative min-h-0 min-w-0 flex-1">
                  <CanvasView
                    imageSrc={imageSrc || ''}
                    rectangles={rectangles}
                    pins={pins}
                    lineMarkups={lineMarkups}
                    textMarkups={textMarkups}
                    selectedTextId={selectedTextId}
                    setSelectedTextId={setSelectedTextId}
                    onCreateTextMarkup={handleCreateTextMarkup}
                    onUpdateTextMarkup={handleUpdateTextMarkup}
                    onDeleteTextMarkup={handleDeleteTextMarkup}
                    filters={filters}
                    viewTransform={viewTransform}
                    setViewTransform={setViewTransform}
                    interaction={interaction}
                    activeTool={activeTool}
                    hoveredRectId={hoveredRectId}
                    hoveredLineId={hoveredLineId}
                    draggingPinId={draggingPinId}
                    selectedRectIds={selectedRectIds}
                    selectedPinId={selectedPinId}
                    selectedLineIds={selectedLineIds}
                    selectedLineId={selectedLineId}
                    selectedLinePointIndex={selectedLinePointIndex}
                    currentRect={currentRect}
                    currentLineMarkup={currentLineMarkup}
                    marqueeRect={marqueeRect}
                    isMenuVisible={isMenuVisible}
                    linkMenuRectId={linkMenuRectId}
                    setLinkMenuRectId={setLinkMenuRectId}
                    openLinkSubmenu={openLinkSubmenu}
                    theme={theme}
                    toolbarPosition={toolbarPosition}
                    setToolbarPosition={setToolbarPosition}
                    isSpacebarDown={isSpacebarDown}
                    imageContainerRef={imageContainerRef}
                    imageGeom={imageGeom}
                    onImageGeomChange={handleImageGeomChange}
                    handleMouseDown={handleMouseDown}
                    handleMouseMove={handleMouseMove}
                    handleMouseUp={handleMouseUp}
                    handleMouseLeave={handleMouseLeave}
                    handleZoom={handleZoom}
                    handleThemeToggle={handleThemeToggle}
                    setHoveredRectId={setHoveredRectId}
                    setActiveTool={handleSetActiveTool}
                    activeLineTool={activeLineTool}
                    setActiveLineTool={(tool) => {
                      setActiveLineTool(tool);
                      handleSetActiveTool(tool);
                    }}
                    activeShape={activeShape}
                    setActiveShape={setActiveShape}
                    activePinType={activePinType}
                    setActivePinType={setActivePinType}
                    activeColor={activeColor}
                    markupFillColor={markupFillColor}
                    markupStrokeColor={markupStrokeColor}
                    onMarkupColorChange={handleMarkupColorChange}
                    onMarkupActiveModeChange={handleMarkupActiveModeChange}
                    setDraggingPinId={setDraggingPinId}
                    setSelectedPinId={setSelectedPinId}
                    setSelectedLineIds={setSelectedLineIds}
                    setSelectedLineId={setSelectedLineId}
                    setSelectedLinePointIndex={setSelectedLinePointIndex}
                    handlePinDetails={handlePinDetails}
                    handleDeletePin={handleDeletePin}
                    setHoveredItem={setHoveredItem}
                    hidePopupTimer={hidePopupTimer}
                    showPopupTimer={showPopupTimer}
                    handleResizeStart={(e, rectId, handle) => {
                      e.stopPropagation();
                      const startPoint = getRelativeCoords(e);
                      const rectToResize = rectangles.find(r => r.id === rectId);
                      if (!startPoint || !rectToResize || rectToResize.locked) return;
                      setLinkMenuRectId(null);
                      useCanvasInteraction.setState({ type: 'resizing', startPoint, initialRects: [rectToResize], handle });
                    }}
                    handlePublishRect={(e, id) => {
                      e.stopPropagation();
                      alert(`Publishing rectangle ${id}`);
                      setLinkMenuRectId(null);
                    }}
                    handleLinkRect={(e, id) => {
                      e.stopPropagation();
                      setLinkMenuRectId(prevId => (prevId === id ? null : id));
                    }}
                    onDeleteSelection={deleteSelection}
                    setOpenLinkSubmenu={setOpenLinkSubmenu}
                    handleSubmenuLink={handleSubmenuLink}
                    onOpenRfiPanel={handleOpenRfiPanel}
                    mouseDownRef={mouseDownRef}
                    setSelectedRectIds={setSelectedRectIds}
                    getRelativeCoords={getRelativeCoords}
                    setPinDragOffset={setPinDragOffset}
                    measurements={measurements}
                    drawingScale={drawingScale}
                    onMeasurementAdd={(m) => { setMeasurements(prev => [...prev, m]); setHasUnsavedChanges(true); }}
                    onMeasurementDelete={(id) => { setMeasurements(prev => prev.filter(m => m.id !== id)); setHasUnsavedChanges(true); }}
                    onMeasurementUpdate={(m) => { setMeasurements(prev => prev.map(x => x.id === m.id ? m : x)); setHasUnsavedChanges(true); }}
                    onDrawingScaleSet={(pxPerFt) => setDrawingScale(pxPerFt)}
                    onNaturalSizeChange={setNaturalSize}
                    drawingScaleClearTick={drawingScaleClearTick}
                    drawingScaleRecalibrateTick={drawingScaleRecalibrateTick}
                    onBeginScaleRecalibration={handleBeginScaleRecalibration}
                    compareImages={compareMode ? {
                      leftSrc: compareMode.left.version.thumbnailUrl,
                      rightSrc: compareMode.right.version.thumbnailUrl,
                      leftVisible: compareMode.leftVisible,
                      rightVisible: compareMode.rightVisible,
                    } : undefined}
                    compareAlignment={compareMode ? {
                      offset: compareAlignment.offset,
                      isAligning: compareAlignment.status === 'aligning',
                      onOffsetChange: (offset) => setCompareAlignment(prev => ({ ...prev, offset })),
                      onConfirmAlign: () => setCompareAlignment(prev => ({ ...prev, status: 'aligned' })),
                    } : undefined}
                  />
                  <CanvasSidebarFloatToggles
                    isLayersOpen={isLayersPanelOpen}
                    onToggleLayers={() => setIsLayersPanelOpen((p) => !p)}
                    isRightPanelOpen={activePanel !== null}
                    onToggleRightPanel={() => {
                        if (activePanel !== null) {
                            setActivePanel(null);
                        } else {
                            setActivePanel('empty');
                        }
                    }}
                  />
                </div>
                <div
                    className={`h-full flex-shrink-0 overflow-hidden border-gray-200 bg-white transition-all duration-200 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 ${activePanel === 'empty' ? 'border-l translate-x-0' : 'translate-x-full'}`}
                    style={{ width: activePanel === 'empty' ? '28rem' : '0px', visibility: activePanel === 'empty' ? 'visible' : 'hidden' }}
                >
                    <div className={`flex h-full w-full flex-col transition-opacity duration-150 overflow-hidden ${activePanel === 'empty' ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="linarc-panel-header">
                            <h2 className="linarc-panel-title">Details</h2>
                            <button type="button" onClick={() => setActivePanel(null)} className="linarc-panel-close" aria-label="Close panel">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700 dark:text-zinc-300">No details to show</p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">This panel displays linked items such as RFIs, safety issues, and punch items when relevant.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <RfiPanel
                    isOpen={activePanel === 'rfi'}
                    isEditMode={isRfiEditMode}
                    formData={rfiFormData}
                    onFormChange={handleRfiFormChange}
                    onSubmit={handleRfiSubmit}
                    onCancel={handleRfiCancel}
                    onHeaderTrash={handleRfiHeaderTrash}
                    onDownload={handleRfiDownload}
                    onClearQuestion={() => setRfiFormData((prev) => ({ ...prev, question: '' }))}
                />
                <SafetyPanel
                    isOpen={activePanel === 'safety'}
                    isEditMode={!!safetyTargetPinId}
                    formData={safetyFormData}
                    onFormChange={handleSafetyFormChange}
                    onSubmit={handleSafetySubmit}
                    onCancel={handleSafetyPanelCancel}
                />
                <PunchPanel
                    isOpen={activePanel === 'punch'}
                    isEditMode={!!punchTargetPinId}
                    mode={punchPanelMode}
                    onModeChange={setPunchPanelMode}
                    formData={punchFormData}
                    onFormChange={handlePunchFormChange}
                    onSubmit={handlePunchSubmit}
                    onCancel={handlePunchPanelCancel}
                    searchTerm={punchSearchTerm}
                    onSearchTermChange={(e) => setPunchSearchTerm(e.target.value)}
                    allPunches={allPunches}
                    onLinkExisting={handleLinkExistingPunch}
                />
            </div>
          </>
        )}

      {hoveredItem && !draggingPinId && !selectedPinId && (
        <HoverPopup
            hoveredItem={hoveredItem}
            rectangles={rectangles}
            allPunches={allPunches}
            allSafetyIssues={allSafetyIssues}
            onOpenRfiPanel={handleOpenRfiPanel}
            onClearHover={() => setHoveredItem(null)}
            hidePopupTimer={hidePopupTimer}
            showPopupTimer={showPopupTimer}
            onPinClick={handlePinDetails}
            onOpenPhotoMarkup={(photo) => { setHoveredItem(null); setPhotoMarkupTarget(photo); setIsPhotoMarkupOpen(true); }}
        />
      )}

      <LinkModal
        isOpen={isLinkModalOpen}
        config={linkModalConfig}
        onClose={() => {
            setIsLinkModalOpen(false);
            if (pinTargetCoords || activeTool === 'pin') {
                setActiveTool('select');
            }
            setPinTargetCoords(null);
        }}
        onSelect={handleSelectLinkItem}
      />
      
      <PhotoPickerModal
        isOpen={isPhotoPickerOpen}
        onClose={() => { setIsPhotoPickerOpen(false); setPhotoPickerTargetId(null); }}
        onPhotoLinked={handlePhotoLinked}
      />

      <PhotoViewMarkupModal
        isOpen={isPhotoMarkupOpen}
        photo={photoMarkupTarget}
        onSave={(_markups: PhotoMarkupData) => { setIsPhotoMarkupOpen(false); setPhotoMarkupTarget(null); }}
        onClose={() => { setIsPhotoMarkupOpen(false); setPhotoMarkupTarget(null); }}
        allRfis={allRfis}
        allSubmittals={mockSubmittals}
        allPunches={allPunches}
        allDrawings={allDrawings}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShareConfirm}
        companies={mockCompanies}
        employees={mockEmployees}
      />

      <DownloadOptionsModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        defaultFileName={defaultDownloadFileName}
        imageSrc={imageSrc}
      />

      <CompareSheetsModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        allDrawings={allDrawings}
        currentDrawing={currentDrawing}
        currentVersion={currentVersion}
        onCompare={(left, right) => {
          setCompareMode({ left, right, leftVisible: true, rightVisible: true });
          setCompareAlignment({ offset: { x: 0, y: 0 }, status: 'idle' });
          setIsCompareModalOpen(false);
        }}
      />

      <PublishWarningModal
        isOpen={isPublishWarningOpen}
        onCancel={handlePublishWarningCancel}
        onDiscard={handlePublishWarningDiscard}
        onPublish={handlePublishWarningPublish}
      />
    </div>
    </LinarcAppShell>
  );
};

export default App;
