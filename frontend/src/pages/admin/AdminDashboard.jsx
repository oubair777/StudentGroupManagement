import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import ProgressBar from '../../components/ProgressBar';
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  FolderSync, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  LayoutGrid,
  Award,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/admin');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const summary = data?.summary || {};
  const courseBreakdown = data?.course_breakdown || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-950/15">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold backdrop-blur-sm border border-white/10">
              Professor Portal &bull; Round 2
            </span>
            <span className="text-xs text-purple-200 font-medium">Academic Management System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Course Oversight & Submission Analytics
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 max-w-xl font-medium">
            Manage course curriculum, monitor individual and group leader acknowledgments, and track class progress.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/assignments"
            className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Post Coursework</span>
          </Link>
          <Link
            to="/admin/submissions"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/20 flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submission Tracker</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Courses Taught"
          value={summary.total_courses || 0}
          subtitle="Active curriculum"
          icon={LayoutGrid}
          color="indigo"
        />
        <StatsCard
          title="Total Students"
          value={summary.total_students || 0}
          subtitle="Enrolled cohort"
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Collaborative Teams"
          value={summary.total_groups || 0}
          subtitle="Formed groups"
          icon={Layers}
          color="blue"
        />
        <StatsCard
          title="Coursework Tasks"
          value={summary.total_assignments || 0}
          subtitle="Individual & group"
          icon={BookOpen}
          color="amber"
        />
        <StatsCard
          title="Class Progress"
          value={`${summary.overall_completion_rate || 0}%`}
          subtitle="Total submissions"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Courses Being Taught Section (Requirement 1.2) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <LayoutGrid className="w-5 h-5 text-purple-600" />
              <span>Courses Being Taught</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Course-level analytics: enrolled student counts, active deliverables, and submission percentages
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 self-start sm:self-auto">
            {courseBreakdown.length} Courses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courseBreakdown.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate('/admin/assignments')}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-black uppercase tracking-wider">
                    {c.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {c.semester}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                  {c.title}
                </h3>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                  <div>
                    <span className="text-base font-black text-slate-800">{c.student_count}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Students</span>
                  </div>
                  <div>
                    <span className="text-base font-black text-slate-800">{c.assignment_count}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Tasks</span>
                  </div>
                  <div>
                    <span className="text-base font-black text-slate-800">{c.group_count}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Groups</span>
                  </div>
                </div>

                <div>
                  <ProgressBar
                    percentage={c.completion_rate}
                    label="Class Submission Rate"
                    size="sm"
                    badgeText={`${c.confirmed_submissions} Submissions`}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:text-purple-800">
                <span>Manage Coursework</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Coursework Progress Breakdown & Recent Submissions Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Coursework Progress Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span>Deliverables & Submissions Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track individual and group coursework submission status across courses
                </p>
              </div>
              <Link
                to="/admin/assignments"
                className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center space-x-1"
              >
                <span>Full List</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {data?.assignment_stats?.map((asgn) => (
                <div
                  key={asgn.id}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        {asgn.course_code && (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md text-[10px] font-black uppercase">
                            {asgn.course_code}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            asgn.submission_type === 'group'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {asgn.submission_type === 'group' ? 'Group Task' : 'Individual'}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {new Date(asgn.due_date).toLocaleDateString()}</span>
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{asgn.title}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-slate-800">
                        {asgn.confirmed_count} / {asgn.expected_count}
                      </span>
                      <span className="text-xs text-slate-400 block font-medium">Submissions</span>
                    </div>
                  </div>

                  <ProgressBar
                    percentage={asgn.completion_rate}
                    label="Submission Completion"
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Recent Submissions Stream */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Recent Submissions</span>
              </h3>
              <Link
                to="/admin/submissions"
                className="text-xs font-bold text-purple-700 hover:text-purple-800"
              >
                Tracker →
              </Link>
            </div>

            <div className="space-y-3">
              {data?.recent_activity?.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No submissions recorded yet.
                </div>
              ) : (
                data?.recent_activity?.slice(0, 6).map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900">{act.student_name}</span>
                        {act.student_id_code && (
                          <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                            ({act.student_id_code})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {act.acknowledged_by_leader ? 'Leader Ack' : 'Verified'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 truncate">
                      {act.course_code && <span className="font-bold mr-1">[{act.course_code}]</span>}
                      <span>{act.assignment_title}</span>
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                      <span>Group: {act.group_name}</span>
                      <span>{new Date(act.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
