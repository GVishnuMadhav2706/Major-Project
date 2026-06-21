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
    name: 'Aarav Sharma',
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
    name: 'Priya Iyer',
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
    name: 'Vikram Malhotra',
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
    name: 'Anjali Nair',
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
    name: 'Rohan Deshmukh',
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
    name: 'Sneha Reddy',
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
    name: 'Aditya Verma',
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
    name: 'Meera Joshi',
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
  {
    id: '9',
    name: 'Kabir Banerjee',
    tenure: 4,
    monthlyUsage: 12.5,
    rechargeAmount: 35,
    planType: 'Standard',
    contractType: 'Month-to-month',
    supportCalls: 2,
    churnProbability: 48,
    willChurn: false,
    riskFactors: ['Unanchored Plan (Month-to-month)', 'Fragile Lifecycle (Tenure ≤ 6 Months)'],
  },
  {
    id: '10',
    name: 'Diya Patwardhan',
    tenure: 24,
    monthlyUsage: 98.4,
    rechargeAmount: 90,
    planType: 'Premium',
    contractType: 'Two year',
    supportCalls: 1,
    churnProbability: 8,
    willChurn: false,
    riskFactors: ['Stable usage & high contract attachment'],
  },
  {
    id: '11',
    name: 'Arjun Rao',
    tenure: 1,
    monthlyUsage: 6.2,
    rechargeAmount: 60,
    planType: 'Standard',
    contractType: 'Month-to-month',
    supportCalls: 4,
    churnProbability: 82,
    willChurn: true,
    riskFactors: ['Support Distress (4+ Customer Service Calls)', 'Onset Period (New Customer ≤ 3 Months)'],
  },
  {
    id: '12',
    name: 'Kavita Gokhale',
    tenure: 14,
    monthlyUsage: 35.8,
    rechargeAmount: 55,
    planType: 'Standard',
    contractType: 'One year',
    supportCalls: 1,
    churnProbability: 18,
    willChurn: false,
    riskFactors: ['Stable usage & high contract attachment'],
  },
  {
    id: '13',
    name: 'Nehal Patel',
    tenure: 9,
    monthlyUsage: 18.4,
    rechargeAmount: 40,
    planType: 'Basic',
    contractType: 'Month-to-month',
    supportCalls: 3,
    churnProbability: 58,
    willChurn: true,
    riskFactors: ['High Support Friction (3 Calls)', 'Unanchored Plan (Month-to-month)'],
  },
  {
    id: '14',
    name: 'Rahul Saxena',
    tenure: 30,
    monthlyUsage: 120.5,
    rechargeAmount: 95,
    planType: 'Unlimited',
    contractType: 'Two year',
    supportCalls: 1,
    churnProbability: 5,
    willChurn: false,
    riskFactors: ['Stable usage & high contract attachment'],
  },
  {
    id: '15',
    name: 'Ishaan Kulkarni',
    tenure: 2,
    monthlyUsage: 45.0,
    rechargeAmount: 85,
    planType: 'Premium',
    contractType: 'Month-to-month',
    supportCalls: 3,
    churnProbability: 68,
    willChurn: true,
    riskFactors: ['High Support Friction (3 Calls)', 'Onset Period (New Customer)'],
  },
  {
    id: '16',
    name: 'Sanjana Sen',
    tenure: 18,
    monthlyUsage: 50.2,
    rechargeAmount: 45,
    planType: 'Standard',
    contractType: 'One year',
    supportCalls: 2,
    churnProbability: 22,
    willChurn: false,
    riskFactors: ['Stable usage & high contract attachment'],
  },
  {
    id: '17',
    name: 'Devendra Yadav',
    tenure: 1,
    monthlyUsage: 1.5,
    rechargeAmount: 30,
    planType: 'Basic',
    contractType: 'Month-to-month',
    supportCalls: 6,
    churnProbability: 95,
    willChurn: true,
    riskFactors: ['Fatal Support Distress (6+ Calls)', 'Onset Period (New Customer)'],
  },
  {
    id: '18',
    name: 'Yashvi Singhal',
    tenure: 25,
    monthlyUsage: 65.4,
    rechargeAmount: 70,
    planType: 'Unlimited',
    contractType: 'Two year',
    supportCalls: 1,
    churnProbability: 7,
    willChurn: false,
    riskFactors: ['Stable usage & high contract attachment'],
  },
  {
    id: '19',
    name: 'Harpreet Singh',
    tenure: 7,
    monthlyUsage: 15.0,
    rechargeAmount: 25,
    planType: 'Basic',
    contractType: 'Month-to-month',
    supportCalls: 2,
    churnProbability: 45,
    willChurn: false,
    riskFactors: ['Unanchored Plan (Month-to-month)'],
  },
  {
    id: '20',
    name: 'Amit Chaudhary',
    tenure: 5,
    monthlyUsage: 42.0,
    rechargeAmount: 50,
    planType: 'Standard',
    contractType: 'Month-to-month',
    supportCalls: 3,
    churnProbability: 60,
    willChurn: true,
    riskFactors: ['High Support Friction (3 Calls)', 'Unanchored Plan'],
  },
  {
    id: '21',
    name: 'Deepa Krishnan',
    tenure: 4,
    monthlyUsage: 22.0,
    rechargeAmount: 65,
    planType: 'Standard',
    contractType: 'Month-to-month',
    supportCalls: 4,
    churnProbability: 72,
    willChurn: true,
    riskFactors: ['High Support Friction (4 Calls)', 'Unanchored Plan'],
  },
  {
    id: '22',
    name: 'Manish Tripathi',
    tenure: 40,
    monthlyUsage: 110.5,
    rechargeAmount: 90,
    planType: 'Premium',
    contractType: 'Two year',
    supportCalls: 0,
    churnProbability: 3,
    willChurn: false,
    riskFactors: ['Loyal long-term premium customer'],
  },
  {
    id: '23',
    name: 'Vivek Aggarwal',
    tenure: 6,
    monthlyUsage: 8.4,
    rechargeAmount: 30,
    planType: 'Basic',
    contractType: 'Month-to-month',
    supportCalls: 3,
    churnProbability: 65,
    willChurn: true,
    riskFactors: ['Unanchored Month-to-month plan', 'Support friction'],
  },
  {
    id: '24',
    name: 'Tanvi Hegde',
    tenure: 16,
    monthlyUsage: 55.4,
    rechargeAmount: 40,
    planType: 'Basic',
    contractType: 'Two year',
    supportCalls: 1,
    churnProbability: 11,
    willChurn: false,
    riskFactors: ['Stable long-term active account'],
  },
  {
    id: '25',
    name: 'Rajeshwari Pillai',
    tenure: 2,
    monthlyUsage: 1.0,
    rechargeAmount: 75,
    planType: 'Standard',
    contractType: 'Month-to-month',
    supportCalls: 5,
    churnProbability: 88,
    willChurn: true,
    riskFactors: ['Severe support distress', 'High Premium Cost Weight'],
  },
  {
    id: '26',
    name: 'Sandeep Khurana',
    tenure: 12,
    monthlyUsage: 34.2,
    rechargeAmount: 45,
    planType: 'Standard',
    contractType: 'One year',
    supportCalls: 2,
    churnProbability: 32,
    willChurn: false,
    riskFactors: ['Moderate usage level'],
  },
  {
    id: '27',
    name: 'Kiran Bhatia',
    tenure: 3,
    monthlyUsage: 11.2,
    rechargeAmount: 25,
    planType: 'Basic',
    contractType: 'Month-to-month',
    supportCalls: 3,
    churnProbability: 55,
    willChurn: true,
    riskFactors: ['New user with rapid support calls', 'Unanchored Contract'],
  },
  {
    id: '28',
    name: 'Rakesh Mohanty',
    tenure: 48,
    monthlyUsage: 195.0,
    rechargeAmount: 120,
    planType: 'Premium',
    contractType: 'Two year',
    supportCalls: 1,
    churnProbability: 2,
    willChurn: false,
    riskFactors: ['Ultra loyal enterprise scale profile'],
  },
  {
    id: '29',
    name: 'Shruti Das',
    tenure: 6,
    monthlyUsage: 14.5,
    rechargeAmount: 30,
    planType: 'Basic',
    contractType: 'Month-to-month',
    supportCalls: 2,
    churnProbability: 40,
    willChurn: false,
    riskFactors: ['Flexible month contract, regular usage'],
  },
  {
    id: '30',
    name: 'Pranav Kapoor',
    tenure: 1,
    monthlyUsage: 4.8,
    rechargeAmount: 85,
    planType: 'Premium',
    contractType: 'Month-to-month',
    supportCalls: 4,
    churnProbability: 80,
    willChurn: true,
    riskFactors: ['Premium monthly flat cost mismatch', 'Frequent startup complaints'],
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

const FIRST_NAMES = ['Vihaan', 'Sai', 'Karan', 'Devika', 'Nehal', 'Meera', 'Rishi', 'Ishwar', 'Aniket', 'Geeta', 'Siddharth', 'Nikhil', 'Pooja', 'Rahul', 'Arvind', 'Sunita', 'Jaya', 'Shankar', 'Abhishek', 'Raj', 'Lata', 'Mohit', 'Kunal', 'Suresh', 'Ramesh', 'Harish', 'Gopal', 'Kailash', 'Devendra', 'Yashvi', 'Amit', 'Deepa', 'Manish', 'Vivek', 'Tanvi', 'Rajeshwari', 'Sandeep', 'Kiran', 'Rakesh', 'Shruti', 'Pranav'];
const LAST_NAMES = ['Sharma', 'Iyer', 'Malhotra', 'Nair', 'Deshmukh', 'Reddy', 'Verma', 'Joshi', 'Banerjee', 'Patwardhan', 'Rao', 'Gokhale', 'Patel', 'Saxena', 'Kulkarni', 'Sen', 'Yadav', 'Singhal', 'Singh', 'Chaudhary', 'Krishnan', 'Tripathi', 'Aggarwal', 'Hegde', 'Pillai', 'Khurana', 'Bhatia', 'Mohanty', 'Das', 'Kapoor'];

export function generateUniqueIndianName(existingNames: string[]): string {
  const existingSet = new Set(existingNames.map(n => n.toLowerCase()));
  for (let i = 0; i < 1000; i++) {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const candidate = `${fn} ${ln}`;
    if (!existingSet.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
  return `Indian Subscriber ${Math.floor(100 + Math.random() * 900)}`;
}
