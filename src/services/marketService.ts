import { supabase } from '../lib/supabase';
import { MarketConfig, MarketPrice, MetalType } from '../types';
import { tradingViewService, LivePrice } from './tradingViewService';
import { INITIAL_CONFIG } from '../constants';

const METAL_SYMBOLS: Record<MetalType, string> = {
  Gold: 'XAUUSD',
  Silver: 'XAGUSD',
  Platinum: 'XPTUSD',
  Palladium: 'XPDUSD',
};

const METALS: MetalType[] = ['Gold', 'Silver', 'Platinum', 'Palladium'];

// The DB may hold a partial config (e.g. `local_prices: {}` from the seed in
// SUPABASE_SETUP.sql). The UI expects the full shape — missing keys cause
// "Cannot convert undefined or null to object" when Object.entries runs over
// an undefined subtree. Merge with the initial defaults so the shape is
// always complete.
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const deepMerge = <T>(base: T, override: unknown): T => {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override ?? base) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    out[k] = deepMerge((base as Record<string, unknown>)[k], v);
  }
  return out as T;
};

export const normalizeConfig = (raw: unknown): MarketConfig => {
  const merged = deepMerge(INITIAL_CONFIG, raw);
  // Ensure every premium entry has both usd_per_kg and iqd_per_kg. The seed
  // only supplies usd_per_kg, so derive iqd_per_kg from the default rate.
  (Object.keys(merged.premiums) as MetalType[]).forEach(metal => {
    const p = merged.premiums[metal] ?? { usd_per_kg: 0, iqd_per_kg: 0 };
    merged.premiums[metal] = {
      usd_per_kg: p.usd_per_kg ?? 0,
      iqd_per_kg: p.iqd_per_kg ?? Math.round((p.usd_per_kg ?? 0) * merged.usd_iqd_index),
    };
  });
  return merged;
};

export const mapLivePricesToMarketPrices = (
  config: MarketConfig,
  livePrices: Record<string, LivePrice>
): MarketPrice[] => {
  return METALS.map(metal => {
    const p = livePrices[METAL_SYMBOLS[metal]];
    if (!p) return {
      metal,
      global_price_usd: 0,
      global_bid: 0,
      global_ask: 0,
      local_bid_iqd: 0,
      local_ask_iqd: 0,
      premium: 0,
      change_24h: 0
    };

    const premium = config.premiums[metal].usd_per_kg / 32.1507;
    return {
      metal,
      global_price_usd: p.price,
      global_bid: p.bid,
      global_ask: p.ask,
      local_bid_iqd: (p.bid + premium) * config.usd_iqd_index,
      local_ask_iqd: (p.ask + premium) * config.usd_iqd_index,
      premium: config.premiums[metal].usd_per_kg,
      change_24h: p.change24h,
      low_24h: p.low24h,
      high_24h: p.high24h
    };
  });
};

export const fetchMarketPrices = async (config: MarketConfig): Promise<MarketPrice[]> => {
  return mapLivePricesToMarketPrices(config, tradingViewService.getPrices());
};

export const calculateIraqiIndex = (config: MarketConfig): number => {
  // Simple index: Relative to a base rate of 1310
  return (config.usd_iqd_index / 1310) * 100; 
};

// Re-derives local IQD fields from existing global prices using the current config.
// Use this instead of re-fetching when only the exchange rate or premium has changed.
export const recomputeLocalPrices = (config: MarketConfig, prices: MarketPrice[]): MarketPrice[] => {
  return prices.map(p => {
    const premium = config.premiums[p.metal].usd_per_kg / 32.1507;
    return {
      ...p,
      local_bid_iqd: (p.global_bid + premium) * config.usd_iqd_index,
      local_ask_iqd: (p.global_ask + premium) * config.usd_iqd_index,
      premium: config.premiums[p.metal].usd_per_kg,
    };
  });
};

export const getKaratPrices = (bid: number, ask: number) => {
  const ozToGram = 31.1035;
  const baseBid = bid / ozToGram;
  const baseAsk = ask / ozToGram;
  
  return [
    { karat: '24K', purity: 1.0, bid: baseBid, ask: baseAsk },
    { karat: '22K', purity: 0.916, bid: baseBid * 0.916, ask: baseAsk * 0.916 },
    { karat: '21K', purity: 0.875, bid: baseBid * 0.875, ask: baseAsk * 0.875 },
    { karat: '18K', purity: 0.75, bid: baseBid * 0.75, ask: baseAsk * 0.75 },
  ];
};

export const getSilverPurityPrices = (bid: number, ask: number) => {
  const ozToGram = 31.1035;
  const baseBid = bid / ozToGram;
  const baseAsk = ask / ozToGram;

  return [
    { purity: '999', value: 0.999, bid: baseBid * 0.999, ask: baseAsk * 0.999 },
    { purity: '925', value: 0.925, bid: baseBid * 0.925, ask: baseAsk * 0.925 },
  ];
};

// Returns KG bar prices derived from TradingView live spot (oz) prices.
// Formula exactly as specified: KG_price = spot_price_per_oz × 32.1507 × purity
// bid/ask are derived from KG mid with a ±0.02% half-spread.
export const getKgMetalPrices = (
  goldSpot: number, goldChange: number,
  silverSpot: number, silverChange: number,
) => {
  const ozPerKg = 32.1507;
  const gold999  = goldSpot  * ozPerKg * 0.999;
  const gold995  = goldSpot  * ozPerKg * 0.995;
  const silver   = silverSpot * ozPerKg * 0.9999;
  return [
    { label: 'GOLD.999',    desc: 'Gold 999 · 1 KG Bar',   bid: gold999 * 0.9998, ask: gold999 * 1.0002, change: goldChange },
    { label: 'GOLD.995',    desc: 'Gold 995 · 1 KG Bar',   bid: gold995 * 0.9998, ask: gold995 * 1.0002, change: goldChange },
    { label: 'SILVER.999.9', desc: 'Silver 999.9 · 1 KG',  bid: silver  * 0.9998, ask: silver  * 1.0002, change: silverChange },
  ];
};

export const marketService = {
  async getConfig(): Promise<MarketConfig | null> {
    const { data, error } = await supabase
      .from('market_config')
      .select('*')
      .eq('id', 'current')
      .single();

    if (error) {
      console.error('Error fetching market config:', error);
      return null;
    }

    return normalizeConfig((data as any).data);
  },

  async updateConfig(config: MarketConfig): Promise<boolean> {
    const { error } = await supabase
      .from('market_config')
      .upsert({
        id: 'current',
        data: config,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating market config:', error);
      return false;
    }

    return true;
  },

  subscribeToConfig(callback: (config: MarketConfig) => void) {
    return supabase
      .channel('market_config_changes')
      .on(
        'postgres_changes',
        { event: '*', table: 'market_config', schema: 'public' },
        (payload) => {
          if (payload.new && (payload.new as any).data) {
            callback(normalizeConfig((payload.new as any).data));
          }
        }
      )
      .subscribe();
  }
};
