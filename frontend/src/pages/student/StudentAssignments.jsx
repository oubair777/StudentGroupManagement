import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import TwoStepSubmissionModal from '../../components/TwoStepSubmissionModal';
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FolderSync, 
  ShieldCheck,
  Calendar,
  Users
} from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, overdue
  const [search, setSearch] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      if (res.data.success) {
        setAssignments(res.data.assignments);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmitted = () => {
    fetchAssignments();
  };

  const filteredAssignments = assignments.filter((asgn) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'submitted'
        ? asgn.is_submitted
        : filter === 'pending'
        ? !asgn.is_submitted && asgn.status !== 'overdue'
        : filter === 'overdue'
        ? asgn.status === 'overdue'
        : true;

    const matchesSearch =
      asgn.title.toLowerCase().includes(search.toLowerCase()) ||
      (asgn.description && asgn.description.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Assignments & Submissions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access OneDrive links, track group progress, and confirm deliverables via two-step verification.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {['all', 'pending', 'submitted', 'overdue'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assignments by title or keyword..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm text-slate-800"
        />
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading assignments...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700">No assignments match your criteria</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Try adjusting your search terms or filter selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((asgn) => {
            const isDueSoon =
              !asgn.is_submitted &&
              new Date(asgn.due_date) - new Date() < 3 * 24 * 60 * 60 * 1000 &&
              new Date(asgn.due_date) > new Date();

            return (
              <div
                key={asgn.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-brand-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Target pill + Status */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        asgn.target_type === 'specific_groups'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {asgn.target_type === 'specific_groups' ? 'Specific Group' : 'All Students'}
                    </span>

                    {asgn.is_submitted ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Submitted</span>
                      </span>
                    ) : asgn.status === 'overdue' ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Overdue</span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                          isDueSoon
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isDueSoon ? 'Due Soon' : 'Pending'}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{asgn.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {asgn.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Due Date & Creator */}
                  <div className="flex items-center space-x-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Due:{' '}
                        {new Date(asgn.due_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Group Progress Bar */}
                  {asgn.group_progress && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-brand-600" />
                          <span>{asgn.group_progress.group_name}</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {asgn.group_progress.submitted_members} of {asgn.group_progress.total_members} confirmed
                        </span>
                      </div>
                      <ProgressBar
                        percentage={asgn.group_progress.completion_percent}
                        showLabel={false}
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Submission note if already submitted */}
                  {asgn.is_submitted && asgn.submission?.notes && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800">
                      <span className="font-bold block mb-0.5">Your Submission Note:</span>
                      "{asgn.submission.notes}"
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <a
                    href={asgn.onedrive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl transition-colors"
                  >
                    <FolderSync className="w-3.5 h-3.5" />
                    <span>Open OneDrive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {asgn.is_submitted ? (
                    <button
                      onClick={() => setSelectedAssignment(asgn)}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Update Confirmation</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedAssignment(asgn)}
                      className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify & Confirm</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two-step verification modal */}
      <TwoStepSubmissionModal
        assignment={selectedAssignment}
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}
