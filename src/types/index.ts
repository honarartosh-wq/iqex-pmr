export type MetalType = 'Gold' | 'Silver' | 'Platinum' | 'Palladium';
export type OrderType = 'Buy' | 'Sell';
export type OrderStatus = 'Open' | 'Negotiating' | 'Completed' | 'Cancelled';
export type Unit = 'Gram' | 'Kilogram' | 'Ounce';

export interface User {
  id: string;
  email: string;
  company_name?: string;
  address?: string;
  kyc_status: 'Pending' | 'Verified' | 'Rejected' | 'None';
  role: 'Trader' | 'Admin';
}

export interface MarketPrice {
  metal: MetalType;
  global_price_usd: number;
  global_bid: number;
  global_ask: number;
  local_bid_iqd: number;
  local_ask_iqd: number;
  premium: number;
  change_24h: number;
  low_24h?: number;
  high_24h?: number;
}

export interface Order {
  id: string;
  trader_id: string;
  trader_name: string;
  metal: MetalType;
  purity?: string; // e.g., "24K", "21K"
  type: OrderType;
  quantity: number;
  unit: Unit;
  price_per_unit: number;
  currency: 'USD' | 'IQD';
  status: OrderStatus;
  created_at: string;
  location: string;
}

export interface Negotiation {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'Active' | 'Accepted' | 'Rejected';
  created_at: string;
}

export interface Message {
  id: string;
  negotiation_id: string;
  sender_id: string;
  content: string;
  type: 'Message' | 'Offer' | 'Accept' | 'Reject';
  offer_price?: number;
  offer_quantity?: number;
  created_at: string;
}

export interface Trade {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  metal: MetalType;
  quantity: number;
  unit: Unit;
  price: number;
  currency: 'USD' | 'IQD';
  executed_at: string;
  contract_url?: string;
}
