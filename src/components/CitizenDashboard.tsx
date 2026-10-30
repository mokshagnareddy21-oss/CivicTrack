import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  User,
  Phone,
  Mail,
  Edit3,
  RefreshCw,
  FileText,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { IComplaint, ComplaintStatus } from '../types.ts';

interface CitizenDashboardProps {
  openSubmitModal: () => void;
  openTrackModal: (trackingId?: string) => void;
  openProfileModal: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  openSubmitModal,
  openTrackModal,
  openProfileModal,
}) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCitizenComplaints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getComplaints();
      if (res.success && res.complaints) {
        setComplaints(res.complaints);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load your submitted grievances.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizenComplaints();
  }, []);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics calculation
  const total = complaints.length;
  const submittedCount = complaints.filter((c) => c.status === 'Submitted').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const rejectedCount = complaints.filter((c) => c.status === 'Rejected').length;

  // Filtered complaints
  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = c.trackingId.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCat = c.category.toLowerCase().includes(q);
      const matchCity = c.location.city.toLowerCase().includes(q);
      return matchId || matchTitle || matchCat || matchCity;
    }
    return true;
  });

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'Submitted':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Submitted
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Citizen Profile Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-teal-950/60 border border-teal-500/30">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-sans">{user?.name}</h1>
              <span className="text-[11px] font-semibold uppercase bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded">
                Registered Citizen
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                {user?.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                {user?.phone}
              </span>
              {user?.city && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    {user.city}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openProfileModal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-400" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={openSubmitModal}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lodge Grievance</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Submitted
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900">{total}</span>
          <span className="text-[11px] text-slate-400 block">All recorded grievances</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs space-y-1 bg-amber-50/20">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
            Pending Review
          </span>
          <span className="text-2xl font-bold font-mono text-amber-700">{submittedCount}</span>
          <span className="text-[11px] text-amber-600/80 block">Awaiting assignment</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-xs space-y-1 bg-teal-50/20">
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider block">
            In Progress
          </span>
          <span className="text-2xl font-bold font-mono text-teal-700">{inProgressCount}</span>
          <span className="text-[11px] text-teal-600/80 block">Under field repair</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs space-y-1 bg-emerald-50/20">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
            Resolved
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700">{resolvedCount}</span>
          <span className="text-[11px] text-emerald-600/80 block">Successfully redressed</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-1 bg-rose-50/20 col-span-2 lg:col-span-1">
          <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider block">
            Rejected
          </span>
          <span className="text-2xl font-bold font-mono text-rose-700">{rejectedCount}</span>
          <span className="text-[11px] text-rose-600/80 block">Duplicate or invalid</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            Status:
          </span>
          {['All', 'Submitted', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, title, city..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
            />
          </div>

          <button
            onClick={fetchCitizenComplaints}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Complaints List Container */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-teal-600/30 border-t-teal-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Querying your complaints from MongoDB...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700 space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto text-rose-600" />
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={fetchCitizenComplaints}
              className="text-xs text-rose-800 underline font-medium"
            >
              Try Reloading
            </button>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No Grievances Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'All'
                  ? 'No complaints match your active filter criteria. Try clearing filters.'
                  : "You haven't submitted any complaints yet. Report an issue to your municipal authority."}
              </p>
            </div>
            <button
              onClick={openSubmitModal}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Lodge Your First Grievance
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint._id}
                onClick={() => openTrackModal(complaint.trackingId)}
                className="bg-white rounded-xl border border-slate-200 hover:border-teal-400/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                      {complaint.trackingId}
                    </span>
                    <button
                      onClick={(e) => handleCopy(complaint.trackingId, e)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700"
                      title="Copy Reference ID"
                    >
                      {copiedId === complaint.trackingId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {complaint.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        complaint.priority === 'Emergency'
                          ? 'bg-rose-100 text-rose-800'
                          : complaint.priority === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {complaint.priority}
                    </span>
                  </div>

                  <div>{getStatusBadge(complaint.status)}</div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {complaint.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {complaint.description}
                  </p>
                </div>

                {complaint.resolutionNote && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    <strong>Resolution Note:</strong> {complaint.resolutionNote}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {complaint.location.address}, {complaint.location.city}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{complaint.assignedDepartment}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs group-hover:translate-x-1 transition-transform">
                    <span>View Timeline & Remarks ({complaint.timeline.length})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
