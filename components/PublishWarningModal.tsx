
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';

interface PublishWarningModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onPublish: (name: string) => void;
}

const PublishWarningModal: React.FC<PublishWarningModalProps> = ({ isOpen, onCancel, onDiscard, onPublish }) => {
  const [markupName, setMarkupName] = useState('');

  useEffect(() => {
    if (isOpen) setMarkupName('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && markupName.trim()) {
      onPublish(markupName.trim());
    }
  };

  return (
    <div className="linarc-modal-overlay" onClick={onCancel}>
      <div
        className="linarc-modal-panel max-w-md"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-warning-title"
      >
        <div className="linarc-modal-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="publish-warning-title" className="linarc-modal-title">Unsaved markup</h3>
              <p className="linarc-modal-subtitle">
                Publish your markup before leaving, or your changes will not be saved.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="linarc-modal-close shrink-0"
              aria-label="Stay on page"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <label htmlFor="publish-markup-name" className="linarc-field-label">
            Markup name
          </label>
          <input
            id="publish-markup-name"
            type="text"
            value={markupName}
            onChange={e => setMarkupName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Review comments – Level 2"
            className="linarc-input mt-1"
            autoFocus
          />
        </div>

        <div className="linarc-modal-footer !justify-between">
          <button
            type="button"
            onClick={onDiscard}
            className="linarc-btn-modal-cancel !text-red-600 hover:!text-red-700 dark:!text-red-400 dark:hover:!text-red-300"
          >
            Discard &amp; leave
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onCancel} className="linarc-btn-modal-cancel">
              Stay
            </button>
            <button
              type="button"
              onClick={() => onPublish(markupName.trim())}
              disabled={!markupName.trim()}
              className="linarc-btn-primary py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publish &amp; leave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishWarningModal;
