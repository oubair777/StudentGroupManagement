import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import ProgressBar from '../../components/ProgressBar';
import TwoStepSubmissionModal from '../../components/TwoStepSubmissionModal';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Users, 
  FolderSync, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Award
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const fetchData = async () => {
    try {
      const [analyticsRes, assignmentsRes, groupsRes] = await Promise.all([
        api.get('/analytics/student'),
        api.get('/assignments'),
        api.get('/groups/my'),
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data);
      if (assignmentsRes.data.success) setAssignments(assignmentsRes.data.assignments);
      if (groupsRes.data.success) setGroups(groupsRes.data.groups);
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitted = () => {
    fetchData();
  };

  const primaryGroup = groups.length > 0 ? groups[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-brand-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-900/10">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">
              Student Workspace
            </span>
            {user?.student_id && (
              <span className="text-xs text-brand-200 font-mono">ID: {user.student_id}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hello, {user?.name}! 👋
          </h1>
          <p className="text-sm text-indigo-100 max-w-xl">
            Collaborate in your group, upload deliverables to OneDrive, and verify your assignment submissions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/student/assignments"
            className="px-4 py-2.5 bg-white text-brand-700 hover:bg-brand-50 font-bold text-sm rounded-xl transition-all shadow-md flex items-center space-x-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Assignments</span>
          </Link>
          <Link
            to="/student/groups"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-all border border-white/20 flex items-center space-x-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Manage Group</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Assigned"
          value={analytics?.personal?.total_assignments || 0}
          subtitle="Course coursework"
          icon={BookOpen}
          color="indigo"
        />
        <StatsCard
          title="Confirmed Submissions"
          value={analytics?.personal?.completed_count || 0}
          subtitle="Verified submissions"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Pending Action"
          value={analytics?.personal?.pending_count || 0}
          subtitle="Awaiting submission"
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Completion Badge"
          value={analytics?.personal?.badge || 'In Progress'}
          subtitle={`${analytics?.personal?.completion_rate || 0}% personal completion`}
          icon={Award}
          color="purple"
        />
      </div>

      {/* Main Grid: Group Progress & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Group Status & Progress */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-brand-600" />
                <span>My Group Progress</span>
              </h3>
              <Link
                to="/student/groups"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-0.5"
              >
                <span>Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {primaryGroup ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-brand-950 text-base">{primaryGroup.name}</h4>
                      <p className="text-xs text-brand-700/80 mt-0.5 font-mono">
                        Code: {primaryGroup.code}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white text-brand-700 border border-brand-200 shadow-sm">
                      {analytics?.group?.badge || 'Active Group'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <ProgressBar
                      percentage={analytics?.group?.group_completion_rate || 0}
                      label="Overall Group Progress"
                      size="md"
                      badgeText={`${analytics?.group?.group_completion_rate || 0}%`}
                    />
                  </div>
                </div>

                {/* Group Members List */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                    Group Members ({primaryGroup.members?.length || 0})
                  </span>
                  <div className="space-y-2">
                    {primaryGroup.members?.map((mem) => (
                      <div
                        key={mem.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {mem.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">
                              {mem.name} {mem.id === user.id && <span className="text-brand-600">(You)</span>}
                            </p>
                            <p className="text-[10px] text-slate-400">{mem.student_id || mem.email}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            mem.role === 'leader'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {mem.role === 'leader' ? 'Leader' : 'Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">You haven't joined a group yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Create a new group or invite other students to collaborate on assignments.
                </p>
                <Link
                  to="/student/groups"
                  className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Create or Join Group
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Assignments Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-brand-600" />
                  <span>Assignments & Submissions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm your OneDrive upload with two-step verification
                </p>
              </div>
              <Link
                to="/student/assignments"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-0.5"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No assignments posted yet.
                </div>
              ) : (
                assignments.slice(0, 3).map((asgn) => (
                  <div
                    key={asgn.id}
                    className="p-5 rounded-2xl border border-slate-200/80 hover:border-brand-200 bg-white hover:bg-slate-50/50 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              asgn.target_type === 'specific_groups'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {asgn.target_type === 'specific_groups' ? 'Group Targeted' : 'All Students'}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              Due: {new Date(asgn.due_date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mt-1">{asgn.title}</h4>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {asgn.is_submitted ? (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmed</span>
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
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{asgn.description}</p>

                    {/* Group Progress for this assignment */}
                    {asgn.group_progress && (
                      <div className="pt-2 border-t border-slate-100">
                        <ProgressBar
                          percentage={asgn.group_progress.completion_percent}
                          label={`Group Progress (${asgn.group_progress.submitted_members}/${asgn.group_progress.total_members} members confirmed)`}
                          size="sm"
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <a
                        href={asgn.onedrive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <FolderSync className="w-3.5 h-3.5" />
                        <span>OneDrive Submission Folder</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {!asgn.is_submitted ? (
                        <button
                          onClick={() => setSelectedAssignment(asgn)}
                          className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify & Confirm Submission</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Submitted on {new Date(asgn.submission.submitted_at).toLocaleDateString()}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Step Submission Verification Modal */}
      <TwoStepSubmissionModal
        assignment={selectedAssignment}
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}
