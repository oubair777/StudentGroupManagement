import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import ProgressBar from '../../components/ProgressBar';
import { 
  BarChart3, 
  Users, 
  Layers, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Calendar,
  Sparkles,
  PieChart
} from 'lucide-react';

export default function AdminAnalytics() {
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
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 text-sm">
        Loading analytics dashboard...
      </div>
    );
  }

  const summary = data?.summary || {};
  const assignmentStats = data?.assignment_stats || [];
  const groupPerformance = data?.group_performance || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2.5">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <span>Academic Analytics & Group Performance</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visual metrics on submission completion rates, group performance rankings, and student engagement.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Overall Submission Rate"
          value={`${summary.overall_completion_rate || 0}%`}
          subtitle="Course-wide aggregate"
          icon={TrendingUp}
          color="indigo"
        />
        <StatsCard
          title="Total Submissions"
          value={summary.total_submissions || 0}
          subtitle="2-Step verified"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Active Groups"
          value={summary.total_groups || 0}
          subtitle="Collaborative teams"
          icon={Layers}
          color="purple"
        />
        <StatsCard
          title="Active Coursework"
          value={summary.total_assignments || 0}
          subtitle="Total assignments posted"
          icon={BookOpen}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Assignment Submission Completion Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>Assignment Completion Rates</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirmed student submissions compared against cohort size
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {assignmentStats.length} Assignments
            </span>
          </div>

          <div className="space-y-5">
            {assignmentStats.map((asgn) => (
              <div key={asgn.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{asgn.title}</h4>
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {new Date(asgn.due_date).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      asgn.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : asgn.status === 'Past Due'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {asgn.status}
                  </span>
                </div>

                {/* Progress bar */}
                <ProgressBar
                  percentage={asgn.completion_rate}
                  size="md"
                  label={`${asgn.confirmed_count} of ${asgn.expected_count} submitted`}
                  badgeText={`${asgn.completion_rate}%`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Group Performance Leaderboard */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Group Performance Ranking</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Team completion scores and performance badges
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {groupPerformance.length} Teams
            </span>
          </div>

          <div className="space-y-4">
            {groupPerformance.map((grp, index) => (
              <div
                key={grp.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-slate-100 font-black text-slate-700 text-xs flex items-center justify-center border border-slate-200">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{grp.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {grp.member_count} members • {grp.confirmed_submissions} submissions
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      grp.badge_color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : grp.badge_color === 'blue'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {grp.performance_badge}
                  </span>
                </div>

                <ProgressBar
                  percentage={grp.completion_rate}
                  size="sm"
                  label="Team Submission Score"
                  badgeText={`${grp.completion_rate}%`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
