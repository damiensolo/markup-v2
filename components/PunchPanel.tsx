
import React from 'react';
import { XMarkIcon } from './Icons';
import Tooltip from './Tooltip';
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
    isOpen,
    isEditMode,
    mode,
    onModeChange,
    formData,
    onFormChange,
    onSubmit,
    onCancel,
    searchTerm,
    onSearchTermChange,
    allPunches,
    onLinkExisting,
}) => {
    return (
        <div
            className={`h-full flex-shrink-0 overflow-hidden border-gray-200 bg-white transition-all duration-200 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 ${isOpen ? 'border-l translate-x-0' : 'translate-x-full'}`}
            style={{ width: isOpen ? '28rem' : '0px', visibility: isOpen ? 'visible' : 'hidden' }}
        >
            <div className={`flex h-full w-full flex-col transition-opacity duration-150 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="linarc-panel-header">
                    <h2 className="linarc-panel-title">{isEditMode ? 'Edit punch item' : 'Create punch item'}</h2>
                    <Tooltip text="Close" position="left">
                        <button type="button" onClick={onCancel} className="linarc-panel-close" aria-label="Close panel">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </Tooltip>
                </div>
                {!isEditMode && (
                    <div className="flex flex-shrink-0 border-b border-gray-100 px-6 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => onModeChange('create')}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                                mode === 'create'
                                    ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-zinc-500 dark:hover:text-zinc-300'
                            }`}
                        >
                            Create new
                        </button>
                        <button
                            type="button"
                            onClick={() => onModeChange('link')}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                                mode === 'link'
                                    ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-zinc-500 dark:hover:text-zinc-300'
                            }`}
                        >
                            Link existing
                        </button>
                    </div>
                )}

                {mode === 'create' || isEditMode ? (
                    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <div className="linarc-panel-body custom-scrollbar flex-1 min-h-0">
                            <div className="mb-4">
                                <label htmlFor="punch-title" className="linarc-field-label">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    id="punch-title"
                                    value={formData.title}
                                    onChange={onFormChange}
                                    required
                                    className="linarc-input"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="punch-assignee" className="linarc-field-label">
                                    Assignee
                                </label>
                                <input
                                    type="text"
                                    name="assignee"
                                    id="punch-assignee"
                                    value={formData.assignee}
                                    onChange={onFormChange}
                                    required
                                    className="linarc-input"
                                />
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
                ) : (
                    <div className="linarc-panel-body custom-scrollbar flex-1 min-h-0 flex flex-col">
                        <label htmlFor="punch-search" className="linarc-field-label">
                            Search
                        </label>
                        <input
                            id="punch-search"
                            type="text"
                            placeholder="Search punch items…"
                            value={searchTerm}
                            onChange={onSearchTermChange}
                            className="linarc-input mb-3"
                        />
                        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                            {allPunches
                                .filter(
                                    p =>
                                        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        p.assignee.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(punch => (
                                    <li key={punch.id}>
                                        <button
                                            type="button"
                                            onClick={() => onLinkExisting(punch)}
                                            className="w-full rounded-lg border border-transparent px-3 py-3 text-left transition-colors hover:border-gray-100 hover:bg-gray-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
                                        >
                                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                                                {punch.id}: {punch.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-500">
                                                Assignee: {punch.assignee}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PunchPanel;
