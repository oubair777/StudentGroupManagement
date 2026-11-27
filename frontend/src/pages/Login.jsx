import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GraduationCap, Lock, Mail, ArrowRight, Sparkles, Shield, User, Loader2, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Validate form fields live
  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required.');
      valid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const data = await login(email.trim(), password);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login Helper
  const handleDemoLogin = async (demoEmail, demoPass, roleLabel) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setEmailError('');
    setPasswordError('');
    setFormError('');
    setLoading(true);

    try {
      const data = await login(demoEmail, demoPass);
      showToast(`Signed in as ${roleLabel} (${data.user.name})`, 'success');
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setFormError('Demo login failed.');
      showToast('Demo login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-600 via-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/30 transform hover:scale-105 transition-transform">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Portal Login</h2>
          <p className="text-xs text-slate-500 font-medium">
            Student & Professor Coursework Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in shake">
                {formError}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="e.g. alex@joineazy.edu"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-800 ${
                    emailError
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-brand-500'
                  }`}
                />
              </div>
              {emailError && <p className="text-[11px] text-rose-600 font-medium mt-1">{emailError}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-800 ${
                    passwordError
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-brand-500'
                  }`}
                />
              </div>
              {passwordError && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{passwordError}</p>
              )}
            </div>

            {/* Submit Button with Loader Animation */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Section */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Role Demonstrations</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('professor@joineazy.edu', 'admin123', 'Professor')}
                className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-left transition-all group"
              >
                <div className="flex items-center space-x-1 text-[11px] font-bold text-purple-900">
                  <Shield className="w-3 h-3 text-purple-600" />
                  <span>Professor</span>
                </div>
                <div className="text-[9px] text-purple-600 font-medium mt-0.5 truncate">
                  Dr. Vance
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('alex@joineazy.edu', 'student123', 'Group Leader')}
                className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition-all group"
              >
                <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-900">
                  <User className="w-3 h-3 text-emerald-600" />
                  <span>Leader</span>
                </div>
                <div className="text-[9px] text-emerald-600 font-medium mt-0.5 truncate">
                  Alex (Lead)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('bella@joineazy.edu', 'student123', 'Group Member')}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left transition-all group"
              >
                <div className="flex items-center space-x-1 text-[11px] font-bold text-blue-900">
                  <User className="w-3 h-3 text-blue-600" />
                  <span>Member</span>
                </div>
                <div className="text-[9px] text-blue-600 font-medium mt-0.5 truncate">
                  Bella (Mbr)
                </div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
