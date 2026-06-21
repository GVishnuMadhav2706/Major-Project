import { useState, useEffect } from 'react';
import { Customer } from './types';
import { INITIAL_CUSTOMERS, calculateStats } from './utils/churnLogic';
import MetricCard from './components/MetricCard';
import ChurnCharts from './components/ChurnCharts';
import CustomerForm from './components/CustomerForm';
import CustomerTable from './components/CustomerTable';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Percent, 
  ShieldAlert, 
  Calendar, 
  Activity, 
  HelpCircle, 
  RefreshCw, 
  PlusCircle, 
  Info,
  Layers
} from 'lucide-react';

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Seed the initial data on mount
  useEffect(() => {
    setCustomers(INITIAL_CUSTOMERS);
  }, []);

  // Compute stats on fly based on active state grid
  const stats = calculateStats(customers);

  // Save (Create or Update) customer logic
  const handleSaveCustomer = (savedCustomer: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === savedCustomer.id);
      if (exists) {
        // Update existing item
        return prev.map((c) => (c.id === savedCustomer.id ? savedCustomer : c));
      } else {
        // Create new item
        return [savedCustomer, ...prev];
      }
    });
    
    // Clear selection state after commitment
    setSelectedCustomer(null);
  };

  // Delete customer record logic
  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer(null);
    }
  };

  // Re-seed original dataset
  const resetDemoState = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setSelectedCustomer(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      {/* Decorative top illumination lines */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-linear-to-r from-transparent via-blue-500 to-transparent opacity-60" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500/2 rounded-full blur-3xl pointer-events-none" />

      {/* Main dashboard wrapper */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-900 p-5 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-linear-to-br from-rose-500 to-indigo-600 rounded-xl shadow-inner text-slate-950 shrink-0">
              <Layers className="w-6 h-6 text-slate-100" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-neutral font-sans text-slate-50 flex items-center gap-2">
                Predictive Analytics
                <span className="text-[10px] font-mono border border-blue-500/20 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                  Telco Churn
                </span>
              </h1>
              <span className="text-xs text-slate-400 font-medium">
                AI Studio Telecom Customer Defection Classification System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={resetDemoState}
              className="group flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 hover:text-slate-200 transition cursor-pointer text-slate-400"
              title="Restore baseline sample subscriber records to run clean simulations."
            >
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Reset Sample Base</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-[11px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SYSTEM ONLINE</span>
            </div>
          </div>
        </header>

        {/* Welcome Interactive Guide Banner */}
        <AnimatePresence>
          {showWelcomeBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-linear-to-r from-blue-950/20 to-indigo-950/20 border border-blue-800/20 rounded-2xl shadow-lg relative p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0 mt-0.5">
                  <Info className="w-5 h-5" />
                </div>
                <div className="font-sans text-xs">
                  <h4 className="font-bold text-slate-200 text-sm tracking-wide mb-1">
                    How Churn Prediction Works
                  </h4>
                  <p className="text-slate-400 leading-relaxed max-w-3xl">
                    High support frequency, short tenure lengths, and unanchored (month-to-month) billing structures act as primary triggers that multiply a subscriber's churn hazard. 
                    <strong className="text-blue-400 font-semibold"> To test the classification engine: </strong> Click any subscriber's <span className="text-amber-400 font-semibold">'Simulation'</span> button in the active table below. Their metrics will slide into the live workspace where you can manipulate service properties to observe Defection Risk fluctuation instantaneously!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcomeBanner(false)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-350 tracking-wider uppercase border border-slate-800/40 hover:border-slate-800 rounded-lg px-2.5 py-1.5 transition whitespace-nowrap align-self-start cursor-pointer md:align-self-center"
              >
                Dismiss Guide
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: KPI Stat Grid Cards */}
        <div id="stats-widget" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Subscribers Base"
            value={stats.totalCustomers}
            subtitle="Current tracked telemetry cohort"
            icon={<Users className="w-5 h-5 text-blue-400" />}
            trend={{ text: 'Sync Active', type: 'neutral' }}
            highlightColor="border-blue-500/10"
          />
          <MetricCard
            title="Average Retention Index"
            value={`${stats.churnRate}%`}
            subtitle="Aggregate defection rate prediction"
            icon={<Percent className="w-5 h-5 text-rose-500" />}
            trend={
              stats.churnRate >= 45 
                ? { text: 'Elevated Hazard', type: 'negative' } 
                : { text: 'Healthy Index', type: 'positive' }
            }
            highlightColor={stats.churnRate >= 45 ? 'border-rose-500/15' : 'border-slate-800'}
          />
          <MetricCard
            title="Acute Threat Count"
            value={stats.highRiskCount}
            subtitle="Users with risk indexes exceeding 75%"
            icon={<ShieldAlert className="w-5 h-5 text-rose-450" />}
            trend={
              stats.highRiskCount > 2
                ? { text: 'Friction Warning', type: 'negative' }
                : { text: 'Stable Margins', type: 'positive' }
            }
            highlightColor={stats.highRiskCount > 2 ? 'border-amber-500/15 animate-pulse' : 'border-slate-800'}
          />
          <MetricCard
            title="Avg Account Longevity"
            value={`${stats.averageTenure} mo`}
            subtitle="Average subscriber tenure duration"
            icon={<Calendar className="w-5 h-5 text-teal-400" />}
            trend={{ text: 'Loyalty anchor', type: 'neutral' }}
            highlightColor="border-teal-500/10"
          />
        </div>

        {/* Section 2: Interactive SVG Visual charts */}
        <section className="bg-slate-950 p-1 border border-transparent rounded-2xl">
          <ChurnCharts customers={customers} />
        </section>

        {/* Section 3: Primary Split Workshop UI Workspace */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Form / Live Simulator (xl:col-span-5) */}
          <div className="xl:col-span-5 w-full">
            <CustomerForm
              selectedCustomer={selectedCustomer}
              onSave={handleSaveCustomer}
              onClearSelection={() => setSelectedCustomer(null)}
            />
          </div>

          {/* Table Directory (xl:col-span-7) */}
          <div className="xl:col-span-7 w-full">
            <CustomerTable
              customers={customers}
              selectedCustomerId={selectedCustomer ? selectedCustomer.id : null}
              onSelectCustomer={setSelectedCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          </div>

        </section>
        
        {/* Humble and Clean footer layout */}
        <footer className="mt-8 border-t border-slate-900 pt-6 pb-2 text-center font-mono text-[10px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            System build Version 1.4.3 • Evaluates linear friction risks using weighted heuristic calculations.
          </div>
          <div>
            Powered by Google AI Studio • Handcrafted Dark Visual Theme
          </div>
        </footer>

      </div>
    </div>
  );
}
