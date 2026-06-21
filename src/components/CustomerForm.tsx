import { useState, useEffect, FormEvent } from 'react';
import { Customer, PlanType, ContractType } from '../types';
import { predictChurn } from '../utils/churnLogic';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Sparkles, UserPlus, Save, RotateCcw, AlertTriangle, Users } from 'lucide-react';

interface CustomerFormProps {
  selectedCustomer: Customer | null;
  onSave: (customer: Customer) => void;
  onClearSelection: () => void;
}

export default function CustomerForm({
  selectedCustomer,
  onSave,
  onClearSelection,
}: CustomerFormProps) {
  // State variables for form fields
  const [name, setName] = useState('');
  const [tenure, setTenure] = useState(12);
  const [monthlyUsage, setMonthlyUsage] = useState(45);
  const [rechargeAmount, setRechargeAmount] = useState(50);
  const [planType, setPlanType] = useState<PlanType>('Standard');
  const [contractType, setContractType] = useState<ContractType>('Month-to-month');
  const [supportCalls, setSupportCalls] = useState(2);

  // Sync state if an existing customer is selected for tweaking
  useEffect(() => {
    if (selectedCustomer) {
      setName(selectedCustomer.name);
      setTenure(selectedCustomer.tenure);
      setMonthlyUsage(selectedCustomer.monthlyUsage);
      setRechargeAmount(selectedCustomer.rechargeAmount);
      setPlanType(selectedCustomer.planType);
      setContractType(selectedCustomer.contractType);
      setSupportCalls(selectedCustomer.supportCalls);
    } else {
      // Set typical default characteristics for a new evaluation
      setName('');
      setTenure(6);
      setMonthlyUsage(15);
      setRechargeAmount(35);
      setPlanType('Standard');
      setContractType('Month-to-month');
      setSupportCalls(1);
    }
  }, [selectedCustomer]);

  // Run the classification logic in real-time based on local form states
  const livePrediction = predictChurn(
    tenure,
    monthlyUsage,
    rechargeAmount,
    planType,
    contractType,
    supportCalls
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Create random or incremental ID if new
    const finalId = selectedCustomer ? selectedCustomer.id : String(Date.now());
    const finalName = name.trim() || `Subscriber-${Math.floor(1000 + Math.random() * 9000)}`;

    const savedCustomer: Customer = {
      id: finalId,
      name: finalName,
      tenure,
      monthlyUsage,
      rechargeAmount,
      planType,
      contractType,
      supportCalls,
      ...livePrediction, // merges churnProbability, willChurn, riskFactors
    };

    onSave(savedCustomer);
    // Reset form after saving new subscriber
    if (!selectedCustomer) {
      setName('');
      setTenure(12);
      setMonthlyUsage(45);
      setRechargeAmount(55);
      setPlanType('Standard');
      setContractType('Month-to-month');
      setSupportCalls(1);
    }
  };

  // Preset quick fill options for dynamic simulator education
  const applyPreset = (type: 'loyal-vip' | 'supportive-churner' | 'idle-overpaying') => {
    switch (type) {
      case 'loyal-vip':
        setName('VIP Subscriber Simulation');
        setTenure(48);
        setMonthlyUsage(185);
        setRechargeAmount(110);
        setPlanType('Unlimited');
        setContractType('Two year');
        setSupportCalls(0);
        break;
      case 'supportive-churner':
        setName('Frustrated User Simulation');
        setTenure(2);
        setMonthlyUsage(8);
        setRechargeAmount(65);
        setPlanType('Premium');
        setContractType('Month-to-month');
        setSupportCalls(6);
        break;
      case 'idle-overpaying':
        setName('Overspending Inactive Simulation');
        setTenure(5);
        setMonthlyUsage(1.2);
        setRechargeAmount(70);
        setPlanType('Premium');
        setContractType('Month-to-month');
        setSupportCalls(3);
        break;
    }
  };

  // Determine indicator colors depending on risk probability
  const getRiskColorClass = (prob: number) => {
    if (prob < 30) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (prob < 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
  };

  const getGaugeStrokeColor = (prob: number) => {
    if (prob < 30) return '#10b981'; // emerald-500
    if (prob < 70) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  // Circular gauge config
  const gaugeRadius = 42;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const strokeDashoffsetGauge = gaugeCircumference - (livePrediction.churnProbability / 100) * gaugeCircumference;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl w-full">
      {/* Workshop Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5 mb-5 font-sans">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${selectedCustomer ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-500/15 text-blue-400'}`}>
              {selectedCustomer ? <Sparkles className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h3 className="text-base font-semibold text-slate-100 font-sans tracking-wide">
              {selectedCustomer ? 'Subscriber Tweaking Simulator' : 'New Subscriber Risk Predictor'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedCustomer 
              ? `Adjust slider variables for ${selectedCustomer.name} to simulate retention efforts`
              : 'Enter parameters of a hypothetical subscriber to test retention probability'}
          </p>
        </div>

        {/* Demo presets */}
        {!selectedCustomer && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('loyal-vip')}
              className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 transition duration-150 cursor-pointer"
            >
              Preset: Loyal VIP
            </button>
            <button
              type="button"
              onClick={() => applyPreset('supportive-churner')}
              className="text-[10px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg px-2.5 py-1.5 transition duration-150 cursor-pointer"
            >
              Preset: Friction Churn
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8 font-sans">
        {/* Left Column: Form Controls (xl:span-7) */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          {/* Subscriber Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Subscriber Identifier / Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Plan Type Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Plan Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Basic', 'Standard', 'Premium', 'Unlimited'] as PlanType[]).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setPlanType(plan)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border text-center transition cursor-pointer ${
                      planType === plan
                        ? 'bg-blue-600 border-blue-500 text-slate-100 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            {/* Contract Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Contract Lock-In
              </label>
              <div className="flex flex-col gap-2">
                {(['Month-to-month', 'One year', 'Two year'] as ContractType[]).map((contract) => (
                  <button
                    key={contract}
                    type="button"
                    onClick={() => setContractType(contract)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      contractType === contract
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span>{contract}</span>
                    {contractType === contract && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sliders Container */}
          <div className="bg-slate-950 border border-slate-800/50 p-5 rounded-xl flex flex-col gap-5">
            {/* Tenure Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-400">Tenure (Length of service)</span>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded">
                  {tenure} {tenure === 1 ? 'Month' : 'Months'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="72"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                <span>1 mo</span>
                <span>3 yr</span>
                <span>6 yr</span>
              </div>
            </div>

            {/* Monthly Usage Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-400">Monthly High-Speed Data</span>
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/5 border border-teal-500/10 px-2 py-0.5 rounded">
                  {monthlyUsage.toFixed(1)} GB
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="0.5"
                value={monthlyUsage}
                onChange={(e) => setMonthlyUsage(Number(e.target.value))}
                className="w-full accent-teal-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                <span>0 GB</span>
                <span>125 GB</span>
                <span>250 GB</span>
              </div>
            </div>

            {/* Support Calls Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-400">Customer Support Queries</span>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded">
                  {supportCalls} {supportCalls === 1 ? 'Incident' : 'Incidents'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={supportCalls}
                onChange={(e) => setSupportCalls(Number(e.target.value))}
                className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                <span>0 Calls (Happy)</span>
                <span>5 Calls (Friction)</span>
                <span>10 Calls (Critical)</span>
              </div>
            </div>

            {/* Monthly Recharge Amount */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-400">Average Monthly Spend</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded">
                  ${rechargeAmount} USD
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(Number(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                <span>$10</span>
                <span>$80</span>
                <span>$150</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Scorecard Display (xl:span-5) */}
        <div className="xl:col-span-5 flex flex-col justify-between gap-6 border-t xl:border-t-0 xl:border-l border-slate-800/85 pt-6 xl:pt-0 xl:pl-8">
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-widest font-sans mb-4">
              Real-Time Prognosis Card
            </span>

            {/* Glowing speedo-meter ring */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800/60 rounded-2xl relative overflow-hidden shadow-lg mb-4">
              {/* Outer faint background glow representing risk */}
              <div
                className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundColor: getGaugeStrokeColor(livePrediction.churnProbability),
                  filter: 'blur(30px)',
                }}
              />

              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={gaugeRadius}
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={gaugeRadius}
                    fill="transparent"
                    stroke={getGaugeStrokeColor(livePrediction.churnProbability)}
                    strokeWidth="8"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={strokeDashoffsetGauge}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                  <span className="text-3xl font-extrabold text-slate-50 tracking-tight">
                    {livePrediction.churnProbability}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Defection Risk
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="text-center font-sans">
                {livePrediction.willChurn ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="flex items-center gap-1 text-rose-500 font-extrabold text-xs tracking-wider uppercase bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      Prediction: Churn Risk (Yes)
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mt-1.5 leading-relaxed">
                      This subscriber features a dangerous retention index and might leave soon.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="flex items-center gap-1 text-emerald-400 font-extrabold text-xs tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      Prediction: Stable Subscriber (No)
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mt-1.5 leading-relaxed">
                      Sufficiently anchored. Retention priority level is marked low.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Active Danger Factors tags list */}
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                Computed Active Churn Drivers
              </span>
              
              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                {livePrediction.riskFactors.map((factor, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={factor}
                    className={`flex items-start gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium ${
                      livePrediction.willChurn
                        ? 'bg-rose-500/5 text-rose-400 border-rose-500/10'
                        : 'bg-slate-950 text-emerald-400 border-slate-900'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-rose-500 shrink-0" />
                    <span>{factor}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Save & Reset buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-6 border-t border-slate-800/40 pt-4">
            <button
              type="submit"
              className={`flex-1 flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-xl transition cursor-pointer shadow-lg ${
                selectedCustomer
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 hover:shadow-amber-500/15'
                  : 'bg-blue-600 text-slate-100 hover:bg-blue-500 hover:shadow-blue-500/15'
              }`}
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>
                {selectedCustomer ? 'Commit Simulated Updates' : 'Add to Subscriber List'}
              </span>
            </button>
            
            {selectedCustomer ? (
              <button
                type="button"
                onClick={onClearSelection}
                className="flex items-center justify-center gap-2 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-400 text-sm px-4 py-3 rounded-xl transition cursor-pointer"
              >
                Cancel Simulation
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setName('');
                  setTenure(12);
                  setMonthlyUsage(45);
                  setRechargeAmount(55);
                  setPlanType('Standard');
                  setContractType('Month-to-month');
                  setSupportCalls(1);
                }}
                className="flex items-center justify-center gap-2 border border-slate-800 hover:bg-slate-850 text-slate-400 text-xs px-4 py-3 rounded-xl transition cursor-pointer"
                title="Reset sliders back to typical default states"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Reset Parameters</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
