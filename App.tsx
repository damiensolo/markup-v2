import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Rectangle, RfiData, SubmittalData, PunchData, DrawingData, PhotoData, PhotoMarkup, Pin, SafetyIssueData, LinkModalConfig, HoveredItemInfo, ViewTransform, InteractionState } from './types';
import LinkModal from './components/LinkModal';
import PhotoViewerModal from './components/PhotoViewerModal';
import RfiPanel from './components/RfiPanel';
import SafetyPanel from './components/SafetyPanel';
import PunchPanel from './components/PunchPanel';
import HoverPopup from './components/HoverPopup';
import WelcomeScreen from './components/WelcomeScreen';
import CanvasView from './components/CanvasView';
import { useZoomPan } from './hooks/useZoomPan';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';

type FilterCategory = 'rfi' | 'submittal' | 'punch' | 'drawing' | 'photo' | 'safety';
export type RectangleTagType = Exclude<FilterCategory, 'safety'>;

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
    { id: 'A-2.1', title: 'Architectural Floor Plan - Level 2', thumbnailUrl: 'https://i.imgur.com/gZ3J4f3.png' },
    { id: 'S-5.0', title: 'Structural Details - Column Connections', thumbnailUrl: 'https://i.imgur.com/K81f2i2.png' },
    { id: 'A-5.1', title: 'Building Section A-A', thumbnailUrl: 'https://i.imgur.com/I7eA7kR.png' },
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

const App: React.FC = () => {
  // Core Data State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [allPhotos, setAllPhotos] = useState<PhotoData[]>(mockPhotos);
  const [allPunches, setAllPunches] = useState<PunchData[]>(mockPunches);
  const [allSafetyIssues, setAllSafetyIssues] = useState<SafetyIssueData[]>(mockSafetyIssues);
  
  // Selection & Interaction State
  const [selectedRectIds, setSelectedRectIds] = useState<string[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [hoveredRectId, setHoveredRectId] = useState<string | null>(null);
  const [linkMenuRectId, setLinkMenuRectId] = useState<string | null>(null);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<HoveredItemInfo | null>(null);
  const [pinTargetCoords, setPinTargetCoords] = useState<{x: number, y: number} | null>(null);

  // Tool State
  const [activeTool, setActiveTool] = useState<'select' | 'shape' | 'pen' | 'arrow' | 'text' | 'distance' | 'drawing' | 'pin'>('select');
  const [activeShape, setActiveShape] = useState<'cloud' | 'box' | 'ellipse'>('box');
  const [activePinType, setActivePinType] = useState<'photo' | 'safety' | 'punch'>('safety');

  // Panel & Modal State
  const [isRfiPanelOpen, setIsRfiPanelOpen] = useState(false);
  const [rfiTargetRectId, setRfiTargetRectId] = useState<string | null>(null);
  const [rfiTargetRfiId, setRfiTargetRfiId] = useState<number | null>(null);
  const [rfiFormData, setRfiFormData] = useState({ title: '', type: 'General Inquiry', question: '' });
  const [isRfiEditMode, setIsRfiEditMode] = useState(false);

  const [isSafetyPanelOpen, setIsSafetyPanelOpen] = useState(false);
  const [safetyTargetPinId, setSafetyTargetPinId] = useState<string | null>(null);
  const [safetyFormData, setSafetyFormData] = useState<Omit<SafetyIssueData, 'id'>>({ title: '', description: '', status: 'Open', severity: 'Medium' });

  const [isPunchPanelOpen, setIsPunchPanelOpen] = useState(false);
  const [punchTargetPinId, setPunchTargetPinId] = useState<string | null>(null);
  const [punchFormData, setPunchFormData] = useState<Omit<PunchData, 'id'>>({ title: '', status: 'Open', assignee: '' });
  const [punchPanelMode, setPunchPanelMode] = useState<'create' | 'link'>('create');
  const [punchSearchTerm, setPunchSearchTerm] = useState('');
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalConfig, setLinkModalConfig] = useState<LinkModalConfig | null>(null);
  const [linkTargetRectId, setLinkTargetRectId] = useState<string | null>(null);
  
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [photoViewerConfig, setPhotoViewerConfig] = useState<{ rectId?: string; photoId: string, pinId?: string } | null>(null);
  
  // UI State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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

  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const hidePopupTimer = useRef<number | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const mouseDownRef = useRef<{x: number, y: number} | null>(null);

  // Custom Hooks for complex logic
  const { viewTransform, setViewTransform, handleWheel, handleZoom } = useZoomPan(imageContainerRef);

  const getRelativeCoords = useCallback((event: React.MouseEvent | WheelEvent | MouseEvent): { x: number; y: number } | null => {
    if (!imageContainerRef.current) return null;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const imageX = (mouseX - viewTransform.translateX) / viewTransform.scale;
    const imageY = (mouseY - viewTransform.translateY) / viewTransform.scale;

    const x = (imageX / rect.width) * 100;
    const y = (imageY / rect.height) * 100;

    return { x, y };
  }, [viewTransform]);
  
    const handleRfiCancel = useCallback(() => {
    setIsRfiPanelOpen(false);
    setRfiTargetRectId(null);
    setRfiTargetRfiId(null);
    setRfiFormData({ title: '', type: 'General Inquiry', question: '' });
    setIsRfiEditMode(false);
  }, []);
  
  const handleOpenRfiPanel = useCallback((rectId: string, rfiId: number | null) => {
    const targetRect = rectangles.find(r => r.id === rectId);
    if (!targetRect) return;
    
    if (rfiId !== null) {
        const rfiToEdit = targetRect.rfi?.find(r => r.id === rfiId);
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
    setIsRfiPanelOpen(true);
    setLinkMenuRectId(null);
  }, [rectangles]);

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
            const allRfis = rectangles.flatMap(r => r.rfi ? r.rfi.map(rfi => ({...rfi, id: rfi.id, title: `RFI-${rfi.id}: ${rfi.title}`})) : []);
            setLinkModalConfig({
                type: 'rfi',
                title: 'Link to an Existing RFI',
                items: allRfis,
                displayFields: [{ key: 'title' }],
                searchFields: ['title', 'question'],
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
                items: mockDrawings,
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
  }, [rectangles, allPhotos, allPunches, handleOpenRfiPanel]);

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
    isRfiPanelOpen, handleRfiCancel,
    setLinkMenuRectId,
    draggingPinId, setDraggingPinId,
    getRelativeCoords,
    handleSubmenuLink,
    setPinTargetCoords,
    setSafetyTargetPinId, setSafetyFormData, setIsSafetyPanelOpen,
    setPunchTargetPinId, setPunchFormData, setPunchPanelMode, setIsPunchPanelOpen,
    mouseDownRef,
  });


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerPhotoUpload = () => photoFileInputRef.current?.click();

  const handleClearAll = () => {
    setRectangles([]);
    setPins([]);
    setSelectedRectIds([]);
    setLinkMenuRectId(null);
  };
  
  const handleDeleteSelected = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRectangles(rects => rects.filter(r => !selectedRectIds.includes(r.id)));
    setSelectedRectIds([]);
    setLinkMenuRectId(null);
  };
  
  const handleSelectLinkItem = (item: any) => {
    if (linkTargetRectId) {
        setRectangles(prevRects => prevRects.map(rect => {
            if (rect.id === linkTargetRectId) {
                const newRect = { ...rect };
                switch (linkModalConfig?.type) {
                    case 'rfi':
                        if (!newRect.rfi) newRect.rfi = [];
                        if (!newRect.rfi.some(r => r.id === item.id)) {
                            const originalRfi = rectangles.flatMap(r => r.rfi || []).find(rfi => rfi.id === item.id);
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
                        if (!newRect.drawings.some(d => d.id === item.id)) newRect.drawings.push(item);
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
    } else if (pinTargetCoords && linkModalConfig?.type === 'photo') {
        const newPin: Pin = {
            id: `pin-${Date.now()}`,
            type: 'photo',
            x: pinTargetCoords.x,
            y: pinTargetCoords.y,
            linkedId: item.id
        };
        setPins(prev => [...prev, newPin]);
        setPinTargetCoords(null);
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
    if (!rfiTargetRectId) return;
  
    setRectangles(prevRects =>
      prevRects.map(rect => {
        if (rect.id === rfiTargetRectId) {
          const newRect = { ...rect };
  
          if (isRfiEditMode && rfiTargetRfiId !== null) {
            newRect.rfi = newRect.rfi?.map(rfi =>
              rfi.id === rfiTargetRfiId ? { ...rfi, ...rfiFormData } : rfi
            );
          } else {
            const newRfiId = (prevRects.flatMap(r => r.rfi || []).reduce((maxId, rfi) => Math.max(maxId, rfi.id), 0)) + 1;
            const newRfiData: RfiData = { id: newRfiId, ...rfiFormData };
            if (!newRect.rfi) newRect.rfi = [];
            newRect.rfi.push(newRfiData);
          }
          return newRect;
        }
        return rect;
      })
    );
    handleRfiCancel();
  };
  
  const handlePinDetails = (pin: Pin) => {
      setSelectedPinId(null);
      if (pin.type === 'photo') {
          setPhotoViewerConfig({ photoId: pin.linkedId, pinId: pin.id });
          setIsPhotoViewerOpen(true);
      } else if (pin.type === 'safety') {
          const issue = allSafetyIssues.find(i => i.id === pin.linkedId);
          if (issue) {
              setSafetyFormData(issue);
              setSafetyTargetPinId(pin.id);
              setIsSafetyPanelOpen(true);
          }
      } else if (pin.type === 'punch') {
          const punchItem = allPunches.find(p => p.id === pin.linkedId);
          if (punchItem) {
              setPunchFormData(punchItem);
              setPunchTargetPinId(pin.id);
              setPunchPanelMode('create');
              setIsPunchPanelOpen(true);
          }
      }
  };

  const handleDeletePin = (pinId: string) => {
      setPins(prev => prev.filter(p => p.id !== pinId));
      setSelectedPinId(null);
  };

  const handleSafetyPanelCancel = () => {
      setIsSafetyPanelOpen(false);
      setSafetyTargetPinId(null);
      setSafetyFormData({ title: '', description: '', status: 'Open', severity: 'Medium' });
      setPinTargetCoords(null);
  };

  const handlePunchPanelCancel = () => {
      setIsPunchPanelOpen(false);
      setPunchTargetPinId(null);
      setPunchFormData({ title: '', status: 'Open', assignee: '' });
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
          const newPin: Pin = { id: `pin-${Date.now()}`, type: 'safety', x: pinTargetCoords.x, y: pinTargetCoords.y, linkedId: newIssue.id };
          setPins(prev => [...prev, newPin]);
      }
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
          const newPin: Pin = { id: `pin-${Date.now()}`, type: 'punch', x: pinTargetCoords.x, y: pinTargetCoords.y, linkedId: newItem.id };
          setPins(prev => [...prev, newPin]);
      }
      handlePunchPanelCancel();
  };

  const handleLinkExistingPunch = (punch: PunchData) => {
    if (pinTargetCoords) {
      const newPin: Pin = { id: `pin-${Date.now()}`, type: 'punch', x: pinTargetCoords.x, y: pinTargetCoords.y, linkedId: punch.id };
      setPins((prev) => [...prev, newPin]);
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
          } else if (pinTargetCoords) {
             const newPin: Pin = { id: `pin-${Date.now()}`, type: 'photo', x: pinTargetCoords.x, y: pinTargetCoords.y, linkedId: newPhoto.id };
             setPins(prev => [...prev, newPin]);
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

  const currentPhotoForViewer = photoViewerConfig ? allPhotos.find(p => p.id === photoViewerConfig.photoId) : null;

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-stretch p-4 overflow-hidden">
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
      <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" ref={photoFileInputRef} />
      <main className="w-full flex-grow flex flex-col items-center bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-cyan-500/10 p-2">
        {!imageSrc ? (
          <WelcomeScreen onUploadClick={triggerFileUpload} />
        ) : (
          <CanvasView
            imageSrc={imageSrc}
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
            isFilterMenuOpen={isFilterMenuOpen}
            theme={theme}
            imageContainerRef={imageContainerRef}
            filterMenuRef={filterMenuRef}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            handleMouseUp={handleMouseUp}
            handleMouseLeave={handleMouseLeave}
            handleWheel={handleWheel}
            handleZoom={handleZoom}
            handleThemeToggle={handleThemeToggle}
            onUploadClick={triggerFileUpload}
            onClearAll={handleClearAll}
            setHoveredRectId={setHoveredRectId}
            getRelativeCoords={getRelativeCoords}
            setActiveTool={setActiveTool}
            activeShape={activeShape}
            setActiveShape={setActiveShape}
            activePinType={activePinType}
            setActivePinType={setActivePinType}
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
              if (!startPoint || !rectToResize) return;
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
            handleDeleteSelected={handleDeleteSelected}
            setOpenLinkSubmenu={setOpenLinkSubmenu}
            handleSubmenuLink={handleSubmenuLink}
            setIsFilterMenuOpen={setIsFilterMenuOpen}
            handleFilterChange={handleFilterChange}
            handleToggleAllFilters={handleToggleAllFilters}
            onOpenRfiPanel={handleOpenRfiPanel}
            onOpenPhotoViewer={(config) => {
              setPhotoViewerConfig(config);
              setIsPhotoViewerOpen(true);
            }}
            mouseDownRef={mouseDownRef}
            setSelectedRectIds={setSelectedRectIds}
          />
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
        />
      )}

      <LinkModal
        isOpen={isLinkModalOpen}
        config={linkModalConfig}
        onClose={() => {
            setIsLinkModalOpen(false);
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

      <RfiPanel
        isOpen={isRfiPanelOpen}
        isEditMode={isRfiEditMode}
        formData={rfiFormData}
        onFormChange={handleRfiFormChange}
        onSubmit={handleRfiSubmit}
        onCancel={handleRfiCancel}
      />
      
      <SafetyPanel
        isOpen={isSafetyPanelOpen}
        isEditMode={!!safetyTargetPinId}
        formData={safetyFormData}
        onFormChange={handleSafetyFormChange}
        onSubmit={handleSafetySubmit}
        onCancel={handleSafetyPanelCancel}
      />
      
      <PunchPanel
        isOpen={isPunchPanelOpen}
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
  );
};

export default App;
