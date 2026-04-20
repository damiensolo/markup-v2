import React, { useState, useCallback, useEffect, useRef, RefObject } from 'react';
import type { ViewTransform } from '../types';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;

/** Lerp factor per frame — lower = silkier (settles over more frames); ~0.18–0.26 is typical for pro canvas UIs. */
const ZOOM_SMOOTHING = 0.19;

const clampScale = (s: number) => Math.max(MIN_ZOOM, Math.min(s, MAX_ZOOM));

/**
 * Wheel zoom: native `{ passive: false }` + exponential scale + rAF-smoothed interpolation
 * toward a target transform (professional canvas tools).
 */
export const useZoomPan = (
  imageContainerRef: RefObject<HTMLDivElement | null>,
  isWheelTargetMounted: boolean,
) => {
  const [viewTransform, setViewTransformState] = useState<ViewTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const targetRef = useRef<ViewTransform>({ scale: 1, translateX: 0, translateY: 0 });
  const displayRef = useRef<ViewTransform>({ scale: 1, translateX: 0, translateY: 0 });
  const rafRef = useRef<number | null>(null);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const setViewTransform = useCallback(
    (updater: React.SetStateAction<ViewTransform>) => {
      stopAnimation();
      setViewTransformState((prev) => {
        const next = typeof updater === 'function' ? (updater as (p: ViewTransform) => ViewTransform)(prev) : updater;
        targetRef.current = next;
        displayRef.current = next;
        return next;
      });
    },
    [stopAnimation],
  );

  const smoothStep = useCallback(() => {
    const target = targetRef.current;
    const display = displayRef.current;

    const scale = display.scale + (target.scale - display.scale) * ZOOM_SMOOTHING;
    const translateX = display.translateX + (target.translateX - display.translateX) * ZOOM_SMOOTHING;
    const translateY = display.translateY + (target.translateY - display.translateY) * ZOOM_SMOOTHING;

    displayRef.current = { scale, translateX, translateY };
    setViewTransformState({ scale, translateX, translateY });

    const scaleErr = Math.abs(target.scale - scale);
    const panErr =
      Math.abs(target.translateX - translateX) + Math.abs(target.translateY - translateY);
    const done = scaleErr < 0.0008 && panErr < 0.35;

    if (!done) {
      rafRef.current = requestAnimationFrame(smoothStep);
    } else {
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isWheelTargetMounted) {
      stopAnimation();
      return;
    }
    const el = imageContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Don't zoom if scrolling over interactive UI (toolbar, dropdowns, etc.)
      const path = e.composedPath();
      for (const node of path) {
          if (node instanceof HTMLElement && (
              node.hasAttribute('data-interactive-ui') ||
              node.tagName === 'BUTTON' ||
              node.tagName === 'INPUT' ||
              node.tagName === 'TEXTAREA' ||
              node.tagName === 'SELECT'
          )) {
              return;
          }
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let dy = e.deltaY;
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) dy *= 16;
      else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) dy *= rect.height;

      const current = targetRef.current;

      // Exponential zoom (natural for design / CAD tools)
      const sensitivity = e.ctrlKey ? 0.0028 : 0.00155;
      const factor = Math.exp(-dy * sensitivity);
      const newScale = clampScale(current.scale * factor);

      const imageX = (mouseX - current.translateX) / current.scale;
      const imageY = (mouseY - current.translateY) / current.scale;
      const newTranslateX = mouseX - imageX * newScale;
      const newTranslateY = mouseY - imageY * newScale;

      targetRef.current = {
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      };

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(smoothStep);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      stopAnimation();
    };
  }, [isWheelTargetMounted, imageContainerRef, smoothStep, stopAnimation]);

  const handleZoom = useCallback(
    (direction: 'in' | 'out' | 'reset') => {
      if (!imageContainerRef.current) return;
      if (direction === 'reset') {
        setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
        return;
      }
      setViewTransform((prev) => {
        const containerRect = imageContainerRef.current!.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        const imageX = (centerX - prev.translateX) / prev.scale;
        const imageY = (centerY - prev.translateY) / prev.scale;
        const newScale =
          direction === 'in'
            ? Math.min(prev.scale * 1.2, MAX_ZOOM)
            : Math.max(prev.scale / 1.2, MIN_ZOOM);
        return {
          scale: newScale,
          translateX: centerX - imageX * newScale,
          translateY: centerY - imageY * newScale,
        };
      });
    },
    [imageContainerRef, setViewTransform],
  );

  return { viewTransform, setViewTransform, handleZoom };
};
