import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  MapPin,
  FileText,
  User,
  Droplet,
  Cone,
  Zap,
  Trash2,
  Shield,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { ComplaintCategory, ComplaintPriority } from '../types.ts';

interface SubmitComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trackingId: string) => void;
  onOpenTracker: (trackingId: string) => void;
}

const CATEGORIES: { label: ComplaintCategory; icon: React.ElementType; desc: string }[] = [
  { label: 'Water Supply', icon: Droplet, desc: 'Pipeline leaks, contaminated water, supply disruption' },
  { label: 'Roads', icon: Cone, desc: 'Potholes, broken asphalt, missing street signs, bridge damage' },
  { label: 'Electricity', icon: Zap, desc: 'Power cuts, hanging live wires, transformer faults, streetlights' },
  { label: 'Sanitation', icon: Trash2, desc: 'Overflowing bins, uncollected waste, open drains, stench' },
  { label: 'Public Safety', icon: Shield, desc: 'Damaged guard rails, dark alleyways, structural hazards' },
  { label: 'Other', icon: HelpCircle, desc: 'General municipal infrastructure or administrative issues' },
];

export const SubmitComplaintModal: React.FC<SubmitComplaintModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenTracker,
}) => {
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Water Supply');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTrackingId, setSubmittedTrackingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      if (user.address) setAddress(user.address);
      if (user.city) setCity(user.city);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (submittedTrackingId) {
      navigator.clipboard.writeText(submittedTrackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedTrackingId(null);
    setStep(1);
    setError(null);
    if (!user) {
      setFullName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCity('');
    }
    setTitle('');
    setDescription('');
    setLandmark('');
    setPincode('');
    onClose();
  };

  const validateStep1 = () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please provide your full legal name.');
      return false;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please provide a valid email address for notifications.');
      return false;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError('Please provide a valid contact telephone number.');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!title.trim() || title.trim().length < 5) {
      setError('Complaint title must be at least 5 characters long.');
      return false;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Please describe the grievance in detail (at least 10 characters).');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !city.trim()) {
      setError('Please provide the street address and city/municipality.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.submitComplaint({
        fullName,
        email,
        phone,
        category,
        title,
        description,
        location: {
          address,
          city,
          landmark,
          pincode,
        },
        priority,
      });

      if (response.success && response.trackingId) {
        setSubmittedTrackingId(response.trackingId);
        onSuccess(response.trackingId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lodge Public Grievance</h3>
              <p className="text-xs text-slate-400">
                Official Municipal Grievance Registration & Redressal Form
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen after submission */}
        {submittedTrackingId ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-slate-900">
                Grievance Registered Successfully!
              </h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your complaint has been logged into the municipal database and automatically assigned to the designated administrative department.
              </p>
            </div>

            {/* Tracking ID Badge */}
            <div className="bg-slate-50 border-2 border-teal-500/30 rounded-xl p-5 max-w-md mx-auto space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Official Tracking Reference ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-bold text-teal-700 tracking-wider">
                  {submittedTrackingId}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center gap-1 text-xs font-medium"
                  title="Copy Tracking ID"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                A confirmation record has been prepared. Please save this tracking ID to follow live redressal progress.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  const id = submittedTrackingId;
                  handleResetAndClose();
                  onOpenTracker(id);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Track Grievance Live</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Step Indicator */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  1
                </span>
                <span className={step === 1 ? 'text-teal-900 font-semibold' : ''}>
                  Citizen Details
                </span>
              </div>
              <div className="w-8 h-px bg-slate-300" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  2
                </span>
                <span className={step === 2 ? 'text-teal-900 font-semibold' : ''}>
                  Complaint Info
                </span>
              </div>
              <div className="w-8 h-px bg-slate-300" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  3
                </span>
                <span className={step === 3 ? 'text-teal-900 font-semibold' : ''}>
                  Location & Submit
                </span>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-6">
              {/* STEP 1: Citizen Contact */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold pb-1 border-b border-slate-100">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>Citizen Contact Information</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. jane@example.com"
                        className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Used for grievance status updates
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 019-2831"
                        className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        For officer field verification
                      </p>
                    </div>
                  </div>

                  {user && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 flex items-center justify-between">
                      <span>Authenticated Citizen: <strong>{user.name}</strong> ({user.email})</span>
                      <span className="text-teal-600 font-semibold text-[10px] uppercase">Verified Account</span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Category & Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold pb-1 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Grievance Classification & Specifics</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Select Public Service Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = category === cat.label;
                        return (
                          <button
                            type="button"
                            key={cat.label}
                            onClick={() => setCategory(cat.label)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-teal-900'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon
                                className={`w-4 h-4 ${
                                  isSelected ? 'text-teal-600' : 'text-slate-500'
                                }`}
                              />
                              <span className="text-xs font-semibold">{cat.label}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight truncate">
                              {cat.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Grievance Title / Subject <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Broken water line leaking at 4th Street intersection"
                        className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Priority Level
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900 bg-white"
                      >
                        <option value="Low">Low - Minor Issue</option>
                        <option value="Medium">Medium - Standard (Default)</option>
                        <option value="High">High - Urgent Disruptions</option>
                        <option value="Emergency">Emergency - Hazard to Life/Safety</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Comprehensive Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explain what happened, since when the problem has existed, affected households, and any safety hazards..."
                      className="w-full text-sm p-3.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900"
                    />
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                      <span>Minimum 10 characters required</span>
                      <span>{description.length} characters</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Location Details */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold pb-1 border-b border-slate-100">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>Incident Location & Municipal Zone</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Street Address / Road Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 742 Evergreen Terrace, Ward 12"
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        City / Municipality <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Metro City"
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Nearest Landmark
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Near St. Mary Church"
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        PIN / Postal Code
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 98101"
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Summary Preview Box */}
                  <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>Submission Preview Summary</span>
                      <span className="text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Category: {category}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">
                      Title: <span className="text-slate-800">{title || '(Not entered)'}</span>
                    </p>
                    <p className="text-slate-500">
                      Reporting Citizen: {fullName} • {phone} • Priority: {priority}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      By submitting, you certify that this information is accurate to the best of your knowledge.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep((step - 1) as 1 | 2);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors"
                >
                  Next: Complaint Info →
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors"
                >
                  Next: Incident Location →
                </button>
              )}

              {step === 3 && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Grievance...</span>
                    </>
                  ) : (
                    <span>Submit Grievance</span>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
