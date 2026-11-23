import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Layers
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-950/10">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">
              Professor & Admin Portal
            </span>
            <span className="text-xs text-purple-200">Unified Academic Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Assignment & Group Oversight
          </h1>
          <p className="text-sm text-purple-100 max-w-xl">
            Create coursework, share OneDrive submission links, assign to groups, and track student confirmations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/assignments"
            className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 font-bold text-sm rounded-xl transition-all shadow-md flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Post Assignment</span>
          </Link>
          <Link
            to="/admin/submissions"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-all border border-white/20 flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submission Tracker</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Students"
          value={data?.summary?.total_students || 0}
          subtitle="Enrolled cohort"
          icon={Users}
          color="indigo"
        />
        <StatsCard
          title="Student Groups"
          value={data?.summary?.total_groups || 0}
          subtitle="Collaborative teams"
          icon={Layers}
          color="purple"
        />
        <StatsCard
          title="Assignments"
          value={data?.summary?.total_assignments || 0}
          subtitle="Posted coursework"
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Submissions"
          value={data?.summary?.total_submissions || 0}
          subtitle="2-Step verified"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Completion Rate"
          value={`${data?.summary?.overall_completion_rate || 0}%`}
          subtitle="Class-wide progress"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Grid: Assignment Progress & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Active Assignments Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span>Assignments Progress Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submission rates and completion metrics across students
                </p>
              </div>
              <Link
                to="/admin/assignments"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {data?.assignment_stats?.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No assignments created yet.
                </div>
              ) : (
                data?.assignment_stats?.map((asgn) => (
                  <div
                    key={asgn.id}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3"
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
                            {asgn.target_type === 'specific_groups' ? 'Specific Groups' : 'All Students'}
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
                        <span className="text-xs text-slate-400 block">Submissions</span>
                      </div>
                    </div>

                    <ProgressBar
                      percentage={asgn.completion_rate}
                      label="Submission Completion"
                      size="sm"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Recent Verified Submissions Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Recent Submissions</span>
              </h3>
              <Link
                to="/admin/submissions"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
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
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs"
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
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 truncate">
                      Assignment: <span className="font-semibold">{act.assignment_title}</span>
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
