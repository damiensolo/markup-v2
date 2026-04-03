
import React from 'react';
import { 
  Upload, 
  FolderOpen, 
  Trash2, 
  MousePointer2, 
  Link, 
  ArrowUpToLine, 
  Layers, 
  Pencil, 
  Square, 
  ArrowUpRight, 
  Type, 
  User, 
  AlertTriangle, 
  Cloud, 
  Circle, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  X, 
  Sun, 
  Moon, 
  Settings, 
  MapPin, 
  Info, 
  Filter, 
  ChevronsLeft, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  Copy, 
  ClipboardList, 
  Image, 
  Ruler, 
  Hexagon, 
  Highlighter, 
  PaintBucket, 
  ChevronLeft, 
  Share2, 
  PanelLeft, 
  PanelRight, 
  Lock, 
  Unlock,
  Camera,
  Check
} from 'lucide-react';

interface IconProps {
  className?: string;
}

export const UploadIcon: React.FC<IconProps> = ({ className }) => <Upload className={className} />;
export const FolderOpenIcon: React.FC<IconProps> = ({ className }) => <FolderOpen className={className} />;
export const TrashIcon: React.FC<IconProps> = ({ className }) => <Trash2 className={className} />;
export const MousePointerIcon: React.FC<IconProps> = ({ className }) => <MousePointer2 className={className} />;
export const LinkIcon: React.FC<IconProps> = ({ className }) => <Link className={className} />;
export const ArrowUpTrayIcon: React.FC<IconProps> = ({ className }) => <ArrowUpToLine className={className} />;
export const SelectIcon: React.FC<IconProps> = ({ className }) => <MousePointer2 className={className} />;
export const MultiIcon: React.FC<IconProps> = ({ className }) => <Layers className={className} />;
export const LayersIcon: React.FC<IconProps> = ({ className }) => <Layers className={className} />;
export const PenIcon: React.FC<IconProps> = ({ className }) => <Pencil className={className} />;
export const BoxIcon: React.FC<IconProps> = ({ className }) => <Square className={className} />;
export const ArrowIcon: React.FC<IconProps> = ({ className }) => <ArrowUpRight className={className} />;
export const TextIcon: React.FC<IconProps> = ({ className }) => <Type className={className} />;
export const DrawingIcon: React.FC<IconProps> = ({ className }) => <User className={className} />;
export const IssueIcon: React.FC<IconProps> = ({ className }) => <AlertTriangle className={className} />;
export const CloudIcon: React.FC<IconProps> = ({ className }) => <Cloud className={className} />;
export const EllipseIcon: React.FC<IconProps> = ({ className }) => <Circle className={className} />;
export const MagnifyingGlassPlusIcon: React.FC<IconProps> = ({ className }) => <ZoomIn className={className} />;
export const MagnifyingGlassMinusIcon: React.FC<IconProps> = ({ className }) => <ZoomOut className={className} />;
export const ArrowsPointingOutIcon: React.FC<IconProps> = ({ className }) => <Maximize className={className} />;
export const XMarkIcon: React.FC<IconProps> = ({ className }) => <X className={className} />;
export const SunIcon: React.FC<IconProps> = ({ className }) => <Sun className={className} />;
export const MoonIcon: React.FC<IconProps> = ({ className }) => <Moon className={className} />;
export const CogIcon: React.FC<IconProps> = ({ className }) => <Settings className={className} />;

// Pins with specific colors and internal icons
export const PhotoPinIcon: React.FC<IconProps> = ({ className }) => (
  <div className={`relative flex items-center justify-center w-full h-full ${className || ''}`}>
    <MapPin className="w-full h-full text-blue-500 fill-current" />
    <Camera className="absolute w-[45%] h-[45%] text-white -translate-y-[15%]" />
  </div>
);

export const SafetyPinIcon: React.FC<IconProps> = ({ className }) => (
  <div className={`relative flex items-center justify-center w-full h-full ${className || ''}`}>
    <MapPin className="w-full h-full text-red-500 fill-current" />
    <AlertTriangle className="absolute w-[45%] h-[45%] text-white -translate-y-[15%]" />
  </div>
);

export const PunchPinIcon: React.FC<IconProps> = ({ className }) => (
  <div className={`relative flex items-center justify-center w-full h-full ${className || ''}`}>
    <MapPin className="w-full h-full text-orange-500 fill-current" />
    <Check className="absolute w-[45%] h-[45%] text-white -translate-y-[15%]" />
  </div>
);

export const InformationCircleIcon: React.FC<IconProps> = ({ className }) => <Info className={className} />;
export const FilterIcon: React.FC<IconProps> = ({ className }) => <Filter className={className} />;
export const ChevronDoubleLeftIcon: React.FC<IconProps> = ({ className }) => <ChevronsLeft className={className} />;
export const EyeIcon: React.FC<IconProps> = ({ className }) => <Eye className={className} />;
export const EyeSlashIcon: React.FC<IconProps> = ({ className }) => <EyeOff className={className} />;
export const ChevronRightIcon: React.FC<IconProps> = ({ className }) => <ChevronRight className={className} />;
export const DocumentDuplicateIcon: React.FC<IconProps> = ({ className }) => <Copy className={className} />;
export const ClipboardListIcon: React.FC<IconProps> = ({ className }) => <ClipboardList className={className} />;
export const PhotoIcon: React.FC<IconProps> = ({ className }) => <Image className={className} />;
export const ImageIcon: React.FC<IconProps> = ({ className }) => <Image className={className} />;
export const LocationIcon: React.FC<IconProps> = ({ className }) => <MapPin className={className} />;
export const MeasurementIcon: React.FC<IconProps> = ({ className }) => <Ruler className={className} />;
export const PolygonIcon: React.FC<IconProps> = ({ className }) => <Hexagon className={className} />;
export const HighlighterIcon: React.FC<IconProps> = ({ className }) => <Highlighter className={className} />;
export const CustomPinIcon: React.FC<IconProps> = ({ className }) => <MapPin className={className} />;
export const FillIcon: React.FC<IconProps> = ({ className }) => <PaintBucket className={className} />;
export const StrokeIcon: React.FC<IconProps> = ({ className }) => <Circle className={className} />;
export const ChevronLeftIcon: React.FC<IconProps> = ({ className }) => <ChevronLeft className={className} />;
export const ShareIcon: React.FC<IconProps> = ({ className }) => <Share2 className={className} />;
export const PanelLeftIcon: React.FC<IconProps> = ({ className }) => <PanelLeft className={className} />;
export const PanelRightIcon: React.FC<IconProps> = ({ className }) => <PanelRight className={className} />;
export const LockClosedIcon: React.FC<IconProps> = ({ className }) => <Lock className={className} />;
export const LockOpenIcon: React.FC<IconProps> = ({ className }) => <Unlock className={className} />;
