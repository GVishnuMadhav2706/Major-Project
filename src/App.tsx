import { useState, useEffect } from 'react';
import { Customer } from './types';
import { INITIAL_CUSTOMERS } from './utils/churnLogic';
import { supabase } from './supabaseClient';
import { getDurableCustomers, saveDurableCustomer, deleteDurableCustomer } from './utils/supabaseDb';
import AuthModal from './components/AuthModal';
import PageHome from './components/PageHome';
import PageDetails from './components/PageDetails';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  Layers,
  LogIn,
  Database,
  CloudLightning,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  PhoneCall,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState<'home' | 'details'>('home');
  
  // Supabase Auth and Sync States
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [cloudSynced, setCloudSynced] = useState(false);

  // Monitor Supabase session states on load
  useEffect(() => {
    // Resolve logged in identity
    supabase.auth.getUser().then(({ data: { user: sessionUser } }) => {
      if (sessionUser) {
        setUser(sessionUser);
      }
    });

    // Setup reactive subscriber callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setCloudSynced(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch or Synchronize subscribers whenever active user changes
  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      const userId = user ? user.id : null;
      const response = await getDurableCustomers(userId);
      
      if (!active) return;

      if (response.data.length > 0) {
        setCustomers(response.data);
      } else {
        // Fallback to baseline default list
        setCustomers(INITIAL_CUSTOMERS);
      }

      setCloudSynced(response.fromDb);
      
      if (response.error) {
        setSyncNotice(response.error);
      } else if (userId) {
        setSyncNotice(`Connected securely to Supabase. Loaded ${response.data.length || INITIAL_CUSTOMERS.length} subscribers.`);
      } else {
        setSyncNotice(null);
      }
    }

    loadCustomers();

    return () => {
      active = false;
    };
  }, [user]);

  // Save (Create or Update) customer logic to support dynamic updates from both PageHome and PageDetails
  const handleSaveCustomer = async (savedCustomer: Customer) => {
    // 1. Update local UI state immediately for responsive feedback
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === savedCustomer.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCustomer.id ? savedCustomer : c));
      } else {
        return [savedCustomer, ...prev];
      }
    });

    // 2. Persist to cloud/local adapter
    const userId = user ? user.id : null;
    const result = await saveDurableCustomer(savedCustomer, userId);

    setCloudSynced(result.fromDb);
    if (result.error) {
      setSyncNotice(result.error);
    } else if (userId) {
      setSyncNotice(`Subscriber "${savedCustomer.name}" cloud syncing successful.`);
    }
  };

  // Delete customer record logic
  const handleDeleteCustomer = async (id: string) => {
    // 1. Update local UI state
    setCustomers((prev) => prev.filter((c) => c.id !== id));

    // 2. Purge from storage
    const userId = user ? user.id : null;
    const result = await deleteDurableCustomer(id, userId);

    if (result.error) {
      setSyncNotice(`Cloud deletion fail: ${result.error}`);
    } else if (userId) {
      setSyncNotice('Subscriber purged from database successfully.');
    }
  };

  // Re-seed original dataset
  const resetDemoState = async () => {
    if (confirm("Reset subscriber register back to database defaults? Any unsaved telemetry will be overwritten.")) {
      setCustomers(INITIAL_CUSTOMERS);
      
      const userId = user ? user.id : null;
      if (userId) {
        setSyncNotice('Re-synchronizing cloud storage. Pushing default subscriber templates to Supabase...');
        for (const item of INITIAL_CUSTOMERS) {
          await saveDurableCustomer(item, userId);
        }
        setSyncNotice('Cloud sample database restore completed.');
      } else {
        setSyncNotice('Local storage demo baseline restored.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      {/* Decorative top illumination lines and background gradients */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-linear-to-r from-transparent via-blue-500 to-transparent opacity-60 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-505/2 rounded-full blur-3xl pointer-events-none" />

      {/* Main dashboard container layout */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Navigation & Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-slate-900/60 border border-slate-900 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-linear-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-inner text-slate-50 shrink-0">
              <Layers className="w-5 h-5 text-slate-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight font-sans text-slate-50 flex items-center flex-wrap gap-2">
                Telecom Customer Churn Prediction
                {cloudSynced && (
                  <span className="text-[10px] font-bold border border-emerald-500/25 text-emerald-400 bg-emerald-500/5 px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" />
                    Live Supabase SQL Sync
                  </span>
                )}
              </h1>
              <span className="text-xs text-slate-405 font-medium">
                Analysis workspace powered by interactive prediction classifiers
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Seed Restore Button */}
            <button
              onClick={resetDemoState}
              className="group flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 hover:text-slate-200 transition cursor-pointer text-slate-400"
              title="Restore baseline sample subscriber records."
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Reset Sample Base</span>
            </button>

            {/* Supabase user authentication status */}
            {user ? (
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-1.5 font-sans">
                <div className="text-left">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Cloud User</span>
                  <span className="block text-[11px] text-blue-300 font-bold max-w-[120px] truncate mt-0.5" title={user.email}>
                    {user.email}
                  </span>
                </div>
                <div className="w-0.5 h-6 bg-slate-850 shrink-0" />
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setSyncNotice('Session terminated successfully. Offline mode active.');
                  }}
                  className="text-[10px] font-bold text-rose-450 hover:text-rose-400 border border-rose-500/10 hover:border-rose-500/30 bg-rose-500/5 px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-400 hover:bg-blue-350 text-slate-950 rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/5"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Cloud Account Sync</span>
              </button>
            )}

            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[10px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ONLINE</span>
            </div>
          </div>
        </header>

        {/* Sync message alert notification banner */}
        <AnimatePresence>
          {syncNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-xs text-slate-400 font-sans flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2.5">
                {cloudSynced ? (
                  <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <CloudLightning className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span>{syncNotice}</span>
              </div>
              <button 
                onClick={() => setSyncNotice(null)} 
                className="text-[10px] font-bold tracking-wider text-slate-500 hover:text-slate-350 transition uppercase cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation Area - 2-Page Structure split */}
        <nav className="flex items-center justify-start p-1.5 bg-slate-900/60 border border-slate-900 rounded-2xl max-w-md gap-1">
          <button
            onClick={() => setCurrentPage('home')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition cursor-pointer ${
              currentPage === 'home' 
                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Home (Analysis Dashboard)</span>
          </button>
          <button
            onClick={() => setCurrentPage('details')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition cursor-pointer ${
              currentPage === 'details' 
                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Customer Details</span>
          </button>
        </nav>

        {/* Primary Page views */}
        <main className="min-h-[50vh]">
          <AnimatePresence mode="wait">
            {currentPage === 'home' ? (
              <motion.div key="home-page" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                <PageHome 
                  customers={customers}
                  onSaveCustomer={handleSaveCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  cloudSynced={cloudSynced}
                />
              </motion.div>
            ) : (
              <motion.div key="details-page" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                <PageDetails 
                  customers={customers}
                  onDeleteCustomer={handleDeleteCustomer}
                  onSaveCustomer={handleSaveCustomer}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {/* Humble and Clean footer layout */}
        <footer className="mt-6 border-t border-slate-900 pt-6 pb-2 text-center font-mono text-[10px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            System build Version 2.0.0 • Evaluates defection risk profiles using real-time parameter scaling factors
          </div>
          <div>
            Powered by Google AI Studio • Connected securely to Supabase REST engine
          </div>
        </footer>

      </div>

      {/* Supabase Authentication Dialog Overlay */}
      <AnimatePresence>
        {authModalOpen && (
          <AuthModal
            onClose={() => setAuthModalOpen(false)}
            onAuthSuccess={(sessionUser) => {
              setUser(sessionUser);
              setSyncNotice(`Authenticated successfully as ${sessionUser.email}. Connected to Cloud Storage.`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
