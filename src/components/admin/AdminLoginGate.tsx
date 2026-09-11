import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { adminAuth } from '../../services/adminAuth';
import { useI18n } from '../../i18n/context';

interface AdminLoginGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onSuccess, onCancel }) => {
  const { t } = useI18n();
  const config = adminAuth.getConfig();

  const [authMode, setAuthMode] = useState<'password' | 'pin'>('password');
  const [email, setEmail] = useState(config.adminEmail);
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      let result;
      if (authMode === 'password') {
        result = adminAuth.login(email, password, rememberMe);
      } else {
        result = adminAuth.loginWithPin(pin, rememberMe);
      }

      setIsSubmitting(false);

      if (result.success) {
        onSuccess();
      } else {
        setFailedAttempts((prev) => prev + 1);
        setErrorMsg(result.error || 'Authentication failed. Please verify your credentials.');
      }
    }, 300);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200/90 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header Guard Banner */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-blue-950 p-6 text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Admin Portal Protected
          </h2>
          <p className="text-xs text-neutral-300 mt-1 max-w-xs mx-auto">
            Authorized Platform Administrator Access Only
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-neutral-800/80 border border-neutral-700 text-neutral-300">
            <Lock className="w-3 h-3 text-blue-400" />
            <span>Confidential System Portal</span>
          </div>
        </div>

        {/* Tab Selector: Password vs Master PIN */}
        <div className="flex border-b border-neutral-100 bg-neutral-50/50 p-1.5 gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'password'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Admin Credentials</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('pin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'pin'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Master PIN</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Access Denied</strong>
                <span>{errorMsg}</span>
                {failedAttempts >= 2 && (
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="mt-1 text-[11px] underline block text-rose-700 hover:text-rose-900 cursor-pointer"
                  >
                    Need initial credentials hint?
                  </button>
                )}
              </div>
            </div>
          )}

          {showHint && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <p className="font-bold">🔑 System Default Access:</p>
              <p>Username / Email: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">admin</code></p>
              <p>Password: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">admin</code></p>
              <p>Master PIN: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">2026123456789012345678901</code></p>
              <p className="text-[10px] text-amber-700 pt-1">You can change username, password, and PIN anytime in Admin Settings.</p>
            </div>
          )}

          {authMode === 'password' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Admin Username or Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-blue-500 rounded-xl focus:outline-hidden transition-all focus:ring-3 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-blue-500 rounded-xl focus:outline-hidden transition-all focus:ring-3 focus:ring-blue-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                25-Digit Master PIN Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={30}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 25-digit PIN..."
                  className="w-full pl-10 pr-10 py-2.5 tracking-widest text-xs font-bold bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-blue-500 rounded-xl focus:outline-hidden transition-all focus:ring-3 focus:ring-blue-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300"
              />
              <span>Remember login on this browser</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Verifying authorization...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Unlock & Enter Admin Portal</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-neutral-500 hover:text-neutral-800 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Catalog</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
