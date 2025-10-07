import React, { useState, useCallback } from 'react';
import type { Rectangle, Pin, InteractionState, SafetyIssueData, PunchData } from '../types';

type ActiveTool = 'select' | 'shape' | 'pen' | 'arrow' | 'text' | 'distance' | 'drawing' | 'pin';
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

export const useCanvasInteraction = ({
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
  setSafetyTargetPinId, setSafetyFormData,
  setPunchTargetPinId, setPunchFormData, setPunchPanelMode,
  setActivePanel,
  mouseDownRef,
}: any) => {
  const [interaction, setInteraction] = useState<InteractionState>({ type: 'none' });
  const [currentRect, setCurrentRect] = useState<Omit<Rectangle, 'id' | 'name' | 'visible'> | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<Omit<Rectangle, 'id' | 'name' | 'visible'> | null>(null);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
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
    
    setSelectedPinId(null);

    const clickedRect = [...rectangles].reverse().find(rect => {
      const normalized = normalizeRect(rect, activeShape);
      return coords.x >= normalized.x && coords.x <= normalized.x + normalized.width &&
             coords.y >= normalized.y && coords.y <= normalized.y + normalized.height;
    });

    if (activeTool === 'select') {
      setLinkMenuRectId(null);
      if (clickedRect) {
        const isSelected = selectedRectIds.includes(clickedRect.id);
        let newSelectedIds = isSelected
          ? (event.shiftKey ? selectedRectIds.filter(id => id !== clickedRect.id) : selectedRectIds)
          : (event.shiftKey ? [...selectedRectIds, clickedRect.id] : [clickedRect.id]);
        setSelectedRectIds(newSelectedIds);
        const rectsToMove = rectangles.filter(r => newSelectedIds.includes(r.id));
        setInteraction({ type: 'moving', startPoint: coords, initialRects: rectsToMove });
      } else {
        if (viewTransform.scale > 1) {
            setInteraction({ type: 'panning', startPoint: { x: event.clientX, y: event.clientY }, initialTransform: viewTransform });
        } else {
            setSelectedRectIds([]);
            setInteraction({ type: 'marquee', startPoint: coords });
            setMarqueeRect({ x: coords.x, y: coords.y, width: 0, height: 0, shape: 'box' });
        }
      }
    } else if (activeTool === 'shape') {
      if (clickedRect) {
        setSelectedRectIds([clickedRect.id]);
        setLinkMenuRectId(null);
        setInteraction({ type: 'moving', startPoint: coords, initialRects: [clickedRect] });
      } else {
        if (isRfiPanelOpen) handleRfiCancel();
        setLinkMenuRectId(null);
        setSelectedRectIds([]);
        setInteraction({ type: 'drawing', startPoint: coords });
        setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0, shape: activeShape });
      }
    }
  }, [getRelativeCoords, interaction.type, rectangles, activeTool, activeShape, selectedRectIds, viewTransform, isRfiPanelOpen, handleRfiCancel, draggingPinId, setInteraction, setCurrentRect, setMarqueeRect, setSelectedRectIds, setSelectedPinId, setLinkMenuRectId, mouseDownRef]);
  
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (draggingPinId) {
      const coords = getRelativeCoords(event);
      if (coords) {
        setPins((prevPins: Pin[]) => prevPins.map(p => p.id === draggingPinId ? { ...p, x: coords.x, y: coords.y } : p));
      }
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
    if (!coords || interaction.type === 'none' || !interaction.startPoint) return;
    
    const dx = coords.x - interaction.startPoint.x;
    const dy = coords.y - interaction.startPoint.y;

    switch (interaction.type) {
      case 'drawing':
      case 'marquee': {
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
  }, [getRelativeCoords, interaction, activeShape, draggingPinId, setPins, setViewTransform, setRectangles, setCurrentRect, setMarqueeRect]);

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const isClick = mouseDownRef.current && Math.abs(event.clientX - mouseDownRef.current.x) < 5 && Math.abs(event.clientY - mouseDownRef.current.y) < 5;
    mouseDownRef.current = null;

    if (draggingPinId) setDraggingPinId(null);

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
  
    if (interaction.type === 'drawing' && currentRect) {
      const normalized = normalizeRect(currentRect, activeShape);
      if (Math.abs(normalized.width) > 1 && Math.abs(normalized.height) > 1) {
        const shapeName = normalized.shape.charAt(0).toUpperCase() + normalized.shape.slice(1);
        const count = rectangles.filter((r: Rectangle) => r.shape === normalized.shape).length + 1;
        const newRect = { ...normalized, id: Date.now().toString(), name: `${shapeName} ${count}`, visible: true };
        setRectangles((prev: Rectangle[]) => [...prev, newRect]);
        setSelectedRectIds([newRect.id]);
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
    } else if (interaction.type === 'resizing' && interaction.initialRects) {
      const rectToNormalize = rectangles.find((r: Rectangle) => r.id === interaction.initialRects?.[0].id);
      if (rectToNormalize) {
        const normalized = normalizeRect(rectToNormalize, rectToNormalize.shape);
        setRectangles((rects: Rectangle[]) => rects.map(r => (r.id === normalized.id ? normalized : r)));
      }
    }
  
    setInteraction({ type: 'none' });
    setCurrentRect(null);
    setMarqueeRect(null);
  }, [interaction, currentRect, marqueeRect, rectangles, activeTool, activePinType, getRelativeCoords, handleSubmenuLink, draggingPinId, mouseDownRef, activeShape]);
  
  const handleMouseLeave = useCallback(() => {
    if (interaction.type !== 'none' || draggingPinId) {
      handleMouseUp({} as React.MouseEvent<HTMLDivElement>);
    }
  }, [interaction.type, draggingPinId, handleMouseUp]);

  useCanvasInteraction.setState = setInteraction;

  return { interaction, currentRect, marqueeRect, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave };
};

useCanvasInteraction.setState = (state: InteractionState) => {};