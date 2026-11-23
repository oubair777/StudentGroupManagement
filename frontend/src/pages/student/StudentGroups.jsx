import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ProgressBar from '../../components/ProgressBar';
import { 
  Users, 
  UserPlus, 
  Plus, 
  Trash2, 
  LogOut, 
  Copy, 
  Check, 
  Shield, 
  AlertCircle, 
  Search,
  Sparkles,
  Award,
  X
} from 'lucide-react';

export default function StudentGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Add member form
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Student search suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchGroupsAndAnalytics = async () => {
    try {
      const [grpRes, analRes] = await Promise.all([
        api.get('/groups/my'),
        api.get('/analytics/student'),
      ]);

      if (grpRes.data.success) setGroups(grpRes.data.groups);
      if (analRes.data.success) setAnalytics(analRes.data);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupsAndAnalytics();
  }, []);

  // Search autocomplete for inviting
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const res = await api.get(`/auth/students?query=${encodeURIComponent(searchQuery)}`);
          if (res.data.success) {
            setSuggestions(res.data.students);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await api.post('/groups', {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setNewGroupName('');
        setNewGroupDesc('');
        fetchGroupsAndAnalytics();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddMember = async (groupId, identifierToUse) => {
    const idf = identifierToUse || inviteIdentifier;
    if (!idf.trim()) return;

    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await api.post(`/groups/${groupId}/members`, {
        identifier: idf.trim(),
      });

      if (res.data.success) {
        setInviteSuccess(res.data.message);
        setInviteIdentifier('');
        setSearchQuery('');
        setSuggestions([]);
        fetchGroupsAndAnalytics();
        setTimeout(() => setInviteSuccess(''), 4000);
      }
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (groupId, memberUserId) => {
    const isSelf = memberUserId === user.id;
    if (
      !window.confirm(
        isSelf
          ? 'Are you sure you want to leave this group?'
          : 'Are you sure you want to remove this member from the group?'
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/groups/${groupId}/members/${memberUserId}`);
      if (res.data.success) {
        fetchGroupsAndAnalytics();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const currentGroup = groups.length > 0 ? groups[0] : null;
  const isLeader = currentGroup?.my_role === 'leader';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Group Management & Collaboration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Form your own team, invite group members via Email or Student ID, and track shared progress.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading group details...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Active Group Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Students must form or join groups to collaborate on assignments and submit deliverables together.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-500/20 transition-all inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your Group Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Group Details & Member Roster (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {groups.map((grp) => {
              const amILeader = grp.my_role === 'leader';

              return (
                <div
                  key={grp.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6"
                >
                  {/* Group Info Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <h2 className="text-2xl font-black text-slate-900">{grp.name}</h2>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            amILeader
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {amILeader ? 'You are Group Leader' : 'Member'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 max-w-xl">
                        {grp.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Group Code Pill */}
                    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start">
                      <span className="text-xs font-mono font-bold text-slate-700">{grp.code}</span>
                      <button
                        onClick={() => copyToClipboard(grp.code)}
                        title="Copy group code"
                        className="text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        {copiedCode === grp.code ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Invite / Add Member Section (Core requirement) */}
                  <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-4">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-5 h-5 text-brand-600" />
                      <h3 className="font-bold text-sm text-slate-900">
                        Invite / Add Member (by Email or Student ID)
                      </h3>
                    </div>

                    {inviteSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                        <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{inviteSuccess}</span>
                      </div>
                    )}

                    {inviteError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{inviteError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            value={inviteIdentifier}
                            onChange={(e) => {
                              setInviteIdentifier(e.target.value);
                              setSearchQuery(e.target.value);
                            }}
                            placeholder="Type student email (e.g. bella@joineazy.edu) or ID (e.g. STU-1002)..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-800"
                          />
                        </div>
                        <button
                          onClick={() => handleAddMember(grp.id)}
                          disabled={inviteLoading || !inviteIdentifier.trim()}
                          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                          {inviteLoading ? 'Adding...' : 'Add to Group'}
                        </button>
                      </div>

                      {/* Suggestions list */}
                      {suggestions.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-2 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {suggestions.map((sug) => (
                            <div
                              key={sug.id}
                              onClick={() => {
                                setInviteIdentifier(sug.email);
                                setSuggestions([]);
                              }}
                              className="py-2 px-3 hover:bg-slate-50 cursor-pointer rounded-lg flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-800">{sug.name}</span>
                                <span className="text-slate-400 ml-2">({sug.email})</span>
                              </div>
                              <span className="font-mono text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                                {sug.student_id || 'Student'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Members Roster */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-800">
                        Group Members ({grp.members?.length || 0})
                      </h3>
                      <span className="text-xs text-slate-400">
                        Formed {new Date(grp.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                      {grp.members?.map((mem) => {
                        const isSelf = mem.id === user.id;

                        return (
                          <div
                            key={mem.id}
                            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm shadow-sm">
                                {mem.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-900 text-sm">{mem.name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded">
                                      You
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      mem.role === 'leader'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {mem.role === 'leader' ? 'Leader' : 'Member'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                                  <span>{mem.email}</span>
                                  {mem.student_id && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono">{mem.student_id}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div>
                              {isSelf ? (
                                <button
                                  onClick={() => handleRemoveMember(grp.id, mem.id)}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span>Leave Group</span>
                                </button>
                              ) : amILeader ? (
                                <button
                                  onClick={() => handleRemoveMember(grp.id, mem.id)}
                                  title="Remove member"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Visual Group Progress & Badge (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">Group Progress Visualizer</h3>
              </div>

              {/* Completion Badge */}
              <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-brand-50 to-indigo-50 border border-brand-100 space-y-2">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-md border border-brand-100 flex items-center justify-center mx-auto text-brand-600">
                  <Sparkles className="w-7 h-7 text-amber-500" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-brand-700">
                  Current Status
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  {analytics?.group?.badge || 'In Progress'}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Calculated based on confirmed OneDrive submissions across all assigned coursework.
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-4">
                <ProgressBar
                  percentage={analytics?.group?.group_completion_rate || 0}
                  label="Overall Team Completion"
                  size="lg"
                  badgeText={`${analytics?.group?.group_completion_rate || 0}%`}
                />

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Active Team:</span>
                    <span className="font-bold text-slate-800">
                      {currentGroup?.name || 'My Group'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Team Members:</span>
                    <span className="font-bold text-slate-800">
                      {currentGroup?.members?.length || 0} students
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Verification Mode:</span>
                    <span className="font-bold text-emerald-600">2-Step Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
            <div className="px-6 py-4 bg-gradient-to-r from-brand-600 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-brand-200" />
                <h3 className="font-bold text-base">Create a New Group</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-brand-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Cloud Innovators"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Topic Focus
                </label>
                <textarea
                  rows={3}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Describe your project theme, team goals, or tech stack..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newGroupName.trim()}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
