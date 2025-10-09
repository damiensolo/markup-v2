
import React from 'react';
import { XMarkIcon } from './Icons';
import type { SafetyIssueData } from '../types';

interface SafetyPanelProps {
    isOpen: boolean;
    isEditMode: boolean;
    formData: Omit<SafetyIssueData, 'id'>;
    onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const SafetyPanel: React.FC<SafetyPanelProps> = ({ isOpen, isEditMode, formData, onFormChange, onSubmit, onCancel }) => {
    return (
        <div
            className={`h-full flex-shrink-0 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'border-l border-gray-200 dark:border-gray-700 shadow-lg' : ''}`}
            style={{ width: isOpen ? '28rem' : '0px' }}
        >
            <div className={`h-full w-full flex flex-col transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit' : 'Create'} Safety Issue</h2>
                        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
                    </div>
                    <form onSubmit={onSubmit} className="flex flex-col flex-grow overflow-y-auto -mr-6 pr-6">
                        <div className="mb-4">
                            <label htmlFor="safety-title" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Title</label>
                            <input type="text" name="title" id="safety-title" value={formData.title} onChange={onFormChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" />
                        </div>
                        <div className="mb-4">
                              <label htmlFor="safety-description" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Description</label>
                              <textarea name="description" id="safety-description" value={formData.description} onChange={onFormChange} rows={4} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="safety-severity" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Severity</label>
                            <select name="severity" id="safety-severity" value={formData.severity} onChange={onFormChange} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                                <option>Low</option><option>Medium</option><option>High</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Attachments</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-500 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, PDF up to 10MB</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">{isEditMode ? 'Save' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SafetyPanel;