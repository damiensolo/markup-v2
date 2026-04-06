import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

// --- Type Definitions ---
interface BookmarkItem {
    categoryKey: string;
    itemKey: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    navIcon: React.ReactNode;
}

interface BookmarksMenuProps {
    bookmarks: BookmarkItem[];
    onSelect: (categoryKey: string, subcategoryKey: string) => void;
    onToggleBookmark: (categoryKey: string, itemKey: string) => void;
    onClose: () => void;
    position?: 'bottom' | 'right';
    triggerRef?: React.RefObject<HTMLElement>;
}

// Bookmark Icon Component
const BookmarkIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className = '' }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill={filled ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
    >
        <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
);

const BookmarksMenu: React.FC<BookmarksMenuProps> = ({ bookmarks, onSelect, onToggleBookmark, onClose, position = 'bottom', triggerRef }) => {
    const isRightPosition = position === 'right';
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (triggerRef?.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            if (isRightPosition) {
                setMenuPosition({
                    top: rect.top,
                    left: rect.right + 8 // 8px gap (ml-2)
                });
            } else {
                // Bottom position - position below the trigger, centered
                const menuWidth = 850; // Approximate menu width
                const leftOffset = Math.max(16, rect.left - (menuWidth / 2) + (rect.width / 2)); // Center relative to trigger, min 16px from edge
                setMenuPosition({
                    top: rect.bottom + 4, // 4px gap
                    left: leftOffset
                });
            }
        }
    }, [isRightPosition, triggerRef]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (triggerRef?.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, triggerRef]);
    
    const animationProps = isRightPosition
        ? {
            initial: { opacity: 0, x: -10, scale: 0.95 },
            animate: { opacity: 1, x: 0, scale: 1 },
            exit: { opacity: 0, x: -10, scale: 0.95 }
        }
        : {
            initial: { opacity: 0, y: 10, scale: 0.95 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 10, scale: 0.95 }
        };

    const emptyMenuContent = (
        <motion.div
            ref={menuRef}
            {...animationProps}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bg-white rounded-xl shadow-2xl p-6 md:p-8 z-[10000] origin-top-left w-[calc(100vw-2rem)] md:w-auto md:min-w-[400px]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
        >
            <div className="text-center py-8">
                <BookmarkIcon filled={false} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No bookmarks yet</p>
                <p className="text-gray-400 text-xs mt-2">Bookmark items in the menu to add them here</p>
            </div>
        </motion.div>
    );

    const menuContent = (
        <motion.div
            ref={menuRef}
            {...animationProps}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bg-white rounded-xl shadow-2xl p-4 md:p-6 lg:p-8 z-[10000] origin-top-left w-[calc(100vw-2rem)] md:w-auto md:min-w-[600px] lg:min-w-[850px] max-w-[calc(100vw-2rem)]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
        >
            <div className="mb-4 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Bookmarks</h3>
                <p className="text-xs text-gray-500 mt-1">Your frequently used tools</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-6 lg:gap-x-8 gap-y-4 text-black">
                {bookmarks.map((item) => (
                    <a
                        key={`${item.categoryKey}:${item.itemKey}`}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onSelect(item.categoryKey, item.itemKey);
                        }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 group relative"
                    >
                        {item.icon}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h5 className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 truncate">
                                    {item.label}
                                </h5>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onToggleBookmark(item.categoryKey, item.itemKey);
                                    }}
                                    className="opacity-100 p-1 hover:bg-gray-100 rounded transition-colors"
                                    aria-label="Remove bookmark"
                                >
                                    <BookmarkIcon 
                                        filled={true} 
                                        className="w-4 h-4 text-yellow-500"
                                    />
                                </button>
                            </div>
                            <p className="text-gray-500 text-xs w-auto mt-0.5 line-clamp-2">
                                {item.description}
                            </p>
                        </div>
                    </a>
                ))}
            </div>
        </motion.div>
    );

    const content = bookmarks.length === 0 ? emptyMenuContent : menuContent;

    // Always use portal when triggerRef is provided to escape overflow containers
    if (triggerRef) {
        return createPortal(content, document.body);
    }

    return content;
};

export default BookmarksMenu;
