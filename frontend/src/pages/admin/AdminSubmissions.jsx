import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import { 
  CheckCircle2, 
  Users, 
  User, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  Search,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  LayoutGrid
} from 'lucide-react';

export default function AdminSubmissions() {
  const [data, setData] = useState({ student_submissions: [], group_summaries: [] });
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState('group'); // 'group' | 'student'
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'submitted' | 'pending' | 'overdue'
  const [search, setSearch] = useState('');

  const fetchTrackerData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCourse) params.course_id = selectedCourse;
      if (selectedAssignment) params.assignment_id = selectedAssignment;
      if (selectedGroup) params.group_id = selectedGroup;
      if (statusFilter !== 'all') params.status_filter = statusFilter;

      const [trackerRes, coursesRes, asgnRes, grpRes] = await Promise.all([
        api.get('/submissions/tracker', { params }),
        api.get('/courses'),
        api.get('/assignments', { params: selectedCourse ? { course_id: selectedCourse } : {} }),
        api.get('/groups'),
      ]);

      if (trackerRes.data.success) setData(trackerRes.data);
      if (coursesRes.data.success) setCourses(coursesRes.data.courses);
      if (asgnRes.data.success) setAssignments(asgnRes.data.assignments);
      if (grpRes.data.success) setGroups(grpRes.data.groups);
    } catch (err) {
      console.error('Failed to load submissions tracker:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, [selectedCourse, selectedAssignment, selectedGroup, statusFilter]);

  // Filtered student submissions
  const filteredStudents = data.student_submissions.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.student_name.toLowerCase().includes(q) ||
      item.student_email.toLowerCase().includes(q) ||
      (item.student_id_code && item.student_id_code.toLowerCase().includes(q)) ||
      (item.group_name && item.group_name.toLowerCase().includes(q)) ||
      (item.assignment_title && item.assignment_title.toLowerCase().includes(q))
    );
  });

  // Filtered group summaries
  const filteredGroups = data.group_summaries.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.group_name.toLowerCase().includes(q) ||
      item.assignment_title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Submission Confirmation Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor course-wide submissions, individual student verifications, and group leader acknowledgments.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('group')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'group'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Group-Wise Tracker</span>
          </button>
          <button
            onClick={() => setViewMode('student')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'student'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Student-Wise Tracker</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Course + Assignment + Status Filter) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2.5 items-center justify-between">
          <div className="flex flex-wrap gap-2.5 items-center flex-1">
            {/* Course Filter */}
            <div className="min-w-[170px]">
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedAssignment('');
                }}
                className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-700"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignment Filter */}
            <div className="min-w-[180px]">
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-700"
              >
                <option value="">All Tasks</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.submission_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter (Requirement 3.2: ability to filter submissions by status) */}
            <div className="min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-700"
              >
                <option value="all">Status: All</option>
                <option value="submitted">Submitted Only</option>
                <option value="pending">Pending Only</option>
                <option value="overdue">Overdue Only</option>
              </select>
            </div>

            {(selectedCourse || selectedAssignment || selectedGroup || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCourse('');
                  setSelectedAssignment('');
                  setSelectedGroup('');
                  setStatusFilter('all');
                }}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold underline px-2"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student or team..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Main Tracker Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading submission logs...</div>
      ) : viewMode === 'group' ? (
        /* ================= GROUP-WISE TRACKER ================= */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Group-Wise Submission Performance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregate team progress and Group Leader acknowledgment verification
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {filteredGroups.length} Group Records
            </span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No group submission records match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Group Name</th>
                    <th className="py-3.5 px-6">Course / Deliverable</th>
                    <th className="py-3.5 px-6">Type</th>
                    <th className="py-3.5 px-6">Confirmed Members</th>
                    <th className="py-3.5 px-6 w-1/4">Progress</th>
                    <th className="py-3.5 px-6">Leader Acknowledgment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredGroups.map((grp, idx) => (
                    <tr key={`${grp.group_id}-${grp.assignment_id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs">
                            {grp.group_name.charAt(0)}
                          </div>
                          <span>{grp.group_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {grp.course_code && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold mr-1.5">
                            {grp.course_code}
                          </span>
                        )}
                        <span>{grp.assignment_title}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${grp.submission_type === 'group' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {grp.submission_type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-black text-slate-900">{grp.confirmed_count}</span>{' '}
                        of <span className="text-slate-500">{grp.total_members} students</span>
                      </td>
                      <td className="py-4 px-6">
                        <ProgressBar percentage={grp.completion_percentage} size="sm" showLabel={true} />
                      </td>
                      <td className="py-4 px-6">
                        {grp.is_leader_acknowledged ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Leader Acknowledged</span>
                          </span>
                        ) : grp.confirmed_count > 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Awaiting Submission</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ================= STUDENT-WISE TRACKER ================= */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Student-Wise Submission Confirmations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed record of each student's course assignment status and leader acknowledgment reflection
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {filteredStudents.length} Students Tracked
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No student records found matching the criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Student</th>
                    <th className="py-3.5 px-6">Group</th>
                    <th className="py-3.5 px-6">Course & Task</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Submission Type</th>
                    <th className="py-3.5 px-6">Acknowledgment</th>
                    <th className="py-3.5 px-6">Submitted At</th>
                    <th className="py-3.5 px-6">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStudents.map((item, idx) => (
                    <tr key={`${item.student_id}-${item.assignment_id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{item.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.student_id_code ? item.student_id_code : item.student_email}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {item.group_name || <span className="text-slate-400 italic">Independent</span>}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {item.course_code && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold mr-1">
                            [{item.course_code}]
                          </span>
                        )}
                        <span>{item.assignment_title}</span>
                      </td>
                      <td className="py-4 px-6">
                        {item.status === 'submitted' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Submitted</span>
                          </span>
                        ) : item.status === 'overdue' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Overdue</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.submission_type === 'group' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {item.submission_type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {item.acknowledged_by_leader ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>By Leader ({item.acknowledged_by_name || 'Leader'})</span>
                          </span>
                        ) : item.confirmed_by_student ? (
                          <span className="inline-flex items-center space-x-1 text-blue-600 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Individual Verified</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                        {item.notes ? <span title={item.notes} className="italic">"{item.notes}"</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
