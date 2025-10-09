import React from 'react';
import { XMarkIcon } from './Icons';

interface RfiPanelProps {
    isOpen: boolean;
    isEditMode: boolean;
    formData: { title: string; type: string; question: string };
    onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const RfiPanel: React.FC<RfiPanelProps> = ({ isOpen, isEditMode, formData, onFormChange, onSubmit, onCancel }) => {
    return (
        <div
            className={`h-full flex-shrink-0 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'border-l border-gray-200 dark:border-gray-700' : ''}`}
            style={{ width: isOpen ? '28rem' : '0px' }}
        >
            <div className={`h-full w-full flex flex-col transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit RFI' : 'Create RFI Draft'}</h2>
                        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                    <form onSubmit={onSubmit} className="flex flex-col flex-grow">
                        <div className="mb-4">
                            <label htmlFor="rfi-title" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">RFI Title</label>
                            <input type="text" name="title" id="rfi-title" value={formData.title} onChange={onFormChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="rfi-type" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">RFI Type</label>
                            <select name="type" id="rfi-type" value={formData.type} onChange={onFormChange} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500">
                                <option>General Inquiry</option>
                                <option>Design Clarification</option>
                                <option>Material Substitution</option>
                                <option>Field Condition</option>
                            </select>
                        </div>
                        <div className="mb-4 flex-grow flex flex-col">
                            <label htmlFor="rfi-question" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Question</label>
                            <textarea name="question" id="rfi-question" value={formData.question} onChange={onFormChange} required rows={6} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white flex-grow resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"></textarea>
                        </div>
                        <div className="mb-4">
                            <p className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Attachments / Linked Items</p>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center text-gray-500 dark:text-gray-400">
                                <p>Attachments can be added after draft creation.</p>
                            </div>
                        </div>
                        <div className="mt-auto flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">{isEditMode ? 'Save Changes' : 'Create Draft'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RfiPanel;