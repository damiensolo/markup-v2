import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';

interface Company {
  id: string;
  name: string;
  role: string;
  projectManager: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  company: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (settings: { visibility: 'public' | 'restricted' | 'private'; ids: string[] }) => void;
  companies: Company[];
  employees: Employee[];
}

type Visibility = 'public' | 'restricted' | 'private';
type Step = 'visibility' | 'select';

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare, companies, employees }) => {
  const [step, setStep] = useState<Step>('visibility');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setStep('visibility');
      setVisibility('public');
      setSelectedIds([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (visibility === 'public') {
      onShare({ visibility: 'public', ids: [] });
    } else {
      setStep('select');
    }
  };

  const handleBack = () => {
    setStep('visibility');
    setSelectedIds([]);
    setSearchTerm('');
  };

  const handleFinalShare = () => {
    onShare({ visibility, ids: selectedIds });
  };

  const data = visibility === 'restricted' ? companies : employees;
  const filteredData = data.filter(item => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    if ('name' in item) { // Both Company and Employee have 'name'
        if(item.name.toLowerCase().includes(lowerSearchTerm)) return true;
    }
    if ('role' in item) { // Both Company and Employee have 'role'
        if (item.role.toLowerCase().includes(lowerSearchTerm)) return true;
    }
    if ('projectManager' in item) { // Company only
        if ((item as Company).projectManager.toLowerCase().includes(lowerSearchTerm)) return true;
    }
    if ('company' in item) { // Employee only
        if ((item as Employee).company.toLowerCase().includes(lowerSearchTerm)) return true;
    }
    return false;
  });

  const isAllSelected = filteredData.length > 0 && selectedIds.length === filteredData.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(item => item.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const VisibilityOption: React.FC<{ value: Visibility; title: string; description: string; }> = ({ value, title, description }) => (
    <button
      type="button"
      onClick={() => setVisibility(value)}
      className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
        visibility === value
          ? 'border-zinc-900 bg-zinc-50 shadow-sm ring-1 ring-zinc-900/10 dark:border-zinc-300 dark:bg-zinc-800/80 dark:ring-white/10'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-600'
      }`}
    >
      <div className="flex items-center">
        <div className="mr-4 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 dark:border-zinc-500">
            {visibility === value && <div className="h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-zinc-100">{title}</h4>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-500">{description}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="linarc-modal-overlay" onClick={onClose}>
        <div 
            className={`linarc-modal-panel flex flex-col transition-all duration-300 ease-in-out ${step === 'visibility' ? 'max-w-xl' : 'max-w-4xl'}`}
            onClick={e => e.stopPropagation()}
            style={{maxHeight: '90vh'}}
            role="dialog"
            aria-modal="true"
        >
          <div className="linarc-modal-header">
              <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="linarc-modal-title">
                        {step === 'visibility' ? 'Set visibility' : visibility === 'restricted' ? 'Select companies' : 'Select employees'}
                    </h3>
                    <p className="linarc-modal-subtitle">
                      {step === 'visibility'
                        ? 'Choose who can view this item in the project.'
                        : 'Search and select from the list below.'}
                    </p>
                  </div>
                  <button type="button" onClick={onClose} className="linarc-modal-close shrink-0" aria-label="Close">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
              </div>
          </div>
          
          {step === 'visibility' ? (
              <>
                <div className="space-y-3 px-6 pb-2 pt-2">
                  <VisibilityOption value="public" title="Public" description="Anyone in this project can view this file / folder" />
                  <VisibilityOption value="restricted" title="Restricted" description="Only selected companies can view this folder" />
                  <VisibilityOption value="private" title="Private" description="Only selected employees can view this folder" />
                </div>
                <div className="linarc-modal-footer">
                  <button type="button" onClick={onClose} className="linarc-btn-modal-cancel">Cancel</button>
                  <button type="button" onClick={handleNext} className="linarc-btn-primary py-1.5 px-4">
                      {visibility === 'public' ? 'Share' : 'Next'}
                  </button>
                </div>
              </>
          ) : (
            <>
              <div className="flex flex-grow flex-col overflow-hidden px-6 pb-2 pt-4">
                <label htmlFor="share-modal-search" className="linarc-field-label">Search</label>
                <input 
                    id="share-modal-search"
                    type="text" 
                    placeholder="Search…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="linarc-input mb-4" 
                />
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-grow flex flex-col">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                          <thead className="bg-gray-50/90 dark:bg-zinc-800/80">
                              <tr>
                                  <th className="w-10 p-3 text-center"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="rounded" /></th>
                                  <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">S.No</th>
                                  <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{visibility === 'restricted' ? 'Company' : 'Name'}</th>
                                  <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{visibility === 'restricted' ? 'Company role' : 'Role'}</th>
                                  <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{visibility === 'restricted' ? 'Project manager' : 'Company'}</th>
                              </tr>
                          </thead>
                      </table>
                  </div>
                  <div className="overflow-y-auto flex-grow">
                      <table className="w-full text-sm">
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {filteredData.map((item, index) => (
                                  <tr key={item.id} onClick={() => handleSelectRow(item.id)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                      <td className="p-3 w-10 text-center"><input type="checkbox" checked={selectedIds.includes(item.id)} readOnly className="rounded" /></td>
                                      <td className="p-3 text-gray-500 dark:text-gray-400">{index + 1}</td>
                                      <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
                                      <td className="p-3 text-gray-600 dark:text-gray-300">{item.role}</td>
                                      <td className="p-3 text-gray-600 dark:text-gray-300">{visibility === 'restricted' ? (item as Company).projectManager : (item as Employee).company}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                </div>
              </div>
              <div className="linarc-modal-footer !justify-between">
                  <button type="button" onClick={handleBack} className="linarc-btn-modal-cancel">Back</button>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={onClose} className="linarc-btn-modal-cancel">Cancel</button>
                    <button type="button" onClick={handleFinalShare} className="linarc-btn-primary py-1.5 px-4">Share</button>
                  </div>
              </div>
            </>
          )}

        </div>
    </div>
  );
};

export default ShareModal;
