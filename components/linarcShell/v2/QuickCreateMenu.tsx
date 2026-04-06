import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    FileDiff, 
    CheckSquare, 
    Truck, 
    CalendarDays, 
    Package, 
    Ticket, 
    ClipboardList, 
    FileQuestion, 
    FileCheck
} from 'lucide-react';

interface QuickCreateItem {
    label: string;
    icon: React.ElementType;
    shortcut?: string;
    type: string;
}

const quickCreateItems: QuickCreateItem[] = [
    { label: 'Change Order', icon: FileDiff, type: 'change-order' },
    { label: 'Checklist', icon: CheckSquare, type: 'checklist' },
    { label: 'Equipment', icon: Truck, type: 'equipment' },
    { label: 'Lookahead', icon: CalendarDays, type: 'lookahead' },
    { label: 'Materials', icon: Package, type: 'materials' },
    { label: 'T&M Ticket', icon: Ticket, type: 'tm-ticket' },
    { label: 'Punch List', icon: ClipboardList, type: 'punch-list' },
    { label: 'RFI', icon: FileQuestion, type: 'rfi' },
    { label: 'Submittal', icon: FileCheck, type: 'submittal' },
];

export const QuickCreateMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top,
                left: rect.right + 8 // 8px gap
            });
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle keyboard shortcuts (Shift + C)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.shiftKey && (event.key === 'C' || event.key === 'c')) {
                event.preventDefault();
                setIsOpen(prev => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleQuickCreate = (type: string) => {
        console.log(`Quick Create triggered for: ${type}`);
        setIsOpen(false);
        // Placeholder for future modal logic
    };

    return (
        <div className="relative w-full">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`relative flex flex-col items-center justify-center gap-1.5 h-[80px] w-full text-xs font-medium transition-colors duration-200 ${isOpen ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
                aria-label="Create New"
                aria-expanded={isOpen}
            >
                <div className="flex items-center justify-center w-6 h-8">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-current">
                        <Plus size={16} />
                    </div>
                </div>
                <span>Create</span>
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            key="quick-create-menu"
                            ref={menuRef}
                            initial={{ opacity: 0, x: 10, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="fixed bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-[10000] origin-top-left"
                            style={{ 
                                top: position.top, 
                                left: position.left,
                                width: '16rem' // w-64
                            }}
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-sm font-semibold text-gray-900">Quick Create</h3>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                {quickCreateItems.map((item) => (
                                    <button
                                        key={item.type}
                                        onClick={() => handleQuickCreate(item.type)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors group focus:outline-none focus:bg-gray-50"
                                    >
                                        <item.icon size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {/* Footer Hint */}
                            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 text-center flex justify-between items-center">
                                <span>Quick Add</span>
                                <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-500">Shift + C</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
