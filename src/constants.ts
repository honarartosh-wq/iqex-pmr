import { User, Order, MarketConfig } from './types';

const BASE_LOCAL_PRICES = {
  'Gold': {
    '24K': { bid_iqd: 98500, ask_iqd: 99200 },
    '22K': { bid_iqd: 90200, ask_iqd: 90900 },
    '21K': { bid_iqd: 86100, ask_iqd: 86800 },
    '18K': { bid_iqd: 73800, ask_iqd: 74500 },
  },
  'Silver': {
    '999': { bid_iqd: 1250, ask_iqd: 1350 },
    '925': { bid_iqd: 1150, ask_iqd: 1250 },
  },
  'Platinum': { bid_iqd: 45000, ask_iqd: 46500 },
  'Palladium': { bid_iqd: 48000, ask_iqd: 49500 },
} as const;

export const INITIAL_CONFIG: MarketConfig = {
  usd_iqd_index: 1310,
  subscription_fee_iqd: 10000,
  city_rates: {
    'Baghdad': {
      bid: 1310, ask: 1315,
      transfer_fees: {
        'Türkiye': { to_usd: 50, from_usd: 40 },
        'UAE': { to_usd: 45, from_usd: 35 },
      },
      local_prices: {
        Gold: { '24K': { bid_iqd: 98500, ask_iqd: 99200 }, '22K': { bid_iqd: 90200, ask_iqd: 90900 }, '21K': { bid_iqd: 86100, ask_iqd: 86800 }, '18K': { bid_iqd: 73800, ask_iqd: 74500 } },
        Silver: { '999': { bid_iqd: 1250, ask_iqd: 1350 }, '925': { bid_iqd: 1150, ask_iqd: 1250 } },
        Platinum: { bid_iqd: 45000, ask_iqd: 46500 },
        Palladium: { bid_iqd: 48000, ask_iqd: 49500 },
      },
    },
    'Erbil': {
      bid: 1315, ask: 1320,
      transfer_fees: {
        'Türkiye': { to_usd: 55, from_usd: 45 },
        'UAE': { to_usd: 50, from_usd: 40 },
      },
      local_prices: {
        Gold: { '24K': { bid_iqd: 99200, ask_iqd: 99900 }, '22K': { bid_iqd: 90900, ask_iqd: 91600 }, '21K': { bid_iqd: 86700, ask_iqd: 87400 }, '18K': { bid_iqd: 74300, ask_iqd: 75000 } },
        Silver: { '999': { bid_iqd: 1260, ask_iqd: 1360 }, '925': { bid_iqd: 1160, ask_iqd: 1260 } },
        Platinum: { bid_iqd: 45500, ask_iqd: 47000 },
        Palladium: { bid_iqd: 48500, ask_iqd: 50000 },
      },
    },
    'Basra': {
      bid: 1308, ask: 1312,
      transfer_fees: {
        'Türkiye': { to_usd: 48, from_usd: 38 },
        'UAE': { to_usd: 43, from_usd: 33 },
      },
      local_prices: {
        Gold: { '24K': { bid_iqd: 98000, ask_iqd: 98700 }, '22K': { bid_iqd: 89800, ask_iqd: 90500 }, '21K': { bid_iqd: 85700, ask_iqd: 86400 }, '18K': { bid_iqd: 73500, ask_iqd: 74200 } },
        Silver: { '999': { bid_iqd: 1240, ask_iqd: 1340 }, '925': { bid_iqd: 1140, ask_iqd: 1240 } },
        Platinum: { bid_iqd: 44500, ask_iqd: 46000 },
        Palladium: { bid_iqd: 47500, ask_iqd: 49000 },
      },
    },
    'Sulaymaniyah': {
      bid: 1314, ask: 1318,
      transfer_fees: {
        'Türkiye': { to_usd: 52, from_usd: 42 },
        'UAE': { to_usd: 47, from_usd: 37 },
      },
      local_prices: {
        Gold: { '24K': { bid_iqd: 98800, ask_iqd: 99500 }, '22K': { bid_iqd: 90500, ask_iqd: 91200 }, '21K': { bid_iqd: 86400, ask_iqd: 87100 }, '18K': { bid_iqd: 74000, ask_iqd: 74700 } },
        Silver: { '999': { bid_iqd: 1255, ask_iqd: 1355 }, '925': { bid_iqd: 1155, ask_iqd: 1255 } },
        Platinum: { bid_iqd: 45200, ask_iqd: 46700 },
        Palladium: { bid_iqd: 48200, ask_iqd: 49700 },
      },
    },
    'Najaf': {
      bid: 1310, ask: 1314,
      transfer_fees: {
        'Türkiye': { to_usd: 50, from_usd: 40 },
        'UAE': { to_usd: 45, from_usd: 35 },
      },
      local_prices: {
        Gold: { '24K': { bid_iqd: 98400, ask_iqd: 99100 }, '22K': { bid_iqd: 90100, ask_iqd: 90800 }, '21K': { bid_iqd: 86000, ask_iqd: 86700 }, '18K': { bid_iqd: 73700, ask_iqd: 74400 } },
        Silver: { '999': { bid_iqd: 1248, ask_iqd: 1348 }, '925': { bid_iqd: 1148, ask_iqd: 1248 } },
        Platinum: { bid_iqd: 44900, ask_iqd: 46400 },
        Palladium: { bid_iqd: 47900, ask_iqd: 49400 },
      },
    },
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
