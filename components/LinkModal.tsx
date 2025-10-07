import React, { useState, useEffect } from 'react';
import { XMarkIcon, UploadIcon } from './Icons';
import type { LinkModalConfig } from '../types';

interface LinkModalProps {
    isOpen: boolean;
    config: LinkModalConfig | null;
    onClose: () => void;
    onSelect: (item: any) => void;
    onUploadRequest: () => void;
}

const LinkModal: React.FC<LinkModalProps> = ({ isOpen, config, onClose, onSelect, onUploadRequest }) => {
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
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col" 
                onClick={e => e.stopPropagation()}
                style={{maxHeight: '80vh'}}
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{config.title}</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                          <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 mt-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500" 
                    />
                </div>
                <ul className="overflow-y-auto p-4">
                    {filteredItems.length > 0 ? filteredItems.map(item => (
                        <li key={item.id}>
                            <button 
                                onClick={() => onSelect(item)}
                                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {config.displayFields.map(field => (
                                    <span key={field.key} className="font-semibold text-gray-800 dark:text-gray-200 mr-4">{item[field.key]}</span>
                                ))}
                            </button>
                        </li>
                    )) : (
                        <li className="p-4 text-center text-gray-500 dark:text-gray-400">No items found.</li>
                    )}
                </ul>
                {config.type === 'photo' && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                        <button 
                            onClick={onUploadRequest}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                        >
                            <UploadIcon className="w-5 h-5" />
                            Upload from Computer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkModal;