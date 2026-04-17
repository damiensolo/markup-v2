import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';
import type { LinkModalConfig } from '../types';

interface LinkModalProps {
    isOpen: boolean;
    config: LinkModalConfig | null;
    onClose: () => void;
    onSelect: (item: any) => void;
}

const LinkModal: React.FC<LinkModalProps> = ({ isOpen, config, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen || !config) return null;

    const filteredItems = config.items.filter(item =>
        config.searchFields.some(field =>
            item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="linarc-modal-overlay" onClick={onClose}>
            <div
                className="linarc-modal-panel flex max-h-[85vh] max-w-lg flex-col"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="link-modal-title"
            >
                <div className="linarc-modal-header">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h2 id="link-modal-title" className="linarc-modal-title">
                                {config.title}
                            </h2>
                            <p className="linarc-modal-subtitle">Select an item to link to this markup.</p>
                        </div>
                        <button type="button" onClick={onClose} className="linarc-modal-close shrink-0" aria-label="Close">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="mt-5">
                        <label htmlFor="link-modal-search" className="linarc-field-label">
                            Search
                        </label>
                        <input
                            id="link-modal-search"
                            type="text"
                            placeholder="Search…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="linarc-input"
                        />
                    </div>
                </div>

                <ul className="custom-scrollbar min-h-0 flex-1 list-none overflow-y-auto px-3 py-2 sm:px-4">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <li key={item.id} className="border-b border-gray-50 last:border-0 dark:border-zinc-800/80">
                                <button
                                    type="button"
                                    onClick={() => onSelect(item)}
                                    className="w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/80"
                                >
                                    {config.displayFields.map(field => (
                                        <span
                                            key={field.key}
                                            className="mr-4 text-sm font-medium text-gray-900 dark:text-zinc-100"
                                        >
                                            {item[field.key]}
                                        </span>
                                    ))}
                                </button>
                            </li>
                        ))
                    ) : (
                        <li className="px-3 py-8 text-center text-sm text-gray-500 dark:text-zinc-500">No items found.</li>
                    )}
                </ul>

            </div>
        </div>
    );
};

export default LinkModal;
