import axios from "axios";
import type {
  Account, Person, Trade, InventoryItem,
  JournalEntry, HawalaTransaction, CustodyItem, DashboardData,
} from "../types/pmr";

const http = axios.create({ baseURL: "/api" });

export const api = {
  // Dashboard
  getDashboard: () => http.get<DashboardData>("/dashboard").then((r) => r.data),

  // Accounts
  getAccounts: () => http.get<Account[]>("/accounts").then((r) => r.data),
  createAccount: (data: { name: string; type: string; balance?: number }) =>
    http.post<Account>("/accounts", data).then((r) => r.data),
  deleteAccount: (id: string) => http.delete(`/accounts/${id}`),

  // Traders & Clients
  getTraders: () => http.get<Person[]>("/traders").then((r) => r.data),
  createTrader: (data: { name: string; phone: string; type: string }) =>
    http.post<Person>("/traders", data).then((r) => r.data),
  deleteTrader: (id: string) => http.delete(`/traders/${id}`),

  // Trades
  getTrades: () => http.get<Trade[]>("/trades").then((r) => r.data),
  createTrade: (data: {
    traderId: string;
    tradeType: string;
    asset: string;
    weight: number;
    purity: string;
    pricePerGram: number;
    currency: string;
  }) => http.post<Trade>("/trades", data).then((r) => r.data),

  // Inventory
  getInventory: () => http.get<InventoryItem[]>("/inventory").then((r) => r.data),

  // Journal
  getJournal: () => http.get<JournalEntry[]>("/journal").then((r) => r.data),

  // Hawala
  getHawala: () => http.get<HawalaTransaction[]>("/hawala").then((r) => r.data),
  createHawala: (data: { senderName: string; receiverName: string; amount: number; currency: string; notes?: string }) =>
    http.post<HawalaTransaction>("/hawala", data).then((r) => r.data),
  updateHawalaStatus: (id: string, status: string) =>
    http.patch<HawalaTransaction>(`/hawala/${id}`, { status }).then((r) => r.data),
  deleteHawala: (id: string) => http.delete(`/hawala/${id}`),

  // Custody
  getCustody: () => http.get<CustodyItem[]>("/custody").then((r) => r.data),
  createCustody: (data: { clientId: string; asset: string; weight: number; purity: string; notes?: string }) =>
    http.post<CustodyItem>("/custody", data).then((r) => r.data),
  deleteCustody: (id: string) => http.delete(`/custody/${id}`),
};
