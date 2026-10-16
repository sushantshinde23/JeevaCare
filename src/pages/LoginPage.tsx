import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { UserRole } from '../types';
import { DEMO_USERS } from '../services/storage';
import { HeartPulse, Lock, Mail, ArrowRight, ShieldCheck, Stethoscope, Building2, Ambulance, Activity, User as UserIcon } from 'lucide-react';
import { GoogleSignInButton } from '../components/common/GoogleSignInButton';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, switchRole, connectGoogle } = useAuth();
  const navigate = useNavigate();

  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('health_worker');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ok = await login(email, selectedRole);
      if (ok) {
        navigate(`/dashboard/${selectedRole}`);
      } else {
        setError('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const ok = await connectGoogle();
      if (ok) {
        navigate(`/dashboard/${selectedRole}`);
      } else {
        setError('Failed to connect Google account. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Google authentication error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickDemo = (userDemo: (typeof DEMO_USERS)[0]) => {
    login(userDemo.email, userDemo.role);
    navigate(`/dashboard/${userDemo.role}`);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F7FAFC] dark:bg-[#101C2C] transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0F766E] text-white shadow-md shadow-[#0F766E]/20">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
            Sign In to JeevaCare
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Secure portal for maternal &amp; newborn emergency referral coordination
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xl space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEE2E2] dark:bg-[#7F1D1D]/40 border border-[#FCA5A5] dark:border-[#DC2626]/40 text-xs font-semibold text-[#DC2626] dark:text-[#F87171]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-[#12304A] dark:text-[#CBD5E1] mb-1">
                Authorized Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] font-medium focus:ring-2 focus:ring-[#0F766E] outline-none"
              >
                <option value="health_worker">ASHA / ANM Frontline Health Worker</option>
                <option value="hospital_coordinator">Hospital Referral Coordinator / Medical Officer</option>
                <option value="transport_coordinator">108 Emergency Transport Coordinator</option>
                <option value="patient">Pregnant Mother / Family Member</option>
                <option value="admin">District Health Officer (CMO)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#12304A] dark:text-[#CBD5E1] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.gov.in"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] placeholder-[#64748B] focus:ring-2 focus:ring-[#0F766E] outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#12304A] dark:text-[#CBD5E1]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-[#0F766E] dark:text-[#2DD4BF] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] placeholder-[#64748B] focus:ring-2 focus:ring-[#0F766E] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white font-bold text-sm shadow-md shadow-[#0F766E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Google Workspace Sign-In */}
          <div className="space-y-3 pt-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase">
                Or continue with Google
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              isLoading={googleLoading}
              label="Sign in with Google (Gmail &amp; Drive)"
              className="w-full"
            />
          </div>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider text-center">
              Quick 1-Click Demo Logins
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { demo: DEMO_USERS[1], label: 'Sign in as ASHA Health Worker (Meena)', icon: Stethoscope },
                { demo: DEMO_USERS[2], label: 'Sign in as Sassoon Hospital Triage (Dr. Deshmukh)', icon: Building2 },
                { demo: DEMO_USERS[3], label: 'Sign in as 108 Ambulance Dispatch (Rajesh)', icon: Ambulance },
                { demo: DEMO_USERS[4], label: 'Sign in as District CMO / Admin (Dr. Nandapurkar)', icon: Activity },
                { demo: DEMO_USERS[0], label: 'Sign in as Patient Family (Sunita)', icon: UserIcon },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickDemo(item.demo)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] hover:bg-[#E8F5F3] dark:hover:bg-[#203449]/80 hover:border-[#0F766E] text-[#12304A] dark:text-[#CBD5E1] transition-colors text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#0F766E] dark:text-[#2DD4BF] shrink-0">
                      Demo &rarr;
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Reset Your Password
            </h3>
            {resetSent ? (
              <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs">
                A password reset instructions link has been sent to your registered email address.
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter your registered health worker or hospital email to receive a secure recovery code.
              </p>
            )}
            <input
              type="email"
              placeholder="name@health.gov.in"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setResetSent(false);
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setResetSent(true)}
                className="px-4 py-1.5 rounded-lg bg-teal-600 text-white font-semibold text-xs"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
