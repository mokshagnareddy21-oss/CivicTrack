import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Send,
  Trash2,
  Edit2,
  Eye,
  FileCheck2,
  BarChart3,
  ListFilter,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Copy,
  ExternalLink,
  History,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  IComplaint,
  ComplaintStatus,
  ComplaintCategory,
  ComplaintPriority,
  AnalyticsData,
} from '../types.ts';

const MUNICIPAL_DEPARTMENTS = [
  'Water Supply & Sewerage Board',
  'Public Works Department (Roads & Bridges)',
  'Electricity & Energy Authority',
  'Solid Waste Management & Sanitation',
  'Police & Public Safety Department',
  'Municipal Public Grievance Cell',
];

interface AdminDashboardProps {
  openTrackModal: (trackingId: string) => void;
  onNavigateHome?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ openTrackModal, onNavigateHome }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grievances' | 'analytics'>('grievances');

  // Filter states
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected complaint for admin action drawer/modal
  const [selectedComplaint, setSelectedComplaint] = useState<IComplaint | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);

  // Action form state
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [statusNote, setStatusNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignedDept, setAssignedDept] = useState('');
  const [assignedPriority, setAssignedPriority] = useState<ComplaintPriority>('Medium');
  const [newRemarkText, setNewRemarkText] = useState('');

  // Individual submission loading indicators
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    setIsLoading(true);
    try {
      const [complaintsRes, analyticsRes] = await Promise.all([
        api.getComplaints({
          status: statusFilter,
          category: categoryFilter,
          department: departmentFilter,
          priority: priorityFilter,
          search: searchQuery,
          startDate,
          endDate,
        }),
        api.getAnalytics(),
      ]);

      if (complaintsRes.success && complaintsRes.complaints) {
        setComplaints(complaintsRes.complaints);
      }
      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user, statusFilter, categoryFilter, departmentFilter, priorityFilter, startDate, endDate]);

  // Deny access if user is not an administrator
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg border border-rose-200">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <AlertTriangle className="w-9 h-9" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 mb-3">
            Access Denied • HTTP 403
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Administrator Privileges Required
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto text-sm mb-6 leading-relaxed">
            The Officer Command Center and administrative grievance management features are strictly restricted to authorized municipal personnel.
            {user ? ` Your current account (${user.email}) is registered with Citizen privileges.` : ' Please sign in with municipal administrator credentials.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => (onNavigateHome ? onNavigateHome() : (window.location.href = '/'))}
              className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
            >
              Return to Citizen Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleOpenActionModal = async (complaint: IComplaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setStatusNote('');
    setResolutionNote(complaint.status === 'Resolved' ? (complaint.resolutionNote || '') : '');
    setRejectionReason(complaint.status === 'Rejected' ? (complaint.rejectionReason || '') : '');
    setAssignedDept(complaint.assignedDepartment || MUNICIPAL_DEPARTMENTS[0]);
    setAssignedPriority(complaint.priority || 'Medium');
    setNewRemarkText('');
    setActionSuccessMsg(null);
    setActionError(null);
    setIsActionModalOpen(true);

    // Fetch authoritative latest record from MongoDB Atlas including complete timeline & remarks
    try {
      setIsLoadingDetails(true);
      const res = await api.getComplaintById(complaint._id);
      if (res.success && res.complaint) {
        setSelectedComplaint(res.complaint);
        setNewStatus(res.complaint.status);
        setResolutionNote(res.complaint.status === 'Resolved' ? (res.complaint.resolutionNote || '') : '');
        setRejectionReason(res.complaint.status === 'Rejected' ? (res.complaint.rejectionReason || '') : '');
        setAssignedDept(res.complaint.assignedDepartment || MUNICIPAL_DEPARTMENTS[0]);
        setAssignedPriority(res.complaint.priority || 'Medium');
      }
    } catch (err: any) {
      console.warn('Could not reload latest complaint details:', err.message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Submit Status Change with strict validation for Resolved and Rejected
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (user?.role !== 'admin') {
      setActionError('Unauthorized. Only administrators can perform this action.');
      return;
    }

    if (newStatus === 'Resolved') {
      if (!resolutionNote || typeof resolutionNote !== 'string' || resolutionNote.trim().length === 0) {
        setActionError('A mandatory resolution note is required when marking a complaint as Resolved.');
        return;
      }
      if (resolutionNote.trim().length < 5) {
        setActionError('Resolution note must be at least 5 characters in length describing the work performed.');
        return;
      }
    }

    if (newStatus === 'Rejected') {
      if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
        setActionError('A mandatory rejection reason is required when rejecting a complaint.');
        return;
      }
      if (rejectionReason.trim().length < 5) {
        setActionError('Rejection reason must be at least 5 characters in length explaining why the grievance cannot be resolved.');
        return;
      }
    }

    setIsSubmittingStatus(true);
    setActionError(null);

    try {
      const payload: {
        status: ComplaintStatus;
        note?: string;
        resolutionNote?: string;
        rejectionReason?: string;
      } = {
        status: newStatus,
        note: statusNote.trim() || undefined,
      };

      if (newStatus === 'Resolved') {
        payload.resolutionNote = resolutionNote.trim();
      } else if (newStatus === 'Rejected') {
        payload.rejectionReason = rejectionReason.trim();
      }

      const res = await api.updateStatus(selectedComplaint._id, payload);

      if (res.success && res.complaint) {
        setSelectedComplaint(res.complaint);
        setActionSuccessMsg(`Complaint status successfully transitioned to "${newStatus}"!`);
        setStatusNote('');
        fetchAdminData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Submit Department Assignment
  const handleAssignDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (user?.role !== 'admin') {
      setActionError('Unauthorized. Only administrators can perform this action.');
      return;
    }

    if (!assignedDept || !assignedDept.trim()) {
      setActionError('A valid department name is required.');
      return;
    }

    setIsSubmittingAssign(true);
    setActionError(null);

    try {
      const res = await api.assignDepartment(selectedComplaint._id, {
        department: assignedDept.trim(),
        priority: assignedPriority,
        note: statusNote.trim() || undefined,
      });

      if (res.success && res.complaint) {
        setSelectedComplaint(res.complaint);
        setActionSuccessMsg(`Assigned to "${assignedDept.trim()}" (Priority: ${assignedPriority}) successfully!`);
        setStatusNote('');
        fetchAdminData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign department.');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Add Official Remark
  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !newRemarkText.trim()) return;

    if (user?.role !== 'admin') {
      setActionError('Unauthorized. Only administrators can perform this action.');
      return;
    }

    if (newRemarkText.trim().length < 2) {
      setActionError('Remark comment must be at least 2 characters long.');
      return;
    }

    setIsSubmittingRemark(true);
    setActionError(null);

    try {
      const res = await api.addRemark(selectedComplaint._id, newRemarkText.trim());
      if (res.success && res.complaint) {
        setSelectedComplaint(res.complaint);
        setNewRemarkText('');
        setActionSuccessMsg('Official administrator remark appended to grievance record.');
        fetchAdminData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to add remark.');
    } finally {
      setIsSubmittingRemark(false);
    }
  };

  // Delete Complaint
  const handleDeleteComplaint = async (id: string, trackingId: string) => {
    if (user?.role !== 'admin') {
      alert('Unauthorized. Only administrators can perform this action.');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to permanently delete complaint ${trackingId}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await api.deleteComplaint(id);
      if (res.success) {
        setIsActionModalOpen(false);
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete complaint.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (complaints.length === 0) return;

    const headers = [
      'Tracking ID',
      'Title',
      'Category',
      'Status',
      'Priority',
      'Citizen Name',
      'Citizen Email',
      'Citizen Phone',
      'Address',
      'City',
      'Assigned Department',
      'Created At',
      'Resolved At',
      'Resolution Note',
    ];

    const rows = complaints.map((c) => [
      c.trackingId,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.status,
      c.priority,
      `"${c.citizenName.replace(/"/g, '""')}"`,
      c.citizenEmail,
      c.citizenPhone,
      `"${c.location.address.replace(/"/g, '""')}"`,
      c.location.city,
      `"${c.assignedDepartment.replace(/"/g, '""')}"`,
      new Date(c.createdAt).toISOString(),
      c.resolvedAt ? new Date(c.resolvedAt).toISOString() : '',
      `"${(c.resolutionNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CivicTrack_Complaints_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary counts
  const summary = analytics?.summary || {
    total: complaints.length,
    submitted: complaints.filter((c) => c.status === 'Submitted').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
    rejected: complaints.filter((c) => c.status === 'Rejected').length,
    resolutionRate:
      complaints.length > 0
        ? Math.round(
            (complaints.filter((c) => c.status === 'Resolved').length / complaints.length) * 100
          )
        : 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-amber-500">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-amber-950/60 border border-amber-500/30">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-sans">
                Administrator Grievance Command
              </h1>
              <span className="text-[11px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                Officer Console
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Logged in: <strong>{user?.name}</strong> ({user?.email}) • Municipal Redressal Authority
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'grievances' ? 'analytics' : 'grievances')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {activeTab === 'grievances' ? (
              <>
                <BarChart3 className="w-4 h-4 text-teal-400" />
                <span>View Analytics Charts</span>
              </>
            ) : (
              <>
                <ListFilter className="w-4 h-4 text-teal-400" />
                <span>View Complaints Table</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Logged
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900">{summary.total}</span>
          <span className="text-[10px] text-slate-400 block">Overall Registry</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs space-y-1 bg-amber-50/20">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
            Submitted / Pending
          </span>
          <span className="text-2xl font-bold font-mono text-amber-700">{summary.submitted}</span>
          <span className="text-[10px] text-amber-600/80 block">Requires Action</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-xs space-y-1 bg-teal-50/20">
          <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">
            In Progress
          </span>
          <span className="text-2xl font-bold font-mono text-teal-700">{summary.inProgress}</span>
          <span className="text-[10px] text-teal-600/80 block">Crews Dispatched</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1 bg-emerald-50/20">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            Resolved
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700">{summary.resolved}</span>
          <span className="text-[10px] text-emerald-600/80 block">Verified Closed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-1 bg-rose-50/20">
          <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
            Rejected
          </span>
          <span className="text-2xl font-bold font-mono text-rose-700">{summary.rejected}</span>
          <span className="text-[10px] text-rose-600/80 block">Invalid / Duplicate</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs space-y-1 bg-blue-50/20">
          <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block">
            Resolution Rate
          </span>
          <span className="text-2xl font-bold font-mono text-blue-700">
            {summary.resolutionRate}%
          </span>
          <span className="text-[10px] text-blue-600/80 block">Municipal SLA KPI</span>
        </div>
      </div>

      {/* VIEW 1: COMPLAINTS MANAGEMENT TABLE */}
      {activeTab === 'grievances' && (
        <div className="space-y-4">
          {/* Comprehensive Filter Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search query */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, citizen, title, address, city..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Search
                </button>
              </form>

              {/* Reset Filters */}
              {(statusFilter !== 'All' ||
                categoryFilter !== 'All' ||
                departmentFilter !== 'All' ||
                priorityFilter !== 'All' ||
                searchQuery ||
                startDate ||
                endDate) && (
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setCategoryFilter('All');
                    setDepartmentFilter('All');
                    setPriorityFilter('All');
                    setSearchQuery('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white text-slate-800"
                >
                  <option value="All">All Statuses</option>
                  <option value="Submitted">Submitted (Pending)</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white text-slate-800"
                >
                  <option value="All">All Categories</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Roads">Roads</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Public Safety">Public Safety</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white text-slate-800 truncate"
                >
                  <option value="All">All Departments</option>
                  {MUNICIPAL_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white text-slate-800"
                >
                  <option value="All">All Priorities</option>
                  <option value="Emergency">Emergency</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Date Range
                </label>
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-1/2 p-1 text-[11px] rounded border border-slate-300"
                    title="From Date"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-1/2 p-1 text-[11px] rounded border border-slate-300"
                    title="To Date"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-teal-600/30 border-t-teal-600 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Querying complaints repository...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="font-semibold text-sm">No complaints match your query</p>
                <p className="text-xs text-slate-400">
                  Try adjusting the filters or resetting search parameters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Tracking ID</th>
                      <th className="py-3 px-4">Citizen Details</th>
                      <th className="py-3 px-4">Grievance Subject</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Assigned Department</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {complaints.map((c) => (
                      <tr key={c._id} className="hover:bg-teal-50/40 transition-colors group">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(c)}
                            className="font-mono font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                            title="Click to view complete complaint details"
                          >
                            <span>{c.trackingId}</span>
                            <ExternalLink className="w-3 h-3 text-teal-600 opacity-60 group-hover:opacity-100" />
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{c.citizenName}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.citizenPhone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(c)}
                            className="font-semibold text-slate-900 hover:text-teal-700 transition-colors truncate block max-w-xs text-left cursor-pointer"
                            title={`View details: ${c.title}`}
                          >
                            {c.title}
                          </button>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5" title={c.location.address}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{c.location.address}, {c.location.city}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium text-xs">
                            {c.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                              c.priority === 'Emergency'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : c.priority === 'High'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[180px] truncate" title={c.assignedDepartment}>
                          <span className="font-medium text-slate-800 flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{c.assignedDepartment}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {c.status === 'Submitted' && (
                            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Submitted</span>
                            </span>
                          )}
                          {c.status === 'In Progress' && (
                            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 inline-flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 text-teal-600" />
                              <span>In Progress</span>
                            </span>
                          )}
                          {c.status === 'Resolved' && (
                            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Resolved</span>
                            </span>
                          )}
                          {c.status === 'Rejected' && (
                            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenActionModal(c)}
                              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 active:bg-teal-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs hover:shadow cursor-pointer"
                              title="View Details & Manage Complaint"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openTrackModal(c.trackingId)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Preview Citizen Public Tracker"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ANALYTICS & STATS CHARTS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Grievance Distribution by Category</h3>
                <span className="text-xs text-slate-400">Total: {summary.total}</span>
              </div>
              <div className="space-y-3">
                {analytics.categoryBreakdown.map((item) => {
                  const percentage =
                    summary.total > 0 ? Math.round((item.count / summary.total) * 100) : 0;
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item.category}</span>
                        <span>
                          {item.count} complaints ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-teal-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Departmental Caseload Workload</h3>
                <span className="text-xs text-slate-400">Assigned Routing</span>
              </div>
              <div className="space-y-3">
                {analytics.departmentBreakdown.map((item) => {
                  const percentage =
                    summary.total > 0 ? Math.round((item.count / summary.total) * 100) : 0;
                  return (
                    <div key={item.department} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate max-w-[260px]">{item.department}</span>
                        <span>
                          {item.count} cases ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-amber-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Priority Distribution & Resolution KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Emergency & High Severity
              </h4>
              <div className="text-3xl font-bold font-mono text-rose-600">
                {analytics.priorityBreakdown.find((p) => p.priority === 'Emergency')?.count || 0}
              </div>
              <p className="text-xs text-slate-500">
                Urgent hazards marked for accelerated 12-hour resolution.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Resolution Rate
              </h4>
              <div className="text-3xl font-bold font-mono text-emerald-600">
                {summary.resolutionRate}%
              </div>
              <p className="text-xs text-slate-500">
                Target performance benchmark is 80% or higher.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Database Engine Health
              </h4>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>MongoDB Mongoose Active</span>
              </div>
              <p className="text-xs text-slate-500">
                Zero data loss, index-optimized grievance queries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ACTION & COMPLAINT DETAILS MODAL */}
      {isActionModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  CT
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm sm:text-base font-bold text-teal-400 bg-slate-800 px-2.5 py-0.5 rounded border border-teal-500/30">
                      {selectedComplaint.trackingId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedComplaint.trackingId);
                        setCopiedTrackingId(true);
                        setTimeout(() => setCopiedTrackingId(false), 2000);
                      }}
                      className="text-xs text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copy Tracking ID"
                    >
                      {copiedTrackingId ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        selectedComplaint.status === 'Submitted'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : selectedComplaint.status === 'In Progress'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : selectedComplaint.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {selectedComplaint.status}
                    </span>
                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        selectedComplaint.priority === 'Emergency'
                          ? 'bg-rose-600 text-white'
                          : selectedComplaint.priority === 'High'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {selectedComplaint.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Registered on {new Date(selectedComplaint.createdAt).toLocaleString()} • Category: {selectedComplaint.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openTrackModal(selectedComplaint.trackingId)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Preview Citizen Public Tracker View"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                  <span>Public Tracker</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenActionModal(selectedComplaint)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Reload Latest Data from MongoDB Atlas"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDetails ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {actionError && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{actionError}</span>
                </div>
                <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {actionSuccessMsg && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{actionSuccessMsg}</span>
                </div>
                <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Scrollable Body: 2 Columns */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Complaint Overview, Citizen Profile, Location & Complete Status History */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Grievance Summary Card */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {selectedComplaint.title}
                      </h4>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-semibold rounded text-[11px] shrink-0">
                        {selectedComplaint.category}
                      </span>
                    </div>
                    <div className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                      {selectedComplaint.description}
                    </div>
                  </div>

                  {/* Citizen Information Card */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 text-slate-500 border-b border-slate-100 pb-2">
                      <User className="w-4 h-4 text-teal-600" />
                      <span>Citizen Details</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Citizen Name</span>
                        <p className="font-semibold text-slate-900">{selectedComplaint.citizenName}</p>
                        {selectedComplaint.citizenId ? (
                          <span className="inline-block text-[10px] text-teal-700 font-medium bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            Registered Citizen
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Direct Public Citizen
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Phone Number</span>
                        <p className="font-mono font-medium text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a href={`tel:${selectedComplaint.citizenPhone}`} className="hover:text-teal-700 underline">
                            {selectedComplaint.citizenPhone}
                          </a>
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                        <p className="font-medium text-slate-800 flex items-center gap-1 truncate" title={selectedComplaint.citizenEmail}>
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <a href={`mailto:${selectedComplaint.citizenEmail}`} className="hover:text-teal-700 underline truncate">
                            {selectedComplaint.citizenEmail}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Jurisdiction Card */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 text-slate-500 border-b border-slate-100 pb-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      <span>Location & Municipal Jurisdiction</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Street / Area Address</span>
                        <p className="font-medium text-slate-800">{selectedComplaint.location.address}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">City / Municipality</span>
                        <p className="font-medium text-slate-800">{selectedComplaint.location.city}</p>
                      </div>
                      {selectedComplaint.location.landmark && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Landmark</span>
                          <p className="font-medium text-slate-800">{selectedComplaint.location.landmark}</p>
                        </div>
                      )}
                      {selectedComplaint.location.pincode && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Postal Code (PIN)</span>
                          <p className="font-mono font-medium text-slate-800">{selectedComplaint.location.pincode}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resolution Notes Display (if status is Resolved) */}
                  {selectedComplaint.status === 'Resolved' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Official Resolution Summary</span>
                      </div>
                      {selectedComplaint.resolvedAt && (
                        <p className="text-[11px] text-emerald-700 font-mono">
                          Resolved on: {new Date(selectedComplaint.resolvedAt).toLocaleString()}
                        </p>
                      )}
                      <div className="bg-white p-3 rounded-lg border border-emerald-200 text-emerald-950 text-xs whitespace-pre-wrap">
                        <strong>Resolution Notes:</strong> {selectedComplaint.resolutionNote || 'Grievance marked as resolved by municipal authority.'}
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason Display (if status is Rejected) */}
                  {selectedComplaint.status === 'Rejected' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-2">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Rejection Reason & Ground Details</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-rose-200 text-rose-950 text-xs whitespace-pre-wrap">
                        <strong>Rejection Reason:</strong> {selectedComplaint.rejectionReason || 'Grievance closed following administrative review.'}
                      </div>
                    </div>
                  )}

                  {/* Complete Status History & Audit Trail (Requirement 3) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4 text-teal-600" />
                        <span>Complete Status History & Audit Trail</span>
                      </h5>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {selectedComplaint.timeline?.length || 0} event{selectedComplaint.timeline?.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {(!selectedComplaint.timeline || selectedComplaint.timeline.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No timeline entries recorded yet.</p>
                    ) : (
                      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {selectedComplaint.timeline.map((event, idx) => (
                          <div key={idx} className="relative group">
                            <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold text-slate-900 text-xs">
                                  {event.action}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(event.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span className="font-medium text-slate-700">{event.performedBy}</span>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                  {event.status}
                                </span>
                              </div>
                              {event.note && (
                                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                  {event.note}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Official Remarks Log */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-teal-600" />
                        <span>Official Remarks Log</span>
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        {selectedComplaint.remarks?.length || 0} remarks
                      </span>
                    </div>

                    {(!selectedComplaint.remarks || selectedComplaint.remarks.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No official remarks recorded yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedComplaint.remarks.map((r, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{r.author}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                                  r.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                                }`}>
                                  {r.role}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(r.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Administrator Action Controls (Requirement 4) */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Current Assigned Department Banner */}
                  <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md space-y-3 border-l-4 border-teal-500">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                      Department Assignment & SLA
                    </h5>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Department</span>
                      <p className="text-sm font-bold flex items-center gap-2 text-white">
                        <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                        <span>{selectedComplaint.assignedDepartment}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Current Status</span>
                        <span className="font-bold text-teal-300">{selectedComplaint.status}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Priority Level</span>
                        <span className="font-bold text-amber-300">{selectedComplaint.priority}</span>
                      </div>
                    </div>
                  </div>

                  {/* CONTROL 1: UPDATE COMPLAINT STATUS */}
                  <form onSubmit={handleUpdateStatus} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3.5">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>1. Update Complaint Status</span>
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Target Redressal Status <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => {
                          const val = e.target.value as ComplaintStatus;
                          setNewStatus(val);
                          if (val === 'Resolved' && selectedComplaint?.status !== 'Resolved') {
                            setResolutionNote('');
                          }
                          if (val === 'Rejected' && selectedComplaint?.status !== 'Rejected') {
                            setRejectionReason('');
                          }
                          setActionError(null);
                        }}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:border-teal-500"
                      >
                        <option value="Submitted">Submitted (Pending Action)</option>
                        <option value="In Progress">In Progress (Under Redressal)</option>
                        <option value="Resolved">Resolved (Work Completed)</option>
                        <option value="Rejected">Rejected (Declined / Out of Scope)</option>
                      </select>
                    </div>

                    {/* Transition Note for Submitted and In Progress states */}
                    {(newStatus === 'Submitted' || newStatus === 'In Progress') && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Transition Audit Note <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="e.g. Field inspection team dispatched to site"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}

                    {/* Requirement 6: Mandatory Resolution Note */}
                    {newStatus === 'Resolved' && (
                      <div className="space-y-1.5 bg-emerald-50/70 p-3.5 rounded-lg border-2 border-emerald-400">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-emerald-950">
                            Official Resolution Note <span className="text-rose-600">* (Mandatory, min 5 chars)</span>
                          </label>
                          <span
                            className={`text-[10px] font-mono font-semibold ${
                              resolutionNote.trim().length >= 5 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {resolutionNote.trim().length} / 5 chars min
                          </span>
                        </div>
                        <textarea
                          required
                          rows={3}
                          value={resolutionNote}
                          onChange={(e) => {
                            setResolutionNote(e.target.value);
                            if (actionError) setActionError(null);
                          }}
                          placeholder="Detail the ground repair action taken, replaced parts, or inspector sign-off (minimum 5 characters)..."
                          className="w-full text-xs p-2.5 rounded-md border border-emerald-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-normal"
                        />
                        <p className="text-[10px] text-emerald-800 font-medium">
                          This official resolution note will be published to the citizen and permanently recorded in the audit trail.
                        </p>
                      </div>
                    )}

                    {/* Requirement 7: Mandatory Rejection Reason */}
                    {newStatus === 'Rejected' && (
                      <div className="space-y-1.5 bg-rose-50/70 p-3.5 rounded-lg border-2 border-rose-400">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-rose-950">
                            Official Rejection Reason <span className="text-rose-600">* (Mandatory, min 5 chars)</span>
                          </label>
                          <span
                            className={`text-[10px] font-mono font-semibold ${
                              rejectionReason.trim().length >= 5 ? 'text-rose-700' : 'text-rose-600'
                            }`}
                          >
                            {rejectionReason.trim().length} / 5 chars min
                          </span>
                        </div>
                        <textarea
                          required
                          rows={3}
                          value={rejectionReason}
                          onChange={(e) => {
                            setRejectionReason(e.target.value);
                            if (actionError) setActionError(null);
                          }}
                          placeholder="Explain why this grievance is being closed (e.g. duplicate ticket, out of municipal jurisdiction) (minimum 5 characters)..."
                          className="w-full text-xs p-2.5 rounded-md border border-rose-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-normal"
                        />
                        <p className="text-[10px] text-rose-800 font-medium">
                          A clear official reason must be given to the citizen explaining why redressal cannot be completed.
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingStatus}
                      className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingStatus ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Status Change...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save Status Change</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* CONTROL 2: ASSIGN DEPARTMENT & PRIORITY */}
                  <form onSubmit={handleAssignDepartment} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3.5">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      <span>2. Assign Department & Priority</span>
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Responsible Department <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={assignedDept}
                        onChange={(e) => setAssignedDept(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:border-teal-500"
                      >
                        {MUNICIPAL_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Priority Level
                      </label>
                      <select
                        value={assignedPriority}
                        onChange={(e) => setAssignedPriority(e.target.value as ComplaintPriority)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:border-teal-500"
                      >
                        <option value="Low">Low - Standard Municipal Notice</option>
                        <option value="Medium">Medium - Regular Priority</option>
                        <option value="High">High - Prompt Action Required</option>
                        <option value="Emergency">Emergency - Critical Safety Hazard</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAssign}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingAssign ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Assigning Department...</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Save Department Assignment</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* CONTROL 3: APPEND OFFICIAL REMARK */}
                  <form onSubmit={handleAddRemark} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3.5">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Send className="w-4 h-4 text-teal-600" />
                      <span>3. Append Official Remark</span>
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Official Administrator Comment
                      </label>
                      <textarea
                        rows={2}
                        value={newRemarkText}
                        onChange={(e) => setNewRemarkText(e.target.value)}
                        placeholder="Enter official remark, site inspection notes, or citizen update..."
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingRemark || !newRemarkText.trim()}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingRemark ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Posting Remark...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Post Official Remark</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Danger Zone: Delete Complaint */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Doc ID: {selectedComplaint._id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteComplaint(selectedComplaint._id, selectedComplaint.trackingId)}
                      className="px-3 py-1.5 text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Record (Spam)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                CivicTrack Administrator Command • Real-time MongoDB Atlas sync
              </span>
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Close Details Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
