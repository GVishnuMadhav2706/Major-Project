import { Customer, PlanType, ContractType, ChurnPredictionResult, DashboardStats } from '../types';

/**
 * High-fidelity heuristic classification engine for Telecom Churn.
 * Returns a risk score and identified churn driver tags based on input characteristics.
 */
export function predictChurn(
  tenure: number,
  monthlyUsage: number,
  rechargeAmount: number,
  planType: PlanType,
  contractType: ContractType,
  supportCalls: number
): ChurnPredictionResult {
  let score = 20; // baseline neutral score
  const factors: string[] = [];

  // 1. Support Calls (Highly sensitive friction indicator)
  if (supportCalls >= 5) {
    score += 40;
    factors.push('Support Distress (5+ Customer Service Calls)');
  } else if (supportCalls >= 3) {
    score += 22;
    factors.push('High Support Friction (3-4 Calls)');
  } else if (supportCalls <= 1) {
    score -= 10;
  }

  // 2. Customer Tenure Onboarding Risk
  if (tenure <= 3) {
    score += 25;
    factors.push('Onset Period (New Customer ≤ 3 Months)');
  } else if (tenure <= 6) {
    score += 15;
    factors.push('Fragile Lifecycle (Tenure ≤ 6 Months)');
  } else if (tenure >= 24) {
    score -= 20; // highly loyal
  } else if (tenure >= 12) {
    score -= 10;
  }

  // 3. Contract Type Anchor
  if (contractType === 'Month-to-month') {
    score += 18;
    factors.push('Unanchored Plan (Month-to-month)');
  } else if (contractType === 'Two year') {
    score -= 25;
  } else if (contractType === 'One year') {
    score -= 10;
  }

  // 4. Usage vs Spend (Value Inefficiency)
  // Low usage but paying high recharge. 
  if (monthlyUsage < 4 && rechargeAmount >= 45) {
    score += 15;
    factors.push('Underutilization Slip (Low usage with high flat costs)');
  }
  
  // High cost contract-free
  if (rechargeAmount >= 75 && contractType === 'Month-to-month') {
    score += 12;
    factors.push('High Premium Pre-Pay Cost Weight');
  }

  // Active user loyalty offset
  if (monthlyUsage > 80 && tenure > 10) {
    score -= 12;
  }

  // Keep score within bounds of [2, 98] to maintain analytical realism
  score = Math.max(2, Math.min(98, score));
  
  const willChurn = score >= 50;

  if (factors.length === 0) {
    if (willChurn) {
      factors.push('Compound customer friction profiles');
    } else {
      factors.push('Stable usage & high contract attachment');
    }
  }

  return {
    churnProbability: Math.round(score),
    willChurn,
    riskFactors: factors,
  };
}

/**
 * Starter mock telecom subscriber base.
 */
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    tenure: 2,
    monthlyUsage: 3.5,
    rechargeAmount: 45,
    planType: 'Standard',
    contractType: 'Month-to-month',
    supportCalls: 5,
    churnProbability: 85,
    willChurn: true,
    riskFactors: ['Support Distress (5+ Customer Service Calls)', 'Onset Period (New Customer ≤ 3 Months)', 'Unanchored Plan (Month-to-month)', 'Underutilization Slip (Low usage with high flat costs)'],
  },
  {
    id: '2',
    name: 'Michael Chen',
    tenure: 38,
    monthlyUsage: 145.2,
    rechargeAmount: 95,
    planType: 'Unlimited',
    contractType: 'Two year',
    supportCalls: 1,
    churnProbability: 5,
    willChurn: false,
    riskFactors: ['Stable usage & high contract attachment'],
  },
  {
    id: '3',
    name: 'Elena Rostova',
    tenure: 8,
    monthlyUsage: 12.0,
    rechargeAmount: 70,
    planType: 'Premium',
    contractType: 'Month-to-month',
    supportCalls: 3,
    churnProbability: 62,
    willChurn: true,
    riskFactors: ['High Support Friction (3-4 Calls)', 'Unanchored Plan (Month-to-month)'],
  },
  {
    id: '4',
    name: 'Marcus Vance',
    tenure: 15,
    monthlyUsage: 8.5,
    rechargeAmount: 20,
    planType: 'Basic',
    contractType: 'One year',
    supportCalls: 0,
    churnProbability: 12,
    willChurn: false,
    riskFactors: ['Stable usage & high contract attachment'],
  },
  {
    id: '5',
    name: 'Chloe Dubois',
    tenure: 1,
    monthlyUsage: 0.8,
    rechargeAmount: 50,
    planType: 'Basic',
    contractType: 'Month-to-month',
    supportCalls: 4,
    churnProbability: 95,
    willChurn: true,
    riskFactors: ['Support Distress (5+ Customer Service Calls)', 'Onset Period (New Customer ≤ 3 Months)', 'Unanchored Plan (Month-to-month)', 'Underutilization Slip (Low usage with high flat costs)'],
  },
  {
    id: '6',
    name: 'David Miller',
    tenure: 14,
    monthlyUsage: 45.0,
    rechargeAmount: 40,
    planType: 'Standard',
    contractType: 'One year',
    supportCalls: 2,
    churnProbability: 25,
    willChurn: false,
    riskFactors: ['Stable usage & high contract attachment'],
  },
  {
    id: '7',
    name: 'Priya Patel',
    tenure: 29,
    monthlyUsage: 85.6,
    rechargeAmount: 80,
    planType: 'Premium',
    contractType: 'Two year',
    supportCalls: 0,
    churnProbability: 4,
    willChurn: false,
    riskFactors: ['Stable usage & high contract attachment'],
  },
  {
    id: '8',
    name: 'Jordan Smith',
    tenure: 5,
    monthlyUsage: 5.0,
    rechargeAmount: 75,
    planType: 'Premium',
    contractType: 'Month-to-month',
    supportCalls: 3,
    churnProbability: 75,
    willChurn: true,
    riskFactors: ['High Support Friction (3-4 Calls)', 'Fragile Lifecycle (Tenure ≤ 6 Months)', 'Unanchored Plan (Month-to-month)', 'High Premium Pre-Pay Cost Weight'],
  },
];

/**
 * Calculates dashboard-wide aggregate metrics.
 */
export function calculateStats(customers: Customer[]): DashboardStats {
  const totalCustomers = customers.length;
  if (totalCustomers === 0) {
    return { totalCustomers: 0, churnCount: 0, churnRate: 0, averageTenure: 0, highRiskCount: 0 };
  }

  const churnCount = customers.filter(c => c.willChurn).length;
  const churnRate = Math.round((churnCount / totalCustomers) * 100);
  const averageTenure = Math.round(customers.reduce((sum, c) => sum + c.tenure, 0) / totalCustomers * 10) / 10;
  const highRiskCount = customers.filter(c => c.churnProbability >= 75).length;

  return {
    totalCustomers,
    churnCount,
    churnRate,
    averageTenure,
    highRiskCount,
  };
}
