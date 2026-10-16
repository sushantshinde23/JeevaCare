import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { HeartPulse, Lock, Mail, User as UserIcon, Phone, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('health_worker');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please provide all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ok = await register(name, email, role, phone);
      if (ok) {
        navigate(`/dashboard/${role}`);
      } else {
        setError('Registration could not be completed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F7FAFC] dark:bg-[#101C2C] transition-colors">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0F766E] text-white shadow-md shadow-[#0F766E]/20">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#12304A] dark:text-[#F1F5F9] tracking-tight">
            Register for JeevaCare
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Create your authorized maternal &amp; newborn care coordinator account
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#172638] border border-[#DCE7EC] dark:border-[#334155] shadow-xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEE2E2] dark:bg-[#7F1D1D]/40 border border-[#FCA5A5] dark:border-[#DC2626]/40 text-xs font-semibold text-[#DC2626] dark:text-[#F87171]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-[#12304A] dark:text-[#CBD5E1] mb-1">
                Your Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] font-medium focus:ring-2 focus:ring-[#0F766E] outline-none"
              >
                <option value="health_worker">ASHA / ANM Frontline Health Worker</option>
                <option value="hospital_coordinator">Hospital Referral Coordinator / Medical Officer</option>
                <option value="transport_coordinator">108 Emergency Transport Coordinator</option>
                <option value="patient">Pregnant Mother / Family Member</option>
                <option value="admin">District Health Officer (Admin)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#12304A] dark:text-[#CBD5E1] mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sunita Ramesh Gaikwad"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] placeholder-[#64748B] focus:ring-2 focus:ring-[#0F766E] outline-none"
                  required
                />
              </div>
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
                  placeholder="name@phc.gov.in"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] placeholder-[#64748B] focus:ring-2 focus:ring-[#0F766E] outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#12304A] dark:text-[#CBD5E1] mb-1">
                Phone Number (10 digits)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] placeholder-[#64748B] focus:ring-2 focus:ring-[#0F766E] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#12304A] dark:text-[#CBD5E1] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE7EC] dark:border-[#334155] bg-[#F7FAFC] dark:bg-[#203449] text-[#12304A] dark:text-[#CBD5E1] placeholder-[#64748B] focus:ring-2 focus:ring-[#0F766E] outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D635C] text-white font-bold text-sm shadow-md shadow-[#0F766E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {loading ? 'Registering...' : 'Create Authorized Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#0F766E] dark:text-[#2DD4BF] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
