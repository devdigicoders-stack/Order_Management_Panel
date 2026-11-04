import React, { useState, useEffect, useMemo } from 'react';
import { 
  StickyNote, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Archive, 
  LayoutGrid, 
  Kanban, 
  RefreshCw, 
  Loader2, 
  X, 
  Tag, 
  ChevronDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AlertModal } from '../components/ui/AlertModal';
import api from '../services/api';
import clsx from 'clsx';

// Status configurations
const NOTE_STATUSES = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'in_progress', label: 'In Progress', icon: Loader2, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'archived', label: 'Archived', icon: Archive, color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

// Order / System Lifecycle Statuses
const ORDER_STATUS_MAP = [
  { id: 'general', label: 'General / No Order', badge: 'bg-slate-100 text-slate-700' },
  { id: 'draft', label: 'Draft', badge: 'bg-gray-100 text-gray-700' },
  { id: 'submitted', label: 'Submitted', badge: 'bg-yellow-100 text-yellow-800' },
  { id: 'approved', label: 'Approved', badge: 'bg-blue-100 text-blue-800' },
  { id: 'ordered', label: 'Ordered / Supplier', badge: 'bg-indigo-100 text-indigo-800' },
  { id: 'packed', label: 'Packed', badge: 'bg-purple-100 text-purple-800' },
  { id: 'loaded', label: 'Loaded / Transit', badge: 'bg-cyan-100 text-cyan-800' },
  { id: 'arrived', label: 'Arrived', badge: 'bg-teal-100 text-teal-800' },
  { id: 'completed', label: 'Completed Order', badge: 'bg-emerald-100 text-emerald-800' },
];

// Priority Configurations
const PRIORITIES = [
  { id: 'low', label: 'Low', badge: 'bg-slate-100 text-slate-600' },
  { id: 'medium', label: 'Medium', badge: 'bg-amber-100 text-amber-700' },
  { id: 'high', label: 'High', badge: 'bg-orange-100 text-orange-700' },
  { id: 'urgent', label: 'Urgent', badge: 'bg-rose-100 text-rose-700 font-bold' },
];

// Color Theme Options
const COLOR_THEMES = [
  { id: 'indigo', border: 'border-l-indigo-500', bg: 'bg-indigo-50/30', dot: 'bg-indigo-500' },
  { id: 'amber', border: 'border-l-amber-500', bg: 'bg-amber-50/30', dot: 'bg-amber-500' },
  { id: 'emerald', border: 'border-l-emerald-500', bg: 'bg-emerald-50/30', dot: 'bg-emerald-500' },
  { id: 'rose', border: 'border-l-rose-500', bg: 'bg-rose-50/30', dot: 'bg-rose-500' },
  { id: 'sky', border: 'border-l-sky-500', bg: 'bg-sky-50/30', dot: 'bg-sky-500' },
  { id: 'purple', border: 'border-l-purple-500', bg: 'bg-purple-50/30', dot: 'bg-purple-500' },
];

export const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'grid'
  
  // Filters
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'pending',
    orderStatus: 'general',
    priority: 'medium',
    category: 'general',
    color: 'indigo',
    pinned: false,
    tags: ''
  });

  // Fetch Notes
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await api.getNotes();
      setNotes(data || []);
    } catch (err) {
      console.warn('Failed to load notes:', err.message);
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to fetch notes',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Status filter
      if (activeStatusTab !== 'all' && note.status !== activeStatusTab) {
        return false;
      }
      // Order status filter
      if (orderStatusFilter !== 'all' && note.orderStatus !== orderStatusFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== 'all' && note.priority !== priorityFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = note.title?.toLowerCase().includes(query);
        const inContent = note.content?.toLowerCase().includes(query);
        const inTags = note.tags?.some(tag => tag.toLowerCase().includes(query));
        const inOrderStatus = note.orderStatus?.toLowerCase().includes(query);
        if (!inTitle && !inContent && !inTags && !inOrderStatus) {
          return false;
        }
      }
      return true;
    });
  }, [notes, activeStatusTab, orderStatusFilter, priorityFilter, searchQuery]);

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: notes.length,
      pending: notes.filter(n => n.status === 'pending').length,
      in_progress: notes.filter(n => n.status === 'in_progress').length,
      completed: notes.filter(n => n.status === 'completed').length,
      archived: notes.filter(n => n.status === 'archived').length,
    };
  }, [notes]);

  // Open Create Modal
  const handleOpenCreate = (defaultStatus = 'pending') => {
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      status: defaultStatus,
      orderStatus: 'general',
      priority: 'medium',
      category: 'general',
      color: 'indigo',
      pinned: false,
      tags: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      content: note.content || '',
      status: note.status || 'pending',
      orderStatus: note.orderStatus || 'general',
      priority: note.priority || 'medium',
      category: note.category || 'general',
      color: note.color || 'indigo',
      pinned: !!note.pinned,
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : (note.tags || '')
    });
    setIsModalOpen(true);
  };

  // Save Note (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setAlertConfig({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter a title for the note.',
        type: 'danger'
      });
      return;
    }

    const payload = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    try {
      if (editingNote) {
        const id = editingNote.id || editingNote._id;
        await api.updateNote(id, payload);
        setAlertConfig({
          isOpen: true,
          title: 'Note Updated',
          message: 'The note has been updated successfully.',
          type: 'success'
        });
      } else {
        await api.createNote(payload);
        setAlertConfig({
          isOpen: true,
          title: 'Note Created',
          message: 'New note has been saved successfully.',
          type: 'success'
        });
      }
      setIsModalOpen(false);
      fetchNotes();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Operation Failed',
        message: err.message || 'Failed to save note.',
        type: 'danger'
      });
    }
  };

  // Quick Status Change
  const handleStatusChange = async (noteId, newStatus) => {
    try {
      await api.updateNoteStatus(noteId, newStatus);
      // Optimistic update
      setNotes(prev => prev.map(n => (n.id === noteId || n._id === noteId) ? { ...n, status: newStatus } : n));
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Update Failed',
        message: err.message || 'Failed to update note status.',
        type: 'danger'
      });
      fetchNotes();
    }
  };

  // Toggle Pin
  const handleTogglePin = async (noteId) => {
    try {
      await api.togglePinNote(noteId);
      setNotes(prev => prev.map(n => {
        if (n.id === noteId || n._id === noteId) {
          return { ...n, pinned: !n.pinned };
        }
        return n;
      }));
    } catch (err) {
      console.warn('Failed to toggle pin:', err.message);
      fetchNotes();
    }
  };

  // Delete Note
  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    const targetId = noteToDelete.id || noteToDelete._id;
    try {
      await api.deleteNote(targetId);
      setAlertConfig({
        isOpen: true,
        title: 'Note Deleted',
        message: 'The note has been removed.',
        type: 'info'
      });
      setNoteToDelete(null);
      fetchNotes();
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Failed to delete note.',
        type: 'danger'
      });
    }
  };

  // Render Note Card
  const renderNoteCard = (note) => {
    const noteId = note.id || note._id;
    const colorTheme = COLOR_THEMES.find(c => c.id === note.color) || COLOR_THEMES[0];
    const statusObj = NOTE_STATUSES.find(s => s.id === note.status) || NOTE_STATUSES[0];
    const orderStatusObj = ORDER_STATUS_MAP.find(o => o.id === note.orderStatus) || ORDER_STATUS_MAP[0];
    const priorityObj = PRIORITIES.find(p => p.id === note.priority) || PRIORITIES[1];

    return (
      <div 
        key={noteId}
        className={clsx(
          "bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative border-l-4",
          colorTheme.border,
          note.pinned && "ring-1 ring-amber-400 bg-amber-50/10"
        )}
      >
        {/* Card Header */}
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Note Status Badge */}
              <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", statusObj.color)}>
                <statusObj.icon className={clsx("w-3 h-3 mr-1", note.status === 'in_progress' && "animate-spin")} />
                {statusObj.label}
              </span>

              {/* Order / Lifecycle Status Badge */}
              {note.orderStatus && note.orderStatus !== 'general' && (
                <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-gray-200", orderStatusObj.badge)}>
                  <Layers className="w-2.5 h-2.5 mr-1" />
                  {orderStatusObj.label}
                </span>
              )}

              {/* Priority Badge */}
              <span className={clsx("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold", priorityObj.badge)}>
                {priorityObj.label}
              </span>
            </div>

            {/* Pin Button */}
            <button
              onClick={() => handleTogglePin(noteId)}
              className={clsx(
                "p-1 rounded-lg transition-colors",
                note.pinned 
                  ? "text-amber-500 hover:text-amber-600 bg-amber-50" 
                  : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
              )}
              title={note.pinned ? "Unpin note" : "Pin to top"}
            >
              <Pin className={clsx("w-4 h-4", note.pinned && "fill-amber-500")} />
            </button>
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm md:text-base leading-snug break-words">
            {note.title}
          </h3>

          {/* Content */}
          {note.content && (
            <p className="mt-2 text-xs md:text-sm text-gray-600 whitespace-pre-line break-words line-clamp-4">
              {note.content}
            </p>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-3">
              {note.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                >
                  <Tag className="w-2.5 h-2.5 mr-1 opacity-70" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center gap-1.5 truncate">
            <span>By {note.authorName || 'Admin'}</span>
            <span>•</span>
            <span>{new Date(note.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Status Dropdown Menu */}
            <div className="relative group">
              <button 
                className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded transition-colors flex items-center gap-0.5"
                title="Change Status"
              >
                <span className="text-[11px] font-medium hidden sm:inline">Status</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block z-20">
                {NOTE_STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleStatusChange(noteId, s.id)}
                    className={clsx(
                      "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors",
                      note.status === s.id && "font-bold text-indigo-600 bg-indigo-50/50"
                    )}
                  >
                    <s.icon className="w-3 h-3" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => handleOpenEdit(note)}
              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"
              title="Edit Note"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setNoteToDelete(note)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded transition-colors"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex flex-col mb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 p-6 rounded-2xl shadow-md text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <StickyNote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                Admin Notes & Status Tracker
                {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
              </h1>
              <p className="text-xs md:text-sm text-indigo-100 mt-0.5">
                Manage notes categorized by order and operational lifecycle statuses
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={fetchNotes}
            disabled={loading}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 text-white"
            title="Refresh Notes"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
          
          <button
            onClick={() => handleOpenCreate('pending')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Note
          </button>
        </div>
      </div>

      {/* Status Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveStatusTab('all')}
          className={clsx(
            "p-4 rounded-xl border text-left transition-all duration-200",
            activeStatusTab === 'all'
              ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm"
              : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">All Notes</span>
            <StickyNote className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{counts.all}</div>
        </button>

        <button
          onClick={() => setActiveStatusTab('pending')}
          className={clsx(
            "p-4 rounded-xl border text-left transition-all duration-200",
            activeStatusTab === 'pending'
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-sm"
              : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending / To Do</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{counts.pending}</div>
        </button>

        <button
          onClick={() => setActiveStatusTab('in_progress')}
          className={clsx(
            "p-4 rounded-xl border text-left transition-all duration-200",
            activeStatusTab === 'in_progress'
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-sm"
              : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <Loader2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{counts.in_progress}</div>
        </button>

        <button
          onClick={() => setActiveStatusTab('completed')}
          className={clsx(
            "p-4 rounded-xl border text-left transition-all duration-200",
            activeStatusTab === 'completed'
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm"
              : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{counts.completed}</div>
        </button>

        <button
          onClick={() => setActiveStatusTab('archived')}
          className={clsx(
            "p-4 rounded-xl border text-left transition-all duration-200 col-span-2 sm:col-span-1",
            activeStatusTab === 'archived'
              ? "bg-gray-100 border-gray-400 ring-2 ring-gray-400/20 shadow-sm"
              : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
          )}
        >
          <div className="flex items-center justify-between text-gray-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Archived</span>
            <Archive className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{counts.archived}</div>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title, details, tags, status..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters & View Modes */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Order/System Status Filter */}
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Lifecycle:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="w-full sm:w-auto text-xs px-2.5 py-2 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="all">All Lifecycles</option>
                {ORDER_STATUS_MAP.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full sm:w-auto text-xs px-2.5 py-2 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="all">All Priorities</option>
                {PRIORITIES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('board')}
                className={clsx(
                  "p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors",
                  viewMode === 'board' ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
                title="Status Kanban Board"
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Board</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors",
                  viewMode === 'grid' ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                )}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <StickyNote className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No notes found</h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery || activeStatusTab !== 'all' || orderStatusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters or search keywords to find what you are looking for.'
              : 'Start keeping track of your administrative thoughts, tasks, and status reminders.'}
          </p>
          <button
            onClick={() => handleOpenCreate('pending')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Note
          </button>
        </div>
      ) : viewMode === 'board' ? (
        /* Status Board / Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {NOTE_STATUSES.map(statusCol => {
            const columnNotes = filteredNotes.filter(n => n.status === statusCol.id);
            return (
              <div 
                key={statusCol.id}
                className="bg-gray-100/70 border border-gray-200/80 rounded-2xl p-3 flex flex-col min-h-[400px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200/70 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={clsx("p-1.5 rounded-lg border", statusCol.color)}>
                      <statusCol.icon className={clsx("w-3.5 h-3.5", statusCol.id === 'in_progress' && "animate-spin")} />
                    </span>
                    <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                      {statusCol.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-white text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200">
                      {columnNotes.length}
                    </span>
                    <button
                      onClick={() => handleOpenCreate(statusCol.id)}
                      className="p-1 hover:bg-white rounded text-gray-500 hover:text-indigo-600 transition-colors"
                      title={`Add note to ${statusCol.label}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Column Notes */}
                <div className="space-y-3 flex-1">
                  {columnNotes.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-300 rounded-xl text-gray-400 text-xs">
                      No {statusCol.label.toLowerCase()} notes
                    </div>
                  ) : (
                    columnNotes.map(note => renderNoteCard(note))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => renderNoteCard(note))}
        </div>
      )}

      {/* Add / Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  {editingNote ? 'Edit Admin Note' : 'Create New Admin Note'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Note Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Check supplier container capacity for Batch 2"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
              </div>

              {/* Status and Order Lifecycle Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Note Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Note Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {NOTE_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Operational Order Lifecycle Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Order / Lifecycle Stage
                  </label>
                  <select
                    value={formData.orderStatus}
                    onChange={(e) => setFormData({ ...formData, orderStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {ORDER_STATUS_MAP.map(o => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority and Color Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Accent Color Theme */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_THEMES.map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: theme.id })}
                        className={clsx(
                          "w-6 h-6 rounded-full transition-transform",
                          theme.dot,
                          formData.color === theme.id ? "ring-2 ring-offset-2 ring-gray-900 scale-110" : "opacity-75 hover:opacity-100"
                        )}
                        title={theme.id}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Note Content */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Note Details / Description
                </label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write note notes, instructions, container numbers, supplier remarks..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Tags and Pinned */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="urgent, supplier, midea, container"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="pinNote"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="pinNote" className="text-xs font-semibold text-gray-700 cursor-pointer flex items-center gap-1">
                    <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Pin this note to the top of lists
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleDeleteNote}
        title="Delete Admin Note"
        message={`Are you sure you want to delete note "${noteToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Note"
        type="danger"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
};

export default Notes;

