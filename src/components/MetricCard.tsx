import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  trend?: {
    text: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  highlightColor?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlightColor = 'border-slate-800',
}: MetricCardProps) {
  const getTrendStyles = () => {
    if (!trend) return '';
    switch (trend.type) {
      case 'positive':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'negative':
        return 'text-rose-400 bg-rose-500/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden bg-slate-900 border ${highlightColor} rounded-2xl p-6 shadow-xl shadow-slate-950/40`}
    >
      {/* Decorative ambient glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-slate-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400 tracking-wide font-sans">{title}</span>
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-100 tracking-tight font-sans">
          {value}
        </span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getTrendStyles()}`}>
            {trend.text}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500 tracking-wide font-sans">{subtitle}</p>
    </motion.div>
  );
}
