import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, UploadIcon } from './Icons';
import type { PhotoData } from '../types';

export const MOCK_PHOTOS: PhotoData[] = [
    { id: 'PHOTO-01', title: 'Site Condition - West Wing', url: 'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=600', source: 'linarc' },
    { id: 'PHOTO-02', title: 'Pre-pour inspection formwork', url: 'https://images.pexels.com/photos/302804/pexels-photo-302804.jpeg?auto=compress&cs=tinysrgb&w=600', source: 'linarc' },
    { id: 'PHOTO-03', title: 'HVAC Ducting - 3rd Floor', url: 'https://images.pexels.com/photos/834892/pexels-photo-834892.jpeg?auto=compress&cs=tinysrgb&w=600', source: 'linarc' },
    { id: 'PHOTO-04', title: 'Foundation pour - Grid B', url: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=600', source: 'linarc' },
    { id: 'PHOTO-05', title: 'Roof membrane detail', url: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=600', source: 'linarc' },
];

type Tab = 'browse' | 'upload';

interface PhotoPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPhotoLinked: (photo: PhotoData) => void;
    existingPhotos?: PhotoData[];
}

const PhotoPickerModal: React.FC<PhotoPickerModalProps> = ({
    isOpen,
    onClose,
    onPhotoLinked,
    existingPhotos = MOCK_PHOTOS,
}) => {
    const [tab, setTab] = useState<Tab>('browse');
    const [searchTerm, setSearchTerm] = useState('');
    const [uploadPreview, setUploadPreview] = useState<PhotoData | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTab('browse');
            setSearchTerm('');
            setUploadPreview(null);
            setIsUploading(false);
            setUploadError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredPhotos = existingPhotos.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        setUploadError(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setUploadPreview({
                id: `UPLOAD-${Date.now()}`,
                title: file.name.replace(/\.[^.]+$/, ''),
                url: ev.target?.result as string,
                source: 'upload',
            });
            setIsUploading(false);
        };
        reader.onerror = () => {
            setIsUploading(false);
            setUploadError('Failed to read the file. Please try a different image.');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleConfirmUpload = () => {
        if (uploadPreview) {
            onPhotoLinked(uploadPreview);
        }
    };

    return (
        <div className="linarc-modal-overlay" onClick={onClose}>
            <div
                className="linarc-modal-panel flex max-h-[85vh] max-w-lg flex-col"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="photo-picker-title"
            >
                {/* Header */}
                <div className="linarc-modal-header">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h2 id="photo-picker-title" className="linarc-modal-title">Link a Photo</h2>
                            <p className="linarc-modal-subtitle">Select an existing photo or upload a new one.</p>
                        </div>
                        <button type="button" onClick={onClose} className="linarc-modal-close shrink-0" aria-label="Close">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="mt-4 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
                        <button
                            type="button"
                            onClick={() => setTab('browse')}
                            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                tab === 'browse'
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            Browse existing
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('upload')}
                            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                tab === 'upload'
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            Upload from computer
                        </button>
                    </div>

                    {tab === 'browse' && (
                        <div className="mt-4">
                            <label htmlFor="photo-picker-search" className="linarc-field-label">Search</label>
                            <input
                                id="photo-picker-search"
                                type="text"
                                placeholder="Search by title or ID…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="linarc-input"
                            />
                        </div>
                    )}
                </div>

                {/* Body */}
                {tab === 'browse' ? (
                    <ul className="custom-scrollbar min-h-0 flex-1 list-none overflow-y-auto px-3 py-2 sm:px-4">
                        {filteredPhotos.length > 0 ? (
                            filteredPhotos.map(photo => (
                                <li key={photo.id} className="border-b border-gray-50 last:border-0 dark:border-zinc-800/80">
                                    <button
                                        type="button"
                                        onClick={() => onPhotoLinked(photo)}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/80"
                                    >
                                        <img
                                            src={photo.url}
                                            alt={photo.title}
                                            className="h-12 w-16 flex-shrink-0 rounded-md object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-gray-900 dark:text-zinc-100">
                                                {photo.title}
                                            </span>
                                            <span className="block text-xs text-gray-400 dark:text-zinc-500">
                                                {photo.id}
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-8 text-center text-sm text-gray-500 dark:text-zinc-500">No photos found.</li>
                        )}
                    </ul>
                ) : (
                    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {uploadError && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/50 dark:bg-red-950/30">
                                <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>
                                <button
                                    type="button"
                                    onClick={() => { setUploadError(null); fileInputRef.current?.click(); }}
                                    className="mt-2 text-xs font-medium text-red-600 underline hover:text-red-500 dark:text-red-400"
                                >
                                    Try again
                                </button>
                            </div>
                        )}
                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                                <svg className="h-8 w-8 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <p className="text-sm text-gray-500 dark:text-zinc-400">Loading photo…</p>
                            </div>
                        ) : uploadPreview ? (
                            <div className="flex flex-col gap-4">
                                <img
                                    src={uploadPreview.url}
                                    alt={uploadPreview.title}
                                    className="w-full rounded-lg object-cover"
                                    style={{ maxHeight: '280px' }}
                                />
                                <p className="truncate text-sm font-medium text-gray-700 dark:text-zinc-300">{uploadPreview.title}</p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setUploadPreview(null); fileInputRef.current?.click(); }}
                                        className="linarc-btn-secondary flex-1"
                                    >
                                        Choose different
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmUpload}
                                        className="linarc-btn-primary flex-1"
                                    >
                                        Link this photo
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 px-6 py-12 transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-zinc-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
                            >
                                <UploadIcon className="h-8 w-8 text-gray-400 dark:text-zinc-500" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Click to choose a photo</p>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">JPG, PNG, GIF, or WebP</p>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoPickerModal;
