import { useState } from 'react';
import { Customer, PlanType } from '../types';
import { Search, Flame, ShieldAlert, Sparkles, Trash2, Filter, AlertCircle, HelpCircle } from 'lucide-react';

interface CustomerTableProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelectCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function CustomerTable({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onDeleteCustomer,
}: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'loyal' | 'warning' | 'critical'>('all');

  // Filter list of subscribers dynamically
  const filteredCustomers = customers.filter((customer) => {
    // 1. Name search match
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Risk category classification
    let matchesRisk = true;
    if (riskFilter === 'loyal') {
      matchesRisk = customer.churnProbability < 30;
    } else if (riskFilter === 'warning') {
      matchesRisk = customer.churnProbability >= 30 && customer.churnProbability < 70;
    } else if (riskFilter === 'critical') {
      matchesRisk = customer.churnProbability >= 70;
    }

    return matchesSearch && matchesRisk;
  });

  // Calculate badges and colors for risk probability
  const getRiskBadgeStyles = (prob: number) => {
    if (prob < 30) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15';
    } else if (prob < 70) {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/15';
    } else {
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/15';
    }
  };

  const getContractBadge = (contract: string) => {
    switch (contract) {
      case 'Two year':
        return 'text-sky-300 bg-sky-950/40 border-sky-800/30';
      case 'One year':
        return 'text-indigo-300 bg-indigo-950/40 border-indigo-800/30';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const getPlanIconColor = (plan: PlanType) => {
    switch (plan) {
      case 'Unlimited':
        return 'text-yellow-400 bg-yellow-400/5 border border-yellow-400/10';
      case 'Premium':
        return 'text-purple-400 bg-purple-400/5 border border-purple-400/10';
      case 'Standard':
        return 'text-blue-400 bg-blue-400/5 border border-blue-400/10';
      default:
        return 'text-slate-400 bg-slate-400/5 border border-slate-800';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl w-full">
      {/* Grid Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6 font-sans">
        <div>
          <h3 className="text-base font-semibold text-slate-100 tracking-wide font-sans">
            Active Subscriber Registry
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Manage your customer database, inspect risk classifications, and trigger simulated workshops
          </p>
        </div>

        {/* Searching & Filtering inputs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Searching */}
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subscriber name..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition"
            />
          </div>

          {/* Filtering */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setRiskFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                riskFilter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setRiskFilter('loyal')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                riskFilter === 'loyal' ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/10' : 'text-slate-500 hover:text-emerald-400'
              }`}
            >
              Loyal
            </button>
            <button
              onClick={() => setRiskFilter('warning')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                riskFilter === 'warning' ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/10' : 'text-slate-500 hover:text-amber-400'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setRiskFilter('critical')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                riskFilter === 'critical' ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-500/10' : 'text-slate-500 hover:text-rose-400'
              }`}
            >
              Critical
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid table */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-850/60">
        <table className="w-full min-w-[850px] border-collapse text-left font-sans text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-4 px-4.5">Subscriber Identifier</th>
              <th className="py-4 px-4.5">Plan Hierarchy</th>
              <th className="py-4 px-4.5">Engagement Metrics</th>
              <th className="py-4 px-4.5">Anchor Value</th>
              <th className="py-4 px-4.5 text-center">Friction Calls</th>
              <th className="py-4 px-4.5 text-center">Defection Risk</th>
              <th className="py-4 px-4.5 text-right">Adjustment Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 bg-slate-900/60">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-700" />
                    <span>No subscribers match your search parameter.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => {
                const isSelected = selectedCustomerId === customer.id;
                return (
                  <tr
                    key={customer.id}
                    className={`transition-colors hover:bg-slate-850/40 ${
                      isSelected ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''
                    }`}
                  >
                    {/* ID & Name */}
                    <td className="py-4 px-4.5">
                      <div className="font-semibold text-slate-150 text-sm">{customer.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">ID: {customer.id}</div>
                    </td>

                    {/* Plan Hierarchy */}
                    <td className="py-4 px-4.5">
                      <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${getPlanIconColor(customer.planType)}`}>
                        {customer.planType}
                      </span>
                    </td>

                    {/* Engagement Metrics (Usage, Tenure) */}
                    <td className="py-4 px-4.5">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <div>
                          <span className="text-slate-400">Tenure: </span>
                          <span className="text-slate-200 font-bold">{customer.tenure} mos</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Usage: </span>
                          <span className="text-teal-400 font-mono font-bold">{customer.monthlyUsage.toFixed(1)} GB</span>
                        </div>
                      </div>
                    </td>

                    {/* Anchor Value (Recharge, Contract) */}
                    <td className="py-4 px-4.5">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <div className="text-amber-400 font-mono font-bold">${customer.rechargeAmount}/mo</div>
                        <span className={`inline-block text-[9px] font-semibold tracking-wide border border-slate-850 px-2 py-0.5 rounded-full shrink-0 w-max ${getContractBadge(customer.contractType)}`}>
                          {customer.contractType}
                        </span>
                      </div>
                    </td>

                    {/* Friction Calls */}
                    <td className="py-4 px-4.5 text-center">
                      <span
                        className={`inline-block font-mono font-bold px-2.5 py-1 rounded-full text-xs ${
                          customer.supportCalls >= 5
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            : customer.supportCalls >= 3
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                            : 'bg-slate-950 text-slate-400 border border-slate-850'
                        }`}
                      >
                        {customer.supportCalls}
                      </span>
                    </td>

                    {/* Defection Risk Meter & Classification */}
                    <td className="py-4 px-4.5 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide leading-none ${getRiskBadgeStyles(customer.churnProbability)}`}>
                          {customer.willChurn ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          <span>{customer.willChurn ? 'Churn' : 'Loyal'}</span>
                          <span>•</span>
                          <span className="font-mono">{customer.churnProbability}%</span>
                        </span>
                        
                        {/* Compact load bar */}
                        <div className="w-24 bg-slate-950 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-900">
                          <div
                            style={{ width: `${customer.churnProbability}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              customer.churnProbability < 30
                                ? 'bg-emerald-500'
                                : customer.churnProbability < 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action controls */}
                    <td className="py-4 px-4.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectCustomer(customer)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-350 bg-slate-950 border border-slate-800 rounded-lg hover:border-amber-500 hover:text-amber-400 transition cursor-pointer font-semibold ${
                            isSelected ? 'bg-amber-500/10 border-amber-500 text-amber-400' : ''
                          }`}
                          title="Load subscriber into adjustment sliders above"
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                          <span>Simulation</span>
                        </button>
                        <button
                          onClick={() => onDeleteCustomer(customer.id)}
                          className="p-1.5 text-slate-500 bg-slate-950 border border-slate-800 rounded-lg hover:border-rose-550 hover:bg-rose-950/15 hover:text-rose-400 transition cursor-pointer"
                          title="Purge subscriber from registry"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Grid Summary Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans mt-4.5">
        <div>
          Showing <span className="font-semibold text-slate-400">{filteredCustomers.length}</span> of{' '}
          <span className="font-semibold text-slate-400">{customers.length}</span> recorded subscribers
        </div>
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] text-slate-600 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1.5 mr-0.5" /> Normal Retained
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block ml-2 mr-0.5" /> High Risk Churn
        </div>
      </div>
    </div>
  );
}
