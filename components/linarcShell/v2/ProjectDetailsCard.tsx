import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from './Tooltip';

interface ProjectDetailsCardProps {
    project: {
        id: string;
        name: string;
        details: string[];
    };
}

const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const BuildingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
        <path d="M6 12h4"></path>
        <path d="M6 16h4"></path>
        <path d="M10 4h4"></path>
        <path d="M10 8h4"></path>
        <path d="M10 12h4"></path>
        <path d="M10 16h4"></path>
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const ChevronDownIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const ProjectDetailsCard: React.FC<ProjectDetailsCardProps> = ({ project }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const cardRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const address = project.details[0] || '';
    const owner = project.details[1] || '';
    const gc = project.details[2] || '';
    const pm = project.details[3] || '';
    const phone = project.details[4] || '';

    // Calculate position based on viewport space - first pass with estimated height
    useEffect(() => {
        if (isExpanded && cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            const estimatedDropdownHeight = 280;
            const estimatedDropdownWidth = 320;
            
            let top: number;
            let left: number;
            
            // Determine if dropdown should open above or below (initial estimate)
            if (spaceBelow < estimatedDropdownHeight && spaceAbove > estimatedDropdownHeight) {
                top = rect.top - estimatedDropdownHeight - 8;
            } else {
                top = rect.bottom + 8;
            }
            
            // Ensure dropdown doesn't go off screen horizontally
            left = Math.max(8, Math.min(rect.left, viewportWidth - estimatedDropdownWidth - 8));
            
            setDropdownStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                width: `${Math.min(estimatedDropdownWidth, viewportWidth - 16)}px`,
            });
        }
    }, [isExpanded]);

    // Second pass: measure actual content after render and adjust if needed
    useEffect(() => {
        if (isExpanded && dropdownRef.current && cardRef.current) {
            // Use requestAnimationFrame to ensure DOM is fully rendered
            const measureAndAdjust = () => {
                const rect = cardRef.current!.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                const actualContentHeight = dropdownRef.current!.scrollHeight;
                const totalHeight = actualContentHeight;
                
                let top: number;
                let maxHeight: string | undefined = undefined;
                let overflowY: 'visible' | 'auto' = 'visible';
                
                // Check if content fits naturally
                if (spaceBelow >= totalHeight + 20) {
                    // Fits below, no constraints needed
                    top = rect.bottom + 8;
                } else if (spaceAbove >= totalHeight + 20) {
                    // Fits above, no constraints needed
                    top = rect.top - totalHeight - 8;
                } else {
                    // Doesn't fit in either direction, need to constrain
                    if (spaceBelow > spaceAbove) {
                        // More space below, constrain there
                        top = rect.bottom + 8;
                        maxHeight = `${spaceBelow - 20}px`;
                        overflowY = 'auto';
                    } else {
                        // More space above, constrain there
                        top = Math.max(8, rect.top - spaceAbove + 20);
                        maxHeight = `${spaceAbove - 20}px`;
                        overflowY = 'auto';
                    }
                }
                
                setDropdownStyle(prev => ({
                    ...prev,
                    top: `${top}px`,
                    maxHeight: maxHeight,
                    overflowY: overflowY,
                }));
            };
            
            // Measure after a brief delay to ensure content is rendered
            const timeoutId = setTimeout(measureAndAdjust, 0);
            requestAnimationFrame(measureAndAdjust);
            
            return () => clearTimeout(timeoutId);
        }
    }, [isExpanded]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    const siteInfoText = address ? `Site: ${address.length > 30 ? address.substring(0, 30) + '...' : address}` : 'Site Information';

    return (
        <Tooltip content={siteInfoText} position="bottom" delay={400} disabled={isExpanded}>
            <div 
                ref={cardRef}
                className="relative"
            >
                {/* Icon + Chevron Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1.5 px-2 py-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 touch-manipulation"
                    aria-expanded={isExpanded}
                    aria-label="Site information"
                >
                    <LocationIcon />
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDownIcon className="w-3.5 h-3.5 text-gray-500" />
                    </motion.div>
                </button>

            {/* Expanded State - Click only */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl p-4 z-[100]"
                        style={dropdownStyle}
                    >
                        <div className="space-y-3 text-[12.25px]">
                            {/* Address */}
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-gray-500 shrink-0">
                                    <LocationIcon />
                                </div>
                                <div className="text-gray-300">
                                    <div className="font-medium text-gray-400 mb-0.5">Address</div>
                                    <div>{address}</div>
                                </div>
                            </div>

                            {/* Owner */}
                            {owner && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-gray-500 shrink-0">
                                        <BuildingIcon />
                                    </div>
                                    <div className="text-gray-300">
                                        <div className="font-medium text-gray-400 mb-0.5">Owner</div>
                                        <div>{owner.replace('Owner - ', '')}</div>
                                    </div>
                                </div>
                            )}

                            {/* GC */}
                            {gc && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-gray-500 shrink-0">
                                        <BuildingIcon />
                                    </div>
                                    <div className="text-gray-300">
                                        <div className="font-medium text-gray-400 mb-0.5">General Contractor</div>
                                        <div>{gc.replace('GC - ', '')}</div>
                                    </div>
                                </div>
                            )}

                            {/* PM */}
                            {pm && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-gray-500 shrink-0">
                                        <UserIcon />
                                    </div>
                                    <div className="text-gray-300">
                                        <div className="font-medium text-gray-400 mb-0.5">Project Manager</div>
                                        <div>{pm.replace('PM - ', '')}</div>
                                    </div>
                                </div>
                            )}

                            {/* Phone */}
                            {phone && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-gray-500 shrink-0">
                                        <PhoneIcon />
                                    </div>
                                    <div className="text-gray-300">
                                        <div className="font-medium text-gray-400 mb-0.5">Phone</div>
                                        <div>{phone}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </Tooltip>
    );
};

export default ProjectDetailsCard;
