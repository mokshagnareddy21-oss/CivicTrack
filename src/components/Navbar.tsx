import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  PlusCircle,
  LayoutDashboard,
  User,
  LogOut,
  FileCode2,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  currentView: 'landing' | 'citizen' | 'admin';
  setCurrentView: (view: 'landing' | 'citizen' | 'admin') => void;
  openSubmitModal: () => void;
  openTrackModal: (trackingId?: string) => void;
  openAuthModal: (initialTab?: 'login' | 'register' | 'admin') => void;
  openApiDocsModal: () => void;
  openProfileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openSubmitModal,
  openTrackModal,
  openAuthModal,
  openApiDocsModal,
  openProfileModal,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickTrackInput, setQuickTrackInput] = useState('');

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackInput.trim()) {
      openTrackModal(quickTrackInput.trim().toUpperCase());
      setQuickTrackInput('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Gov Banner */}
      <div className="bg-slate-950 text-slate-300 text-xs px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-medium text-slate-200">
              Department of Public Grievance Redressal & Civic Affairs
            </span>
            <span className="hidden sm:inline-block text-slate-500">•</span>
            <span className="hidden sm:inline-block text-slate-400">
              Official Municipal Grievance Tracking Portal
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={openApiDocsModal}
              className="hover:text-teal-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5 text-teal-400" />
              <span>API & Postman Guide</span>
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-teal-400 font-mono font-medium">SLA: 48h Redressal Target</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-900/40 group-hover:bg-teal-500 transition-colors">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Civic<span className="text-teal-400">Track</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-teal-950/80 text-teal-300 border border-teal-800/60 px-1.5 py-0.5 rounded">
                Official
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Every complaint deserves a resolution.</p>
          </div>
        </div>

        {/* Quick Track Search Input (Desktop) */}
        <form
          onSubmit={handleQuickTrackSubmit}
          className="hidden md:flex items-center relative max-w-xs w-full"
        >
          <input
            type="text"
            value={quickTrackInput}
            onChange={(e) => setQuickTrackInput(e.target.value)}
            placeholder="Track Reference e.g. CT-2026-..."
            className="w-full bg-slate-800/90 text-sm text-slate-100 placeholder-slate-400 pl-3.5 pr-20 py-1.5 rounded-md border border-slate-700 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 font-mono"
          />
          <button
            type="submit"
            className="absolute right-1 px-2.5 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded transition-colors flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            Track
          </button>
        </form>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => setCurrentView('landing')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentView === 'landing'
                ? 'text-teal-300 bg-slate-800'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Home & Directory
          </button>

          <button
            onClick={() => openTrackModal()}
            className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Search className="w-4 h-4 text-teal-400" />
            Track Status
          </button>

          <button
            onClick={openSubmitModal}
            className="px-3.5 py-1.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-md shadow-sm transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Lodge Grievance
          </button>

          {/* User state buttons */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              {isAdmin ? (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                    currentView === 'admin'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Console
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('citizen')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                    currentView === 'citizen'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-750'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Grievances
                </button>
              )}

              <div className="relative group">
                <button
                  onClick={openProfileModal}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 transition-colors"
                  title="Citizen Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-teal-300 font-bold text-xs border border-slate-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                </button>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3 py-1.5 text-sm font-medium text-teal-300 border border-teal-500/40 hover:bg-teal-950/40 rounded-md transition-colors"
              >
                Citizen Register
              </button>
              <button
                onClick={() => openAuthModal('admin')}
                className="px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/50 hover:bg-amber-900/50 border border-amber-600/40 rounded-md transition-colors flex items-center gap-1"
                title="Officer / Admin Access"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={openSubmitModal}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Lodge
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <form onSubmit={handleQuickTrackSubmit} className="pt-2 pb-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={quickTrackInput}
                onChange={(e) => setQuickTrackInput(e.target.value)}
                placeholder="Track ID e.g. CT-2026-..."
                className="flex-1 bg-slate-800 text-sm text-slate-100 placeholder-slate-400 px-3 py-1.5 rounded border border-slate-700 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 rounded"
              >
                Track
              </button>
            </div>
          </form>

          <button
            onClick={() => {
              setCurrentView('landing');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded"
          >
            Home & Directory
          </button>

          <button
            onClick={() => {
              openTrackModal();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-teal-400" />
            Track Grievance Status
          </button>

          {user ? (
            <>
              {isAdmin ? (
                <button
                  onClick={() => {
                    setCurrentView('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded"
                >
                  Admin Console
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCurrentView('citizen');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium bg-teal-600 text-white rounded"
                >
                  My Grievances
                </button>
              )}

              <button
                onClick={() => {
                  openProfileModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded flex items-center gap-2"
              >
                <User className="w-4 h-4 text-teal-400" />
                Profile: {user.name}
              </button>

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-rose-400 hover:bg-slate-800 rounded flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  openAuthModal('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-sm text-center font-medium bg-slate-800 text-white rounded"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  openAuthModal('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-sm text-center font-medium bg-teal-600 text-white rounded"
              >
                Register
              </button>
            </div>
          )}

          <button
            onClick={() => {
              openApiDocsModal();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-teal-300 flex items-center gap-1.5"
          >
            <FileCode2 className="w-3.5 h-3.5 text-teal-400" />
            API Docs & Postman Instructions
          </button>
        </div>
      )}
    </header>
  );
};
