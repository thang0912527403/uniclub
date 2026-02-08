export interface DashboardStats {
  newCustomers: number;
  newCustomersGoal: number;
  totalIncome: number;
  incomeChange: number;
}

export interface RevenueData {
  day: string;
  value1: number;
  value2: number;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  amount?: string;
  type: 'payment' | 'sale' | 'task';
}

export interface Product {
  id: string;
  name: string;
  assigned: string;
  progress: number;
  priority: 'High' | 'Medium' | 'Low';
  budget: string;
}
