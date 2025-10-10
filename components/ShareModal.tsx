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
    <div
      onClick={() => setVisibility(value)}
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${visibility === value ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/50' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-400'}`}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center mr-4">
            {visibility === value && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
        <div 
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full flex flex-col transition-all duration-300 ease-in-out ${step === 'visibility' ? 'max-w-xl' : 'max-w-4xl'}`}
            onClick={e => e.stopPropagation()}
            style={{maxHeight: '90vh'}}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {step === 'visibility' ? 'Set Visibility' : visibility === 'restricted' ? 'Select Companies' : 'Select Employees'}
                  </h3>
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </button>
              </div>
          </div>
          
          {step === 'visibility' ? (
              <>
                <div className="p-6 space-y-4">
                  <VisibilityOption value="public" title="Public" description="Anyone in this project can view this file / folder" />
                  <VisibilityOption value="restricted" title="Restricted" description="Only selected companies can view this folder" />
                  <VisibilityOption value="private" title="Private" description="Only selected employees can view this folder" />
                </div>
                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
                  <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                  <button onClick={handleNext} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                      {visibility === 'public' ? 'Share' : 'Next'}
                  </button>
                </div>
              </>
          ) : (
            <>
              <div className="p-6 flex-grow flex flex-col overflow-hidden">
                <input 
                    type="text" 
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" 
                />
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-grow flex flex-col">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700/50">
                              <tr>
                                  <th className="p-3 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="rounded" /></th>
                                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">S.No</th>
                                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">{visibility === 'restricted' ? 'Company' : 'Name'}</th>
                                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">{visibility === 'restricted' ? 'Company Role' : 'Role'}</th>
                                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">{visibility === 'restricted' ? 'Project Manager' : 'Company'}</th>
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
               {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <button onClick={handleBack} className="bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Back</button>
                  <div className="flex gap-4">
                    <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleFinalShare} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg">Share</button>
                  </div>
              </div>
            </>
          )}

        </div>
    </div>
  );
};

export default ShareModal;
