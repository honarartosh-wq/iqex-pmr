import { supabase } from '../lib/supabase';
import { MarketConfig, MarketPrice, MetalType } from '../types';
import { tradingViewService } from './tradingViewService';

export const fetchMarketPrices = async (config: MarketConfig): Promise<MarketPrice[]> => {
  const globalPrices = tradingViewService.getPrices();
  const metals: MetalType[] = ['Gold', 'Silver', 'Platinum', 'Palladium'];
  
  return metals.map(metal => {
    const symbol = metal === 'Gold' ? 'XAUUSD' : metal === 'Silver' ? 'XAGUSD' : metal === 'Platinum' ? 'XPTUSD' : 'XPDUSD';
    const p = globalPrices[symbol];
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

    const premium = config.premiums[metal].usd_per_kg / 32.1507; // Convert KG premium to Ounce
    
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

export const calculateIraqiIndex = (config: MarketConfig): number => {
  // Simple index: Relative to a base rate of 1310
  return (config.usd_iqd_index / 1310) * 100; 
};

export const getIndexMetalPrices = (config: MarketConfig, prices: MarketPrice[]): MarketPrice[] => {
  return prices.map(p => ({
    ...p,
    local_bid_iqd: p.global_bid * config.usd_iqd_index,
    local_ask_iqd: p.global_ask * config.usd_iqd_index
  }));
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

export const marketService = {
  async getConfig(): Promise<MarketConfig | null> {
    const { data, error } = await supabase
      .from('market_configs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching market config:', error);
      return null;
    }

    return data as unknown as MarketConfig;
  },

  async updateConfig(config: MarketConfig): Promise<boolean> {
    // We try to update the latest one or insert a new one
    // For simplicity in this app, we'll just insert a new version or update by ID if we had it
    const { error } = await supabase
      .from('market_configs')
      .insert([
        {
          usd_iqd_index: config.usd_iqd_index,
          subscription_fee_iqd: config.subscription_fee_iqd,
          city_rates: config.city_rates,
          premiums: config.premiums,
          transfer_fees: config.transfer_fees,
          local_prices: config.local_prices,
          updated_at: new Date().toISOString()
        }
      ]);

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
        { event: '*', table: 'market_configs', schema: 'public' },
        (payload) => {
          callback(payload.new as unknown as MarketConfig);
        }
      )
      .subscribe();
  }
};
