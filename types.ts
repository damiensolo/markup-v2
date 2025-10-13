/**
 * Represents RFI data linked to a rectangle.
 */
export interface RfiData {
  id: number;
  title: string;
  type: string;
  question: string;
}

/**
 * Represents Submittal data linked to a rectangle.
 */
export interface SubmittalData {
  id: string;
  title: string;
  specSection: string;
  status: 'Open' | 'Closed' | 'In Review';
}

/**
 * Represents Punch List data linked to a rectangle.
 */
export interface PunchData {
  id: string;
  title: string;
  status: 'Open' | 'Ready for Review' | 'Closed';
  assignee: string;
}

/**
 * Represents a specific version of a drawing.
 */
export interface DrawingVersion {
  id: string;
  name: string;
  timestamp: string;
  thumbnailUrl: string;
}

/**
 * Represents Drawing data linked to a rectangle.
 */
export interface DrawingData {
  id: string;
  title: string;
  versions: DrawingVersion[];
}

/**
 * Represents a markup annotation on a linked photo.
 * Values are percentages (0-100) relative to the photo's dimensions.
 */
export type PhotoMarkupShapeType = 'box' | 'ellipse' | 'cloud';

export interface ShapePhotoMarkup {
    id: string;
    type: 'shape';
    shape: PhotoMarkupShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PenPhotoMarkup {
    id:string;
    type: 'pen';
    points: { x: number; y: number }[];
}

export interface ArrowPhotoMarkup {
    id: string;
    type: 'arrow';
    start: { x: number; y: number };
    end: { x: number; y: number };
}

export interface TextPhotoMarkup {
    id: string;
    type: 'text';
    x: number;
    y: number;
    text: string;
}

export type PhotoMarkup = ShapePhotoMarkup | PenPhotoMarkup | ArrowPhotoMarkup | TextPhotoMarkup;


/**
 * Represents Photo data linked to a rectangle.
 */
export interface PhotoData {
  id: string;
  title: string;
  url: string;
  source: 'linarc' | 'upload';
  markups?: PhotoMarkup[];
}


/**
 * Represents a rectangle highlight on the blueprint.
 * All values are percentages (0-100) relative to the image container's dimensions.
 */
export interface Rectangle {
  id: string;
  shape: 'box' | 'cloud' | 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  visible: boolean;
  rfi?: RfiData[];
  submittals?: SubmittalData[];
  punches?: PunchData[];
  drawings?: DrawingData[];
  photos?: PhotoData[];
}

/**
 * Represents Safety Issue data.
 */
export interface SafetyIssueData {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  severity: 'Low' | 'Medium' | 'High';
}

/**
 * Represents a location-based pin on the blueprint.
 */
export interface Pin {
  id: string;
  type: 'photo' | 'safety' | 'punch';
  x: number; // percentage
  y: number; // percentage
  linkedId: string; // id of PhotoData, SafetyIssueData, or PunchData
  name: string;
  visible: boolean;
}

/**
 * Configuration for the Link Modal component.
 */
export interface LinkModalConfig {
    type: 'rfi' | 'submittal' | 'punch' | 'drawing' | 'photo';
    title: string;
    items: any[];
    displayFields: { key: string; label?: string }[];
    searchFields: string[];
}

/**
 * Information for the hover popup.
 */
export interface HoveredItemInfo {
  type: 'rfi' | 'submittal' | 'punch' | 'drawing' | 'photo' | 'pin';
  rectId?: string;
  itemId: number | string;
  position: { top: number; left: number };
  pin?: Pin;
}

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

export interface ViewTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface InteractionState {
  type: 'none' | 'drawing' | 'moving' | 'resizing' | 'marquee' | 'panning';
  startPoint?: { x: number; y: number }; // In percentage for drawing/move/resize, in client pixels for panning
  initialRects?: Rectangle[];
  handle?: ResizeHandle;
  initialTransform?: ViewTransform;
}