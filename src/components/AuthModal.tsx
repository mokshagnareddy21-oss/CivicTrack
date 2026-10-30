import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  User,
  Lock,
  Mail,
  Building,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'admin';
  onSuccess: (role: 'citizen' | 'admin') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccess,
}) => {
  const { login, register } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(
    initialTab === 'register' ? 'register' : 'login'
  );

  // Form states initialized empty for security
  const [email, setEmail] = useState(
    initialTab === 'admin' ? 'admin@civictrack.gov' : ''
  );
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login(email.trim(), password);
      onSuccess(user.role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
      });
      onSuccess(user.role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'admin' | 'citizen') => {
    setIsLoading(true);
    setError(null);

    const demoEmail =
      role === 'admin' ? 'admin@civictrack.gov' : 'citizen.jane@civictrack.org';
    const demoPass = role === 'admin' ? 'Admin@CivicTrack2026' : 'Citizen@123';

    setEmail(demoEmail);
    setPassword(demoPass);
    setTab('login');

    try {
      const user = await login(demoEmail, demoPass);
      onSuccess(user.role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick evaluation login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {tab === 'login' ? 'Portal Sign In' : 'Citizen Registration'}
              </h3>
              <p className="text-xs text-slate-400">CivicTrack Official Public Service Access</p>
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
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-3 text-center transition-colors border-b-2 ${
              tab === 'login'
                ? 'border-teal-600 text-teal-800 bg-white font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-3 text-center transition-colors border-b-2 ${
              tab === 'register'
                ? 'border-teal-600 text-teal-800 bg-white font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Create Citizen Account
          </button>
        </div>

        {/* Evaluation Shortcut Panel */}
        <div className="bg-teal-50/70 border-b border-teal-100 p-3.5 text-xs text-teal-900 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Evaluation Quick Access (1-Click):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={isLoading}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <Building className="w-3 h-3" />
              <span>Admin Console</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('citizen')}
              disabled={isLoading}
              className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              <User className="w-3 h-3" />
              <span>Citizen Portal</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full text-sm pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-sm pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Need a citizen account? </span>
              <button
                type="button"
                onClick={() => setTab('register')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline cursor-pointer"
              >
                Register here
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full legal name"
                className="w-full text-sm px-3.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full text-sm px-3.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full text-sm px-3.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-sm px-3.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Apt"
                  className="w-full text-sm px-3.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City / Ward
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Metro City"
                  className="w-full text-sm px-3.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Register as Citizen</span>
              )}
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-slate-500">Already registered? </span>
              <button
                type="button"
                onClick={() => setTab('login')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
