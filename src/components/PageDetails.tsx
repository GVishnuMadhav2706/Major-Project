import { useState, useMemo, FormEvent } from 'react';
import { Customer, PlanType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  User, 
  PhoneCall, 
  Trash2, 
  AlertCircle, 
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Check,
  X
} from 'lucide-react';

interface PageDetailsProps {
  customers: Customer[];
  onDeleteCustomer: (id: string) => void;
  onSaveCustomer: (customer: Customer) => void;
}

export default function PageDetails({ 
  customers, 
  onDeleteCustomer,
  onSaveCustomer
}: PageDetailsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'spend' | 'tenure' | 'risk'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Input state for adding an individual subscriber manually right inside the Detail Registry to assure dynamic live updates
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState<PlanType>('Standard');
  const [newTenure, setNewTenure] = useState(12);
  const [newUsage, setNewUsage] = useState(45);
  const [newSpend, setNewSpend] = useState(60);
  const [newSupport, setNewSupport] = useState(2);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper converter to write tenure in months / years
  const formatTenure = (months: number) => {
    if (months < 12) {
      return `${months} mos`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    }
    return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
  };

  // Safe color indicator mapping
  // Green -> Low Risk (< 30)
  // Yellow -> Medium Risk (30 - 69)
  // Red -> High Risk (>= 70)
  const getRiskClassification = (prob: number) => {
    if (prob < 30) return { label: 'Low Risk', badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25', dotClass: 'bg-emerald-500' };
    if (prob < 70) return { label: 'Medium Risk', badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/25', dotClass: 'bg-amber-500' };
    return { label: 'High Risk', badgeClass: 'bg-rose-500/10 text-rose-500 border border-rose-500/25', dotClass: 'bg-rose-500' };
  };

  // Filter & Search Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // 1. Case-insensitive Search by Name or ID
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        customer.name.toLowerCase().includes(query) || 
        customer.id.toLowerCase().includes(query);

      // 2. Filter by PlanType
      const matchesPlan = 
        selectedPlanFilter === 'all' || 
        customer.planType.toLowerCase() === selectedPlanFilter.toLowerCase();

      // 3. Filter by Risk Label
      let matchesRisk = true;
      if (selectedRiskFilter !== 'all') {
        const prob = customer.churnProbability;
        if (selectedRiskFilter === 'low') matchesRisk = prob < 30;
        else if (selectedRiskFilter === 'medium') matchesRisk = prob >= 30 && prob < 70;
        else if (selectedRiskFilter === 'high') matchesRisk = prob >= 70;
      }

      return matchesSearch && matchesPlan && matchesRisk;
    });
  }, [customers, searchQuery, selectedPlanFilter, selectedRiskFilter]);

  // Sorting Process
  const sortedAndFilteredCustomers = useMemo(() => {
    const list = [...filteredCustomers];
    list.sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (sortBy === 'spend') {
        valA = a.rechargeAmount;
        valB = b.rechargeAmount;
      } else if (sortBy === 'tenure') {
        valA = a.tenure;
        valB = b.tenure;
      } else if (sortBy === 'risk') {
        valA = a.churnProbability;
        valB = b.churnProbability;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredCustomers, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'spend' | 'tenure' | 'risk') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Safe Insertion to ensure no duplicates and unique ID
  const handleAddNewSubscriberSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = newName.trim();
    if (!cleanName) {
      setFormError('Please provide a valid subscriber name.');
      return;
    }

    // Uniqueness constraint check (Case-insensitive name verify)
    const exists = customers.some(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      setFormError(`A subscriber with the identifier "${cleanName}" already exists. Please enter a unique name.`);
      return;
    }

    // Dynamic heuristic classifier calculations on the spot
    let score = 25; // baseline index
    if (newTenure < 6) score += 20;
    else if (newTenure < 18) score += 10;
    
    if (newSupport > 4) score += 30;
    else if (newSupport > 2) score += 15;

    if (newSpend > 100) score += 10;
    if (newUsage > 120) score += 10;

    const finalScore = Math.min(Math.max(score, 5), 98);
    const willChurn = finalScore >= 50;

    const mockRiskFactors = [];
    if (newTenure < 12) mockRiskFactors.push('Brief Tenure Anchor');
    if (newSupport > 3) mockRiskFactors.push('Extreme Support Friction');
    if (newSpend > 85) mockRiskFactors.push('High Premium Monthly Cost');

    const generatedId = 'TEL-' + Math.floor(100000 + Math.random() * 900000);

    const newCust: Customer = {
      id: generatedId,
      name: cleanName,
      tenure: newTenure,
      monthlyUsage: newUsage,
      rechargeAmount: newSpend,
      planType: newPlan,
      contractType: newTenure < 12 ? 'Month-to-month' : 'One year',
      supportCalls: newSupport,
      churnProbability: finalScore,
      willChurn,
      riskFactors: mockRiskFactors
    };

    onSaveCustomer(newCust);
    setNewName('');
    setFormError(null);
    setAddFormOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl font-sans">
        
        {/* Top Header Row of registry details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Subscriber Registry & Info Center
              <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/15">
                {sortedAndFilteredCustomers.length} Records Shown
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Manage, search, filter and inspect subscriber records directly. Values remain synchronized in memory and to Supabase database.
            </p>
          </div>

          <button
            onClick={() => setAddFormOpen(!addFormOpen)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-950 border border-blue-900/50 text-blue-400 hover:text-blue-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {addFormOpen ? <X className="w-3.5 h-3.5" /> : <FileCheck className="w-3.5 h-3.5" />}
            <span>{addFormOpen ? 'Close New Form' : 'Register Subscriber'}</span>
          </button>
        </div>

        {/* Dynamic add form overlay context inside customer page details as requested */}
        <AnimatePresence>
          {addFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <form onSubmit={handleAddNewSubscriberSubmit} className="bg-slate-950/80 border border-slate-850 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-900/60">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">New Subscriber Form (Auto-Unique ID Assigned)</span>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subscriber Name (Must Be Unique)</label>
                    <input
                      required
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Rachel Greene"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  {/* Plan selector */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Plan Level</label>
                    <select
                      value={newPlan}
                      onChange={(e) => setNewPlan(e.target.value as PlanType)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Unlimited">Unlimited</option>
                    </select>
                  </div>

                  {/* Tenure length slider */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tenure Length ({newTenure} months)</label>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={newTenure}
                      onChange={(e) => setNewTenure(Number(e.target.value))}
                      className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-900/60 pt-3">
                  {/* Monthly spend */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Monthly Spend (${newSpend} USD)</label>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      value={newSpend}
                      onChange={(e) => setNewSpend(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>

                  {/* Monthly Usage */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Monthly Usage ({newUsage} GB Data)</label>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={newUsage}
                      onChange={(e) => setNewUsage(Number(e.target.value))}
                      className="w-full accent-teal-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>

                  {/* Customer support requests */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Support Requests ({newSupport} total)</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={newSupport}
                      onChange={(e) => setNewSupport(Number(e.target.value))}
                      className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Confirm & Store Subscriber
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search, filters, sorting controls layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* Column A: Search */}
          <div className="lg:col-span-5 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subscriber by Name or Customer ID (case-insensitive)..."
              className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-slate-700 text-slate-200 text-xs pl-10 pr-4 py-3 rounded-xl transition"
            />
          </div>

          {/* Column B: Plan Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Plan:</span>
            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-350 text-xs rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="all">All Plan Levels</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>

          {/* Column C: Risk Filter */}
          <div className="lg:col-span-4 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Risk Zone:</span>
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-350 text-xs rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Green (Low Risk &lt; 30%)</option>
              <option value="medium">Yellow (Medium Risk 30-69%)</option>
              <option value="high">Red (High Risk ≥ 70%)</option>
            </select>
          </div>
        </div>

        {/* Sorted indicators guidance */}
        <div className="flex flex-wrap items-center gap-5 mb-4 text-[10px] text-slate-500 font-medium">
          <span>Sort options (Click header to toggle order):</span>
          <button 
            type="button" 
            onClick={() => toggleSort('name')} 
            className={`flex items-center gap-1 transition cursor-pointer ${sortBy === 'name' ? 'text-blue-400 font-bold' : 'hover:text-slate-400'}`}
          >
            Name {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button 
            type="button" 
            onClick={() => toggleSort('tenure')} 
            className={`flex items-center gap-1 transition cursor-pointer ${sortBy === 'tenure' ? 'text-blue-400 font-bold' : 'hover:text-slate-400'}`}
          >
            Tenure {sortBy === 'tenure' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button 
            type="button" 
            onClick={() => toggleSort('spend')} 
            className={`flex items-center gap-1 transition cursor-pointer ${sortBy === 'spend' ? 'text-blue-400 font-bold' : 'hover:text-slate-400'}`}
          >
            Spend {sortBy === 'spend' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button 
            type="button" 
            onClick={() => toggleSort('risk')} 
            className={`flex items-center gap-1 transition cursor-pointer ${sortBy === 'risk' ? 'text-blue-400 font-bold' : 'hover:text-slate-400'}`}
          >
            Churn Risk {sortBy === 'risk' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
          </button>
        </div>

        {/* Primary Customer Table registry info */}
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="py-4 px-4">Subscriber Name</th>
                <th className="py-4 px-4">Customer ID</th>
                <th className="py-4 px-4">Plan Type</th>
                <th className="py-4 px-4">Monthly Usage (Data)</th>
                <th className="py-4 px-4">Monthly Spend</th>
                <th className="py-4 px-4">Tenure duration</th>
                <th className="py-4 px-4">Support Requests</th>
                <th className="py-4 px-4">Churn Status</th>
                <th className="py-4 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {sortedAndFilteredCustomers.map((customer) => {
                const diagnosis = getRiskClassification(customer.churnProbability);
                return (
                  <tr key={customer.id} className="transition-colors hover:bg-slate-850/45">
                    {/* Subscriber Name */}
                    <td className="py-3 px-4 font-bold text-slate-250 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-[10px] text-blue-405 font-bold uppercase">
                        {customer.name.slice(0, 2)}
                      </div>
                      <span className="truncate max-w-[150px]" title={customer.name}>{customer.name}</span>
                    </td>

                    {/* Customer ID */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-500 text-[11px]">
                      {customer.id}
                    </td>

                    {/* Plan Type */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] uppercase font-bold text-slate-400 rounded-md">
                        {customer.planType}
                      </span>
                    </td>

                    {/* Monthly Usage */}
                    <td className="py-3 px-4">
                      <span className="text-teal-400 font-bold">{customer.monthlyUsage.toFixed(1)} GB</span>
                      <span className="text-[10px] text-slate-500 block">Cellular data & calls</span>
                    </td>

                    {/* Monthly Spend */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-500">
                      ${customer.rechargeAmount.toFixed(2)}
                    </td>

                    {/* Tenure (months/years) */}
                    <td className="py-3 px-4 text-slate-400 font-medium">
                      {formatTenure(customer.tenure)}
                      <span className="text-[9px] text-slate-600 block">({customer.tenure} total mos)</span>
                    </td>

                    {/* Support Requests */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block font-mono font-black text-xs px-2 py-0.5 rounded-full ${
                        customer.supportCalls >= 4 
                          ? 'bg-rose-500/10 text-rose-455 font-black border border-rose-500/15' 
                          : 'bg-slate-950 text-slate-400'
                      }`}>
                        {customer.supportCalls}
                      </span>
                    </td>

                    {/* Churn Status (Color code indicator) */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${diagnosis.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${diagnosis.dotClass} animate-pulse`} />
                        {diagnosis.label} ({customer.churnProbability}%)
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Remove subscriber "${customer.name}"?`)) {
                            onDeleteCustomer(customer.id);
                          }
                        }}
                        className="p-1.5 bg-slate-950 border border-slate-850 hover:border-rose-500/30 hover:text-rose-400 rounded-lg transition shrink-0 cursor-pointer text-slate-500"
                        title="Purge record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}

              {sortedAndFilteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-550 font-medium">
                    No results found matching search coordinates or filter state.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </motion.div>
  );
}
