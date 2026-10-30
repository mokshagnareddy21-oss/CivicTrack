import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { CitizenDashboard } from './components/CitizenDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { SubmitComplaintModal } from './components/SubmitComplaintModal.tsx';
import { TrackComplaintModal } from './components/TrackComplaintModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { EditProfileModal } from './components/EditProfileModal.tsx';
import { ApiDocsModal } from './components/ApiDocsModal.tsx';
import { ComplaintCategory } from './types.ts';
import { api } from './services/api.ts';
import { Database, AlertTriangle, CheckCircle2, RefreshCw, HelpCircle, Copy, Check, ExternalLink } from 'lucide-react';

function DatabaseStatusBanner() {
  const [dbState, setDbState] = useState<{
    isConnected: boolean;
    status: string;
    engine: string;
    lastError?: string | null;
  } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      if (data && data.database) {
        setDbState({
          isConnected: data.database.isConnected,
          status: data.database.status,
          engine: data.database.engine || 'MongoDB Atlas',
          lastError: data.database.lastError,
        });
      }
    } catch {
      setDbState({
        isConnected: false,
        status: 'disconnected',
        engine: 'MongoDB Atlas',
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    setRetryResult(null);
    try {
      const res = await api.retryDbConnection();
      if (res && res.database) {
        setDbState({
          isConnected: res.database.isConnected,
          status: res.database.status,
          engine: res.database.engine || 'MongoDB Atlas',
          lastError: res.database.lastError,
        });
        if (res.database.isConnected) {
          setRetryResult('Successfully connected to MongoDB Atlas!');
        } else {
          setRetryResult('Handshake sent — Atlas is still awaiting IP whitelist (0.0.0.0/0).');
        }
      }
    } catch {
      setRetryResult('Could not reach backend health check.');
    } finally {
      setIsRetrying(false);
    }
  };

  const copyWhitelistIp = () => {
    navigator.clipboard.writeText('0.0.0.0/0');
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  if (!dbState || dismissed) return null;

  if (dbState.isConnected) {
    return (
      <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-200 text-xs px-4 py-2 transition-all">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>MongoDB Atlas Connected:</strong> Live persistence to cluster <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-300 font-mono">cluster0.35hjtwr.mongodb.net</code> is active.
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-emerald-400 hover:text-emerald-100 px-2 py-0.5 rounded cursor-pointer text-xs"
            title="Dismiss notification"
          >
            ✕ Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside aria-label="Database Status" className="bg-slate-900 border-b border-amber-500/40 text-slate-100 text-xs transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-amber-300">
                  MongoDB Atlas Whitelist Required:
                </span>
                <span className="text-slate-300">
                  Cluster handshake pending until <code className="bg-slate-800 text-amber-200 px-1.5 py-0.5 rounded font-mono border border-slate-700">0.0.0.0/0</code> is added in Atlas Network Access.
                </span>
              </div>
              {retryResult && (
                <p className="mt-1 text-teal-300 font-medium text-[11px]">
                  ↳ {retryResult}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium cursor-pointer transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>{showInstructions ? 'Hide Setup Steps' : '4-Step Whitelist Guide'}</span>
            </button>

            <button
              onClick={copyWhitelistIp}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium cursor-pointer transition-colors"
              title="Copy 0.0.0.0/0 to clipboard"
            >
              {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedIp ? 'Copied 0.0.0.0/0!' : 'Copy 0.0.0.0/0'}</span>
            </button>

            <button
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Step-by-Step Whitelist Instructions */}
        {showInstructions && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-slate-300 grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg">
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
              <div>
                <p className="font-semibold text-white">Open Atlas Dashboard</p>
                <p className="text-[11px] text-slate-400">Log in to your account at <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" className="text-teal-400 underline inline-flex items-center gap-0.5">cloud.mongodb.com <ExternalLink className="w-2.5 h-2.5" /></a></p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
              <div>
                <p className="font-semibold text-white">Go to Network Access</p>
                <p className="text-[11px] text-slate-400">Under the <strong>Security</strong> menu in the left navigation sidebar.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
              <div>
                <p className="font-semibold text-white">Click "+ Add IP Address"</p>
                <p className="text-[11px] text-slate-400">Click the green button and select <strong>"Allow Access from Anywhere"</strong> (<code className="text-amber-300">0.0.0.0/0</code>).</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
              <div>
                <p className="font-semibold text-white">Click "Confirm"</p>
                <p className="text-[11px] text-slate-400">Atlas takes ~10s to apply. Then click <strong>Test Connection</strong> above!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function CivicTrackMain() {
  const { user, isAdmin } = useAuth();

  const [currentView, setCurrentView] = useState<'landing' | 'citizen' | 'admin'>('landing');

  // Modals state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState<ComplaintCategory | undefined>();

  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [trackedId, setTrackedId] = useState<string | undefined>();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register' | 'admin'>('login');

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);

  const handleOpenSubmit = (category?: ComplaintCategory) => {
    setPreselectedCategory(category);
    setIsSubmitOpen(true);
  };

  const handleOpenTrack = (trackingId?: string) => {
    setTrackedId(trackingId);
    setIsTrackOpen(true);
  };

  const handleOpenAuth = (tab: 'login' | 'register' | 'admin' = 'login') => {
    setAuthInitialTab(tab);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (role: 'citizen' | 'admin') => {
    if (role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('citizen');
    }
  };

  const handleNavigateToDashboard = () => {
    if (isAdmin) {
      setCurrentView('admin');
    } else {
      setCurrentView('citizen');
    }
  };

  // Synchronize and guard routes on direct URL access (e.g., /admin, #admin)
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || hash === '#admin') {
        if (user && !isAdmin) {
          // Deny/redirect citizen to citizen dashboard
          setCurrentView('citizen');
        } else {
          setCurrentView('admin');
        }
      } else if (path === '/citizen' || hash === '#citizen') {
        setCurrentView('citizen');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);
    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
    };
  }, [user, isAdmin]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      {/* Database Connectivity Banner */}
      <DatabaseStatusBanner />

      {/* Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        openSubmitModal={() => handleOpenSubmit()}
        openTrackModal={handleOpenTrack}
        openAuthModal={handleOpenAuth}
        openApiDocsModal={() => setIsApiDocsOpen(true)}
        openProfileModal={() => setIsProfileOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            openSubmitModal={handleOpenSubmit}
            openTrackModal={handleOpenTrack}
            openAuthModal={handleOpenAuth}
            navigateToDashboard={handleNavigateToDashboard}
          />
        )}

        {currentView === 'citizen' && (
          <CitizenDashboard
            openSubmitModal={() => handleOpenSubmit()}
            openTrackModal={handleOpenTrack}
            openProfileModal={() => setIsProfileOpen(true)}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            openTrackModal={handleOpenTrack}
            onNavigateHome={() => setCurrentView('landing')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        openApiDocsModal={() => setIsApiDocsOpen(true)}
        openSubmitModal={() => handleOpenSubmit()}
        openTrackModal={() => handleOpenTrack()}
      />

      {/* Global Modals */}
      <SubmitComplaintModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={(id) => {
          setTrackedId(id);
        }}
        onOpenTracker={(id) => {
          setIsSubmitOpen(false);
          handleOpenTrack(id);
        }}
      />

      <TrackComplaintModal
        isOpen={isTrackOpen}
        onClose={() => {
          setIsTrackOpen(false);
          setTrackedId(undefined);
        }}
        initialTrackingId={trackedId}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authInitialTab}
        onSuccess={handleAuthSuccess}
      />

      <EditProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CivicTrackMain />
    </AuthProvider>
  );
}
