// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  fullName: string | null;
  role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
  companyId: number;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

// ─── Company ─────────────────────────────────────────────────────────────────

export interface Company {
  id: number;
  name: string;
  cui: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface Client {
  id: number;
  companyId: number;
  name: string;
  cui: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

// ─── Invoice ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'CANCELED';

export interface Invoice {
  id: number;
  companyId: number;
  clientId: number;
  series: string | null;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  totalAmount: string;
  status: InvoiceStatus;
  notes: string | null;
  createdAt: string;
  client?: Client;
  payments?: Payment[];
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export type PaymentMethod = 'BANK' | 'CASH' | 'CARD' | 'OTHER';

export interface Payment {
  id: number;
  invoiceId: number;
  amount: string;
  paidAt: string;
  method: PaymentMethod;
  reference: string | null;
  createdAt: string;
  invoice?: Invoice;
}

// ─── Reminder ────────────────────────────────────────────────────────────────

export type ReminderStatus = 'SENT' | 'FAILED';
export type Channel = 'EMAIL' | 'SMS';

export interface Reminder {
  id: number;
  invoiceId: number;
  channel: Channel;
  recipient: string;
  status: ReminderStatus;
  errorMsg: string | null;
  sentAt: string;
  invoice?: Invoice;
  rule?: { name: string } | null;
}

// ─── AI Score ────────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AIClientScore {
  id: number;
  companyId: number;
  clientId: number;
  trustScore: number;
  riskLevel: RiskLevel;
  lateProb: string | null;
  modelVersion: string | null;
  calculatedAt: string;
  client?: Client;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export type AuditAction =
  | 'CREATE_CLIENT' | 'UPDATE_CLIENT' | 'DELETE_CLIENT'
  | 'CREATE_INVOICE' | 'UPDATE_INVOICE' | 'CANCEL_INVOICE'
  | 'ADD_PAYMENT' | 'DELETE_PAYMENT'
  | 'SEND_REMINDER' | 'GENERATE_NOTICE'
  | 'CALCULATE_AI_SCORE' | 'LOGIN' | 'LOGOUT' | 'VERIFY_EMAIL' | 'UPDATE_SETTINGS';

export interface AuditLog {
  id: number;
  companyId: number | null;
  userId: number | null;
  action: AuditAction;
  entityType: string | null;
  entityId: number | null;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { email: string; fullName: string | null } | null;
}

// ─── Recurring Invoice ────────────────────────────────────────────────────────

export type RecurringInterval = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface RecurringInvoice {
  id: number;
  companyId: number;
  clientId: number;
  templateName: string;
  series: string | null;
  amount: string;
  currency: string;
  notes: string | null;
  interval: RecurringInterval;
  dayOfMonth: number;
  nextRunAt: string;
  isActive: boolean;
  createdAt: string;
  client?: Client;
}

// ─── Expense ─────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'UTILITIES' | 'SALARIES' | 'RENT' | 'SUPPLIES' | 'SERVICES' | 'TAXES' | 'OTHER';

export interface Expense {
  id: number;
  companyId: number;
  category: ExpenseCategory;
  description: string;
  amount: string;
  currency: string;
  date: string;
  supplier: string | null;
  reference: string | null;
  createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardTotals {
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueInvoices: number;
}

export interface DashboardAging {
  bucket0to30: number;
  bucket31to60: number;
  bucket61plus: number;
}

export interface DashboardInvoiceRow {
  id: number;
  clientName: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  overdueDays: number;
  status: InvoiceStatus;
}

export interface DashboardCashFlow {
  overdue: number;
  thisWeek: number;
  thisMonth: number;
  nextMonth: number;
}

export interface DashboardSummary {
  totals: DashboardTotals;
  aging: DashboardAging;
  cashFlow: DashboardCashFlow;
  invoices: DashboardInvoiceRow[];
}
