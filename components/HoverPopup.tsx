import React from 'react';
import type { HoveredItemInfo, Rectangle, PhotoData, SafetyIssueData, PunchData, DrawingData } from '../types';

interface HoverPopupProps {
    hoveredItem: HoveredItemInfo | null;
    rectangles: Rectangle[];
    allPhotos: PhotoData[];
    allPunches: PunchData[];
    allSafetyIssues: SafetyIssueData[];
    onOpenPhotoViewer: (config: { rectId?: string; photoId: string, pinId?: string }) => void;
    onOpenRfiPanel: (rectId: string, rfiId: number | null) => void;
    onClearHover: () => void;
    hidePopupTimer: React.MutableRefObject<number | null>;
}

const HoverPopup: React.FC<HoverPopupProps> = ({ 
    hoveredItem, rectangles, allPhotos, allPunches, allSafetyIssues, onOpenPhotoViewer, onOpenRfiPanel, onClearHover, hidePopupTimer
}) => {
    if (!hoveredItem) return null;

    let content = null;

    switch (hoveredItem.type) {
        case 'pin':
            const pin = hoveredItem.pin;
            if (pin) {
                if (pin.type === 'photo') {
                    const photo = allPhotos.find(p => p.id === pin.linkedId);
                     if (photo) content = (
                        <>
                            <h4 className="font-bold text-blue-400 mb-2 truncate">{photo.id}: {photo.title}</h4>
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenPhotoViewer({ photoId: photo.id, pinId: pin.id });
                                    onClearHover(); // Close the popup
                                }}
                                className="rounded-md mb-3 w-full h-32 block hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <img src={photo.url} alt={photo.title} className="w-full h-full object-cover rounded-md" />
                            </button>
                            <p className="text-sm text-gray-400">Click pin or thumbnail to view & annotate.</p>
                        </>
                    );
                } else if (pin.type === 'safety') {
                    const issue = allSafetyIssues.find(i => i.id === pin.linkedId);
                    if (issue) content = (
                         <>
                            <h4 className="font-bold text-red-400 mb-2 truncate">{issue.id}: {issue.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Severity:</span> {issue.severity}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span> {issue.status}</p>
                            <p className="text-sm text-gray-400">Click pin to view details.</p>
                         </>
                    );
                } else if (pin.type === 'punch') {
                    const punch = allPunches.find(p => p.id === pin.linkedId);
                    if (punch) content = (
                        <>
                            <h4 className="font-bold text-orange-400 mb-2 truncate">{punch.id}: {punch.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Assignee:</span> {punch.assignee}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span> {punch.status}</p>
                            <p className="text-sm text-gray-400">Click pin to view details.</p>
                        </>
                    );
                }
            }
            break;
        default:
            const rect = rectangles.find(r => r.id === hoveredItem.rectId);
            if (rect) {
                switch (hoveredItem.type) {
                    case 'rfi':
                        const rfi = rect.rfi?.find(r => r.id === hoveredItem.itemId);
                        if (rfi) content = (
                            <>
                                <h4 className="font-bold text-blue-400 mb-2 truncate">RFI-{rfi.id}: {rfi.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Type:</span> {rfi.type}</p>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 max-h-24 overflow-y-auto">
                                    <span className="font-semibold text-gray-500 dark:text-gray-400">Question:</span>
                                    <p className="whitespace-pre-wrap break-words">{rfi.question}</p>
                                </div>
                                <a href="https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/document/rfi/uiSFtnkKXNpn5Koz/details?tab=details" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 text-sm font-semibold">View Full RFI &rarr;</a>
                            </>
                        );
                        break;
                    case 'submittal':
                        const submittal = rect.submittals?.find(s => s.id === hoveredItem.itemId);
                        if (submittal) content = (
                            <>
                                <h4 className="font-bold text-green-400 mb-2 truncate">{submittal.id}: {submittal.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Spec Section:</span> {submittal.specSection}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span> {submittal.status}</p>
                                <a href="https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/document/submittals/package/FMVmW4xEe9bcHUTp/registries/Xh6FHaQZ9Dyv6V3i/?tab=response" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 text-sm font-semibold">View Full Submittal &rarr;</a>
                            </>
                        );
                        break;
                    case 'punch':
                        const punch = rect.punches?.find(p => p.id === hoveredItem.itemId);
                        if (punch) content = (
                            <>
                                <h4 className="font-bold text-orange-400 mb-2 truncate">{punch.id}: {punch.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Assignee:</span> {punch.assignee}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span> {punch.status}</p>
                                <a href="https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/quality/punchList/H7SakWBed794KRdU/details?tab=details" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 text-sm font-semibold">View Full Punch Item &rarr;</a>
                            </>
                        );
                        break;
                    case 'drawing':
                        const drawing = rect.drawings?.find(d => d.id === hoveredItem.itemId);
                        // Fix: Access thumbnailUrl from the first version of the drawing.
                        if (drawing && drawing.versions?.[0]) content = (
                            <>
                                <h4 className="font-bold text-indigo-400 mb-2 truncate">{drawing.id}: {drawing.title}</h4>
                                <img src={drawing.versions[0].thumbnailUrl} alt={drawing.title} className="rounded-md mb-3 w-full object-cover" />
                                <a href="https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/document/newPlans/markup/A-3.2/AHV6vNEm20250627115709/latest" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 text-sm font-semibold">View Full Drawing &rarr;</a>
                            </>
                        );
                        break;
                    case 'photo':
                        const photo = rect.photos?.find(p => p.id === hoveredItem.itemId);
                        if (photo) content = (
                            <>
                                <h4 className="font-bold text-blue-400 mb-2 truncate">{photo.id}: {photo.title}</h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenPhotoViewer({ rectId: rect.id, photoId: photo.id });
                                        onClearHover(); // Close the popup
                                    }}
                                    className="rounded-md mb-3 w-full h-32 block hover:opacity-80 transition-opacity cursor-pointer"
                                >
                                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover rounded-md" />
                                </button>
                                <p className="text-sm text-gray-400">Click tag or thumbnail to view & annotate.</p>
                            </>
                        );
                        break;
                }
            }
    }

    if (!content) return null;

    return (
        <div
            className="absolute bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-xl z-[60] w-72"
            style={{
                top: `${hoveredItem.position.top}px`,
                left: `${hoveredItem.position.left + 10}px`,
                transform: 'translateY(-50%)'
            }}
            onMouseEnter={() => { if (hidePopupTimer.current) clearTimeout(hidePopupTimer.current); }}
            onMouseLeave={onClearHover}
        >
            {content}
        </div>
    );
};

export default HoverPopup;