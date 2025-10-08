// Fix: Added `React` to the import to make types like `React.WheelEvent` available.
import React, { useState, useCallback, RefObject } from 'react';
import type { ViewTransform } from '../types';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;

export const useZoomPan = (imageContainerRef: RefObject<HTMLDivElement>) => {
  const [viewTransform, setViewTransform] = useState<ViewTransform>({ scale: 1, translateX: 0, translateY: 0 });

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!imageContainerRef.current) return;

    const { scale, translateX, translateY } = viewTransform;
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const imageX = (mouseX - translateX) / scale;
    const imageY = (mouseY - translateY) / scale;

    const delta = e.deltaY * -0.005;
    const newScale = Math.max(MIN_ZOOM, Math.min(scale + delta, MAX_ZOOM));
    
    const newTranslateX = mouseX - imageX * newScale;
    const newTranslateY = mouseY - imageY * newScale;

    setViewTransform({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
  }, [viewTransform, imageContainerRef]);

  const handleZoom = useCallback((direction: 'in' | 'out' | 'reset') => {
    if (!imageContainerRef.current) return;
    if (direction === 'reset') {
        setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
        return;
    }

    const { scale, translateX, translateY } = viewTransform;
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    const imageX = (centerX - translateX) / scale;
    const imageY = (centerY - translateY) / scale;
    
    const newScale = direction === 'in' 
        ? Math.min(scale * 1.2, MAX_ZOOM) 
        : Math.max(scale / 1.2, MIN_ZOOM);

    const newTranslateX = centerX - imageX * newScale;
    const newTranslateY = centerY - imageY * newScale;
    
    setViewTransform({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
  }, [viewTransform, imageContainerRef]);

  return { viewTransform, setViewTransform, handleWheel, handleZoom };
};
