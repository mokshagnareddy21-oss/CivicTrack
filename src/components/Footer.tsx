import React from 'react';
import { ShieldCheck, PhoneCall, Building, ExternalLink, Database, Server } from 'lucide-react';

interface FooterProps {
  openApiDocsModal: () => void;
  openSubmitModal: () => void;
  openTrackModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  openApiDocsModal,
  openSubmitModal,
  openTrackModal,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      {/* Emergency Helpline Strip */}
      <div className="bg-slate-900 border-b border-slate-800 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold uppercase tracking-wider">
            <PhoneCall className="w-4 h-4 text-teal-400" />
            <span>24/7 Citizen Emergency Toll-Free Helplines:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-300 font-mono">
            <span className="flex items-center gap-1">
              <span className="text-slate-500">Central Police/Safety:</span>
              <strong className="text-teal-300">112</strong>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-500">Water Leakage:</span>
              <strong className="text-teal-300">1916</strong>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-500">Power Outage:</span>
              <strong className="text-teal-300">1912</strong>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-500">Sanitation & Garbage:</span>
              <strong className="text-teal-300">1969</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mandate */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Civic<span className="text-teal-400">Track</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every complaint deserves a resolution. CivicTrack is an open, auditable public service grievance tracking engine bridging citizens and municipal administration with end-to-end transparency.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Building className="w-3.5 h-3.5 text-teal-400" />
              <span>Municipal Administrative Oversight Division</span>
            </div>
          </div>

          {/* Citizen Services */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Citizen Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={openSubmitModal}
                  className="hover:text-teal-300 transition-colors cursor-pointer"
                >
                  Submit Public Grievance
                </button>
              </li>
              <li>
                <button
                  onClick={openTrackModal}
                  className="hover:text-teal-300 transition-colors cursor-pointer"
                >
                  Track Complaint by Reference ID
                </button>
              </li>
              <li>
                <span className="text-slate-500">Citizen Service Level Agreements (SLAs)</span>
              </li>
              <li>
                <span className="text-slate-500">Department Escalation Matrix</span>
              </li>
              <li>
                <span className="text-slate-500">Right to Public Services Charter</span>
              </li>
            </ul>
          </div>

          {/* Grievance Categories */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Covered Departments
            </h4>
            <ul className="space-y-2 text-xs">
              <li>Water Supply & Sewerage Board</li>
              <li>Public Works Department (Roads)</li>
              <li>Electricity & Power Authority</li>
              <li>Solid Waste & Sanitation Cell</li>
              <li>Police & Community Public Safety</li>
              <li>General Civic Infrastructure</li>
            </ul>
          </div>

          {/* Developer & Architecture */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Architecture & API
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={openApiDocsModal}
                  className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>Interactive API Documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Database className="w-3.5 h-3.5 text-teal-400" />
                <span>MongoDB Atlas & Mongoose ODM</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Server className="w-3.5 h-3.5 text-teal-400" />
                <span>Node.js & Express RESTful Engine</span>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                JWT Authentication • Bcrypt Hashing • Full Audit Trail
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} CivicTrack Municipal Governance Systems. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-teal-400/90 font-mono">Status: Connected to Database</span>
            <span>•</span>
            <span className="text-slate-400">Public Service Portal v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
