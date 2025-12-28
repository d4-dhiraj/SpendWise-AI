
export enum Category {
  FOOD = 'Food',
  TRAVEL = 'Travel',
  FUN = 'Fun',
  ACADEMIC = 'Academic',
  OTHER = 'Other'
}

export type TransactionType = 'credit' | 'debit';

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: Category;
  type: TransactionType;
  date: string;
  rawSms: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    url?: string;
  };
}

export interface ClassificationResponse {
  amount: number;
  merchant: string;
  category: Category;
  type: TransactionType;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    url?: string;
  };
}

export interface ComparisonData {
  category: Category;
  userAmount: number;
  peerAmount: number;
  insight: string;
}

export interface RunwayAnalysis {
  zeroDate: string;
  daysRemaining: number;
  burnRatePerDay: number;
  warningLevel: number;
  advice: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentSaved: number;
  deadline?: string;
}

export interface GoalStrategy {
  itemToSkip: string;
  avgCostPerItem: number;
  skipsRequired: number;
  encouragement: string;
}
