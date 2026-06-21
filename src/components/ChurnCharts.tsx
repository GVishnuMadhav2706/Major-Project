import { useState } from 'react';
import { Customer } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ChurnChartsProps {
  customers: Customer[];
}

export default function ChurnCharts({ customers }: ChurnChartsProps) {
  const [hoveredSegment, setHoveredSegment] = useState<'churn' | 'loyal' | null>(null);

  const total = customers.length;
  const churnList = customers.filter((c) => c.willChurn);
  const loyalList = customers.filter((c) => !c.willChurn);

  const churnCount = churnList.length;
  const loyalCount = loyalList.length;

  const churnPercent = total > 0 ? Math.round((churnCount / total) * 100) : 0;
  const loyalPercent = total > 0 ? Math.round((loyalCount / total) * 100) : 0;

  // Pie chart calculations (Radius 50)
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  const strokeDashoffsetLoyal = circumference - (loyalPercent / 100) * circumference;
  const strokeDashoffsetChurn = circumference - (churnPercent / 100) * circumference;

  // Segments calculations by risk tier
  // Low: < 30%, Mid: 30%-69%, High: >= 70%
  const lowRiskList = customers.filter((c) => c.churnProbability < 30);
  const midRiskList = customers.filter((c) => c.churnProbability >= 30 && c.churnProbability < 70);
  const highRiskList = customers.filter((c) => c.churnProbability >= 70);

  const lowPercentage = total > 0 ? (lowRiskList.length / total) * 100 : 0;
  const midPercentage = total > 0 ? (midRiskList.length / total) * 100 : 0;
  const highPercentage = total > 0 ? (highRiskList.length / total) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Chart 1: Donut Churn / Retention Proportion */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
      >
        <div>
          <h3 className="text-base font-semibold text-slate-100 font-sans tracking-wide">
            Subscriber Retention Ratio
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Breakdown of predicted churn (Yes) vs committed loyalty (No)
          </p>
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm font-sans">
            No subscriber data available to plot metrics.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around py-6 gap-6">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* SVG Ring Donut */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth="14"
                />
                
                {/* Loyal Segment (Emerald Green) */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffsetLoyal}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out cursor-pointer hover:stroke-[16px]"
                  onMouseEnter={() => setHoveredSegment('loyal')}
                  onMouseLeave={() => setHoveredSegment(null)}
                />

                {/* Churn Segment (Rose Pink), Rotated to start exactly where Loyal segment ends */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffsetChurn}
                  strokeLinecap="round"
                  // Rotate by the loyal percent to start exactly there
                  transform={`rotate(${(loyalPercent / 100) * 360} 70 70)`}
                  className="transition-all duration-700 ease-out cursor-pointer hover:stroke-[16px]"
                  onMouseEnter={() => setHoveredSegment('churn')}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              </svg>

              {/* Central Information display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                  {hoveredSegment === 'churn' ? (
                    <motion.div
                      key="churnText"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center"
                    >
                      <span className="text-3xl font-bold text-rose-500 font-sans tracking-tight">
                        {churnPercent}%
                      </span>
                      <p className="text-[10px] text-rose-400 font-semibold tracking-wider uppercase font-sans">
                        Churn Risk
                      </p>
                    </motion.div>
                  ) : hoveredSegment === 'loyal' ? (
                    <motion.div
                      key="loyalText"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center"
                    >
                      <span className="text-3xl font-bold text-emerald-400 font-sans tracking-tight">
                        {loyalPercent}%
                      </span>
                      <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase font-sans">
                        Loyal Base
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="defaultText"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <span className="text-3xl font-bold text-slate-100 font-sans tracking-tight">
                        {total}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase font-sans">
                        Subscribers
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Labels and Legends */}
            <div className="flex flex-col gap-4 font-sans max-w-[180px] w-full">
              {/* Loyal Legend */}
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  hoveredSegment === 'loyal' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'border border-transparent'
                }`}
                onMouseEnter={() => setHoveredSegment('loyal')}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">Retention No-Churn</span>
                </div>
                <div className="flex items-baseline justify-between mt-1 pl-4.5">
                  <span className="text-lg font-bold text-slate-100">{loyalCount} subs</span>
                  <span className="text-xs text-emerald-400 font-semibold">{loyalPercent}%</span>
                </div>
              </div>

              {/* Churn Legend */}
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  hoveredSegment === 'churn' ? 'bg-rose-500/10 border border-rose-500/20' : 'border border-transparent'
                }`}
                onMouseEnter={() => setHoveredSegment('churn')}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">Predicted Churn</span>
                </div>
                <div className="flex items-baseline justify-between mt-1 pl-4.5">
                  <span className="text-lg font-bold text-slate-100">{churnCount} subs</span>
                  <span className="text-xs text-rose-400 font-semibold">{churnPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Chart 2: Custom Horizontal Segmented Risk Distribution Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
      >
        <div>
          <h3 className="text-base font-semibold text-slate-100 font-sans tracking-wide">
            Subscribers Risk Segment
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Segmentation divided into Minimal, Warning, and Critical hazard zones
          </p>
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm font-sans">
            No subscriber data available to plot metrics.
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-6 py-4">
            {/* Visual Bar Container */}
            <div className="w-full flex h-6 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-900">
              {/* Minimal Risk Segment */}
              {lowPercentage > 0 && (
                <div
                  style={{ width: `${lowPercentage}%` }}
                  className="h-full bg-linear-to-r from-teal-500 to-emerald-500 relative group transition-all duration-500 hover:brightness-110 active:scale-95"
                  title={`Safe Score Segment: ${lowRiskList.length} Subscribers`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity">
                    {Math.round(lowPercentage)}%
                  </span>
                </div>
              )}

              {/* Warning Risk Segment */}
              {midPercentage > 0 && (
                <div
                  style={{ width: `${midPercentage}%` }}
                  className="h-full bg-linear-to-r from-amber-500 to-orange-500 relative group transition-all duration-500 hover:brightness-110 active:scale-95"
                  title={`Moderate Score Warning Segment: ${midRiskList.length} Subscribers`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity">
                    {Math.round(midPercentage)}%
                  </span>
                </div>
              )}

              {/* Critical Risk Segment */}
              {highPercentage > 0 && (
                <div
                  style={{ width: `${highPercentage}%` }}
                  className="h-full bg-linear-to-r from-rose-500 to-crimson-600 relative group transition-all duration-500 hover:brightness-110 active:scale-95"
                  title={`Critical Risk Segment: ${highRiskList.length} Subscribers`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity">
                    {Math.round(highPercentage)}%
                  </span>
                </div>
              )}
            </div>

            {/* Risk Tier Detailed Stats */}
            <div className="grid grid-cols-3 gap-2.5 font-sans mt-2">
              {/* Minimal */}
              <div className="bg-slate-950/60 border border-slate-800/40 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-400">Minimal Risk</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">Score &lt; 30%</p>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-base font-bold text-slate-100">{lowRiskList.length}</span>
                  <span className="text-xs text-emerald-400 font-semibold">{Math.round(lowPercentage)}%</span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-slate-950/60 border border-slate-800/40 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-400">Warning Zone</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">Score 30-69%</p>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-base font-bold text-slate-100">{midRiskList.length}</span>
                  <span className="text-xs text-amber-500 font-semibold">{Math.round(midPercentage)}%</span>
                </div>
              </div>

              {/* Critical */}
              <div className="bg-slate-950/60 border border-slate-800/40 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-400">Critical Threat</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">Score ≥ 70%</p>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-base font-bold text-slate-100">{highRiskList.length}</span>
                  <span className="text-xs text-rose-500 font-semibold">{Math.round(highPercentage)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
