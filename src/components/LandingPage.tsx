import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Droplet,
  Cone,
  Zap,
  Trash2,
  Shield,
  HelpCircle,
  FileCheck2,
  Building2,
  Users,
  Award,
  Sparkles,
  PhoneCall,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { PublicStats, ComplaintCategory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface LandingPageProps {
  openSubmitModal: (category?: ComplaintCategory) => void;
  openTrackModal: (trackingId?: string) => void;
  openAuthModal: (tab?: 'login' | 'register' | 'admin') => void;
  navigateToDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  openSubmitModal,
  openTrackModal,
  openAuthModal,
  navigateToDashboard,
}) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<PublicStats>({
    totalGrievancesLogged: 1420,
    resolvedGrievances: 1210,
    activeResolution: 165,
    resolutionRatePercent: 85,
    avgResponseHours: 18,
  });

  const [heroTrackInput, setHeroTrackInput] = useState('');

  useEffect(() => {
    api
      .getPublicStats()
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  const handleHeroTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroTrackInput.trim()) {
      openTrackModal(heroTrackInput.trim().toUpperCase());
    }
  };

  const categories: {
    category: ComplaintCategory;
    icon: React.ElementType;
    title: string;
    desc: string;
    sla: string;
    dept: string;
  }[] = [
    {
      category: 'Water Supply',
      icon: Droplet,
      title: 'Water Supply & Sewerage',
      desc: 'Pipeline leaks, pressure drops, water contamination, burst mains, drainage overflow.',
      sla: '24 - 48 Hours',
      dept: 'Water Supply & Sewerage Board',
    },
    {
      category: 'Roads',
      icon: Cone,
      title: 'Roads & Bridges',
      desc: 'Hazardous potholes, broken asphalt, missing guard rails, street name plates, culvert damage.',
      sla: '48 - 72 Hours',
      dept: 'Public Works Department (PWD)',
    },
    {
      category: 'Electricity',
      icon: Zap,
      title: 'Electricity & Streetlights',
      desc: 'Power cuts, transformer sparks, drooping electrical wires, dark streets, meter faults.',
      sla: '12 - 24 Hours',
      dept: 'Electricity & Energy Authority',
    },
    {
      category: 'Sanitation',
      icon: Trash2,
      title: 'Solid Waste & Sanitation',
      desc: 'Overflowing municipal dumpsters, missed door-to-door collection, stagnant drains, dead animal removal.',
      sla: '12 - 36 Hours',
      dept: 'Solid Waste Management Cell',
    },
    {
      category: 'Public Safety',
      icon: Shield,
      title: 'Public Safety Hazards',
      desc: 'Uncovered manholes, fallen tree branches, structural hazards, park maintenance.',
      sla: 'Immediate / 24 Hours',
      dept: 'Police & Public Safety Division',
    },
    {
      category: 'Other',
      icon: HelpCircle,
      title: 'General Municipal Affairs',
      desc: 'Property tax disputes, civic license delays, public parks, town planning questions.',
      sla: '72 Hours',
      dept: 'Municipal Administration Bureau',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          {/* Government tag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide shadow-sm">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Official Unified Public Grievance Portal</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-sans">
              Every complaint deserves a <span className="text-teal-400 underline decoration-teal-600/60 decoration-wavy decoration-2">resolution.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              CivicTrack empowers citizens to report civic infrastructure failures and ensures municipal departments resolve them with measurable Service Level Agreements (SLAs).
            </p>
          </div>

          {/* Quick Track Input Widget */}
          <div className="max-w-xl mx-auto bg-slate-800/90 p-2 sm:p-2.5 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md">
            <form onSubmit={handleHeroTrackSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={heroTrackInput}
                  onChange={(e) => setHeroTrackInput(e.target.value)}
                  placeholder="Enter Tracking Reference (e.g. CT-2026-WTR892)"
                  className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-400 pl-10 pr-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-teal-400 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-slate-400">
              <span>Quick Try:</span>
              <button
                type="button"
                onClick={() => openTrackModal('CT-2026-WTR892')}
                className="text-teal-300 hover:underline font-mono"
              >
                CT-2026-WTR892
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openTrackModal('CT-2026-ROD411')}
                className="text-teal-300 hover:underline font-mono"
              >
                CT-2026-ROD411
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openTrackModal('CT-2026-SAN104')}
                className="text-teal-300 hover:underline font-mono"
              >
                CT-2026-SAN104
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => openSubmitModal()}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-teal-950/50 transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Submit a Public Grievance</span>
            </button>

            {user ? (
              <button
                onClick={navigateToDashboard}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm rounded-lg border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>Go to {isAdmin ? 'Admin Console' : 'My Grievance Dashboard'}</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('register')}
                className="px-6 py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4 text-teal-400" />
                <span>Create Citizen Account</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* LIVE STATS METRICS COUNTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {stats.totalGrievancesLogged.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Grievances Logged
            </div>
            <p className="text-[11px] text-teal-600 font-medium">100% Audited in MongoDB</p>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
              {stats.resolvedGrievances.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Successfully Resolved
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">Field Inspected & Verified</p>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
              {stats.activeResolution.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Under Active Resolution
            </div>
            <p className="text-[11px] text-amber-700 font-medium">Department Crews Dispatched</p>
          </div>

          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-mono">
              {stats.resolutionRatePercent}%
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Municipal Resolution Rate
            </div>
            <p className="text-[11px] text-teal-700 font-medium">Avg Redressal: {stats.avgResponseHours}h</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
            Transparent Municipal Redressal
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How CivicTrack Resolves Public Grievances
          </h2>
          <p className="text-sm text-slate-600">
            A three-step transparent governance workflow holding municipal departments accountable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative space-y-4 hover:border-teal-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-200">
              01
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Citizen Lodges Grievance
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit details regarding roads, water, power, sanitation, or safety. A tamper-proof unique Tracking ID (e.g. <code>CT-2026-XXXXX</code>) is instantly minted in MongoDB Atlas.
              </p>
            </div>
            <div className="pt-2 text-xs text-teal-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Instant Tracking Reference</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative space-y-4 hover:border-teal-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-200">
              02
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                2. Department Assignment & Review
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Grievance Redressal Officer reviews incoming complaints, assigns priority, routes to the appropriate field division, and logs timestamped audit notes.
              </p>
            </div>
            <div className="pt-2 text-xs text-teal-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Departmental SLA Clock Starts</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative space-y-4 hover:border-teal-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-200">
              03
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                3. Ground Resolution & Verification
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Field engineers execute repairs on-site. The case is marked Resolved with mandatory resolution notes and closing remarks visible publicly to the citizen.
              </p>
            </div>
            <div className="pt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full Audit Trail & Closure</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLAINT CATEGORIES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
            Public Service Departments
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Official Grievance Categories
          </h2>
          <p className="text-sm text-slate-600">
            Report issues directly to specialized municipal authorities with defined resolution SLAs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.category}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{cat.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{cat.dept}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{cat.desc}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    SLA: <strong className="text-teal-700">{cat.sla}</strong>
                  </span>
                  <button
                    onClick={() => openSubmitModal(cat.category)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 group-hover:underline cursor-pointer"
                  >
                    <span>Lodge Issue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ABOUT & TRANSPARENCY SECTION */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-teal-400 text-xs font-semibold">
              <Award className="w-4 h-4" />
              <span>Right to Public Grievance Redressal</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Bridging the gap between citizens and municipal administrators.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              CivicTrack was built under the mandate of open municipal governance. Historically, public complaints were lost in paperwork, delayed indefinitely, or closed without citizen verification.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              With CivicTrack, every single submission receives an unforgeable tracking number, automated routing to municipal bodies, transparent status updates, and a permanent audit trail on MongoDB Atlas.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-xl font-bold text-teal-400 block font-mono">100%</span>
                <span className="text-xs text-slate-300">Public Audit Visibility</span>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-xl font-bold text-teal-400 block font-mono">&lt; 48 Hrs</span>
                <span className="text-xs text-slate-300">Target Resolution Time</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <span>Municipal Redressal Standards</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-sm">Role-Based Access Control</strong>
                  <span className="text-slate-400">
                    Citizens securely view only their own complaints. Certified administrators have authority to assign departments and update statuses.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-sm">Mandatory Resolution Notes</strong>
                  <span className="text-slate-400">
                    Complaints cannot simply be clicked closed. Administrators must document the ground action taken, team dispatched, and inspection findings.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block text-sm">Real-time Progress Tracker</strong>
                  <span className="text-slate-400">
                    Citizens don't need to visit municipal offices or wait on phone holds. Tracking works 24/7 on web and mobile devices.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => openSubmitModal()}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer text-center"
              >
                Lodge Grievance Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & ESCALATION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Support & Escalation
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Municipal Grievance Directorate
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an emergency hazard threatens life or property, please contact immediate first responders before submitting an online grievance ticket.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <PhoneCall className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 block">Toll-Free Grievance Cell:</span>
                  <span className="text-slate-600 font-mono">1800-425-CIVIC (1800-425-2484)</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 block">Official Support Email:</span>
                  <span className="text-slate-600 font-mono">grievance-cell@civictrack.gov</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 block">Municipal Headquarters:</span>
                  <span className="text-slate-600">
                    City Administrative Complex, Block B, 4th Floor, Metro City
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 block">Office Working Hours:</span>
                  <span className="text-slate-600">Monday - Friday: 09:00 - 18:00 (Portal runs 24/7)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
