import React from 'react';
import type { HoveredItemInfo, Rectangle, SafetyIssueData, PunchData, DrawingData, Pin, PhotoData } from '../types';
import { MOCK_PHOTOS } from './PhotoPickerModal';

interface HoverPopupProps {
    hoveredItem: HoveredItemInfo | null;
    rectangles: Rectangle[];
    allPunches: PunchData[];
    allSafetyIssues: SafetyIssueData[];
    onOpenRfiPanel: (rectId: string, rfiId: number | null) => void;
    onClearHover: () => void;
    hidePopupTimer: React.MutableRefObject<number | null>;
    showPopupTimer: React.MutableRefObject<number | null>;
    onPinClick: (pin: Pin) => void;
    onOpenPhotoMarkup: (photo: PhotoData) => void;
}

const HoverPopup: React.FC<HoverPopupProps> = ({
    hoveredItem, rectangles, allPunches, allSafetyIssues, onOpenRfiPanel, onClearHover, hidePopupTimer, showPopupTimer, onPinClick, onOpenPhotoMarkup
}) => {
    if (!hoveredItem) return null;

    let content = null;

    switch (hoveredItem.type) {
        case 'pin':
            const pin = hoveredItem.pin;
            if (pin) {
                if (pin.type === 'safety') {
                    const issue = allSafetyIssues.find(i => i.id === pin.linkedId);
                    if (issue) content = (
                         <>
                            <button onClick={(e) => { e.stopPropagation(); onPinClick(pin); onClearHover(); }} className="w-full text-left group">
                                <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2 truncate group-hover:text-gray-700 dark:group-hover:text-zinc-300 transition-colors underline decoration-dotted">{issue.id}: {issue.title}</h4>
                            </button>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Severity:</span> {issue.severity}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span> {issue.status}</p>
                            <p className="text-sm text-gray-400">Click title or pin to view details.</p>
                         </>
                    );
                } else if (pin.type === 'punch') {
                    const punch = allPunches.find(p => p.id === pin.linkedId);
                    if (punch) content = (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onPinClick(pin); onClearHover(); }} className="w-full text-left group">
                                <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2 truncate group-hover:text-gray-700 dark:group-hover:text-zinc-300 transition-colors underline decoration-dotted">{punch.id}: {punch.title}</h4>
                            </button>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Assignee:</span> {punch.assignee}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span> {punch.status}</p>
                            <p className="text-sm text-gray-400">Click title or pin to view details.</p>
                        </>
                    );
                } else if (pin.type === 'photo') {
                    // Photo pins store the photo ID in linkedId
                    const photo = MOCK_PHOTOS.find(p => p.id === pin.linkedId);
                    if (photo) content = (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onOpenPhotoMarkup(photo); onClearHover(); }} 
                                className="w-full text-left group"
                            >
                                <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2 truncate group-hover:text-gray-700 dark:group-hover:text-zinc-300 transition-colors underline decoration-dotted">
                                    {photo.id}: {photo.title}
                                </h4>
                                <div className="rounded-md overflow-hidden mb-3 border border-gray-100 dark:border-zinc-800 shadow-sm transition-opacity group-hover:opacity-90">
                                    <img src={photo.url} alt={photo.title} className="w-full h-32 object-cover" />
                                </div>
                            </button>
                            <p className="text-sm text-gray-400">Click title or photo to view & annotate.</p>
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
                                <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2 truncate">RFI-{rfi.id}: {rfi.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Type:</span> {rfi.type}</p>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 max-h-24 overflow-y-auto">
                                    <span className="font-semibold text-gray-500 dark:text-gray-400">Question:</span>
                                    <p className="whitespace-pre-wrap break-words">{rfi.question}</p>
                                </div>
                                <a href="https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/document/rfi/uiSFtnkKXNpn5Koz/details?tab=details" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-semibold">View Full RFI &rarr;</a>
                            </>
                        );
                        break;
                    case 'submittal':
                        const submittal = rect.submittals?.find(s => s.id === hoveredItem.itemId);
                        if (submittal) content = (
                            <>
                                <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2 truncate">{submittal.id}: {submittal.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Spec Section:</span> {submittal.specSection}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span> {submittal.status}</p>
                                <a href="https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/document/submittals/package/FMVmW4xEe9bcHUTp/registries/Xh6FHaQZ9Dyv6V3i/?tab=response" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-semibold">View Full Submittal &rarr;</a>
                            </>
                        );
                        break;
                    case 'punch':
                        const punch = rect.punches?.find(p => p.id === hoveredItem.itemId);
                        if (punch) content = (
                            <>
                                <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2 truncate">{punch.id}: {punch.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><span className="font-semibold text-gray-500 dark:text-gray-400">Assignee:</span> {punch.assignee}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span> {punch.status}</p>
                                <a href="https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/quality/punchList/H7SakWBed794KRdU/details?tab=details" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300">View Full Punch Item &rarr;</a>
                            </>
                        );
                        break;
                    case 'drawing':
                        const drawing = rect.drawings?.find(d => d.id === hoveredItem.itemId);
                        // Fix: Access thumbnailUrl from the first version of the drawing.
                        if (drawing && drawing.versions?.[0]) content = (
                            <>
                                <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2 truncate">{drawing.id}: {drawing.title}</h4>
                                <img src={drawing.versions[0].thumbnailUrl} alt={drawing.title} className="rounded-md mb-3 w-full object-cover" />
                                <a href="https://demo.linarc.io/projectPortal/kbUydYsp3LW2WhsQ/document/newPlans/markup/A-3.2/AHV6vNEm20250627115709/latest" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-semibold">View Full Drawing &rarr;</a>
                            </>
                        );
                        break;
                    case 'photo':
                        const photo = rect.photos?.find((p: PhotoData) => p.id === hoveredItem.itemId);
                        if (photo) content = (
                            <>
                                <h4 className="font-semibold text-gray-900 dark:text-zinc-100 mb-2 truncate">{photo.id}: {photo.title}</h4>
                                <button
                                    type="button"
                                    onClick={() => { onOpenPhotoMarkup(photo); onClearHover(); }}
                                    className="w-full rounded-md overflow-hidden mb-3 block hover:opacity-90 transition-opacity"
                                >
                                    <img
                                        src={photo.url}
                                        alt={photo.title}
                                        className="w-full object-cover"
                                        style={{ maxHeight: '160px' }}
                                        onError={(e) => {
                                            const t = e.currentTarget;
                                            t.onerror = null;
                                            t.style.display = 'none';
                                            const placeholder = document.createElement('div');
                                            placeholder.className = 'flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-md text-gray-400 dark:text-zinc-500 text-xs py-8';
                                            placeholder.textContent = 'Image unavailable';
                                            t.parentNode?.insertBefore(placeholder, t);
                                        }}
                                    />
                                </button>
                                <p className="text-sm text-gray-400">Click to view &amp; annotate.</p>
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
            onMouseEnter={() => {
                if (hidePopupTimer.current) { clearTimeout(hidePopupTimer.current); hidePopupTimer.current = null; }
                if (showPopupTimer.current) { clearTimeout(showPopupTimer.current); showPopupTimer.current = null; }
            }}
            onMouseLeave={() => {
                hidePopupTimer.current = window.setTimeout(onClearHover, 500);
            }}
        >
            {content}
        </div>
    );
};

export default HoverPopup;