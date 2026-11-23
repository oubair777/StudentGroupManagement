import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  FolderSync, 
  ExternalLink, 
  Calendar, 
  Users, 
  CheckCircle2, 
  X,
  AlertCircle
} from 'lucide-react';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [onedriveLink, setOnedriveLink] = useState('');
  const [targetType, setTargetType] = useState('all'); // 'all' | 'specific_groups'
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [asgnRes, grpRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/groups'),
      ]);

      if (asgnRes.data.success) setAssignments(asgnRes.data.assignments);
      if (grpRes.data.success) setAllGroups(grpRes.data.groups);
    } catch (err) {
      console.error('Failed to load assignments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setTitle('');
    setDescription('');
    // Default due date: 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setDueDate(defaultDate.toISOString().slice(0, 16));
    setOnedriveLink('https://onedrive.live.com/?id=joineazy_submissions');
    setTargetType('all');
    setSelectedGroupIds([]);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (asgn) => {
    setModalMode('edit');
    setEditingId(asgn.id);
    setTitle(asgn.title);
    setDescription(asgn.description || '');
    setDueDate(new Date(asgn.due_date).toISOString().slice(0, 16));
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
      title: title.trim(),
      description: description.trim(),
      due_date: new Date(dueDate).toISOString(),
      onedrive_link: onedriveLink.trim(),
      target_type: targetType,
      target_group_ids: targetType === 'specific_groups' ? selectedGroupIds : [],
    };

    try {
      if (modalMode === 'create') {
        const res = await api.post('/assignments', payload);
        if (res.data.success) {
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await api.put(`/assignments/${editingId}`, payload);
        if (res.data.success) {
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
    if (!window.confirm(`Are you sure you want to delete assignment "${asgnTitle}"? This will delete all student submission records associated with it.`)) {
      return;
    }

    try {
      const res = await api.delete(`/assignments/${id}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Assignment Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, edit, and assign coursework with OneDrive upload links for the entire class or targeted groups.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-purple-900/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-xl font-bold text-slate-800">No Assignments Created Yet</h3>
          <p className="text-xs text-slate-500">
            Click the button above to post your first assignment with a OneDrive submission folder.
          </p>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl shadow-md transition-all inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asgn) => (
            <div
              key={asgn.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header row: target pill & action buttons */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      asgn.target_type === 'specific_groups'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {asgn.target_type === 'specific_groups' ? 'Specific Groups' : 'All Students'}
                  </span>

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

                <h3 className="text-lg font-bold text-slate-900 leading-snug">{asgn.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {asgn.description || 'No description provided.'}
                </p>

                {/* Targeted Groups Pills */}
                {asgn.target_type === 'specific_groups' && asgn.target_groups?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Assigned Groups:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {asgn.target_groups.map((g) => (
                        <span
                          key={g.id}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-md"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Due Date */}
                <div className="flex items-center space-x-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
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

              {/* Bottom Card Row */}
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
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-200" />
                <h3 className="font-bold text-base">
                  {modalMode === 'create' ? 'Create New Assignment' : 'Edit Assignment'}
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

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Milestone 1: Project Architecture & ER Diagram"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description & Deliverables Requirements
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide instructions, required file formats, submission criteria..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800 resize-none"
                />
              </div>

              {/* Due Date & Time */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Due Date & Submission Deadline *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Target Scope: All Students vs Specific Groups (Core Requirement) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Assignment Scope *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      targetType === 'all'
                        ? 'border-purple-600 bg-purple-50/50 text-purple-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      value="all"
                      checked={targetType === 'all'}
                      onChange={() => setTargetType('all')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs">All Students</span>
                  </label>

                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      targetType === 'specific_groups'
                        ? 'border-purple-600 bg-purple-50/50 text-purple-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      value="specific_groups"
                      checked={targetType === 'specific_groups'}
                      onChange={() => setTargetType('specific_groups')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs">Specific Groups</span>
                  </label>
                </div>

                {/* If Specific Groups selected, show checklist */}
                {targetType === 'specific_groups' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      Select Targeted Groups:
                    </span>
                    {allGroups.length === 0 ? (
                      <p className="text-xs text-slate-400">No student groups created yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                        {allGroups.map((g) => {
                          const isChecked = selectedGroupIds.includes(g.id);
                          return (
                            <label
                              key={g.id}
                              className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer ${
                                isChecked
                                  ? 'border-purple-400 bg-purple-50 text-purple-900 font-semibold'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleGroupSelection(g.id)}
                                className="rounded text-purple-600 focus:ring-purple-500"
                              />
                              <span className="truncate">{g.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : modalMode === 'create'
                    ? 'Post Assignment'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
