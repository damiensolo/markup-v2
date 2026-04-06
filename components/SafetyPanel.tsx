
import React from 'react';
import { XMarkIcon } from './Icons';
import Tooltip from './Tooltip';
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
            className={`h-full flex-shrink-0 overflow-hidden border-gray-200 bg-white transition-all duration-200 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 ${isOpen ? 'border-l translate-x-0' : 'translate-x-full'}`}
            style={{ width: isOpen ? '28rem' : '0px', visibility: isOpen ? 'visible' : 'hidden' }}
        >
            <div className={`flex h-full w-full flex-col transition-opacity duration-150 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="linarc-panel-header">
                    <h2 className="linarc-panel-title">{isEditMode ? 'Edit safety issue' : 'Create safety issue'}</h2>
                    <Tooltip text="Close" position="left">
                        <button type="button" onClick={onCancel} className="linarc-panel-close" aria-label="Close panel">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                </div>
                <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="linarc-panel-body custom-scrollbar flex-1 min-h-0">
                        <div className="mb-4">
                            <label htmlFor="safety-title" className="linarc-field-label">
                                Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                id="safety-title"
                                value={formData.title}
                                onChange={onFormChange}
                                required
                                className="linarc-input"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="safety-description" className="linarc-field-label">
                                Description
                            </label>
                            <textarea
                                name="description"
                                id="safety-description"
                                value={formData.description}
                                onChange={onFormChange}
                                rows={4}
                                className="linarc-textarea"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="safety-severity" className="linarc-field-label">
                                Severity
                            </label>
                            <select
                                name="severity"
                                id="safety-severity"
                                value={formData.severity}
                                onChange={onFormChange}
                                className="linarc-select"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <span className="linarc-field-label">Attachments</span>
                            <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-6 pb-6 pt-5 dark:border-zinc-600 dark:bg-zinc-950/50">
                                <div className="space-y-1 text-center">
                                    <svg
                                        className="mx-auto h-10 w-10 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex justify-center text-sm text-gray-600 dark:text-zinc-400">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400"
                                        >
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-zinc-500">PNG, JPG, PDF up to 10MB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="linarc-panel-footer">
                        <button type="button" onClick={onCancel} className="linarc-btn-modal-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="linarc-btn-primary py-2.5 px-5">
                            {isEditMode ? 'Save' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SafetyPanel;
