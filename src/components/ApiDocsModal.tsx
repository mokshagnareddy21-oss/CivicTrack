import React, { useState } from 'react';
import {
  X,
  FileCode2,
  Copy,
  Check,
  Server,
  Database,
  Shield,
  Layers,
  Send,
} from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'postman' | 'architecture'>('endpoints');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleRegisterCurl = `curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jane Citizen",
    "email": "citizen.user@example.com",
    "password": "<STRONG_USER_PASSWORD>",
    "phone": "+1 555-0192",
    "address": "45 Maple Street",
    "city": "Metro City"
  }'`;

  const sampleSubmitCurl = `curl -X POST http://localhost:3000/api/complaints \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \\
  -d '{
    "fullName": "Jane Citizen",
    "email": "citizen.user@example.com",
    "phone": "+1 555-0192",
    "category": "Water Supply",
    "priority": "High",
    "title": "Low water pressure following main line maintenance",
    "description": "Continuous pressure drop across residential lines for over 24 hours.",
    "location": {
      "address": "4th Ave & Oak St Intersection",
      "city": "Metro City",
      "landmark": "Near Central Library",
      "pincode": "98101"
    }
  }'`;

  const sampleStatusUpdateCurl = `curl -X PATCH http://localhost:3000/api/complaints/<COMPLAINT_OBJECT_ID>/status \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \\
  -d '{
    "status": "Resolved",
    "resolutionNote": "Field crew verified line pressure and replaced distribution valve. Service restored."
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                CivicTrack API & Postman Integration Guide
              </h3>
              <p className="text-xs text-slate-400">
                Backend RESTful Technical Documentation & Endpoints Reference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 px-6">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'endpoints'
                ? 'border-teal-600 text-teal-800 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            REST API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('postman')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'postman'
                ? 'border-teal-600 text-teal-800 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Postman Testing Instructions
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'architecture'
                ? 'border-teal-600 text-teal-800 font-bold bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Database & System Architecture
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* TAB 1: REST ENDPOINTS */}
          {activeTab === 'endpoints' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  CivicTrack RESTful Service Specification
                </h4>
                <p className="text-slate-500">
                  All requests and responses use JSON. Authenticated endpoints require a Bearer token in the <code>Authorization</code> header. Rate limiters protect authentication and public tracking endpoints.
                </p>
              </div>

              {/* Endpoint Group: Auth */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 pb-1 border-b border-slate-200">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span>Authentication & Profile Endpoints (Rate Limited)</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 font-mono">
                  <div className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">POST</strong>
                      <span>/api/auth/register</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Register new citizen (strictly assigns 'citizen' role)</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">POST</strong>
                      <span>/api/auth/login</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Authenticate user or administrator, returns signed JWT</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">GET</strong>
                      <span>/api/auth/me</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Fetch active session user profile [Bearer token required]</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">PUT</strong>
                      <span>/api/auth/profile</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Update personal contact info (name, phone, address, city)</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">PUT</strong>
                      <span>/api/auth/change-password</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Change account password with verification of old password</span>
                  </div>
                </div>
              </div>

              {/* Endpoint Group: Complaints */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 pb-1 border-b border-slate-200">
                  <Send className="w-4 h-4 text-teal-600" />
                  <span>Complaints & Grievances Management</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 font-mono">
                  <div className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">POST</strong>
                      <span>/api/complaints</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Submit grievance (links citizenId if authenticated; generates CT-YYYY-XXXXX)</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">GET</strong>
                      <span>/api/complaints/track/:trackingId</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Public tracking: status & timeline (citizen PII stripped) [Rate Limited]</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">GET</strong>
                      <span>/api/complaints</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">List grievances (Citizens retrieve ONLY own; Admins retrieve all with filters)</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">PATCH</strong>
                      <span>/api/complaints/:id/status</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">[Admin Only] Update status with mandatory resolution/rejection note</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">PATCH</strong>
                      <span>/api/complaints/:id/assign</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">[Admin Only] Assign department & set priority level</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">POST</strong>
                      <span>/api/complaints/:id/remarks</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Add remark (Admin or Complaint Owner only)</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px]">DELETE</strong>
                      <span>/api/complaints/:id</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">[Admin Only] Delete spam/duplicate record</span>
                  </div>
                </div>
              </div>

              {/* Endpoint Group: Analytics & Health */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 pb-1 border-b border-slate-200">
                  <Server className="w-4 h-4 text-teal-600" />
                  <span>Analytics & System Health</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 font-mono">
                  <div className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">GET</strong>
                      <span>/api/analytics/overview</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">[Admin Only] Executive summary counts and breakdown</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">GET</strong>
                      <span>/api/analytics/public-stats</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Public high-level metrics for portal landing page</span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="flex items-center gap-2">
                      <strong className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">GET</strong>
                      <span>/api/health</span>
                    </span>
                    <span className="text-slate-500 font-sans text-[11px]">Real-time MongoDB Atlas connection status and host</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POSTMAN TESTING INSTRUCTIONS */}
          {activeTab === 'postman' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 space-y-1">
                <h5 className="font-bold">Postman Testing Setup</h5>
                <p className="text-xs">
                  Set Base URL to <code>http://localhost:3000</code> or your deployment host. For protected endpoints, copy the <code>token</code> from login and pass as <code>Authorization: Bearer &lt;token&gt;</code>.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-800">Account Configuration Note</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  The municipal administrator account is seeded using credentials defined securely in your <code>DEFAULT_ADMIN_EMAIL</code> and <code>DEFAULT_ADMIN_PASSWORD</code> environment variables. Never commit plaintext production credentials.
                </p>
              </div>

              {/* cURL Snippet 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>1. Register New Citizen</span>
                  <button
                    onClick={() => handleCopy(sampleRegisterCurl, 'curl1')}
                    className="text-teal-600 hover:text-teal-800 flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copiedKey === 'curl1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'curl1' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  {sampleRegisterCurl}
                </pre>
              </div>

              {/* cURL Snippet 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>2. Submit Grievance (Authenticated or Public)</span>
                  <button
                    onClick={() => handleCopy(sampleSubmitCurl, 'curl2')}
                    className="text-teal-600 hover:text-teal-800 flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copiedKey === 'curl2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'curl2' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  {sampleSubmitCurl}
                </pre>
              </div>

              {/* cURL Snippet 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>3. Admin Update Status to 'Resolved'</span>
                  <button
                    onClick={() => handleCopy(sampleStatusUpdateCurl, 'curl3')}
                    className="text-teal-600 hover:text-teal-800 flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copiedKey === 'curl3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'curl3' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  {sampleStatusUpdateCurl}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Architecture Overview</span>
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  CivicTrack is structured as a 3-tier full-stack application with strict role-based access control, input validation, and database normalization:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <strong className="block text-slate-900 mb-1">Presentation Layer</strong>
                    <p className="text-slate-500 text-[11px]">
                      React 19 with Vite, Tailwind CSS v4, Lucide icons, responsive gov-tech design system.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <strong className="block text-slate-900 mb-1">API & Service Layer</strong>
                    <p className="text-slate-500 text-[11px]">
                      Node.js & Express.js REST APIs with JWT authentication, bcryptjs password hashing, rate limiting, and role checks.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <strong className="block text-slate-900 mb-1">Persistence Layer</strong>
                    <p className="text-slate-500 text-[11px]">
                      MongoDB Atlas with Mongoose ODM schemas, indexes on trackingId, status, category, citizenId.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-teal-600" />
                  <span>MongoDB Atlas Connection Configuration</span>
                </h5>
                <p className="text-slate-600">
                  CivicTrack connects strictly to your MongoDB Atlas cluster via the <code>MONGODB_URI</code> environment variable:
                </p>
                <pre className="p-3 rounded-lg bg-slate-900 text-teal-300 font-mono text-[11px]">
                  MONGODB_URI="mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/civictrack?retryWrites=true&w=majority"
                </pre>
                <p className="text-slate-500 text-[11px]">
                  Ensure your Atlas cluster allows network connectivity from your deployment IP (under Atlas Security &rarr; Network Access &rarr; Allow Access from Anywhere or current IP).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
