import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Rectangle, RfiData, SubmittalData, PunchData, DrawingData, PhotoData, PhotoMarkup, Pin, SafetyIssueData, LinkModalConfig, HoveredItemInfo, ViewTransform, InteractionState, DrawingVersion, MarkupSet } from './types';
import LinkModal from './components/LinkModal';
import PhotoViewerModal from './components/PhotoViewerModal';
import ShareModal from './components/ShareModal';
import RfiPanel from './components/RfiPanel';
import SafetyPanel from './components/SafetyPanel';
import PunchPanel from './components/PunchPanel';
import HoverPopup from './components/HoverPopup';
import WelcomeScreen from './components/WelcomeScreen';
import CanvasView from './components/CanvasView';
import { useZoomPan } from './hooks/useZoomPan';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import LayersPanel from './components/LayersPanel';
import { FilterIcon, ChevronLeftIcon, ShareIcon, DocumentDuplicateIcon, FolderOpenIcon } from './components/Icons';

type FilterCategory = 'rfi' | 'submittal' | 'punch' | 'drawing' | 'photo' | 'safety';
export type RectangleTagType = Exclude<FilterCategory, 'safety'>;
type ActiveTool = 'select' | 'shape' | 'pen' | 'arrow' | 'text' | 'pin' | 'image' | 'location' | 'measurement' | 'polygon' | 'highlighter' | 'customPin' | 'fill' | 'stroke';
export type ToolbarPosition = 'bottom' | 'top' | 'left' | 'right';
export interface ImageGeom {
    width: number;
    height: number;
    x: number;
    y: number;
}

const mockRfis: RfiData[] = [
    { id: 101, title: 'Clarification on beam specification', type: 'Design Clarification', question: 'The structural drawing S-2.1 specifies a W12x26 beam, but the architectural drawing A-5.0 shows a W14x22. Please clarify which is correct.' },
    { id: 102, title: 'Permission to use alternative sealant', type: 'Material Substitution', question: 'The specified sealant Dow Corning 795 is unavailable with a 6-week lead time. Can we substitute with Pecora 890, which has equivalent performance characteristics? Datasheet attached.' },
    { id: 103, title: 'Unexpected conduit in wall cavity', type: 'Field Condition', question: 'During demolition of the partition wall in Room 204, we discovered an undocumented electrical conduit. Please advise on whether it is live and if it needs to be relocated.' },
    { id: 104, title: 'Location of thermostat in Lobby', type: 'General Inquiry', question: 'The MEP drawings do not specify the exact mounting location for the main lobby thermostat. Please provide a location.' },
];

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
        title: 'BUILDING DATA', 
        versions: [
            { id: 'v3', name: 'Revision 3', timestamp: '2024-07-20', thumbnailUrl: 'https://i.imgur.com/gZ3J4f3.png' },
            { id: 'v2', name: 'Revision 2', timestamp: '2024-07-15', thumbnailUrl: 'https://i.imgur.com/K81f2i2.png' },
            { id: 'v1', name: 'Initial Release', timestamp: '2024-07-10', thumbnailUrl: 'https://i.imgur.com/I7eA7kR.png' },
        ]
    },
    { 
        id: 'A-2.1', 
        title: 'Architectural Floor Plan - Level 2', 
        versions: [
            { id: 'v1', name: 'Initial Release', timestamp: '2024-06-01', thumbnailUrl: 'https://i.imgur.com/gZ3J4f3.png' },
        ] 
    },
    { 
        id: 'S-5.0', 
        title: 'Structural Details - Column Connections', 
        versions: [
            { id: 'v2', name: 'As-Built', timestamp: '2024-08-01', thumbnailUrl: 'https://i.imgur.com/K81f2i2.png' },
            { id: 'v1', name: 'For Construction', timestamp: '2024-05-20', thumbnailUrl: 'https://i.imgur.com/gZ3J4f3.png' },
        ]
    },
    { 
        id: 'A-5.1', 
        title: 'Building Section A-A', 
        versions: [
            { id: 'v1', name: 'Initial Release', timestamp: '2024-06-15', thumbnailUrl: 'https://i.imgur.com/I7eA7kR.png' },
        ]
    },
];

const mockPhotos: PhotoData[] = [
    { id: 'PHOTO-01', title: 'Site Condition - West Wing', url: 'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=600', source: 'linarc' },
    { id: 'PHOTO-02', title: 'Pre-pour inspection formwork', url: 'https://images.pexels.com/photos/302804/pexels-photo-302804.jpeg?auto=compress&cs=tinysrgb&w=600', source: 'linarc' },
    { id: 'PHOTO-03', title: 'HVAC Ducting - 3rd Floor', url: 'https://images.pexels.com/photos/834892/pexels-photo-834892.jpeg?auto=compress&cs=tinysrgb&w=600', source: 'linarc' },
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
}
const DrawingSelector: React.FC<DrawingSelectorProps> = ({ drawings, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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
        <div className="relative w-[19.5rem]" ref={selectorRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-10 flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-left text-sm"
            >
                <span className="truncate text-gray-800 dark:text-gray-200">{value ? `${value.id} - ${value.title}` : 'Select a drawing'}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2">
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
}
const DrawingVersionSelector: React.FC<DrawingVersionSelectorProps> = ({ versions, value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-56" ref={selectorRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full h-10 flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-left text-sm disabled:bg-gray-100 disabled:dark:bg-gray-700/50 disabled:cursor-not-allowed"
            >
                <span className="truncate text-gray-800 dark:text-gray-200">{value ? `${value.name} (${value.timestamp})` : 'Select version'}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2">
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
                className="h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center gap-2 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Load Markup Sets"
            >
                <FolderOpenIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Load Markup</span>
                {loadedCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center -ml-1">
                        {loadedCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                        <input
                            type="text"
                            placeholder="Search markups..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                            autoFocus
                        />
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
                                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-start gap-3 ${isLoaded ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            >
                                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isLoaded ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400 dark:border-gray-500'}`}>
                                                    {isLoaded && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7L5.5 9.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                </div>
                                                <div className="flex-grow">
                                                    <p className={`font-semibold ${isLoaded ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{set.name}</p>
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
    filters: Record<FilterCategory, boolean>;
    areFiltersActive: boolean;
    isFilterMenuOpen: boolean;
    setIsFilterMenuOpen: (isOpen: boolean) => void;
    handleFilterChange: (filter: FilterCategory) => void;
    handleToggleAllFilters: () => void;
    markupSets: MarkupSet[];
    loadedSetIds: string[];
    onToggleMarkupSet: (set: MarkupSet) => void;
}

const Header: React.FC<HeaderProps> = ({ onBack, currentDrawing, allDrawings, onDrawingChange, currentVersion, onVersionChange, hasUnsavedChanges, onSave, onShare, filters, areFiltersActive, isFilterMenuOpen, setIsFilterMenuOpen, handleFilterChange, handleToggleAllFilters, markupSets, loadedSetIds, onToggleMarkupSet }) => {
    const filterMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setIsFilterMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsFilterMenuOpen]);

    return (
        <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 flex-wrap gap-2">
            <div className="flex items-center gap-2">
                <button onClick={onBack} className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Back to drawings">
                    <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
                <DrawingSelector drawings={allDrawings} value={currentDrawing} onChange={onDrawingChange} />
                <DrawingVersionSelector versions={currentDrawing?.versions || []} value={currentVersion} onChange={onVersionChange} disabled={!currentDrawing} />
                <MarkupSetSelector
                    markupSets={currentDrawing ? markupSets.filter(s => s.drawingId === currentDrawing?.id && s.versionId === currentVersion?.id) : markupSets}
                    loadedSetIds={loadedSetIds}
                    onToggle={onToggleMarkupSet}
                    disabled={false}
                />
            </div>
            <div className="flex items-center gap-2">
                 <div ref={filterMenuRef} className="relative">
                    <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-10 relative bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 border border-gray-300 dark:border-gray-600`}>
                        <FilterIcon className="w-5 h-5" /> Filter
                        {areFiltersActive && <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800" />}
                    </button>
                    {isFilterMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4">
                           <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700 mb-2">
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
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${filters[key] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${filters[key] ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                    </label>
                                ))}
                           </div>
                        </div>
                    )}
                </div>
                <button onClick={onShare} className="h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 border border-gray-300 dark:border-gray-600">
                    <ShareIcon className="w-5 h-5" /> Share
                </button>
                <button onClick={() => alert('Compare functionality not implemented')} className="h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 border border-gray-300 dark:border-gray-600">
                    <DocumentDuplicateIcon className="w-5 h-5" /> Compare
                </button>
                <button
                    onClick={onSave}
                    disabled={!hasUnsavedChanges}
                    className="h-10 font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:dark:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                >
                    Save Markup
                </button>
            </div>
        </div>
    );
}


const App: React.FC = () => {
  // Core Data State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [allRfis, setAllRfis] = useState<RfiData[]>(mockRfis);
  const [allPhotos, setAllPhotos] = useState<PhotoData[]>(mockPhotos);
  const [allPunches, setAllPunches] = useState<PunchData[]>(mockPunches);
  const [allSafetyIssues, setAllSafetyIssues] = useState<SafetyIssueData[]>(mockSafetyIssues);
  
  // Selection & Interaction State
  const [selectedRectIds, setSelectedRectIds] = useState<string[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [hoveredRectId, setHoveredRectId] = useState<string | null>(null);
  const [linkMenuRectId, setLinkMenuRectId] = useState<string | null>(null);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [pinDragOffset, setPinDragOffset] = useState<{x: number, y: number} | null>(null);
  const [hoveredItem, setHoveredItem] = useState<HoveredItemInfo | null>(null);
  const [pinTargetCoords, setPinTargetCoords] = useState<{x: number, y: number} | null>(null);
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  const [imageGeom, setImageGeom] = useState<ImageGeom>({ width: 0, height: 0, x: 0, y: 0 });

  // Tool State
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [activeShape, setActiveShape] = useState<'cloud' | 'box' | 'ellipse'>('box');
  const [activePinType, setActivePinType] = useState<'photo' | 'safety' | 'punch'>('safety');
  const [activeColor, setActiveColor] = useState<'fill' | 'stroke'>('fill');

  // Panel & Modal State
  const [activePanel, setActivePanel] = useState<'rfi' | 'safety' | 'punch' | null>(null);

  const [rfiTargetRectId, setRfiTargetRectId] = useState<string | null>(null);
  const [rfiTargetRfiId, setRfiTargetRfiId] = useState<number | null>(null);
  const [rfiFormData, setRfiFormData] = useState({ title: '', type: 'General Inquiry', question: '' });
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
  
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [photoViewerConfig, setPhotoViewerConfig] = useState<{ rectId?: string; photoId: string, pinId?: string } | null>(null);
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // UI State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>('bottom');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [openLinkSubmenu, setOpenLinkSubmenu] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<FilterCategory, boolean>>({
    rfi: true,
    submittal: true,
    punch: true,
    drawing: true,
    photo: true,
    safety: true,
  });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
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
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const hidePopupTimer = useRef<number | null>(null);
  const mouseDownRef = useRef<{x: number, y: number} | null>(null);

  // Custom Hooks for complex logic
  const { viewTransform, setViewTransform, handleWheel, handleZoom } = useZoomPan(imageContainerRef);

  useEffect(() => {
    if (currentDrawing) {
        const latestVersion = currentDrawing.versions[0];
        setCurrentVersion(latestVersion);
        setImageSrc(latestVersion.thumbnailUrl);
        setRectangles([]);
        setPins([]);
        setSelectedRectIds([]);
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
    setRfiFormData({ title: '', type: 'General Inquiry', question: '' });
    setIsRfiEditMode(false);
    if (activeTool === 'pin') {
        setActiveTool('select');
    }
  }, [activeTool]);
  
  const handleOpenRfiPanel = useCallback((rectId: string, rfiId: number | null) => {
    if (rfiId !== null) {
        const rfiToEdit = allRfis.find(r => r.id === rfiId);
        if (rfiToEdit) {
            setRfiFormData({title: rfiToEdit.title, type: rfiToEdit.type, question: rfiToEdit.question});
            setIsRfiEditMode(true);
        } else {
            return;
        }
    } else {
        setRfiFormData({ title: '', type: 'General Inquiry', question: '' });
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
            setLinkModalConfig({
                type: 'photo',
                title: 'Link a Photo',
                items: allPhotos,
                displayFields: [{ key: 'id' }, { key: 'title' }],
                searchFields: ['id', 'title'],
            });
            setIsLinkModalOpen(true);
            break;
        default:
            alert(`Linking ${type} for rectangle ${targetId}`);
            break;
    }
  }, [allRfis, allPhotos, allPunches, allDrawings, handleOpenRfiPanel]);

  const handleSetActiveTool = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
    setActivePanel(null);
  }, []);

  const handleToggleItemLock = useCallback((id: string, type: 'rect' | 'pin') => {
    if (type === 'rect') {
        setRectangles(prev => prev.map(r => r.id === id ? { ...r, locked: !r.locked } : r));
    } else {
        setPins(prev => prev.map(p => p.id === id ? { ...p, locked: !p.locked } : p));
    }
    setHasUnsavedChanges(true);
  }, []);

  const {
    interaction,
    currentRect,
    marqueeRect,
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
    if (changed) setHasUnsavedChanges(true);
  }, [selectedRectIds, selectedPinId, rectangles, pins]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || isLinkModalOpen || isPhotoViewerOpen || isShareModalOpen) {
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
            case 'o':
                e.preventDefault();
                setActiveShape('ellipse');
                handleSetActiveTool('shape');
                break;
            case 'p':
                e.preventDefault();
                handleSetActiveTool('pin');
                break;
            case 'delete':
            case 'backspace':
                e.preventDefault();
                deleteSelection();
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
      isPhotoViewerOpen,
      isShareModalOpen,
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
    if (selectedRectIds.length === 1) {
      const timer = setTimeout(() => setIsMenuVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [selectedRectIds]);

  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRectangles([]);
        setPins([]);
        setSelectedRectIds([]);
        setHoveredRectId(null);
        setLinkMenuRectId(null);
        setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
        setImageSrc(e.target?.result as string);
        setCurrentDrawing(null); // Clear selected drawing if a local file is uploaded
        setCurrentVersion(null);
        setHasUnsavedChanges(false);
        setLoadedSetIds([]);
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerPhotoUpload = () => photoFileInputRef.current?.click();

  const handleSelectLinkItem = (item: any) => {
    if (linkTargetRectId) {
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
                    case 'photo':
                        if (!newRect.photos) newRect.photos = [];
                        if (!newRect.photos.some(p => p.id === item.id)) newRect.photos.push(item);
                        break;
                }
                return newRect;
            }
            return rect;
        }));
        setExpandedLayerIds(prev => [...new Set([...prev, linkTargetRectId])]);
        setHasUnsavedChanges(true);
    } else if (pinTargetCoords && linkModalConfig?.type === 'photo') {
        const newPinName = `Photo ${pins.filter(p => p.type === 'photo').length + 1}`;
        const newPin: Pin = {
            id: `pin-${Date.now()}`,
            type: 'photo',
            x: pinTargetCoords.x,
            y: pinTargetCoords.y,
            linkedId: item.id,
            name: newPinName,
            visible: true
        };
        setPins(prev => [...prev, newPin]);
        setHasUnsavedChanges(true);
        setPinTargetCoords(null);
        setActiveTool('select');
        setActivePanel(null);
    }

    setIsLinkModalOpen(false);
    setLinkModalConfig(null);
    setLinkTargetRectId(null);
  };

  const handleRfiFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRfiFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

      // Add to the target rectangle
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
      setExpandedLayerIds(prev => [...new Set([...prev, rfiTargetRectId])]);
      setHasUnsavedChanges(true);
    }
    
    handleRfiCancel();
  };
  
  const handlePinDetails = (pin: Pin) => {
      setSelectedPinId(null);
      if (pin.type === 'photo') {
          setActivePanel(null);
          setPhotoViewerConfig({ photoId: pin.linkedId, pinId: pin.id });
          setIsPhotoViewerOpen(true);
      } else if (pin.type === 'safety') {
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
  
  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: PhotoData = { id: `UPLOAD-${Date.now()}`, title: file.name, url: e.target?.result as string, source: 'upload', markups: [] };
          setAllPhotos(prev => [...prev, newPhoto]);
          if (linkTargetRectId) {
             setRectangles(prevRects => prevRects.map(rect => {
                if (rect.id === linkTargetRectId) {
                    const newRect = {...rect};
                    if (!newRect.photos) newRect.photos = [];
                    newRect.photos.push(newPhoto);
                    return newRect;
                }
                return rect;
             }));
             setExpandedLayerIds(prev => [...new Set([...prev, linkTargetRectId])]);
             setHasUnsavedChanges(true);
          } else if (pinTargetCoords) {
             const newPinName = `Photo ${pins.filter(p => p.type === 'photo').length + 1}`;
             const newPin: Pin = { id: `pin-${Date.now()}`, type: 'photo', x: pinTargetCoords.x, y: pinTargetCoords.y, linkedId: newPhoto.id, name: newPinName, visible: true };
             setPins(prev => [...prev, newPin]);
             setHasUnsavedChanges(true);
             setActiveTool('select');
             setActivePanel(null);
          }
          setIsLinkModalOpen(false);
          setLinkModalConfig(null);
          setLinkTargetRectId(null);
          setPinTargetCoords(null);
        };
        reader.readAsDataURL(file);
        event.target.value = '';
      }
  };

  const handleUpdatePhotoMarkups = (newMarkups: PhotoMarkup[]) => {
    if (!photoViewerConfig) return;
    const { photoId } = photoViewerConfig;
    setAllPhotos(prevPhotos => prevPhotos.map(photo => 
        photo.id === photoId ? { ...photo, markups: newMarkups } : photo
    ));
    setHasUnsavedChanges(true);
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
      setSelectedRectIds([]);
      setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
      setHasUnsavedChanges(false);
      setLoadedSetIds([]);
  };

  const handleToggleMarkupSet = (set: MarkupSet) => {
    if (loadedSetIds.includes(set.id)) {
        // Unload
        setRectangles(prev => prev.filter(r => r.sourceSetId !== set.id));
        setPins(prev => prev.filter(p => p.sourceSetId !== set.id));
        setLoadedSetIds(prev => prev.filter(id => id !== set.id));
    } else {
        // Load
        // Add sourceSetId to items to identify them later
        const newRects = set.rectangles.map(r => ({ ...r, sourceSetId: set.id }));
        const newPins = set.pins.map(p => ({ ...p, sourceSetId: set.id }));
        setRectangles(prev => [...prev, ...newRects]);
        setPins(prev => [...prev, ...newPins]);
        setLoadedSetIds(prev => [...prev, set.id]);
    }
  };
  
  const handleGoBack = () => {
      if (hasUnsavedChanges) {
          if (!window.confirm("You have unsaved changes that will be lost. Are you sure you want to go back?")) {
              return;
          }
      }
      setImageSrc(null);
      setCurrentDrawing(null);
      setRectangles([]);
      setPins([]);
      setSelectedRectIds([]);
      setHasUnsavedChanges(false);
      setLoadedSetIds([]);
  };

  const currentPhotoForViewer = photoViewerConfig ? allPhotos.find(p => p.id === photoViewerConfig.photoId) : null;
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

  const handleTogglePinVisibility = useCallback((id: string) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
    // Not considered a "savable" change
  }, []);
  
  const handleSelectPin = useCallback((id: string, e: React.MouseEvent) => {
    setSelectedRectIds([]);
    setSelectedPinId(prev => (prev === id ? null : id));
  }, []);

  const handleOpenPhotoViewerFromLayer = useCallback((photoId: string) => {
    setPhotoViewerConfig({ photoId });
    setIsPhotoViewerOpen(true);
  }, []);

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

  const handleToggleBatchVisibility = useCallback((items: { id: string; type: 'rect' | 'pin' }[], visible: boolean) => {
    const rectIds = new Set(items.filter(i => i.type === 'rect').map(i => i.id));
    const pinIds = new Set(items.filter(i => i.type === 'pin').map(i => i.id));

    if (rectIds.size > 0) {
        setRectangles(prev => prev.map(r => rectIds.has(r.id) ? { ...r, visible } : r));
    }
    if (pinIds.size > 0) {
        setPins(prev => prev.map(p => pinIds.has(p.id) ? { ...p, visible } : p));
    }
  }, []);

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-stretch p-4 overflow-hidden">
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
      <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" ref={photoFileInputRef} />
      <main className="w-full flex-grow flex flex-col items-stretch bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-blue-500/10 p-2 overflow-hidden">
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
                filters={filters}
                areFiltersActive={areFiltersActive}
                isFilterMenuOpen={isFilterMenuOpen}
                setIsFilterMenuOpen={setIsFilterMenuOpen}
                handleFilterChange={handleFilterChange}
                handleToggleAllFilters={handleToggleAllFilters}
                markupSets={allMarkupSets}
                loadedSetIds={loadedSetIds}
                onToggleMarkupSet={handleToggleMarkupSet}
            />
            <div className="flex-grow flex flex-row items-stretch overflow-hidden">
                <LayersPanel
                  isOpen={isLayersPanelOpen}
                  onToggle={() => setIsLayersPanelOpen(p => !p)}
                  rectangles={rectangles}
                  pins={pins}
                  selectedRectIds={selectedRectIds}
                  selectedPinId={selectedPinId}
                  expandedIds={expandedLayerIds}
                  onToggleExpand={toggleLayerExpand}
                  onSelectRect={handleSelectRect}
                  onSelectPin={handleSelectPin}
                  onRenameRect={handleRenameRect}
                  onRenamePin={handleRenamePin}
                  onDeleteRect={handleDeleteRect}
                  onDeletePin={handleDeletePin}
                  onToggleRectVisibility={handleToggleRectVisibility}
                  onTogglePinVisibility={handleTogglePinVisibility}
                  onOpenRfiPanel={handleOpenRfiPanel}
                  onOpenPhotoViewer={handleOpenPhotoViewerFromLayer}
                  markupSetNames={markupSetNames}
                  onToggleBatchVisibility={handleToggleBatchVisibility}
                  onToggleLock={handleToggleItemLock}
                />
                <div className="flex-grow h-full relative">
                  <CanvasView
                    imageSrc={imageSrc || ''}
                    rectangles={rectangles}
                    pins={pins}
                    filters={filters}
                    viewTransform={viewTransform}
                    interaction={interaction}
                    activeTool={activeTool}
                    hoveredRectId={hoveredRectId}
                    draggingPinId={draggingPinId}
                    selectedRectIds={selectedRectIds}
                    selectedPinId={selectedPinId}
                    currentRect={currentRect}
                    marqueeRect={marqueeRect}
                    isMenuVisible={isMenuVisible}
                    linkMenuRectId={linkMenuRectId}
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
                    handleWheel={handleWheel}
                    handleZoom={handleZoom}
                    handleThemeToggle={handleThemeToggle}
                    setHoveredRectId={setHoveredRectId}
                    setActiveTool={handleSetActiveTool}
                    activeShape={activeShape}
                    setActiveShape={setActiveShape}
                    activePinType={activePinType}
                    setActivePinType={setActivePinType}
                    activeColor={activeColor}
                    setActiveColor={setActiveColor}
                    setDraggingPinId={setDraggingPinId}
                    setSelectedPinId={setSelectedPinId}
                    handlePinDetails={handlePinDetails}
                    handleDeletePin={handleDeletePin}
                    setHoveredItem={setHoveredItem}
                    hidePopupTimer={hidePopupTimer}
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
                    onOpenPhotoViewer={(config) => {
                      setPhotoViewerConfig(config);
                      setIsPhotoViewerOpen(true);
                    }}
                    mouseDownRef={mouseDownRef}
                    setSelectedRectIds={setSelectedRectIds}
                    getRelativeCoords={getRelativeCoords}
                    setPinDragOffset={setPinDragOffset}
                  />
                </div>
                <RfiPanel
                    isOpen={activePanel === 'rfi'}
                    isEditMode={isRfiEditMode}
                    formData={rfiFormData}
                    onFormChange={handleRfiFormChange}
                    onSubmit={handleRfiSubmit}
                    onCancel={handleRfiCancel}
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
      </main>

      {hoveredItem && !draggingPinId && !selectedPinId && (
        <HoverPopup
            hoveredItem={hoveredItem}
            rectangles={rectangles}
            allPhotos={allPhotos}
            allPunches={allPunches}
            allSafetyIssues={allSafetyIssues}
            onOpenPhotoViewer={(config) => {
                setPhotoViewerConfig(config);
                setIsPhotoViewerOpen(true);
            }}
            onOpenRfiPanel={handleOpenRfiPanel}
            onClearHover={() => setHoveredItem(null)}
            hidePopupTimer={hidePopupTimer}
            onPinClick={handlePinDetails}
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
        onUploadRequest={triggerPhotoUpload}
      />
      
      <PhotoViewerModal
        isOpen={isPhotoViewerOpen}
        photoData={currentPhotoForViewer || null}
        onClose={() => setIsPhotoViewerOpen(false)}
        onUpdateMarkups={handleUpdatePhotoMarkups}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShareConfirm}
        companies={mockCompanies}
        employees={mockEmployees}
      />
    </div>
  );
};

export default App;