import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  FolderSync, 
  ShieldCheck,
  FileCheck2,
  Loader2
} from 'lucide-react';
import api from '../services/api';

export default function TwoStepSubmissionModal({ assignment, isOpen, onClose, onSubmitted }) {
  const [step1Checked, setStep1Checked] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !assignment) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!step1Checked) {
      setError('Please check Step 1 before confirming submission.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/submissions/confirm', {
        assignment_id: assignment.id,
        confirmation_step1: true,
        confirmation_step2: true,
        notes: notes.trim(),
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSubmitted(res.data.submission);
          onClose();
          setSuccess(false);
          setStep1Checked(false);
          setNotes('');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-600 to-indigo-700 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <FileCheck2 className="w-6 h-6 text-brand-200" />
            <h3 className="font-bold text-lg">Two-Step Submission Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-brand-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Submission Confirmed!</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Your group submission has been recorded and verified on the professor's dashboard.
              </p>
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-5">
              {/* Assignment Overview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                  Assignment
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{assignment.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {assignment.description || 'No description provided.'}
                </p>

                {/* External OneDrive Button */}
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-600">
                    <FolderSync className="w-4 h-4 text-blue-500" />
                    <span>Upload target: OneDrive</span>
                  </div>
                  <a
                    href={assignment.onedrive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-lg transition-colors border border-blue-200"
                  >
                    <span>Open OneDrive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Upload Confirmation */}
              <div
                onClick={() => setStep1Checked(!step1Checked)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  step1Checked
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="step1"
                    checked={step1Checked}
                    onChange={(e) => setStep1Checked(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor="step1"
                      className="text-sm font-bold text-slate-900 cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>Step 1: OneDrive Upload Verification</span>
                      {step1Checked && <CheckCircle className="w-4 h-4 text-brand-600 inline" />}
                    </label>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      "I confirm that my assignment deliverables have been uploaded to the professor's OneDrive submission link above."
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Final Confirmation & Notes */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  step1Checked ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <ShieldCheck
                    className={`w-4 h-4 ${step1Checked ? 'text-brand-600' : 'text-slate-400'}`}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 2: Submission Notes (Optional)
                  </span>
                </div>
                <textarea
                  disabled={!step1Checked}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    step1Checked
                      ? "Add any notes for the professor (e.g. OneDrive file name, group members who contributed, etc.)..."
                      : "Complete Step 1 above to enable final confirmation..."
                  }
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 resize-none text-slate-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!step1Checked || submitting}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center space-x-2 ${
                    step1Checked && !submitting
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:from-brand-700 hover:to-indigo-700 shadow-brand-500/25 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Yes, I have submitted</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
