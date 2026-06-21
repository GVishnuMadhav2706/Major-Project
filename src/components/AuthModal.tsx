import { useState, FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, X, LogIn, UserPlus, Info, CheckCircle2, AlertCircle, Copy, Terminal } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (sessionUser: any) => void;
}

export default function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSqlInstructions, setShowSqlInstructions] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const sqlQuery = `create table telecom_customers (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  tenure integer not null,
  monthly_usage numeric not null,
  recharge_amount numeric not null,
  plan_type text not null,
  contract_type text not null,
  support_calls integer not null,
  churn_probability integer not null,
  will_churn boolean not null,
  risk_factors text[] not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table telecom_customers enable row level security;

-- Create policy for subscriber records
create policy "Users can manage their own subscribers"
on telecom_customers for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Dynamic standard basic email/password verification
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Register standard user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data?.user) {
          // If auto_confirm is enabled (typical in dynamic test environments), 
          // or if confirmation is sent, report gracefully
          if (data.session) {
            setSuccessMsg('Account registered successfully! Automatic sign-in completed.');
            setTimeout(() => {
              onAuthSuccess(data.user);
              onClose();
            }, 1500);
          } else {
            setSuccessMsg('Sign-up submitted! Check your mailbox (or if email confirmations are automated, login directly).');
            setIsSignUp(false);
          }
        }
      } else {
        // Login normal user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data?.user) {
          setSuccessMsg('Authenticated! Synchronizing customer base...');
          setTimeout(() => {
            onAuthSuccess(data.user);
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs cursor-pointer"
      />

      {/* Main modal surface container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl shadow-slate-950/80 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Glow element */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 rounded-xl text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header content */}
        <div className="text-center mb-6 font-sans">
          <span className="inline-block text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
            Supabase Synchronization
          </span>
          <h3 className="text-xl font-bold text-slate-50 tracking-tight">
            {isSignUp ? 'Create Cloud Workstation' : 'Connect Cloud Database'}
          </h3>
          <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">
            {isSignUp 
              ? 'Join our live server to back up subscriber predictions, logs, and simulated values safely.'
              : 'Log in using your registered credentials to restore your simulated customer base.'}
          </p>
        </div>

        {/* Messaging banners */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-start gap-2 theme bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-medium mb-4"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-medium mb-4"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth form */}
        <form onSubmit={handleAuth} className="space-y-4 font-sans">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address / Identity
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. pilot@agency-workplace.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-750 focus:outline-none text-slate-200 text-sm pl-10 pr-4 py-3 rounded-xl transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-750 focus:outline-none text-slate-200 text-sm pl-10 pr-4 py-3 rounded-xl transition"
              />
            </div>
          </div>

          {/* Quick-fill credentials helper snippet */}
          <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="text-left font-sans text-slate-400 text-[11px]">
              <span className="font-bold text-slate-300 block">⚡ Testing Quick-Fill</span>
              Credentials: <code className="text-blue-300">admin@test.com</code> / <code className="text-blue-300">123456</code>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@test.com');
                setPassword('123456');
              }}
              className="px-2.5 py-1.5 text-[10px] font-bold hover:bg-slate-850 text-blue-400 border border-blue-500/10 hover:border-blue-500/30 rounded-lg transition shrink-0 cursor-pointer"
            >
              Fill Coordinates
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 font-bold text-sm text-slate-950 bg-blue-400 hover:bg-blue-350 disabled:bg-slate-800 disabled:text-slate-500 px-5 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/5 ${
              loading ? 'cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-955 border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>Create Cloud Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 shrink-0" />
                <span>Connect & Lock In Session</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle links */}
        <div className="text-center mt-5 text-[11px] text-slate-500">
          {isSignUp ? (
            <p>
              Already configured a user profile?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                }}
                className="text-blue-400 font-bold hover:underline cursor-pointer"
              >
                Log In instead
              </button>
            </p>
          ) : (
            <p>
              New to this prediction workspace?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                }}
                className="text-blue-400 font-bold hover:underline cursor-pointer"
              >
                Sign Up a fresh account
              </button>
            </p>
          )}
        </div>

        {/* Supabase PostgreSQL Schema Integration guide and code block */}
        <div className="mt-8 border-t border-slate-800/80 pt-5">
          <button
            type="button"
            onClick={() => setShowSqlInstructions(!showSqlInstructions)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-300 transition cursor-pointer bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-850"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-405 shrink-0" />
              <span>PostgreSQL SQL Table Setup (Optional)</span>
            </div>
            <span className="text-xs text-slate-500">{showSqlInstructions ? 'Collapse' : 'Expand Schema'}</span>
          </button>

          <AnimatePresence>
            {showSqlInstructions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-[10px] font-sans leading-relaxed text-slate-400">
                  <div className="flex items-start gap-2 mb-3 bg-blue-500/5 text-blue-300 p-2.5 rounded-lg border border-blue-500/10">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                    <p>
                      To persist subscribers permanently in the interactive cloud, execute the SQL below in the **Supabase SQL Editor** to create the tables and enable Row-Level Security:
                    </p>
                  </div>

                  <div className="relative font-mono bg-slate-900 border border-slate-800 p-3 rounded-lg overflow-x-auto text-[9px] text-slate-300 max-h-48 scrollbar">
                    <button
                      onClick={handleCopySql}
                      className="absolute top-2 right-2 p-1 bg-slate-950 border border-slate-800 rounded hover:border-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      title="Copy SQL code"
                    >
                      {copiedSql ? (
                        <span className="text-[9px] text-emerald-400 font-bold px-1">Copied!</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <pre>{sqlQuery}</pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
