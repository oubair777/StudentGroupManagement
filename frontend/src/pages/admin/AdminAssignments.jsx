import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  FolderSync, 
  ExternalLink, 
  Calendar, 
  Users, 
  User,
  CheckCircle2, 
  X,
  AlertCircle,
  LayoutGrid
} from 'lucide-react';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submissionType, setSubmissionType] = useState('individual'); // 'individual' | 'group'
  const [onedriveLink, setOnedriveLink] = useState('');
  const [targetType, setTargetType] = useState('all'); // 'all' | 'specific_groups'
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCourseFilter) params.course_id = selectedCourseFilter;

      const [asgnRes, coursesRes, grpRes] = await Promise.all([
        api.get('/assignments', { params }),
        api.get('/courses'),
        api.get('/groups'),
      ]);

      if (asgnRes.data.success) setAssignments(asgnRes.data.assignments);
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.courses);
        if (!courseId && coursesRes.data.courses.length > 0) {
          setCourseId(coursesRes.data.courses[0].id);
        }
      }
      if (grpRes.data.success) setAllGroups(grpRes.data.groups);
    } catch (err) {
      console.error('Failed to load assignments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCourseFilter]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setCourseId(courses.length > 0 ? courses[0].id : '');
    setTitle('');
    setDescription('');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setDueDate(defaultDate.toISOString().slice(0, 16));
    setSubmissionType('individual');
    setOnedriveLink('https://onedrive.live.com/?id=joineazy_submissions');
    setTargetType('all');
    setSelectedGroupIds([]);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (asgn) => {
    setModalMode('edit');
    setEditingId(asgn.id);
    setCourseId(asgn.course_id || (courses.length > 0 ? courses[0].id : ''));
    setTitle(asgn.title);
    setDescription(asgn.description || '');
    setDueDate(new Date(asgn.due_date).toISOString().slice(0, 16));
    setSubmissionType(asgn.submission_type || 'individual');
    setOnedriveLink(asgn.onedrive_link);
    setTargetType(asgn.target_type);
    setSelectedGroupIds(asgn.target_groups ? asgn.target_groups.map((g) => g.id) : []);
    setFormError('');
    setShowModal(true);
  };

  const toggleGroupSelection = (groupId) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !onedriveLink.trim()) {
      setFormError('Title, Due Date, and OneDrive Submission Link are required.');
      return;
    }

    if (targetType === 'specific_groups' && selectedGroupIds.length === 0) {
      setFormError('Please select at least one group to target.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const payload = {
      course_id: courseId || null,
      title: title.trim(),
      description: description.trim(),
      due_date: new Date(dueDate).toISOString(),
      submission_type: submissionType,
      onedrive_link: onedriveLink.trim(),
      target_type: targetType,
      target_group_ids: targetType === 'specific_groups' ? selectedGroupIds : [],
    };

    try {
      if (modalMode === 'create') {
        const res = await api.post('/assignments', payload);
        if (res.data.success) {
          showToast('Assignment created successfully!', 'success');
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await api.put(`/assignments/${editingId}`, payload);
        if (res.data.success) {
          showToast('Assignment updated successfully!', 'success');
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, asgnTitle) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${asgnTitle}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/assignments/${id}`);
      if (res.data.success) {
        showToast('Assignment deleted successfully.', 'info');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (typeFilter === 'individual') return a.submission_type === 'individual';
    if (typeFilter === 'group') return a.submission_type === 'group';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Coursework & Assignment Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, configure individual vs group submission types, and target specific groups across courses.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-purple-900/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Assignment</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Course Filter */}
          <div className="min-w-[190px]">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-700"
            >
              <option value="">All Taught Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Submission Type Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('individual')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                typeFilter === 'individual' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Individual</span>
            </button>
            <button
              onClick={() => setTypeFilter('group')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                typeFilter === 'group' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Group</span>
            </button>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {filteredAssignments.length} Assignments Displayed
        </span>
      </div>

      {/* Assignment Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading assignments...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Assignments Found</h3>
          <p className="text-xs text-slate-500">Click the button above to post your first assignment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((asgn) => {
            const isGroup = asgn.submission_type === 'group';

            return (
              <div
                key={asgn.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Header row: Course Code + Submission Type + Action buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      {asgn.course_code && (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
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

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(asgn)}
                        title="Edit Assignment"
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asgn.id, asgn.title)}
                        title="Delete Assignment"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug">{asgn.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {asgn.description}
                  </p>

                  {/* Due Date & Course */}
                  <div className="flex items-center space-x-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {new Date(asgn.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Bottom Row: OneDrive link + Submissions counter */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={asgn.onedrive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <FolderSync className="w-3.5 h-3.5" />
                    <span>OneDrive Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center space-x-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{asgn.total_submissions || 0} Submitted</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-200" />
                <h3 className="font-bold text-base">
                  {modalMode === 'create' ? 'Post New Coursework' : 'Edit Coursework'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-purple-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Course Selector (Round 2 requirement) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Associated Course *
                </label>
                <select
                  required
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 font-semibold"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title} ({c.semester})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deliverable Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Milestone 2: Collaborative Microservice Architecture"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                />
              </div>

              {/* Submission Type: Individual vs Group (Requirement 1.3 & 3.2) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Submission Type & Acknowledgment Flow *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      submissionType === 'individual'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="subType"
                      value="individual"
                      checked={submissionType === 'individual'}
                      onChange={() => setSubmissionType('individual')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="block font-bold">Individual Task</span>
                      <span className="text-[10px] text-slate-500">Each student submits individually</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      submissionType === 'group'
                        ? 'border-purple-600 bg-purple-50/50 text-purple-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="subType"
                      value="group"
                      checked={submissionType === 'group'}
                      onChange={() => setSubmissionType('group')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="text-xs">
                      <span className="block font-bold">Group Assignment</span>
                      <span className="text-[10px] text-slate-500">Only Group Leader can submit for team</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description & Deliverable Guidelines
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="State deliverables, required formats, testing criteria..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 resize-none"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Submission Deadline *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                />
              </div>

              {/* OneDrive Submission Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  OneDrive Submission Folder Link *
                </label>
                <div className="relative">
                  <FolderSync className="w-4 h-4 text-blue-500 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    required
                    value={onedriveLink}
                    onChange={(e) => setOnedriveLink(e.target.value)}
                    placeholder="https://onedrive.live.com/?id=..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Post Assignment' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
