import { supabase } from '../lib/supabase';
import { Trade, MetalType, Unit } from '../types';

export const tradeService = {
  async createTrade(data: {
    order_id: string;
    buyer_id: string;
    seller_id: string;
    metal: MetalType;
    quantity: number;
    unit: Unit;
    price: number;
    currency: 'USD' | 'IQD';
  }): Promise<Trade | null> {
    const { data: trade, error } = await supabase
      .from('trades')
      .insert([{
        ...data,
        executed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating trade:', error);
      return null;
    }

    return trade as Trade;
  },

  async getTrades(userId: string): Promise<Trade[]> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('executed_at', { ascending: false });

    if (error) {
      console.error('Error fetching trades:', error);
      return [];
    }

    return data as Trade[];
  }
};
