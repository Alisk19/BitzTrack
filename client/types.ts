export interface Order {
  id: string;
  customerId: string;
  customer: string; // Name for display
  productName: string;
  quantity: number;
  pricePerUnit: number;
  amount: number; // Total Pricing
  rawMaterialType: string;
  rawMaterialColor: string;
  failedProducts: number;
  date: string;
  status: string;
  paid: number;
  pending: number;
  deliveryDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate: string;
  avatarLetter: string;
}

export interface Material {
  id: number;
  name: string;
  dealerName: string;
  materialType: string;
  quantity: number;
  unit: string;
  receiveDate: string;
  paymentStatus: 'Paid' | 'Pending' | 'Unpaid';
  paidBy: string;
  icon?: string;
}

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  period: string;
}

export interface Expense {
  id: string;
  paidBy: string;
  expenseType: 'Rent' | 'Light Bill' | 'Other';
  amount: number;
  date: string;
  notes: string;
}