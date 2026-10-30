import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Copy,
  Check,
  Send,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { IComplaint } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface TrackComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingId?: string;
}

export const TrackComplaintModal: React.FC<TrackComplaintModalProps> = ({
  isOpen,
  onClose,
  initialTrackingId,
}) => {
  const { user } = useAuth();
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [complaint, setComplaint] = useState<IComplaint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Follow-up remark state
  const [newRemark, setNewRemark] = useState('');
  const [isAddingRemark, setIsAddingRemark] = useState(false);
  const [remarkSuccess, setRemarkSuccess] = useState(false);

  useEffect(() => {
    if (initialTrackingId && isOpen) {
      setTrackingIdInput(initialTrackingId);
      performSearch(initialTrackingId);
    }
  }, [initialTrackingId, isOpen]);

  if (!isOpen) return null;

  const performSearch = async (idToSearch: string) => {
    if (!idToSearch.trim()) return;
    setIsLoading(true);
    setError(null);
    setRemarkSuccess(false);

    try {
      const response = await api.trackComplaint(idToSearch.trim());
      if (response.success && response.complaint) {
        setComplaint(response.complaint);
      } else {
        setError('No record found matching this tracking ID.');
      }
    } catch (err: any) {
      setError(
        err.message || 'Unable to locate complaint with this ID. Please verify and try again.'
      );
      setComplaint(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(trackingIdInput);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !newRemark.trim()) return;

    setIsAddingRemark(true);
    try {
      const res = await api.addRemark(complaint._id, newRemark.trim());
      if (res.success && res.complaint) {
        setComplaint(res.complaint);
        setNewRemark('');
        setRemarkSuccess(true);
        setTimeout(() => setRemarkSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add remark. Please ensure you are logged in.');
    } finally {
      setIsAddingRemark(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Submitted / Pending
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            In Progress / Under Review
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Grievance Redressed & Resolved
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Rejected / Closed
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Track Grievance Redressal Status</h3>
              <p className="text-xs text-slate-400">
                Live Public Service Progress & Administrative Audit Trail
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setComplaint(null);
              setError(null);
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input bar */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                placeholder="Enter Tracking ID (e.g. CT-2026-WTR892)"
                className="w-full pl-4 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono text-slate-900 uppercase"
              />
              {trackingIdInput && (
                <button
                  type="button"
                  onClick={() => setTrackingIdInput('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !trackingIdInput.trim()}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Query</span>
            </button>
          </form>

          {/* Quick sample pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Sample Live IDs:</span>
            {['CT-2026-WTR892', 'CT-2026-ROD411', 'CT-2026-SAN104'].map((sampleId) => (
              <button
                key={sampleId}
                type="button"
                onClick={() => {
                  setTrackingIdInput(sampleId);
                  performSearch(sampleId);
                }}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 font-mono text-teal-700 hover:border-teal-300 transition-colors cursor-pointer"
              >
                {sampleId}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Lookup Notice</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!complaint && !error && !isLoading && (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Search className="w-12 h-12 mx-auto text-slate-300" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-600">
                  Ready to track municipal grievance
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Type your reference tracking ID above to see live assignment, inspection timeline, and administrative resolution notes.
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <div className="w-8 h-8 border-3 border-teal-600/20 border-t-teal-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs">Querying Municipal Registry...</p>
            </div>
          )}

          {complaint && (
            <div className="space-y-6">
              {/* Grievance Overview Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Reference ID:
                    </span>
                    <span className="text-lg font-mono font-bold text-teal-800">
                      {complaint.trackingId}
                    </span>
                    <button
                      onClick={() => handleCopyId(complaint.trackingId)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy Tracking ID"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div>{getStatusBadge(complaint.status)}</div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-900">{complaint.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    {complaint.description}
                  </p>
                </div>

                {/* Key Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Category</span>
                    <span className="font-semibold text-slate-800">{complaint.category}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Priority</span>
                    <span
                      className={`font-semibold ${
                        complaint.priority === 'Emergency'
                          ? 'text-rose-600'
                          : complaint.priority === 'High'
                          ? 'text-amber-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {complaint.priority}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Assigned Dept</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="truncate">{complaint.assignedDepartment}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Registered On</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    <strong>Location:</strong> {complaint.location.address}, {complaint.location.city}
                    {complaint.location.landmark && ` (Landmark: ${complaint.location.landmark})`}
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Redressal Lifecycle Status
                </h5>
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-6 right-6 top-3 h-0.5 bg-slate-200 -z-0" />

                  {/* Step 1: Submitted */}
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        ['Submitted', 'In Progress', 'Resolved'].includes(complaint.status)
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      1
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 mt-1.5">Submitted</span>
                    <span className="text-[10px] text-slate-400">Grievance Logged</span>
                  </div>

                  {/* Step 2: In Progress */}
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        ['In Progress', 'Resolved'].includes(complaint.status)
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      2
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 mt-1.5">In Progress</span>
                    <span className="text-[10px] text-slate-400">Department Assigned</span>
                  </div>

                  {/* Step 3: Resolved / Closed */}
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        complaint.status === 'Resolved'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : complaint.status === 'Rejected'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      3
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-1.5 ${
                        complaint.status === 'Resolved'
                          ? 'text-emerald-700'
                          : complaint.status === 'Rejected'
                          ? 'text-rose-700'
                          : 'text-slate-800'
                      }`}
                    >
                      {complaint.status === 'Rejected' ? 'Rejected' : 'Resolved'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {complaint.status === 'Resolved'
                        ? 'Redressal Verified'
                        : complaint.status === 'Rejected'
                        ? 'Case Concluded'
                        : 'Awaiting Closure'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolution Note if resolved */}
              {complaint.resolutionNote && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>Official Resolution Note</span>
                  </div>
                  <p className="leading-relaxed">{complaint.resolutionNote}</p>
                  {complaint.resolvedAt && (
                    <p className="text-[11px] text-emerald-700">
                      Resolved on: {new Date(complaint.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Rejection reason if rejected */}
              {complaint.rejectionReason && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Rejection Reason</span>
                  </div>
                  <p className="leading-relaxed">{complaint.rejectionReason}</p>
                </div>
              )}

              {/* Official Audit Timeline */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Administrative Action Timeline ({complaint.timeline.length} Events)</span>
                </h5>

                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
                  {complaint.timeline.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs relative">
                      {idx !== complaint.timeline.length - 1 && (
                        <div className="absolute left-2.5 top-5 bottom-0 w-px bg-slate-200" />
                      )}
                      <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border border-teal-300">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{item.action}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">By: {item.performedBy}</p>
                        {item.note && (
                          <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks Audit Section */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>Official Remarks & Communications</span>
                </h5>

                {complaint.remarks && complaint.remarks.length > 0 ? (
                  <div className="space-y-2">
                    {complaint.remarks.map((remark, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          remark.role === 'admin'
                            ? 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold flex items-center gap-1">
                            {remark.author}
                            <span
                              className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold ${
                                remark.role === 'admin'
                                  ? 'bg-amber-200 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {remark.role}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(remark.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{remark.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No remarks recorded yet.</p>
                )}

                {/* Add Follow-up Remark if user logged in */}
                {user ? (
                  <form onSubmit={handleAddRemark} className="pt-2">
                    {remarkSuccess && (
                      <p className="text-xs text-emerald-600 font-medium mb-1">
                        Remark added successfully!
                      </p>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newRemark}
                        onChange={(e) => setNewRemark(e.target.value)}
                        placeholder={`Add ${user.role === 'admin' ? 'official admin' : 'citizen follow-up'} remark...`}
                        className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="submit"
                        disabled={isAddingRemark || !newRemark.trim()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Log in as a citizen or administrator to add authenticated remarks to this grievance thread.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => {
              setComplaint(null);
              setError(null);
              onClose();
            }}
            className="px-5 py-2 text-sm font-medium bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
