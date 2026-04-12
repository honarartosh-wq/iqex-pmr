import axios from 'axios';
import { MarketPrice, MetalType } from '../types';

// Mock weights for the Iraqi Market Index
const WEIGHTS = {
  GLOBAL: 0.50,
  EXCHANGE_RATE: 0.20,
  PREMIUM: 0.15,
  ACTIVITY: 0.10,
  REMITTANCE: 0.05,
};

// Default exchange rate (USD to IQD)
const DEFAULT_EXCHANGE_RATE = 1500;

export const fetchMarketPrices = async (exchangeRate: number = DEFAULT_EXCHANGE_RATE): Promise<MarketPrice[]> => {
  try {
    // In a real app, you'd fetch from an API like MetalpriceAPI
    // const response = await axios.get(`https://api.metalpriceapi.com/v1/latest?api_key=${process.env.MARKET_DATA_API_KEY}&base=USD&currencies=XAU,XAG,XPT,XPD`);
    
    // Mock data for demonstration
    const mockGlobalPrices = {
      Gold: 2350.50, // per ounce
      Silver: 28.20, // per ounce
      Platinum: 980.00, // per ounce
      Palladium: 1050.00, // per ounce
    };

    const metals: MetalType[] = ['Gold', 'Silver', 'Platinum', 'Palladium'];

    return metals.map(metal => {
      const globalPrice = mockGlobalPrices[metal];
      const spreadPercent = 0.001; // 0.1% spread
      const globalBid = globalPrice * (1 - spreadPercent / 2);
      const globalAsk = globalPrice * (1 + spreadPercent / 2);
      
      const premium = 5.0; // 5% local premium
      
      // Unit conversions
      let localBasePriceUsd = globalPrice;
      if (metal === 'Gold') {
        localBasePriceUsd = globalPrice / 31.1035; // per gram
      } else if (metal === 'Silver') {
        localBasePriceUsd = globalPrice * 32.1507; // per kg
      }

      const localPriceUsd = localBasePriceUsd * (1 + premium / 100);
      const localPriceIqd = localPriceUsd * exchangeRate;
      
      // Local spread (slightly wider than global)
      const localSpread = localPriceIqd * 0.003; 
      const localBidIqd = localPriceIqd - localSpread / 2;
      const localAskIqd = localPriceIqd + localSpread / 2;

      return {
        metal,
        global_price_usd: globalPrice,
        global_bid: globalBid,
        global_ask: globalAsk,
        local_bid_iqd: localBidIqd,
        local_ask_iqd: localAskIqd,
        premium,
        change_24h: (Math.random() * 4 - 2),
        low_24h: localBidIqd * 0.98,
        high_24h: localAskIqd * 1.02,
      };
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    return [];
  }
};

export const getKaratPrices = (goldBidIqd: number, goldAskIqd: number) => {
  return [
    { karat: '24K', purity: 1.0, bid: goldBidIqd, ask: goldAskIqd },
    { karat: '22K', purity: 0.916, bid: goldBidIqd * 0.916, ask: goldAskIqd * 0.916 },
    { karat: '21K', purity: 0.875, bid: goldBidIqd * 0.875, ask: goldAskIqd * 0.875 },
    { karat: '18K', purity: 0.750, bid: goldBidIqd * 0.750, ask: goldAskIqd * 0.750 },
    { karat: '14K', purity: 0.583, bid: goldBidIqd * 0.583, ask: goldAskIqd * 0.583 },
    { karat: '12K', purity: 0.500, bid: goldBidIqd * 0.500, ask: goldAskIqd * 0.500 },
    { karat: '9K', purity: 0.375, bid: goldBidIqd * 0.375, ask: goldAskIqd * 0.375 },
  ];
};

export const getLaborCosts = () => {
  return {
    gold: [
      { origin: 'Italian', cost: 12500 },
      { origin: 'Turkish', cost: 8500 },
      { origin: 'Iraqi', cost: 4500 },
      { origin: 'Khaliji', cost: 7000 },
    ],
    silver: [
      { origin: '925 Standard', cost: 2500 },
    ]
  };
};

export const getCurrencyRates = () => {
  const baseRate = 1500;
  const cities = [
    'Baghdad', 'Basra', 'Nineveh', 'Erbil', 'Sulaymaniyah', 
    'Kirkuk', 'Najaf', 'Karbala', 'Dhi Qar', 'Anbar', 
    'Diyala', 'Babil', 'Al-Qadisiyah', 'Maysan', 'Wasit', 
    'Saladin', 'Dohuk', 'Muthanna', 'Halabja'
  ];
  
  return cities.map(city => {
    const variation = (Math.random() - 0.5) * 10;
    const bid = baseRate + variation - 2;
    const ask = baseRate + variation + 2;
    
    return {
      city,
      bid,
      ask,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  });
};

export const getSilverPurityPrices = (silverBidIqd: number, silverAskIqd: number) => {
  return [
    { label: '999 (Pure)', purity: 1.0, bid: silverBidIqd, ask: silverAskIqd },
    { label: '925 (Sterling)', purity: 0.925, bid: silverBidIqd * 0.925, ask: silverAskIqd * 0.925 },
  ];
};

export const calculateIraqiIndex = (prices: MarketPrice[]): number => {
  if (prices.length === 0) return 0;
  // Simple index calculation based on gold price for now
  const gold = prices.find(p => p.metal === 'Gold');
  if (!gold) return 0;
  
  // This is a simplified version of the formula provided in the requirements
  return gold.local_bid_iqd / 1000; // Index value
};
