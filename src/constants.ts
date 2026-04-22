import { User, Order, MarketConfig } from './types';

export const INITIAL_CONFIG: MarketConfig = {
  usd_iqd_index: 1310,
  subscription_fee_iqd: 10000,
  city_rates: {
    'Baghdad': { 
      bid: 1310, ask: 1315, 
      transfer_fees: {
        'Türkiye': { to_usd: 50, from_usd: 40 },
        'UAE': { to_usd: 45, from_usd: 35 }
      }
    },
    'Erbil': { 
      bid: 1315, ask: 1320, 
      transfer_fees: {
        'Türkiye': { to_usd: 55, from_usd: 45 },
        'UAE': { to_usd: 50, from_usd: 40 }
      }
    },
    'Basra': { 
      bid: 1308, ask: 1312, 
      transfer_fees: {
        'Türkiye': { to_usd: 48, from_usd: 38 },
        'UAE': { to_usd: 43, from_usd: 33 }
      }
    },
    'Sulaymaniyah': { 
      bid: 1314, ask: 1318, 
      transfer_fees: {
        'Türkiye': { to_usd: 52, from_usd: 42 },
        'UAE': { to_usd: 47, from_usd: 37 }
      }
    },
    'Najaf': { 
      bid: 1310, ask: 1314, 
      transfer_fees: {
        'Türkiye': { to_usd: 50, from_usd: 40 },
        'UAE': { to_usd: 45, from_usd: 35 }
      }
    }
  },
  premiums: {
    'Gold': { usd_per_kg: 1200, iqd_per_kg: 1572000 },
    'Silver': { usd_per_kg: 150, iqd_per_kg: 196500 },
    'Platinum': { usd_per_kg: 800, iqd_per_kg: 1048000 },
    'Palladium': { usd_per_kg: 900, iqd_per_kg: 1179000 }
  },
  transfer_fees: {
    'Türkiye': { to_usd_per_10k: 50, from_usd_per_10k: 40 },
    'UAE': { to_usd_per_10k: 45, from_usd_per_10k: 35 }
  },
  local_prices: {
    'Gold': {
      '24K': { bid_iqd: 98500, ask_iqd: 99200 },
      '22K': { bid_iqd: 90200, ask_iqd: 90900 },
      '21K': { bid_iqd: 86100, ask_iqd: 86800 },
      '18K': { bid_iqd: 73800, ask_iqd: 74500 }
    },
    'Silver': {
      '999': { bid_iqd: 1250, ask_iqd: 1350 },
      '925': { bid_iqd: 1150, ask_iqd: 1250 }
    },
    'Platinum': { bid_iqd: 45000, ask_iqd: 46500 },
    'Palladium': { bid_iqd: 48000, ask_iqd: 49500 }
  }
};
