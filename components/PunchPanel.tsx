import React from 'react';
import { XMarkIcon } from './Icons';
import type { PunchData } from '../types';

interface PunchPanelProps {
    isOpen: boolean;
    isEditMode: boolean;
    mode: 'create' | 'link';
    onModeChange: (mode: 'create' | 'link') => void;
    formData: Omit<PunchData, 'id'>;
    onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    searchTerm: string;
    onSearchTermChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    allPunches: PunchData[];
    onLinkExisting: (punch: PunchData) => void;
}

const PunchPanel: React.FC<PunchPanelProps> = ({
    isOpen, isEditMode, mode, onModeChange, formData, onFormChange, onSubmit, onCancel, searchTerm, onSearchTermChange, allPunches, onLinkExisting
}) => {
    return (
        <div
            className={`h-full flex-shrink-0 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'border-l border-gray-200 dark:border-gray-700' : ''}`}
            style={{ width: isOpen ? '28rem' : '0px' }}
        >
            <div className={`h-full w-full flex flex-col transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit' : 'Create'} Punch List Item</h2>
                        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" /></button>
                    </div>
                    
                    {!isEditMode && (
                      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                          <button onClick={() => onModeChange('create')} className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'create' ? 'border-b-2 border-cyan-500 text-cyan-500 dark:text-cyan-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Create New</button>
                          <button onClick={() => onModeChange('link')} className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'link' ? 'border-b-2 border-cyan-500 text-cyan-500 dark:text-cyan-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Link Existing</button>
                      </div>
                    )}
      
                    {mode === 'create' || isEditMode ? (
                      <form onSubmit={onSubmit} className="flex flex-col flex-grow">
                          <div className="mb-4">
                              <label htmlFor="punch-title" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Title</label>
                              <input type="text" name="title" id="punch-title" value={formData.title} onChange={onFormChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500" />
                          </div>
                          <div className="mb-4">
                              <label htmlFor="punch-assignee" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Assignee</label>
                              <input type="text" name="assignee" id="punch-assignee" value={formData.assignee} onChange={onFormChange} required className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500" />
                          </div>
                          <div className="mt-auto flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                              <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">{isEditMode ? 'Save' : 'Create'}</button>
                          </div>
                      </form>
                    ) : (
                      <div className="flex flex-col flex-grow">
                         <input 
                              type="text" 
                              placeholder="Search existing punch items..."
                              value={searchTerm}
                              onChange={onSearchTermChange}
                              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500" 
                          />
                          <ul className="overflow-y-auto -mr-6 pr-6">
                              {allPunches.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.assignee.toLowerCase().includes(searchTerm.toLowerCase())).map(punch => (
                                  <li key={punch.id}>
                                      <button onClick={() => onLinkExisting(punch)} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                          <p className="font-semibold text-gray-800 dark:text-gray-200">{punch.id}: {punch.title}</p>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">Assignee: {punch.assignee}</p>
                                      </button>
                                  </li>
                              ))}
                          </ul>
                      </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PunchPanel;