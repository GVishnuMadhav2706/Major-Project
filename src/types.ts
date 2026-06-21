export type PlanType = 'Basic' | 'Standard' | 'Premium' | 'Unlimited';
export type ContractType = 'Month-to-month' | 'One year' | 'Two year';

export interface Customer {
  id: string;
  name: string;
  tenure: number; // in months
  monthlyUsage: number; // in GB
  rechargeAmount: number; // in USD
  planType: PlanType;
  contractType: ContractType;
  supportCalls: number; // count
  
  // Prediction output fields
  churnProbability: number; // 0 to 100
  willChurn: boolean;
  riskFactors: string[];
}

export interface ChurnPredictionResult {
  churnProbability: number;
  willChurn: boolean;
  riskFactors: string[];
}

export interface DashboardStats {
  totalCustomers: number;
  churnCount: number;
  churnRate: number; // %
  averageTenure: number; // months
  highRiskCount: number; // score >= 75
}
