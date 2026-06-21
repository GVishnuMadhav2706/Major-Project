import { useState, FormEvent } from 'react';
import { Customer, PlanType, ContractType } from '../types';
import { predictChurn, generateUniqueIndianName } from '../utils/churnLogic';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Percent, 
  ShieldCheck, 
  ShieldAlert, 
  Flame, 
  Plus, 
  Info, 
  HelpCircle, 
  PieChart as PieIcon, 
  BarChart2, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  Trash2,
  Database,
  LogIn
} from 'lucide-react';

interface PageHomeProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  cloudSynced: boolean;
  onConnectCloudDatabase?: () => void;
  user?: any;
}

export default function PageHome({ 
  customers, 
  onSaveCustomer, 
  onDeleteCustomer,
  cloudSynced,
  onConnectCloudDatabase,
  user
}: PageHomeProps) {
  // --- Prediction Tool Form State ---
  const [tenure, setTenure] = useState(12);
  const [monthlyUsage, setMonthlyUsage] = useState(45);
  const [monthlySpend, setMonthlySpend] = useState(50);
  const [supportCalls, setSupportCalls] = useState(2);
  const [name, setName] = useState('');
  const [planType, setPlanType] = useState<PlanType>('Standard');
  const [contractType, setContractType] = useState<ContractType>('Month-to-month');

  const [notification, setNotification] = useState<string | null>(null);

  // Live prediction logic based on sliders
  const liveResult = predictChurn(
    tenure,
    monthlyUsage,
    monthlySpend, // recharge amount maps to monthlySpend
    planType,
    contractType,
    supportCalls
  );

  const getRiskColor = (prob: number) => {
    if (prob < 30) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (prob < 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const getRiskBorder = (prob: number) => {
    if (prob < 30) return 'border-emerald-500/30';
    if (prob < 70) return 'border-amber-500/30';
    return 'border-rose-500/30';
  };

  // --- Summary Metrics Calculations ---
  const totalCount = customers.length;
  const churnCount = customers.filter(c => c.willChurn).length;
  const activeCount = totalCount - churnCount;
  const churnPercent = totalCount > 0 ? Math.round((churnCount / totalCount) * 100) : 0;
  
  // High risk customers (score >= 70%)
  const highRiskCount = customers.filter(c => c.churnProbability >= 70).length;

  // --- Chart Calculations (Donut & Risk Levels) ---
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffsetLoyal = circumference - ((100 - churnPercent) / 100) * circumference;
  const strokeDashoffsetChurn = circumference - (churnPercent / 100) * circumference;

  const lowRiskList = customers.filter(c => c.churnProbability < 30);
  const midRiskList = customers.filter(c => c.churnProbability >= 30 && c.churnProbability < 70);
  const highRiskList = customers.filter(c => c.churnProbability >= 70);

  const lowPercent = totalCount > 0 ? Math.round((lowRiskList.length / totalCount) * 100) : 0;
  const midPercent = totalCount > 0 ? Math.round((midRiskList.length / totalCount) * 100) : 0;
  const highPercent = totalCount > 0 ? Math.round((highRiskList.length / totalCount) * 100) : 0;

  // Form submission: create a unique and non-duplicate customer record
  const handleAddSubscriber = (e: FormEvent) => {
    e.preventDefault();
    const cleanId = 'TEL-' + Math.floor(100000 + Math.random() * 900000);
    const finalName = name.trim() || generateUniqueIndianName(customers.map(c => c.name));

    // Prevent duplicate name if name matches exactly (case insensitive)
    const exists = customers.some(c => c.name.toLowerCase() === finalName.toLowerCase());
    if (exists) {
      alert(`A subscriber with the identifier "${finalName}" already exists. Please choose a unique name.`);
      return;
    }

    const newCust: Customer = {
      id: cleanId,
      name: finalName,
      tenure,
      monthlyUsage,
      rechargeAmount: monthlySpend,
      planType,
      contractType,
      supportCalls,
      churnProbability: liveResult.churnProbability,
      willChurn: liveResult.willChurn,
      riskFactors: liveResult.riskFactors,
    };

    onSaveCustomer(newCust);
    setNotification(`Successfully registered "${finalName}" into database!`);
    
    // Reset specific states
    setName('');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-8 font-sans"
    >
      {/* Dynamic Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl text-xs text-emerald-400 font-semibold flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer uppercase font-extrabold"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync database prompt banner */}
      {!user && onConnectCloudDatabase && (
        <div className="bg-slate-900/60 border border-amber-500/10 hover:border-amber-500/25 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/2 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl mt-0.5 shrink-0">
              <Database className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Connect Cloud Database</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Unlock direct cloud logging, remote bucket storage, and historical synchronized analysis. Connect safely to your live Supabase database with pre-filled test credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onConnectCloudDatabase}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-350 hover:shadow-lg hover:shadow-amber-500/10 rounded-xl transition cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>Connect Cloud Database</span>
          </button>
        </div>
      )}

      {/* --- Main summary metrics cards --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold tracking-wider uppercase">Total Customers</span>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight mt-3">{totalCount}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Cohort of telemetry records</p>
        </div>

        {/* Card 2: Churn Percentage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold tracking-wider uppercase">Churn Percentage</span>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-rose-500">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight mt-3">{churnPercent}%</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              churnPercent >= 40 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {churnPercent >= 40 ? 'High Retention Friction' : 'Optimal Retention'}
            </span>
          </div>
        </div>

        {/* Card 3: Active Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold tracking-wider uppercase">Active Customers</span>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight mt-3">{activeCount}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Committed, non-churning base</p>
        </div>

        {/* Card 4: High Risk Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold tracking-wider uppercase">High Risk Customers</span>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight mt-3">{highRiskCount}</p>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Risk probability indices ≥ 70%</p>
        </div>
      </section>

      {/* --- Main 2-column workspace --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Interactive Prediction Simulator Form */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-5">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-base font-bold text-slate-100">Live Simulator tool</h3>
                <p className="text-xs text-slate-550">Adjust properties below to evaluate churn probability in real time.</p>
              </div>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-5">
              {/* Optional Name (Useful if adding to telemetry registry) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Subscriber Name
                  </label>
                  <button
                    type="button"
                    onClick={() => setName(generateUniqueIndianName(customers.map(c => c.name)))}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-350 bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/30 px-2 py-0.5 rounded transition cursor-pointer"
                  >
                    Suggest Indian Name
                  </button>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma (or leave blank for auto-generate)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-700 transition"
                />
              </div>

              {/* Grid selectors for Plan & Contract defaults */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Plan
                  </label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as PlanType)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-350 text-xs rounded-xl px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Unlimited">Unlimited</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Contract Level
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as ContractType)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-350 text-xs rounded-xl px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>
                </div>
              </div>

              {/* Sliders Area */}
              <div className="space-y-4 bg-slate-950/60 p-4 border border-slate-850 rounded-xl">
                {/* Sliders: Tenure */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px] font-semibold text-slate-400">
                    <span>Tenure Length</span>
                    <span className="font-mono text-blue-400 font-bold">{tenure} Months</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sliders: Usage */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px] font-semibold text-slate-400">
                    <span>Monthly Usage</span>
                    <span className="font-mono text-teal-400 font-bold">{monthlyUsage} GB</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={monthlyUsage}
                    onChange={(e) => setMonthlyUsage(Number(e.target.value))}
                    className="w-full accent-teal-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sliders: Monthly spend */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px] font-semibold text-slate-400">
                    <span>Monthly Spend</span>
                    <span className="font-mono text-amber-500 font-bold">${monthlySpend} USD</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={monthlySpend}
                    onChange={(e) => setMonthlySpend(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sliders: CS Support calls */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px] font-semibold text-slate-400">
                    <span>Support Calls</span>
                    <span className="font-mono text-rose-500 font-bold">{supportCalls} Calls</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={supportCalls}
                    onChange={(e) => setSupportCalls(Number(e.target.value))}
                    className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Real-time calculated results card */}
              <div className={`p-4 rounded-xl border ${getRiskBorder(liveResult.churnProbability)} flex items-center justify-between gap-4 bg-slate-950/90 relative overflow-hidden`}>
                <div className="absolute inset-0 pointer-events-none opacity-[0.015] bg-slate-400" />
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Prediction Outcome</span>
                  <div className="flex items-center gap-1.5">
                    {liveResult.willChurn ? (
                      <span className="text-rose-500 font-extrabold text-xs uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/15 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        Risk: Churn (Yes)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-extrabold text-xs uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        Risk: Loyal (No)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Defection Index</span>
                  <p className="text-2xl font-black text-slate-50">{liveResult.churnProbability}%</p>
                </div>
              </div>

              {/* Submit To Registry Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 font-bold text-xs bg-blue-600 hover:bg-blue-500 text-slate-100 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/10"
              >
                <Plus className="w-4 h-4" />
                <span>Save Subscriber to Registry</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Hand: Visual charts and Analytical table */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Pie Chart: Churn proportion */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                  <PieIcon className="w-3.5 h-3.5 text-blue-400" />
                  Churn vs Retention ratio
                </h4>
                <p className="text-[10px] text-slate-500">Breakdown of the predicted churn split</p>
              </div>

              <div className="flex items-center justify-center py-6 relative">
                {/* Custom Ring indicator */}
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#1e293b" strokeWidth="12" />
                  
                  {/* Retention Segment (Loyal) */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffsetLoyal}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  
                  {/* Churn Segment (Rose) */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffsetChurn}
                    strokeLinecap="round"
                    transform={`rotate(${( (100 - churnPercent) / 100) * 360} 70 70)`}
                    className="transition-all duration-500"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                  <span className="text-2xl font-extrabold text-slate-50">{churnPercent}%</span>
                  <span className="text-[8px] text-rose-450 font-bold uppercase tracking-wider">Churn Rate</span>
                </div>
              </div>

              {/* Legend labels */}
              <div className="flex justify-around items-center text-[10px] border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-300">Loyal ({100 - churnPercent}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-semibold text-slate-300">Churn ({churnPercent}%)</span>
                </div>
              </div>
            </div>

            {/* Custom Bar Chart: Risk levels split (Low, Medium, High) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                  <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                  Subscribers Risk Levels
                </h4>
                <p className="text-[10px] text-slate-500">Safe score zones compared to hazards</p>
              </div>

              <div className="py-2.5 space-y-3.5">
                {/* Low Risk Segment */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-sans font-semibold mb-1 text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Low Risk (&lt; 30%)
                    </span>
                    <span className="font-bold text-slate-200">{lowRiskList.length} subs ({lowPercent}%)</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-900">
                    <div style={{ width: `${lowPercent}%` }} className="h-full bg-emerald-500 rounded-full transition-all duration-500" />
                  </div>
                </div>

                {/* Medium Risk Segment */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-sans font-semibold mb-1 text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Medium Risk (30 - 69%)
                    </span>
                    <span className="font-bold text-slate-200">{midRiskList.length} subs ({midPercent}%)</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-900">
                    <div style={{ width: `${midPercent}%` }} className="h-full bg-amber-500 rounded-full transition-all duration-500" />
                  </div>
                </div>

                {/* High Risk Segment */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-sans font-semibold mb-1 text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      High Risk (≥ 70%)
                    </span>
                    <span className="font-bold text-slate-200">{highRiskList.length} subs ({highPercent}%)</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-900">
                    <div style={{ width: `${highPercent}%` }} className="h-full bg-rose-500 rounded-full transition-all duration-500" />
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 leading-relaxed border-t border-slate-800/80 pt-3">
                Classification logic identifies extreme support friction as a primary driver.
              </div>
            </div>

          </div>

          {/* Table: Analysis Checklist Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4.5 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">Churn Diagnostics Register</h3>
                <p className="text-[10px] text-slate-500">Subscriber profiles evaluated by the classification logic</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-850 px-2 py-1 rounded">
                Records: {totalCount}
              </span>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-850">
              <table className="w-full min-w-[500px] border-collapse text-left text-[11px] font-sans">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="py-3 px-3.5">Customer ID</th>
                    <th className="py-3 px-3.5">Plan</th>
                    <th className="py-3 px-3.5">Tenure</th>
                    <th className="py-3 px-3.5">Usage</th>
                    <th className="py-3 px-3.5">Monthly Spend</th>
                    <th className="py-3 px-3.5 text-right">Churn Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {customers.slice(0, 5).map((customer) => (
                    <tr key={customer.id} className="transition-colors hover:bg-slate-850/30">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-400">{customer.id}</td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 text-[10px] font-bold rounded-md">
                          {customer.planType}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">{customer.tenure} mos</td>
                      <td className="py-3 px-3.5 text-teal-400 font-bold">{customer.monthlyUsage.toFixed(1)} GB</td>
                      <td className="py-3 px-3.5 text-amber-400 font-bold">${customer.rechargeAmount}/mo</td>
                      <td className="py-3 px-3.5 text-right">
                        {customer.willChurn ? (
                          <span className="text-[9px] font-black uppercase text-rose-450 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                            Churn ({customer.churnProbability}%)
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Loyal ({customer.churnProbability}%)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                        No customer telemetry database found. Reset database to rebuild sample.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {customers.length > 5 && (
              <p className="text-[10px] text-slate-550 text-right mt-3 font-medium">
                * Displaying 5 recent records. Go to the <strong className="text-blue-400">Customer Details</strong> tab to see full registry search.
              </p>
            )}
          </div>

        </div>

      </div>

    </motion.div>
  );
}
