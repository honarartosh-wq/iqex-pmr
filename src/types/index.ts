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
  tier?: 'Standard' | 'Silver' | 'Gold' | 'Platinum';
  kyc_docs?: {
    id_front?: string;
    id_back?: string;
    selfie?: string;
    business_license?: string;
  };
  subscription_status?: 'Active' | 'Expired' | 'Frozen' | 'None';
  subscription_expiry?: string;
  is_frozen?: boolean;
  rating?: number;       // 0–5 average star rating
  total_trades?: number; // total completed trades
  total_ratings?: number;
}

export interface TraderRating {
  trader_id: string;
  rater_id: string;
  rating: number; // 1–5
  comment?: string;
  created_at: string;
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

export type PricingModel = 'Fixed' | 'SpotRelated';

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
  pricing_model: PricingModel;
  expiry_time?: string; // For Fixed price
  premium?: number; // For SpotRelated price
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
  contract_id?: string;
}

export interface Contract {
  id: string;
  trade_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  seller_name: string;
  metal: MetalType;
  quantity: number;
  unit: Unit;
  price: number;
  currency: 'USD' | 'IQD';
  status: 'Signed' | 'Completed' | 'Cancelled';
  buyer_signature: string;
  seller_signature: string;
  signed_at: string;
  created_at: string;
}

export interface MarketConfig {
  usd_iqd_index: number;
  subscription_fee_iqd: number;
  city_rates: {
    [city: string]: {
      bid: number;
      ask: number;
      transfer_fees: {
        [country: string]: {
          to_usd: number;
          from_usd: number;
        };
      };
      local_prices?: {
        'Gold': {
          [karat: string]: { bid_iqd: number; ask_iqd: number };
        };
        'Silver': {
          [purity: string]: { bid_iqd: number; ask_iqd: number };
        };
        'Platinum': { bid_iqd: number; ask_iqd: number };
        'Palladium': { bid_iqd: number; ask_iqd: number };
      };
    };
  };
  premiums: {
    [metal in MetalType]: {
      usd_per_kg: number;
      iqd_per_kg: number;
    };
  };
  transfer_fees: {
    [country: string]: {
      to_usd_per_10k: number;
      from_usd_per_10k: number;
    };
  };
  local_prices: {
    'Gold': {
      [karat: string]: { bid_iqd: number; ask_iqd: number };
    };
    'Silver': {
      [purity: string]: { bid_iqd: number; ask_iqd: number };
    };
    'Platinum': { bid_iqd: number; ask_iqd: number };
    'Palladium': { bid_iqd: number; ask_iqd: number };
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  is_read: boolean;
  link?: string;
}

export interface IQEXIndexComponent {
  label: string;
  weight: number;       // e.g., 0.50
  factor: number;       // normalized ratio vs baseline (1.0 = at baseline)
  contribution: number; // weight * factor
  change: number;       // % change from prior
}

export interface IQEXMetalIndex {
  id: string;           // e.g., 'gold-24k'
  label: string;        // e.g., 'Gold 24K'
  metal: MetalType;
  purity?: string;
  indexValue: number;   // composite score (base 1000)
  change24h: number;    // % change
  bidIQD: number;
  askIQD: number;
  bidUSD: number;
  askUSD: number;
  components: {
    globalPrice: IQEXIndexComponent;
    exchangeRate: IQEXIndexComponent;
    localPremium: IQEXIndexComponent;
    supplyDemand: IQEXIndexComponent;
    hawalaCosts: IQEXIndexComponent;
  };
}
