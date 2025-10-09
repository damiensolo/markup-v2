

import React from 'react';

interface IconProps {
  className?: string;
}

export const UploadIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

export const MousePointerIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 17 17" fill="none" className={`relative top-[3px] ${className || ''}`.trim()}>
      <path d="M6.76091 15.4535L1.02431 2.34129C0.659554 1.50755 1.50755 0.659554 2.34129 1.02431L15.4535 6.76091C16.3122 7.1366 16.2287 8.3811 15.3274 8.63859L10.6592 9.97238C10.327 10.0673 10.0673 10.327 9.97238 10.6592L8.63859 15.3274C8.3811 16.2287 7.1366 16.3122 6.76091 15.4535Z" stroke="currentColor"/>
    </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

export const ArrowUpTrayIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const SelectIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h.008v.008H3.75V3.75z" transform="translate(14, 2.5) scale(0.5)" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M 4.5,4.5 L 9,9 M 4.5,4.5 L 4.5,7 M 4.5,4.5 L 7,4.5" fill="none" transform="translate(-1, -1) scale(0.9)" />
    <path d="M5.2,18.2 L5.2,5.2 L18.2,5.2 L18.2,18.2 L5.2,18.2 Z M9.5,2.5 L13.5,2.5 L13.5,5.2 L9.5,5.2 Z M9.5,18.2 L13.5,18.2 L13.5,21.5 L9.5,21.5 Z M2.5,9.5 L5.2,9.5 L5.2,13.5 L2.5,13.5 Z M18.2,9.5 L21.5,9.5 L21.5,13.5 L18.2,13.5 Z" stroke="none" fill="currentColor" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M 10,10 L 1,2 L 10,10 L 6,11 L 10,10 L 4,14 L 10,10 Z" transform="translate(4,4)" fill="currentColor"/>
  </svg>
);

export const MultiIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5-6h15m-15-3h15m-15-3h15" />
    <path d="M3.375 7.5h17.25" />
    <path d="M3.375 12h17.25" />
    <path d="M3.375 16.5h17.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M 3,3 L 10,3 L 10,10 L 3,10 Z" strokeDasharray="2,1" />
    <path d="M2.25 15.75l5.25-5.25" />
    <path d="M8.25 15.75L3 10.5" />
  </svg>
);

export const PenIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

export const BoxIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 015.25 16.5v-9z" />
  </svg>
);

export const ArrowIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);

export const TextIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14M12 5v14M9 19h6" />
  </svg>
);

export const DrawingIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

export const IssueIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

export const CloudIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-2.6-4.243 4.5 4.5 0 00-8.332-1.763c-1.262.1-2.454.6-3.4 1.3C2.85 9.4 2.25 12.2 2.25 15z" />
    </svg>
);
  
export const EllipseIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <ellipse cx="12" cy="12" rx="9" ry="6" stroke="currentColor" fill="none" />
    </svg>
);

export const MagnifyingGlassPlusIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m-3-3h6" />
  </svg>
);

export const MagnifyingGlassMinusIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
  </svg>
);

export const ArrowsPointingOutIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);

export const XMarkIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const SunIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);
  
export const MoonIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.572 0 4.92-.99 6.752-2.648z" />
    </svg>
);

export const CogIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 21V15M6 9V3M12 21V13M12 7V3M18 21V17M18 11V3M4 12a2 2 0 104 0 2 2 0 00-4 0zM10 10a2 2 0 104 0 2 2 0 00-4 0zM16 14a2 2 0 104 0 2 2 0 00-4 0z" />
    </svg>
);

export const PhotoPinIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 32s10-13.438 10-19A10 10 0 106 13c0 5.562 10 19 10 19z" className="text-blue-500" fill="currentColor" />
    <g transform="translate(11 8) scale(0.416)" fill="currentColor" className="text-white">
      <path d="M12 12.75a3 3 0 100-6 3 3 0 000 6z" />
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25-2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V6c0-.414.336-.75.75-.75h16.5c.414 0 .75.336.75.75v10.06l-3.56-3.56a.75.75 0 00-1.06 0l-3.06 3.06a.75.75 0 01-1.06 0l-1.72-1.72a.75.75 0 00-1.06 0l-5.69 5.69a.75.75 0 001.06 1.06l4.19-4.19a.75.75 0 011.06 0l1.72 1.72a.75.75 0 001.06 0l3.06-3.06a.75.75 0 011.06 0l3.56 3.56a.75.75 0 00-1.06 1.06l.001-.001z" clipRule="evenodd" />
    </g>
  </svg>
);

export const SafetyPinIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M16 32s10-13.438 10-19A10 10 0 106 13c0 5.562 10 19 10 19z" className="text-red-500" fill="currentColor" />
      <g transform="translate(11 8) scale(0.416)" fill="currentColor" className="text-white">
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.198 0l7.5 13c1.155 2-.77 4.5-3.299 4.5H5.198c-2.52 0-4.455-2.5-3.299-4.5l7.5-13zM12 10.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zm0 6a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </g>
    </svg>
);

export const PunchPinIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M16 32s10-13.438 10-19A10 10 0 106 13c0 5.562 10 19 10 19z" className="text-orange-500" fill="currentColor" />
        <g transform="translate(11 8) scale(0.416)" fill="currentColor" className="text-white">
            <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071 1.052A32.94 32.94 0 0113.4 15.182V19.5a.75.75 0 01-1.5 0v-4.318c0-.78-.31-1.53-.878-2.098S9.79 7.5 9 7.5c-.79 0-1.53.31-2.098.878S6 9.97 6 10.75v3.53c-.792.223-1.58.49-2.355.79A.75.75 0 003 15.825V18a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75v-2.175a.75.75 0 00-.355-1.007c-.775-.298-1.563-.567-2.355-.79v-3.53c0-.78-.31-1.53-.878-2.098S14.29 7.5 13.5 7.5c-.79 0-1.53.31-2.098.878s-.878 1.318-.878 2.098v4.682a32.94 32.94 0 011.437-12.896.75.75 0 00-1.052-1.07z" clipRule="evenodd" />
        </g>
    </svg>
);

export const InformationCircleIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);

export const FilterIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
);

export const ChevronDoubleLeftIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const EyeSlashIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
    </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

export const DocumentDuplicateIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
);

export const ClipboardListIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3M15.75 3H8.25A2.25 2.25 0 006 5.25v13.5A2.25 2.25 0 008.25 21h7.5A2.25 2.25 0 0018 18.75V5.25A2.25 2.25 0 0015.75 3z" />
    </svg>
);

export const PhotoIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
);

export const LocationIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const MeasurementIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <g transform="rotate(-45 12 12) translate(-2, -2)">
        <path d="M5 7h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 13v-3m4 3v-4m4 4v-3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export const PolygonIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" className={className}>
        <circle cx="6" cy="6" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <circle cx="18" cy="6" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <circle cx="6" cy="18" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <path d="M7.5 6 H 16.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 7.5 V 16.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 7.5 V 16.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 18 H 16.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const HighlighterIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.25 5.25L18.75 8.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.75 14.75L13.25 7.25L16.75 10.75L9.25 18.25L5 19L5.75 14.75Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.25 18.25L12.75 14.75" />
    </svg>
);

export const CustomPinIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17,12V3A1,1 0 0,0 16,2H8A1,1 0 0,0 7,3V12L5,14V16H11V22L12,23L13,22V16H19V14L17,12Z" />
    </svg>
);

export const FillIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="12" r="8" />
    </svg>
);

export const StrokeIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
        <circle cx="12" cy="12" r="8" />
    </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" />
    </svg>
);