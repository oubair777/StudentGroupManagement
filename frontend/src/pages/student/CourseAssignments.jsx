import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import TwoStepSubmissionModal from '../../components/TwoStepSubmissionModal';
import { 
  BookOpen, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FolderSync, 
  ExternalLink, 
  Users, 
  User, 
  ShieldCheck, 
  Calendar,
  Lock,
  Sparkles
} from 'lucide-react';

export default function CourseAssignments() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, individual, group, submitted, pending
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, asgnRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/assignments?course_id=${courseId}`),
      ]);

      if (courseRes.data.success) setCourse(courseRes.data.course);
      if (asgnRes.data.success) setAssignments(asgnRes.data.assignments);
    } catch (err) {
      console.error('Failed to load course assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const handleSubmitted = () => {
    fetchCourseData();
  };

  const filteredAssignments = assignments.filter((asgn) => {
    if (filter === 'individual') return asgn.submission_type === 'individual';
    if (filter === 'group') return asgn.submission_type === 'group';
    if (filter === 'submitted') return asgn.is_submitted;
    if (filter === 'pending') return !asgn.is_submitted;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Back to Courses Link */}
      <div>
        <Link
          to="/student/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Enrolled Courses</span>
        </Link>
      </div>

      {/* Course Banner */}
      {course && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-black uppercase tracking-wider border border-white/20">
                  {course.code}
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  {course.semester} &bull; {course.department}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{course.title}</h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center shrink-0 self-start md:self-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Instructor
              </span>
              <p className="text-sm font-black text-white mt-0.5">{course.instructor_name}</p>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                {course.instructor_email}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Coursework & Deliverables</h2>
          <p className="text-xs text-slate-500">
            View requirements, check submission types, and verify OneDrive uploads
          </p>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'individual', label: 'Individual' },
            { id: 'group', label: 'Group Tasks' },
            { id: 'submitted', label: 'Completed' },
            { id: 'pending', label: 'Pending' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading course deliverables...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700">No deliverables match this filter</h3>
          <p className="text-xs text-slate-400">Try switching tabs above.</p>
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
                  {/* Top Bar: Submission Type Pill + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border ${
                          isGroup
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isGroup ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        <span>{isGroup ? 'Group Task' : 'Individual'}</span>
                      </span>
                    </div>

                    {/* Status Badge */}
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
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
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

                  {/* Deadline */}
                  <div className="flex items-center space-x-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {new Date(asgn.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Group Leader Acknowledgment Banner (Core requirement 1.3 & 3.3) */}
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

                  {/* Submission note if already submitted */}
                  {asgn.is_submitted && asgn.submission?.notes && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800">
                      <span className="font-bold block mb-0.5">Submission Note:</span>
                      "{asgn.submission.notes}"
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

                  {/* Submission Action Button based on Leader Permission */}
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
                      title={`Only your group leader (${asgn.leader_name}) can submit`}
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
