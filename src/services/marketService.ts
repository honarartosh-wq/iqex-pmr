import { supabase } from '../lib/supabase';
import { MarketConfig, MarketPrice, MetalType, IQEXMetalIndex, IQEXIndexComponent } from '../types';
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
  return (config.usd_iqd_index / 1310) * 100;
};

/* ── IQEX 5-factor index baselines ─────────────────────────────────────── */
const BASE = {
  XAUUSD: 2000,   // USD/oz
  XAGUSD: 25,     // USD/oz
  XPTUSD: 950,    // USD/oz
  XPDUSD: 1000,   // USD/oz
  usd_iqd: 1310,
  goldPremium: 1200,   // USD/kg
  silverPremium: 150,
  platinumPremium: 800,
  palladiumPremium: 900,
  hawala: 50,          // USD per 10k baseline
  activity: 10,        // baseline active orders
};

function makeComponent(
  label: string,
  weight: number,
  factor: number,
  changePct: number
): IQEXIndexComponent {
  return { label, weight, factor, contribution: weight * factor, change: changePct };
}

export const calculateIQEXIndexes = (
  config: MarketConfig,
  activeOrderCount: number = 0
): IQEXMetalIndex[] => {
  const gp = tradingViewService.getPrices();
  const ozToGram = 31.1035;
  const cityRate = config.usd_iqd_index;

  const activityFactor = Math.min(1.5, 0.7 + (activeOrderCount / BASE.activity) * 0.3);
  const avgHawala = (() => {
    const fees = Object.values(config.transfer_fees);
    if (fees.length === 0) return BASE.hawala;
    const avg = fees.reduce((s, f) => s + f.to_usd_per_10k, 0) / fees.length;
    return avg || BASE.hawala;
  })();
  const hawalaFactor = BASE.hawala / Math.max(avgHawala, 1);
  const fxFactor = cityRate / BASE.usd_iqd;

  const buildIndex = (
    id: string,
    label: string,
    metal: MetalType,
    symbol: string,
    purity: number,
    premiumBase: number,
    currentPremiumUSD: number,
    purityKey?: string
  ): IQEXMetalIndex => {
    const spot = gp[symbol];
    if (!spot) {
      return {
        id, label, metal, purity: purityKey,
        indexValue: 1000, change24h: 0,
        bidIQD: 0, askIQD: 0, bidUSD: 0, askUSD: 0,
        components: {
          globalPrice: makeComponent('Global Price', 0.50, 1, 0),
          exchangeRate: makeComponent('Exchange Rate', 0.20, 1, 0),
          localPremium: makeComponent('Local Premium', 0.15, 1, 0),
          supplyDemand: makeComponent('Supply & Demand', 0.10, 1, 0),
          hawalaCosts: makeComponent('Hawala Costs', 0.05, 1, 0),
        },
      };
    }

    const basePriceForMetal = symbol === 'XAUUSD' ? BASE.XAUUSD : symbol === 'XAGUSD' ? BASE.XAGUSD : symbol === 'XPTUSD' ? BASE.XPTUSD : BASE.XPDUSD;
    const globalFactor = (spot.price * purity) / (basePriceForMetal * purity);
    const premiumFactor = currentPremiumUSD / Math.max(premiumBase, 1);

    const weightedScore =
      0.50 * globalFactor +
      0.20 * fxFactor +
      0.15 * premiumFactor +
      0.10 * activityFactor +
      0.05 * hawalaFactor;

    const indexValue = Math.round(weightedScore * 1000 * 10) / 10;

    const pricePerGramUSD = (spot.bid * purity) / ozToGram;
    const bidUSD = pricePerGramUSD;
    const askUSD = (spot.ask * purity) / ozToGram;
    const bidIQD = bidUSD * cityRate;
    const askIQD = askUSD * cityRate;

    return {
      id, label, metal, purity: purityKey,
      indexValue,
      change24h: spot.change24h * purity,
      bidIQD: Math.round(bidIQD),
      askIQD: Math.round(askIQD),
      bidUSD,
      askUSD,
      components: {
        globalPrice: makeComponent('Global Price', 0.50, globalFactor, spot.change24h),
        exchangeRate: makeComponent('Exchange Rate', 0.20, fxFactor, ((cityRate - BASE.usd_iqd) / BASE.usd_iqd) * 100),
        localPremium: makeComponent('Local Premium', 0.15, premiumFactor, ((currentPremiumUSD - premiumBase) / premiumBase) * 100),
        supplyDemand: makeComponent('Supply & Demand', 0.10, activityFactor, ((activeOrderCount - BASE.activity) / BASE.activity) * 100),
        hawalaCosts: makeComponent('Hawala Costs', 0.05, hawalaFactor, ((BASE.hawala - avgHawala) / BASE.hawala) * 100),
      },
    };
  };

  return [
    buildIndex('gold-24k', 'Gold 24K', 'Gold', 'XAUUSD', 1.000, BASE.goldPremium, config.premiums['Gold'].usd_per_kg, '24K'),
    buildIndex('gold-21k', 'Gold 21K', 'Gold', 'XAUUSD', 0.875, BASE.goldPremium, config.premiums['Gold'].usd_per_kg * 0.875, '21K'),
    buildIndex('silver',   'Silver 999', 'Silver', 'XAGUSD', 0.999, BASE.silverPremium, config.premiums['Silver'].usd_per_kg, '999'),
    buildIndex('platinum', 'Platinum', 'Platinum', 'XPTUSD', 1.000, BASE.platinumPremium, config.premiums['Platinum'].usd_per_kg, undefined),
    buildIndex('palladium','Palladium', 'Palladium', 'XPDUSD', 1.000, BASE.palladiumPremium, config.premiums['Palladium'].usd_per_kg, undefined),
  ];
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
