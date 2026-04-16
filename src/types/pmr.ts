export type AccountType = "gold" | "silver" | "usd" | "iqd" | "bank";
export type PersonType = "trader" | "client";
export type AssetType = "gold" | "silver";
export type TradeType = "buy" | "sell";
export type CurrencyType = "usd" | "iqd";
export type HawalaStatus = "pending" | "completed" | "cancelled";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  type: PersonType;
  createdAt: string;
}

export interface Trade {
  id: string;
  traderId: string;
  traderName: string;
  tradeType: TradeType;
  asset: AssetType;
  weight: number;
  purity: string;
  pricePerGram: number;
  totalValue: number;
  currency: CurrencyType;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  asset: AssetType;
  purity: string;
  weight: number;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  tradeId: string;
  accountId: string;
  accountName: string;
  entryType: "debit" | "credit";
  amount: number;
  description: string;
  createdAt: string;
}

export interface HawalaTransaction {
  id: string;
  senderName: string;
  receiverName: string;
  amount: number;
  currency: CurrencyType;
  status: HawalaStatus;
  notes: string;
  createdAt: string;
}

export interface CustodyItem {
  id: string;
  clientId: string;
  clientName: string;
  asset: AssetType;
  weight: number;
  purity: string;
  notes: string;
  createdAt: string;
}

export interface DashboardData {
  balances: { gold: number; silver: number; usd: number; iqd: number };
  recentTrades: Trade[];
  custodySummary: { gold: number; silver: number; total: number };
  hawalaSummary: { pending: number; completed: number; total: number; pendingAmount: number };
  inventorySummary: InventoryItem[];
}

export type Page =
  | "dashboard"
  | "accounts"
  | "traders"
  | "trades"
  | "inventory"
  | "hawala"
  | "custody";
