import { MarketConfig } from './types';

const DEFAULT_TRANSFER_FEES = {
  'Türkiye': { to_usd: 50, from_usd: 40 },
  'UAE': { to_usd: 45, from_usd: 35 },
};

const DEFAULT_LOCAL_PRICES: MarketConfig['local_prices'] = {
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
};

// All 19 Iraqi governorates (18 federal + Halabja, split from Sulaymaniyah in 2014).
// Names match the governorate (not the capital city) using common English spellings.
const IRAQI_GOVERNORATES: Array<{ name: string; bid: number; ask: number }> = [
  { name: 'Baghdad',      bid: 1310, ask: 1315 },
  { name: 'Basra',        bid: 1308, ask: 1312 },
  { name: 'Nineveh',      bid: 1312, ask: 1316 },
  { name: 'Erbil',        bid: 1315, ask: 1320 },
  { name: 'Sulaymaniyah', bid: 1314, ask: 1318 },
  { name: 'Duhok',        bid: 1315, ask: 1319 },
  { name: 'Halabja',      bid: 1314, ask: 1318 },
  { name: 'Kirkuk',       bid: 1312, ask: 1316 },
  { name: 'Anbar',        bid: 1311, ask: 1315 },
  { name: 'Babylon',      bid: 1310, ask: 1314 },
  { name: 'Diyala',       bid: 1311, ask: 1315 },
  { name: 'Dhi Qar',      bid: 1309, ask: 1313 },
  { name: 'Karbala',      bid: 1310, ask: 1314 },
  { name: 'Maysan',       bid: 1308, ask: 1312 },
  { name: 'Muthanna',     bid: 1309, ask: 1313 },
  { name: 'Najaf',        bid: 1310, ask: 1314 },
  { name: 'Qadisiyah',    bid: 1310, ask: 1314 },
  { name: 'Saladin',      bid: 1311, ask: 1315 },
  { name: 'Wasit',        bid: 1310, ask: 1314 },
];

const city_rates: MarketConfig['city_rates'] = IRAQI_GOVERNORATES.reduce((acc, { name, bid, ask }) => {
  acc[name] = {
    bid,
    ask,
    transfer_fees: {
      'Türkiye': { ...DEFAULT_TRANSFER_FEES['Türkiye'] },
      'UAE': { ...DEFAULT_TRANSFER_FEES['UAE'] },
    },
    // Seed per-city syndicate prices with a deep clone so each city is
    // independently editable and never resolves to `undefined` in the UI.
    local_prices: JSON.parse(JSON.stringify(DEFAULT_LOCAL_PRICES)),
  };
  return acc;
}, {} as MarketConfig['city_rates']);

export const INITIAL_CONFIG: MarketConfig = {
  usd_iqd_index: 1310,
  subscription_fee_iqd: 10000,
  city_rates,
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
  local_prices: JSON.parse(JSON.stringify(DEFAULT_LOCAL_PRICES)),
};
