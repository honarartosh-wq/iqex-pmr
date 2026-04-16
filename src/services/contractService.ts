import { supabase } from '../lib/supabase';
import { Contract, Trade, MetalType, Unit } from '../types';

export const contractService = {
  async createContract(data: {
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
    buyer_signature: string;
    seller_signature: string;
  }): Promise<Contract | null> {
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert([{
        ...data,
        status: 'Signed',
        signed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating contract:', error);
      return null;
    }

    return contract as Contract;
  },

  async getContracts(userId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      return [];
    }

    return data as Contract[];
  },

  async getContractById(id: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching contract:', error);
      return null;
    }

    return data as Contract;
  }
};
