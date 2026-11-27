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
  Users,
  User,
  Lock,
  Sparkles,
  Filter
} from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [submissionTypeFilter, setSubmissionTypeFilter] = useState('all'); // all, individual, group
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, submitted, overdue
  const [search, setSearch] = useState('');
  
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCourse) params.course_id = selectedCourse;

      const [asgnRes, coursesRes] = await Promise.all([
        api.get('/assignments', { params }),
        api.get('/courses'),
      ]);

      if (asgnRes.data.success) setAssignments(asgnRes.data.assignments);
      if (coursesRes.data.success) setCourses(coursesRes.data.courses);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCourse]);

  const handleSubmitted = () => {
    fetchData();
  };

  const filteredAssignments = assignments.filter((asgn) => {
    // Status filter
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'submitted'
        ? asgn.is_submitted
        : statusFilter === 'pending'
        ? !asgn.is_submitted && asgn.status !== 'overdue'
        : statusFilter === 'overdue'
        ? asgn.status === 'overdue'
        : true;

    // Type filter
    const matchesType =
      submissionTypeFilter === 'all'
        ? true
        : submissionTypeFilter === 'individual'
        ? asgn.submission_type === 'individual'
        : asgn.submission_type === 'group';

    // Search query
    const matchesSearch =
      asgn.title.toLowerCase().includes(search.toLowerCase()) ||
      (asgn.description && asgn.description.toLowerCase().includes(search.toLowerCase())) ||
      (asgn.course_code && asgn.course_code.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Assignments & Coursework
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track individual and group deliverables across all your enrolled courses.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'pending', label: 'Pending' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'overdue', label: 'Overdue' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar (Course + Type + Search) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap gap-2.5 items-center flex-1">
          {/* Course Selector */}
          <div className="min-w-[180px]">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-slate-700"
            >
              <option value="">All Enrolled Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Type Toggle: Individual vs Group */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setSubmissionTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                submissionTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSubmissionTypeFilter('individual')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                submissionTypeFilter === 'individual'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Individual</span>
            </button>
            <button
              onClick={() => setSubmissionTypeFilter('group')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                submissionTypeFilter === 'group'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Group</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, courses, keywords..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 text-slate-800"
          />
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading coursework...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700">No coursework matching the filters</h3>
          <p className="text-xs text-slate-400">Try adjusting your course, type, or search filters above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((asgn) => {
            const isGroup = asgn.submission_type === 'group';

            return (
              <div
                key={asgn.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-brand-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Course Code + Submission Type + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      {asgn.course_code && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200">
                          {asgn.course_code}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                          isGroup
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isGroup ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span>{isGroup ? 'Group Task' : 'Individual'}</span>
                      </span>
                    </div>

                    {/* Status Badge */}
                    {asgn.is_submitted ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Submitted</span>
                      </span>
                    ) : asgn.status === 'overdue' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[11px] font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Overdue</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-snug">{asgn.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {asgn.description}
                    </p>
                  </div>

                  {/* Deadline & Course Title */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Due: {new Date(asgn.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {asgn.course_title && (
                      <span className="text-[11px] font-medium text-slate-400 truncate max-w-[180px]">
                        {asgn.course_title}
                      </span>
                    )}
                  </div>

                  {/* Group Leader Acknowledgment Banner (Requirement 1.3 & 3.3) */}
                  {isGroup && (
                    <div className="p-3.5 rounded-2xl border text-xs space-y-1 bg-slate-50 border-slate-200">
                      {asgn.is_leader ? (
                        <div className="flex items-start space-x-2 text-amber-800">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">★ You are the Group Leader</span>
                            <span className="text-[11px] text-amber-700">
                              Your submission will acknowledge and complete this deliverable for all team members.
                            </span>
                          </div>
                        </div>
                      ) : asgn.is_submitted ? (
                        <div className="flex items-start space-x-2 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Acknowledged by Group Leader</span>
                            <span className="text-[11px] text-emerald-700">
                              Submitted by {asgn.leader_name} on behalf of your team.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-2 text-slate-600">
                          <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-slate-800">
                              Awaiting Group Leader Submission
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Only your group leader ({asgn.leader_name}) can acknowledge and submit this task.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                </div>

                {/* Bottom Actions */}
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

                  {/* Submit / Awaiting Action Button */}
                  {asgn.is_submitted ? (
                    <button
                      onClick={() => asgn.can_submit && setSelectedAssignment(asgn)}
                      disabled={!asgn.can_submit}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                        asgn.can_submit
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{asgn.can_submit ? 'Update Submission' : 'Acknowledged'}</span>
                    </button>
                  ) : !asgn.can_submit ? (
                    <div
                      title={`Only your group leader (${asgn.leader_name}) can submit this task`}
                      className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Awaiting Leader</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAssignment(asgn)}
                      className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isGroup ? 'Acknowledge for Team' : 'Verify & Confirm'}</span>
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
