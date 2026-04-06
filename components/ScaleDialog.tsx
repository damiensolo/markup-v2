
import React from 'react';
import { XMarkIcon } from './Icons';

interface ScaleDialogProps {
  isOpen: boolean;
  onStartCalibrating: () => void;
  onClose: () => void;
}

const ScaleDialog: React.FC<ScaleDialogProps> = ({ isOpen, onStartCalibrating, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="linarc-modal-overlay" onClick={onClose}>
      <div
        className="linarc-modal-panel max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scale-dialog-title"
      >
        <div className="linarc-modal-header">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="scale-dialog-title" className="linarc-modal-title">Set Drawing Scale</h3>
              <p className="linarc-modal-subtitle">
                To measure accurately, draw a reference line over any known dimension on the blueprint — like a room width or door opening. Then enter the real-world length.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="linarc-modal-close shrink-0"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="linarc-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="linarc-btn-modal-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onStartCalibrating}
            className="linarc-btn-primary py-2.5 px-5"
          >
            Start Calibrating
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScaleDialog;
