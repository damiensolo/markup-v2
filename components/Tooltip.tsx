import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom': return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left': return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right': return 'left-full ml-2 top-1/2 -translate-y-1/2';
      default: return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom': return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900';
      case 'left': return 'left-full top-1/2 -translate-y-1/2 border-l-gray-900';
      case 'right': return 'right-full top-1/2 -translate-y-1/2 border-r-gray-900';
      default: return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900';
    }
  };

  const getInitialY = () => {
    if (position === 'top') return 4;
    if (position === 'bottom') return -4;
    return 0;
  };

  const getInitialX = () => {
    if (position === 'left') return 4;
    if (position === 'right') return -4;
    return 0;
  };

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: getInitialY(), x: getInitialX() }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: getInitialY(), x: getInitialX() }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className={`absolute z-[100] px-3 py-1.5 text-[13px] font-medium text-white bg-gray-900 rounded-md shadow-xl whitespace-nowrap pointer-events-none ${getPositionClasses()}`}
          >
            {text}
            <div className={`absolute border-[5px] border-transparent ${getArrowClasses()}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
