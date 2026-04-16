

import React, { useState, useCallback } from 'react';
import type { Rectangle, Pin, InteractionState, SafetyIssueData, PunchData, LineMarkup, LineMarkupPoint } from '../types';

type ActiveTool = 'select' | 'shape' | 'pen' | 'line' | 'arrow' | 'freeline' | 'text' | 'pin' | 'image' | 'location' | 'measurement' | 'polygon' | 'highlighter' | 'customPin' | 'fill' | 'stroke';
type ActiveShape = 'cloud' | 'box' | 'ellipse';
type ActivePinType = 'photo' | 'safety' | 'punch';

const normalizeRect = (rect: Omit<Rectangle, 'id' | 'name' | 'visible'> | Rectangle, activeShape: ActiveShape): Rectangle => {
  const newRect = { ...rect, id: 'id' in rect ? rect.id : '', shape: 'shape' in rect && rect.shape ? rect.shape : activeShape, name: 'name' in rect ? rect.name : '', visible: 'visible' in rect ? rect.visible : true };
  if (newRect.width < 0) {
    newRect.x = newRect.x + newRect.width;
    newRect.width = Math.abs(newRect.width);
  }
  if (newRect.height < 0) {
    newRect.y = newRect.y + newRect.height;
    newRect.height = Math.abs(newRect.height);
  }
  return newRect;
};

// Ramer-Douglas-Peucker path simplification (coordinates are percentages).
const rdpSimplify = (points: LineMarkupPoint[], epsilon: number): LineMarkupPoint[] => {
  if (points.length <= 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  const abx = last.x - first.x;
  const aby = last.y - first.y;
  const abLen = Math.hypot(abx, aby);
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = abLen === 0
      ? Math.hypot(points[i].x - first.x, points[i].y - first.y)
      : Math.abs(aby * points[i].x - abx * points[i].y + last.x * first.y - last.y * first.x) / abLen;
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
};

const lineSegmentsIntersect = (a1: LineMarkupPoint, a2: LineMarkupPoint, b1: LineMarkupPoint, b2: LineMarkupPoint) => {
  const orient = (p: LineMarkupPoint, q: LineMarkupPoint, r: LineMarkupPoint) =>
    (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  const onSegment = (p: LineMarkupPoint, q: LineMarkupPoint, r: LineMarkupPoint) =>
    Math.min(p.x, r.x) <= q.x && q.x <= Math.max(p.x, r.x) &&
    Math.min(p.y, r.y) <= q.y && q.y <= Math.max(p.y, r.y);

  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);

  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  if (o1 === 0 && onSegment(a1, b1, a2)) return true;
  if (o2 === 0 && onSegment(a1, b2, a2)) return true;
  if (o3 === 0 && onSegment(b1, a1, b2)) return true;
  if (o4 === 0 && onSegment(b1, a2, b2)) return true;
  return false;
};

export const useCanvasInteraction = ({
  rectangles, setRectangles,
  pins, setPins,
  activeTool, activeShape, activePinType,
  markupFillColor, markupStrokeColor,
  selectedRectIds, setSelectedRectIds,
  setSelectedPinId,
  viewTransform, setViewTransform,
  isRfiPanelOpen, handleRfiCancel,
  setLinkMenuRectId,
  draggingPinId, setDraggingPinId,
  lineMarkups, setLineMarkups,
  selectedLineIds, setSelectedLineIds,
  selectedLineId, setSelectedLineId,
  selectedLinePointIndex, setSelectedLinePointIndex,
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
}: any) => {
  const [interaction, setInteraction] = useState<InteractionState>({ type: 'none' });
  const [currentRect, setCurrentRect] = useState<Omit<Rectangle, 'id' | 'name' | 'visible'> | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<Omit<Rectangle, 'id' | 'name' | 'visible'> | null>(null);
  const [currentLineMarkup, setCurrentLineMarkup] = useState<LineMarkup | null>(null);
  const [movingLineInitialPoints, setMovingLineInitialPoints] = useState<LineMarkupPoint[] | null>(null);
  const [movingLineId, setMovingLineId] = useState<string | null>(null);
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);

  const findNearestLinePoint = useCallback((coords: LineMarkupPoint) => {
    const hitRadius = 1.25;
    for (const line of [...lineMarkups].reverse()) {
      if (!line.visible) continue;
      for (let i = 0; i < line.points.length; i++) {
        const p = line.points[i];
        if (Math.hypot(p.x - coords.x, p.y - coords.y) <= hitRadius) {
          return { lineId: line.id, pointIndex: i };
        }
      }
    }
    return null;
  }, [lineMarkups]);

  const distanceToSegment = (point: LineMarkupPoint, a: LineMarkupPoint, b: LineMarkupPoint) => {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = point.x - a.x;
    const apy = point.y - a.y;
    const abLenSq = abx * abx + aby * aby;
    if (abLenSq === 0) return Math.hypot(apx, apy);
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
    const cx = a.x + t * abx;
    const cy = a.y + t * aby;
    return Math.hypot(point.x - cx, point.y - cy);
  };

  const findNearestLineSegment = useCallback((coords: LineMarkupPoint) => {
    const hitRadius = 0.9;
    for (const line of [...lineMarkups].reverse()) {
      if (!line.visible || line.points.length < 2) continue;
      for (let i = 0; i < line.points.length - 1; i++) {
        const d = distanceToSegment(coords, line.points[i], line.points[i + 1]);
        if (d <= hitRadius) {
          return line;
        }
      }
      if (line.type === 'freeline' && line.closed && line.points.length >= 3) {
        const last = line.points[line.points.length - 1];
        const first = line.points[0];
        const closingDistance = distanceToSegment(coords, last, first);
        if (closingDistance <= hitRadius) {
          return line;
        }
      }
    }
    return null;
  }, [lineMarkups]);

  const isPointInsidePolygon = (point: LineMarkupPoint, polygon: LineMarkupPoint[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersects = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  };

  const findClosedFreelineByFillHit = useCallback((coords: LineMarkupPoint) => {
    for (const line of [...lineMarkups].reverse()) {
      if (!line.visible || line.locked || line.type !== 'freeline' || !line.closed || line.points.length < 3) continue;
      if (isPointInsidePolygon(coords, line.points)) {
        return line;
      }
    }
    return null;
  }, [lineMarkups]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isSpacebarDown && event.button === 0) {
        event.preventDefault();
        setInteraction({ type: 'panning', startPoint: { x: event.clientX, y: event.clientY }, initialTransform: viewTransform });
        return;
    }

    if ((event.target as HTMLElement).closest('[data-interactive-ui="true"]')) return;
    
    mouseDownRef.current = { x: event.clientX, y: event.clientY };
    if (interaction.type !== 'none' || draggingPinId) return;

    if (event.button === 1) {
      event.preventDefault();
      setInteraction({ type: 'panning', startPoint: { x: event.clientX, y: event.clientY }, initialTransform: viewTransform });
      return;
    }

    const coords = getRelativeCoords(event);
    if (!coords) return;
    
    const previouslySelectedLineId = selectedLineId;
    setSelectedPinId(null);

    if (activeTool === 'line' || activeTool === 'arrow' || activeTool === 'freeline') {
      setSelectedRectIds([]);
      if (activeTool === 'freeline' && previouslySelectedLineId) {
        const selected = lineMarkups.find((line: LineMarkup) => line.id === previouslySelectedLineId && line.type === 'freeline');
        if (selected && !selected.closed && selected.points.length >= 3) {
          const firstPoint = selected.points[0];
          if (firstPoint && Math.hypot(firstPoint.x - coords.x, firstPoint.y - coords.y) <= 1.25) {
            setLineMarkups((prev: LineMarkup[]) => prev.map((line) => (
              line.id === selected.id ? { ...line, closed: true } : line
            )));
            setSelectedLineId(selected.id);
            setSelectedLineIds([selected.id]);
            setSelectedLinePointIndex(0);
            setHasUnsavedChanges(true);
            return;
          }
        }
      }
      const hit = findNearestLinePoint(coords);
      if (hit) {
        const line = lineMarkups.find((l: LineMarkup) => l.id === hit.lineId);
        if (line?.locked) {
          setSelectedLineId(hit.lineId);
          setSelectedLineIds([hit.lineId]);
          setSelectedLinePointIndex(hit.pointIndex);
          return;
        }
        setSelectedLineId(hit.lineId);
        setSelectedLineIds([hit.lineId]);
        setSelectedLinePointIndex(hit.pointIndex);
        setInteraction({ type: 'moving', startPoint: coords, initialRects: [] });
        setMovingLineInitialPoints(null);
        setMovingLineId(hit.lineId);
        return;
      }

      const segmentHit = findNearestLineSegment(coords);
      if (segmentHit) {
        if (segmentHit.locked) {
          setSelectedLineId(segmentHit.id);
          setSelectedLineIds([segmentHit.id]);
          setSelectedLinePointIndex(null);
          return;
        }
        setSelectedLineId(segmentHit.id);
        setSelectedLineIds([segmentHit.id]);
        setSelectedLinePointIndex(null);
        setMovingLineInitialPoints(segmentHit.points.map((p) => ({ ...p })));
        setMovingLineId(segmentHit.id);
        setInteraction({ type: 'moving', startPoint: coords, initialRects: [] });
        return;
      }

      const fillHit = findClosedFreelineByFillHit(coords);
      if (fillHit) {
        setSelectedLineId(fillHit.id);
        setSelectedLineIds([fillHit.id]);
        setSelectedLinePointIndex(null);
        setMovingLineInitialPoints(fillHit.points.map((p) => ({ ...p })));
        setMovingLineId(fillHit.id);
        setInteraction({ type: 'moving', startPoint: coords, initialRects: [] });
        return;
      }

      if (activeTool === 'freeline') {
        if (previouslySelectedLineId) {
          const selected = lineMarkups.find((line: LineMarkup) => line.id === previouslySelectedLineId && line.type === 'freeline');
          if (selected) {
            if (selected.closed) return;
            setLineMarkups((prev: LineMarkup[]) => prev.map((line) => {
              if (line.id !== selected.id) return line;
              return { ...line, points: [...line.points, coords] };
            }));
            setSelectedLineIds([selected.id]);
            setSelectedLinePointIndex(selected.points.length);
            setHasUnsavedChanges(true);
            return;
          }
        }
        const newFreeline: LineMarkup = {
          id: `line-${Date.now()}`,
          type: 'freeline',
          points: [coords],
          name: `Freeline ${lineMarkups.filter((line: LineMarkup) => line.type === 'freeline').length + 1}`,
          visible: true,
          fillColor: 'transparent',
          strokeColor: markupStrokeColor,
        };
        setLineMarkups((prev: LineMarkup[]) => [...prev, newFreeline]);
        setSelectedLineId(newFreeline.id);
        setSelectedLineIds([newFreeline.id]);
        setSelectedLinePointIndex(0);
        setHasUnsavedChanges(true);
        return;
      }

      const newLine: LineMarkup = {
        id: `line-${Date.now()}`,
        type: activeTool,
        points: [coords, coords],
        name: `${activeTool === 'arrow' ? 'Arrow' : 'Line'} ${lineMarkups.filter((line: LineMarkup) => line.type === activeTool).length + 1}`,
        visible: true,
        fillColor: 'transparent',
        strokeColor: markupStrokeColor,
      };
      setCurrentLineMarkup(newLine);
      setInteraction({ type: 'drawing', startPoint: coords });
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setSelectedRectIds([]);

      // 1. Hit-test start/end points of existing freehand strokes — same priority as
      //    the line/arrow tools give to their endpoint handles.
      const endpointHitRadius = 1.5;
      for (const line of [...lineMarkups].reverse()) {
        if (!line.visible || (line.type !== 'pen' && line.type !== 'highlighter')) continue;
        if (line.points.length < 1) continue;
        const firstPt = line.points[0];
        const lastPt = line.points[line.points.length - 1];
        const hitFirst = Math.hypot(firstPt.x - coords.x, firstPt.y - coords.y) <= endpointHitRadius;
        const hitLast = line.points.length > 1 && Math.hypot(lastPt.x - coords.x, lastPt.y - coords.y) <= endpointHitRadius;
        if (hitFirst || hitLast) {
          const pointIndex = hitFirst ? 0 : line.points.length - 1;
          setSelectedLineId(line.id);
          setSelectedLineIds([line.id]);
          setSelectedLinePointIndex(pointIndex);
          if (!line.locked) {
            setMovingLineId(line.id);
            setMovingLineInitialPoints(null);
            setInteraction({ type: 'moving', startPoint: coords, initialRects: [] });
          }
          return;
        }
      }

      // 2. Hit-test the stroke body (segment) — lets users drag the whole stroke.
      const segHit = findNearestLineSegment(coords);
      if (segHit && (segHit.type === 'pen' || segHit.type === 'highlighter')) {
        setSelectedLineId(segHit.id);
        setSelectedLineIds([segHit.id]);
        setSelectedLinePointIndex(null);
        if (!segHit.locked) {
          setMovingLineInitialPoints(segHit.points.map((p: LineMarkupPoint) => ({ ...p })));
          setMovingLineId(segHit.id);
          setInteraction({ type: 'moving', startPoint: coords, initialRects: [] });
        }
        return;
      }

      // 3. No hit on an existing stroke — start drawing a new one.
      setSelectedLineId(null);
      setSelectedLineIds([]);
      setSelectedLinePointIndex(null);
      const isPen = activeTool === 'pen';
      const newStroke: LineMarkup = {
        id: `line-${Date.now()}`,
        type: activeTool,
        points: [coords],
        name: `${isPen ? 'Pen' : 'Highlight'} ${lineMarkups.filter((l: LineMarkup) => l.type === activeTool).length + 1}`,
        visible: true,
        strokeColor: markupStrokeColor,
        fillColor: 'transparent',
        strokeWidth: isPen ? 3 : 16,
      };
      setCurrentLineMarkup(newStroke);
      setInteraction({ type: 'drawing', startPoint: coords });
      return;
    }

    setSelectedLineId(null);
    setSelectedLineIds([]);
    setSelectedLinePointIndex(null);

    const clickedRect = [...rectangles].reverse().find(rect => {
      const normalized = normalizeRect(rect, activeShape);
      return coords.x >= normalized.x && coords.x <= normalized.x + normalized.width &&
             coords.y >= normalized.y && coords.y <= normalized.y + normalized.height;
    });

    if (activeTool === 'select') {
      setLinkMenuRectId(null);
      const linePointHit = findNearestLinePoint(coords);
      if (linePointHit) {
        const line = lineMarkups.find((l: LineMarkup) => l.id === linePointHit.lineId);
        setSelectedRectIds([]);
        setSelectedLineId(linePointHit.lineId);
        setSelectedLineIds([linePointHit.lineId]);
        setSelectedLinePointIndex(linePointHit.pointIndex);
        if (!line?.locked) {
          setMovingLineId(linePointHit.lineId);
          setInteraction({ type: 'moving', startPoint: coords, initialRects: [] });
        }
        return;
      }
      const lineSegmentHit = findNearestLineSegment(coords);
      if (lineSegmentHit) {
        setSelectedRectIds([]);
        setSelectedLineId(lineSegmentHit.id);
        setSelectedLineIds([lineSegmentHit.id]);
        setSelectedLinePointIndex(null);
        if (!lineSegmentHit.locked) {
          setMovingLineInitialPoints(lineSegmentHit.points.map((p) => ({ ...p })));
          setMovingLineId(lineSegmentHit.id);
          setInteraction({ type: 'moving', startPoint: coords, initialRects: [] });
        }
        return;
      }
      const lineFillHit = findClosedFreelineByFillHit(coords);
      if (lineFillHit) {
        setSelectedRectIds([]);
        setSelectedLineId(lineFillHit.id);
        setSelectedLineIds([lineFillHit.id]);
        setSelectedLinePointIndex(null);
        setMovingLineInitialPoints(lineFillHit.points.map((p) => ({ ...p })));
        setMovingLineId(lineFillHit.id);
        setInteraction({ type: 'moving', startPoint: coords, initialRects: [] });
        return;
      }
      if (clickedRect) {
        const isSelected = selectedRectIds.includes(clickedRect.id);
        let newSelectedIds = isSelected
          ? (event.shiftKey ? selectedRectIds.filter(id => id !== clickedRect.id) : selectedRectIds)
          : (event.shiftKey ? [...selectedRectIds, clickedRect.id] : [clickedRect.id]);
        setSelectedRectIds(newSelectedIds);
        
        // Only move if not locked
        if (!clickedRect.locked) {
             const rectsToMove = rectangles.filter(r => newSelectedIds.includes(r.id) && !r.locked);
             if (rectsToMove.length > 0) {
                 setInteraction({ type: 'moving', startPoint: coords, initialRects: rectsToMove });
             }
        }
      } else {
        if (viewTransform.scale > 1) {
            setInteraction({ type: 'panning', startPoint: { x: event.clientX, y: event.clientY }, initialTransform: viewTransform });
        } else {
            setSelectedRectIds([]);
            setSelectedLineIds([]);
            setInteraction({ type: 'marquee', startPoint: coords });
            setMarqueeRect({ x: coords.x, y: coords.y, width: 0, height: 0, shape: 'box' });
        }
      }
    } else if (activeTool === 'shape') {
      if (clickedRect) {
        setSelectedRectIds([clickedRect.id]);
        setLinkMenuRectId(null);
        if (!clickedRect.locked) {
            setInteraction({ type: 'moving', startPoint: coords, initialRects: [clickedRect] });
        }
      } else {
        if (isRfiPanelOpen) handleRfiCancel();
        setLinkMenuRectId(null);
        setSelectedRectIds([]);
        setInteraction({ type: 'drawing', startPoint: coords });
        setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0, shape: activeShape });
      }
    }
  }, [getRelativeCoords, interaction.type, rectangles, activeTool, activeShape, selectedRectIds, viewTransform, isRfiPanelOpen, handleRfiCancel, draggingPinId, setInteraction, setCurrentRect, setMarqueeRect, setSelectedRectIds, setSelectedPinId, setLinkMenuRectId, mouseDownRef, isSpacebarDown, lineMarkups, selectedLineId, findNearestLinePoint, findNearestLineSegment, findClosedFreelineByFillHit, markupStrokeColor, setLineMarkups, setHasUnsavedChanges, setSelectedLineIds]);
  
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (draggingPinId) {
      const coords = getRelativeCoords(event);
      if (coords) {
        const offsetX = pinDragOffset ? pinDragOffset.x : 0;
        const offsetY = pinDragOffset ? pinDragOffset.y : 0;
        setPins((prevPins: Pin[]) => prevPins.map(p => p.id === draggingPinId ? { ...p, x: coords.x - offsetX, y: coords.y - offsetY } : p));
      }
      return;
    }
    
    if (movingLineId && selectedLinePointIndex !== null && interaction.type === 'moving') {
      const coords = getRelativeCoords(event);
      if (!coords) return;
      setLineMarkups((prev: LineMarkup[]) => prev.map(line => {
        if (line.id !== movingLineId) return line;
        const nextPoints = line.points.map((p, idx) => idx === selectedLinePointIndex ? coords : p);
        return { ...line, points: nextPoints };
      }));
      return;
    }
    
    if (movingLineId && selectedLinePointIndex === null && interaction.type === 'moving' && movingLineInitialPoints && interaction.startPoint) {
      const coords = getRelativeCoords(event);
      if (!coords) return;
      const dx = coords.x - interaction.startPoint.x;
      const dy = coords.y - interaction.startPoint.y;
      const movingIds = selectedLineIds.length > 1 && selectedLineIds.includes(movingLineId) ? selectedLineIds : [movingLineId];
      setLineMarkups((prev: LineMarkup[]) => prev.map((line) => {
        if (!movingIds.includes(line.id)) return line;
        const basePoints = line.id === movingLineId ? movingLineInitialPoints : line.points;
        return {
          ...line,
          points: basePoints.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        };
      }));
      return;
    }

    if (interaction.type === 'panning') {
        if (!interaction.startPoint || !interaction.initialTransform) return;
        const dx = event.clientX - interaction.startPoint.x;
        const dy = event.clientY - interaction.startPoint.y;
        setViewTransform({ scale: interaction.initialTransform.scale, translateX: interaction.initialTransform.translateX + dx, translateY: interaction.initialTransform.translateY + dy });
        return;
    }

    const coords = getRelativeCoords(event);
    if (!coords) return;

    // Keep hover state fresh whenever the cursor is idle over the canvas
    if (interaction.type === 'none') {
      const nearSeg = findNearestLineSegment(coords);
      setHoveredLineId(nearSeg ? nearSeg.id : null);
      return;
    }

    if (!interaction.startPoint) return;

    const dx = coords.x - interaction.startPoint.x;
    const dy = coords.y - interaction.startPoint.y;

    switch (interaction.type) {
      case 'drawing':
      case 'marquee': {
        if (currentLineMarkup) {
          if (currentLineMarkup.type === 'pen' || currentLineMarkup.type === 'highlighter') {
            // Continuous freehand: append point if cursor moved far enough
            setCurrentLineMarkup(prev => {
              if (!prev) return prev;
              const last = prev.points[prev.points.length - 1];
              if (Math.hypot(coords.x - last.x, coords.y - last.y) < 0.05) return prev;
              return { ...prev, points: [...prev.points, coords] };
            });
          } else {
            setCurrentLineMarkup(prev => prev ? ({ ...prev, points: [prev.points[0], coords] }) : prev);
          }
          break;
        }
        const baseRect = { x: interaction.startPoint.x, y: interaction.startPoint.y, width: dx, height: dy };
        if (interaction.type === 'drawing') setCurrentRect({ ...baseRect, shape: activeShape });
        else setMarqueeRect({ ...baseRect, shape: 'box' });
        break;
      }
      case 'moving': {
        if (!interaction.initialRects) return;
        setRectangles((rects: Rectangle[]) => rects.map(r => {
          const initial = interaction.initialRects?.find(ir => ir.id === r.id);
          return initial ? { ...r, x: initial.x + dx, y: initial.y + dy } : r;
        }));
        break;
      }
      case 'resizing': {
        if (!interaction.initialRects || !interaction.handle) return;
        const { x, y, width, height } = interaction.initialRects[0];
        let newRect = { ...interaction.initialRects[0] };
        if (interaction.handle.includes('l')) { newRect.x = x + dx; newRect.width = width - dx; }
        if (interaction.handle.includes('r')) { newRect.width = width + dx; }
        if (interaction.handle.includes('t')) { newRect.y = y + dy; newRect.height = height - dy; }
        if (interaction.handle.includes('b')) { newRect.height = height + dy; }
        setRectangles((rects: Rectangle[]) => rects.map(r => r.id === newRect.id ? newRect : r));
        break;
      }
    }
  }, [getRelativeCoords, interaction, activeShape, draggingPinId, setPins, setViewTransform, setRectangles, setCurrentRect, setMarqueeRect, pinDragOffset, selectedLinePointIndex, setLineMarkups, currentLineMarkup, movingLineInitialPoints, movingLineId, selectedLineIds]);

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const isClick = mouseDownRef.current && Math.abs(event.clientX - mouseDownRef.current.x) < 5 && Math.abs(event.clientY - mouseDownRef.current.y) < 5;
    mouseDownRef.current = null;

    if (draggingPinId) {
      setDraggingPinId(null);
      setHasUnsavedChanges(true);
    }
    
    if (movingLineId && interaction.type === 'moving') {
      setHasUnsavedChanges(true);
      setInteraction({ type: 'none' });
      setMovingLineInitialPoints(null);
      setMovingLineId(null);
      return;
    }

    if (activeTool === 'pin' && isClick && interaction.type === 'none') {
      const coords = getRelativeCoords(event);
      if (!coords) return;
      setPinTargetCoords(coords);
      switch (activePinType) {
        case 'photo':
          setActivePanel(null);
          handleSubmenuLink(event, 'Link Photo', 'pin');
          break;
        case 'safety':
          setSafetyTargetPinId(null);
          setSafetyFormData({ title: '', description: '', status: 'Open', severity: 'Medium' });
          setActivePanel('safety');
          break;
        case 'punch':
          setPunchTargetPinId(null);
          setPunchFormData({ title: '', status: 'Open', assignee: '' });
          setPunchPanelMode('create');
          setActivePanel('punch');
          break;
      }
      setInteraction({ type: 'none' });
      return;
    }

    if (interaction.type === 'none') return;
  
    if (interaction.type === 'drawing' && currentLineMarkup) {
      const pointCount = currentLineMarkup.points.length;
      if (pointCount >= 2) {
        let toCommit = currentLineMarkup;
        if (currentLineMarkup.type === 'pen' || currentLineMarkup.type === 'highlighter') {
          // Simplify the path to reduce stored points while preserving visual quality
          const simplified = rdpSimplify(currentLineMarkup.points, 0.12);
          toCommit = { ...currentLineMarkup, points: simplified.length >= 2 ? simplified : currentLineMarkup.points };
        }
        setLineMarkups((prev: LineMarkup[]) => [...prev, toCommit]);
        setSelectedLineId(toCommit.id);
        setSelectedLineIds([toCommit.id]);
        setSelectedLinePointIndex(null);
        setHasUnsavedChanges(true);
      }
    } else if (interaction.type === 'drawing' && currentRect) {
      const normalized = normalizeRect(currentRect, activeShape);
      if (Math.abs(normalized.width) > 1 && Math.abs(normalized.height) > 1) {
        const shapeName = normalized.shape === 'box' ? 'Rectangle' : normalized.shape.charAt(0).toUpperCase() + normalized.shape.slice(1);
        const count = rectangles.filter((r: Rectangle) => r.shape === normalized.shape).length + 1;
        const newRect = {
          ...normalized,
          id: Date.now().toString(),
          name: `${shapeName} ${count}`,
          visible: true,
          fillColor: markupFillColor,
          strokeColor: markupStrokeColor,
        };
        setRectangles((prev: Rectangle[]) => [...prev, newRect]);
        setSelectedRectIds([newRect.id]);
        setHasUnsavedChanges(true);
      }
    } else if (interaction.type === 'marquee' && marqueeRect) {
      const normalizedMarquee = normalizeRect(marqueeRect, 'box');
      const selected = rectangles.filter((rect: Rectangle) => {
        const normalizedRect = normalizeRect(rect, rect.shape);
        return normalizedRect.x < normalizedMarquee.x + normalizedMarquee.width &&
               normalizedRect.x + normalizedRect.width > normalizedMarquee.x &&
               normalizedRect.y < normalizedMarquee.y + normalizedMarquee.height &&
               normalizedRect.y + normalizedRect.height > normalizedMarquee.y;
      });
      setSelectedRectIds(selected.map((r: Rectangle) => r.id));
      const marqueeMinX = normalizedMarquee.x;
      const marqueeMaxX = normalizedMarquee.x + normalizedMarquee.width;
      const marqueeMinY = normalizedMarquee.y;
      const marqueeMaxY = normalizedMarquee.y + normalizedMarquee.height;
      const marqueeEdges = [
        [{ x: marqueeMinX, y: marqueeMinY }, { x: marqueeMaxX, y: marqueeMinY }],
        [{ x: marqueeMaxX, y: marqueeMinY }, { x: marqueeMaxX, y: marqueeMaxY }],
        [{ x: marqueeMaxX, y: marqueeMaxY }, { x: marqueeMinX, y: marqueeMaxY }],
        [{ x: marqueeMinX, y: marqueeMaxY }, { x: marqueeMinX, y: marqueeMinY }],
      ] as [LineMarkupPoint, LineMarkupPoint][];

      const selectedLines = lineMarkups.filter((line: LineMarkup) => {
        if (!line.visible || line.points.length === 0) return false;
        const anyPointInside = line.points.some((p) => p.x >= marqueeMinX && p.x <= marqueeMaxX && p.y >= marqueeMinY && p.y <= marqueeMaxY);
        if (anyPointInside) return true;
        for (let i = 0; i < line.points.length - 1; i++) {
          const a = line.points[i];
          const b = line.points[i + 1];
          for (const [e1, e2] of marqueeEdges) {
            if (lineSegmentsIntersect(a, b, e1, e2)) return true;
          }
        }
        if (line.type === 'freeline' && line.closed && line.points.length >= 3) {
          const last = line.points[line.points.length - 1];
          const first = line.points[0];
          for (const [e1, e2] of marqueeEdges) {
            if (lineSegmentsIntersect(last, first, e1, e2)) return true;
          }
        }
        return false;
      });
      if (selectedLines.length > 0) {
        const ids = selectedLines.map((line) => line.id);
        setSelectedLineIds(ids);
        setSelectedLineId(ids[ids.length - 1]);
        setSelectedLinePointIndex(null);
      } else {
        setSelectedLineIds([]);
        setSelectedLineId(null);
        setSelectedLinePointIndex(null);
      }
    } else if (interaction.type === 'moving' || interaction.type === 'resizing') {
        if (interaction.startPoint) {
            const finalCoords = getRelativeCoords(event);
            if (finalCoords) {
                const dx = finalCoords.x - interaction.startPoint.x;
                const dy = finalCoords.y - interaction.startPoint.y;
                if (Math.hypot(dx, dy) > 0.5) { // Check for meaningful change
                    setHasUnsavedChanges(true);
                }
            }
        }
        if (interaction.type === 'resizing' && interaction.initialRects) {
            const rectToNormalize = rectangles.find((r: Rectangle) => r.id === interaction.initialRects?.[0].id);
            if (rectToNormalize) {
              const normalized = normalizeRect(rectToNormalize, rectToNormalize.shape);
              setRectangles((rects: Rectangle[]) => rects.map(r => (r.id === normalized.id ? normalized : r)));
            }
        }
    }
  
    setInteraction({ type: 'none' });
    setCurrentRect(null);
    setMarqueeRect(null);
    setCurrentLineMarkup(null);
    setMovingLineInitialPoints(null);
    setMovingLineId(null);
  }, [interaction, currentRect, marqueeRect, rectangles, activeTool, activePinType, getRelativeCoords, handleSubmenuLink, draggingPinId, mouseDownRef, activeShape, setHasUnsavedChanges, setRectangles, setSelectedRectIds, markupFillColor, markupStrokeColor, currentLineMarkup, setLineMarkups, setSelectedLineId, setSelectedLineIds, setSelectedLinePointIndex, movingLineId, lineMarkups]);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredLineId(null);
    if (interaction.type !== 'none' || draggingPinId) {
      handleMouseUp({} as React.MouseEvent<HTMLDivElement>);
    }
  }, [interaction.type, draggingPinId, handleMouseUp]);

  useCanvasInteraction.setState = setInteraction;

  return { interaction, currentRect, marqueeRect, currentLineMarkup, hoveredLineId, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave };
};

useCanvasInteraction.setState = (state: InteractionState) => {};