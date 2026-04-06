import React, { useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Download,
  Indent,
  Italic,
  Link2,
  List,
  ListOrdered,
  Outdent,
  Smile,
  Strikethrough,
  Table,
  Trash2,
  Underline,
  Unlink,
} from 'lucide-react';
import { XMarkIcon } from './Icons';
import Tooltip from './Tooltip';
import type { RfiFormState } from '../types';

interface RfiPanelProps {
  isOpen: boolean;
  isEditMode: boolean;
  formData: RfiFormState;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onHeaderTrash?: () => void;
  onDownload?: () => void;
  onClearQuestion?: () => void;
}

function formatCreatedLine(author: string): string {
  const d = new Date();
  const date = d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${author} on ${date} ${time}`;
}

const RTE_TOOLBAR_BTN =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded border border-transparent text-zinc-600 transition-colors hover:border-zinc-200 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800';

const RfiPanel: React.FC<RfiPanelProps> = ({
  isOpen,
  isEditMode,
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  onHeaderTrash,
  onDownload,
  onClearQuestion,
}) => {
  const [detailTab, setDetailTab] = useState<'details' | 'email'>('details');

  const questionMeta = `Question - Step 1 : CREATE Created by : ${formatCreatedLine('Thomas Cole, Martinez Developments')}`;
  const answerMeta = `Answer - Created by : ${formatCreatedLine('Thomas Cole, Martinez Developments')}`;

  const radioYesNo = (name: 'scheduleImpact' | 'costImpact') => (
    <div className="flex flex-wrap gap-6">
      {(['Yes', 'No'] as const).map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
          <input
            type="radio"
            name={name}
            value={opt}
            checked={formData[name] === opt}
            onChange={onFormChange}
            className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:focus:ring-blue-500"
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div
      className={`h-full flex-shrink-0 overflow-hidden border-gray-200 bg-white transition-all duration-200 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 ${isOpen ? 'border-l translate-x-0' : 'translate-x-full'}`}
      style={{ width: isOpen ? 'min(36rem, 100vw)' : '0px', maxWidth: isOpen ? '36rem' : '0px', visibility: isOpen ? 'visible' : 'hidden' }}
    >
      <div className={`flex h-full w-full flex-col transition-opacity duration-150 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div className="linarc-panel-header">
          <h2 className="linarc-panel-title">{isEditMode ? 'Edit RFI' : 'Create RFI'}</h2>
          <Tooltip text="Close" position="left">
            <button type="button" onClick={onCancel} className="linarc-panel-close" aria-label="Close panel">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="linarc-panel-body custom-scrollbar flex-1 min-h-0">
          {/* Tabs + header actions */}
          <div className="mb-5 flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setDetailTab('details')}
                className={`relative px-3 pb-2.5 text-sm font-semibold transition-colors ${
                  detailTab === 'details'
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                }`}
              >
                Details
                {detailTab === 'details' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-orange-500" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('email')}
                className={`relative px-3 pb-2.5 text-sm font-semibold transition-colors ${
                  detailTab === 'email'
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                }`}
              >
                Email
                {detailTab === 'email' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-orange-500" aria-hidden />
                )}
              </button>
            </div>
            <div className="flex items-center gap-0.5 pb-1">
              {onHeaderTrash && (
                <button
                  type="button"
                  onClick={onHeaderTrash}
                  className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label={isEditMode ? 'Delete RFI' : 'Reset draft'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onDownload}
                className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          {detailTab === 'email' ? (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-400">
              Email notifications and recipients will be configured here.
            </div>
          ) : (
            <>
              <div className="space-y-5">
                <div>
                  <label htmlFor="rfi-title" className="linarc-field-label">
                    RFI Name <span className="font-bold text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="rfi-title"
                    value={formData.title}
                    onChange={onFormChange}
                    required
                    placeholder="RFI Title"
                    className="linarc-input placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label htmlFor="rfi-type" className="linarc-field-label">
                    RFI Type <span className="font-bold text-red-600 dark:text-red-400">*</span>
                  </label>
                  <select
                    name="type"
                    id="rfi-type"
                    value={formData.type}
                    onChange={onFormChange}
                    required
                    className="linarc-select"
                  >
                    <option value="">Select RFI Type</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Design Clarification">Design Clarification</option>
                    <option value="Material Substitution">Material Substitution</option>
                    <option value="Field Condition">Field Condition</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rfi-priority" className="linarc-field-label">
                    Priority
                  </label>
                  <select name="priority" id="rfi-priority" value={formData.priority} onChange={onFormChange} className="linarc-select">
                    <option value="">Select Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rfi-sequence" className="linarc-field-label">
                    Sequence
                  </label>
                  <select name="sequence" id="rfi-sequence" value={formData.sequence} onChange={onFormChange} className="linarc-select">
                    <option value="">Select Sequence</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rfi-location" className="linarc-field-label">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="rfi-location"
                    value={formData.location}
                    onChange={onFormChange}
                    placeholder="Add Location"
                    className="linarc-input placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div className="flex flex-row flex-wrap items-start gap-x-10 gap-y-3">
                  <div className="min-w-0">
                    <p className="linarc-field-label">Schedule Impact</p>
                    {radioYesNo('scheduleImpact')}
                  </div>
                  <div className="min-w-0">
                    <p className="linarc-field-label">Cost Impact</p>
                    {radioYesNo('costImpact')}
                  </div>
                </div>
              </div>

              {/* Question block */}
              <div className="mt-6 rounded-lg border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-950">
                <div className="flex items-start justify-between gap-2 border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-600">
                  <p className="text-[11px] font-semibold leading-snug text-zinc-700 dark:text-zinc-300">{questionMeta}</p>
                  <button
                    type="button"
                    onClick={() => onClearQuestion?.()}
                    className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    aria-label="Clear question"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-600">
                  <div className="mb-1 flex flex-wrap items-center gap-1">
                    <select className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200" defaultValue="normal" aria-label="Text style">
                      <option value="normal">Normal Text</option>
                      <option value="h2">Heading</option>
                    </select>
                    <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-600" aria-hidden />
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Bold" aria-hidden tabIndex={-1}>
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Italic" aria-hidden tabIndex={-1}>
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Underline" aria-hidden tabIndex={-1}>
                      <Underline className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Strikethrough" aria-hidden tabIndex={-1}>
                      <Strikethrough className="h-3.5 w-3.5" />
                    </button>
                    <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-600" aria-hidden />
                    <button type="button" className={`${RTE_TOOLBAR_BTN} border-zinc-300 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800`} title="Align center" aria-hidden tabIndex={-1}>
                      <AlignCenter className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Align left" aria-hidden tabIndex={-1}>
                      <AlignLeft className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Align right" aria-hidden tabIndex={-1}>
                      <AlignRight className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Justify" aria-hidden tabIndex={-1}>
                      <AlignJustify className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Bullet list" aria-hidden tabIndex={-1}>
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Numbered list" aria-hidden tabIndex={-1}>
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Indent" aria-hidden tabIndex={-1}>
                      <Indent className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Outdent" aria-hidden tabIndex={-1}>
                      <Outdent className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Emoji" aria-hidden tabIndex={-1}>
                      <Smile className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Link" aria-hidden tabIndex={-1}>
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Unlink" aria-hidden tabIndex={-1}>
                      <Unlink className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className={RTE_TOOLBAR_BTN} title="Table" aria-hidden tabIndex={-1}>
                      <Table className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  name="question"
                  id="rfi-question"
                  value={formData.question}
                  onChange={onFormChange}
                  required
                  rows={4}
                  placeholder="Enter description"
                  className="linarc-textarea w-full resize-y rounded-none border-0 focus:ring-0 dark:focus:ring-0"
                />

                <div className="flex flex-col gap-3 border-t border-zinc-200 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-600">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Linked Item &amp; Attachments</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      + Link Item
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      + Add Attachment
                    </button>
                  </div>
                </div>
              </div>

              {/* Answer block */}
              <div className="mt-6">
                <p className="mb-2 text-[11px] font-semibold leading-snug text-zinc-700 dark:text-zinc-300">{answerMeta}</p>
                <input
                  type="text"
                  name="answer"
                  value={formData.answer}
                  onChange={onFormChange}
                  placeholder="Click to add a RFI answer."
                  className="linarc-input placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>
            </>
          )}

          </div>
          <div className="linarc-panel-footer">
            <button type="button" onClick={onCancel} className="linarc-btn-modal-cancel">
              Cancel
            </button>
            <button type="submit" className="linarc-btn-primary py-1.5 px-4" disabled={detailTab === 'email'} title={detailTab === 'email' ? 'Switch to Details to save' : undefined}>
              {isEditMode ? 'Save changes' : 'Create RFI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RfiPanel;
