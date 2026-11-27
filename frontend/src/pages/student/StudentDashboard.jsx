import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import ProgressBar from '../../components/ProgressBar';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Users, 
  ArrowRight,
  Award,
  GraduationCap,
  Sparkles,
  LayoutGrid,
  Calendar,
  Layers
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, analyticsRes, groupsRes] = await Promise.all([
          api.get('/courses'),
          api.get('/analytics/student'),
          api.get('/groups/my'),
        ]);

        if (coursesRes.data.success) setCourses(coursesRes.data.courses);
        if (analyticsRes.data.success) setAnalytics(analyticsRes.data);
        if (groupsRes.data.success) setGroups(groupsRes.data.groups);
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const primaryGroup = groups.length > 0 ? groups[0] : null;

  // Theme color styles for course cards
  const colorSchemes = {
    indigo: {
      border: 'border-indigo-100 hover:border-indigo-300',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      button: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
      gradient: 'from-indigo-600 to-indigo-800',
    },
    purple: {
      border: 'border-purple-100 hover:border-purple-300',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      button: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
      gradient: 'from-purple-600 to-purple-800',
    },
    emerald: {
      border: 'border-emerald-100 hover:border-emerald-300',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      button: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
      gradient: 'from-emerald-600 to-emerald-800',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-brand-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold backdrop-blur-sm border border-white/10">
              Student Workspace
            </span>
            {user?.student_id && (
              <span className="text-xs text-brand-200 font-mono font-bold">ID: {user.student_id}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl font-medium">
            Access your enrolled courses, collaborate in teams, and track your individual & group submissions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/student/assignments"
            className="px-4 py-2.5 bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>All Coursework</span>
          </Link>
          <Link
            to="/student/groups"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/20 flex items-center space-x-1.5"
          >
            <Users className="w-4 h-4" />
            <span>My Team</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Enrolled Courses"
          value={analytics?.personal?.enrolled_courses || courses.length || 0}
          subtitle="Academic curriculum"
          icon={LayoutGrid}
          color="indigo"
        />
        <StatsCard
          title="Assigned Deliverables"
          value={analytics?.personal?.total_assignments || 0}
          subtitle="Individual & group tasks"
          icon={BookOpen}
          color="purple"
        />
        <StatsCard
          title="Verified Submissions"
          value={analytics?.personal?.completed_count || 0}
          subtitle="2-Step confirmed"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Overall Completion"
          value={`${analytics?.personal?.completion_rate || 0}%`}
          subtitle={analytics?.personal?.badge || 'In Progress'}
          icon={Award}
          color="amber"
        />
      </div>

      {/* Enrolled Courses Section (Requirement 1.2) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <LayoutGrid className="w-5 h-5 text-brand-600" />
              <span>Enrolled Courses</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any course to view its assignments, deadlines, and submission statuses
            </p>
          </div>
          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200 self-start sm:self-auto">
            {courses.length} Active Courses
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading your enrolled courses...</div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-700">No courses enrolled yet</h3>
            <p className="text-xs text-slate-400 mt-1">Contact your professor to be enrolled in course units.</p>
          </div>
        ) : (
          /* Responsive Grid of Course Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const theme = colorSchemes[course.color_theme] || colorSchemes.indigo;

              return (
                <div
                  key={course.id}
                  onClick={() => navigate(`/student/courses/${course.id}`)}
                  className={`bg-white rounded-3xl p-6 border ${theme.border} shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group transform hover:-translate-y-1`}
                >
                  <div className="space-y-4">
                    {/* Course Code & Department */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${theme.badge}`}>
                        {course.code}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {course.semester || 'Fall 2026'}
                      </span>
                    </div>

                    {/* Course Title & Description */}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {course.description || 'Comprehensive curriculum with hands-on projects.'}
                      </p>
                    </div>

                    {/* Instructor Info */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {course.instructor_name ? course.instructor_name.charAt(0) : 'P'}
                        </div>
                        <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                          {course.instructor_name || 'Dr. Robert Vance'}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {course.assignment_count} Tasks
                      </span>
                    </div>

                    {/* Progress Bar (Course Completion) */}
                    <div className="pt-1">
                      <ProgressBar
                        percentage={course.progress_percentage || 0}
                        label="Course Completion"
                        size="sm"
                        badgeText={`${course.completed_assignments || 0}/${course.assignment_count || 0}`}
                      />
                    </div>
                  </div>

                  {/* Card Bottom Action */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600 group-hover:text-brand-700">
                    <span>View Course Assignments</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Group & Quick Assignments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group Quick Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-brand-600" />
              <span>My Collaboration Group</span>
            </h3>
            <Link to="/student/groups" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              Details →
            </Link>
          </div>

          {primaryGroup ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-brand-950 text-base">{primaryGroup.name}</h4>
                    <p className="text-[11px] text-brand-700 font-mono mt-0.5 font-bold">
                      Code: {primaryGroup.code}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${primaryGroup.my_role === 'leader' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                    {primaryGroup.my_role === 'leader' ? '★ Group Leader' : 'Team Member'}
                  </span>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    percentage={analytics?.group?.group_completion_rate || 0}
                    label="Team Progress"
                    size="sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Team Roster ({primaryGroup.members?.length || 0})
                </span>
                {primaryGroup.members?.map((m) => (
                  <div key={m.id} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-800">
                      {m.name} {m.id === user.id && <span className="text-brand-600">(You)</span>}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No active group yet.{' '}
              <Link to="/student/groups" className="text-brand-600 font-bold underline">
                Create one now
              </Link>
            </div>
          )}
        </div>

        {/* System Features Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Round 2 Features Active</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Enhanced System
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <LayoutGrid className="w-4 h-4 text-brand-600" />
                <span>Course-Driven Curriculum</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Assignments are now organized cleanly by course code (CS-301, CS-402, CS-505) with click-through pages.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Group Leader Acknowledgment</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                For team coursework, only group leaders can submit, instantly propagating acknowledgment to all members.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
