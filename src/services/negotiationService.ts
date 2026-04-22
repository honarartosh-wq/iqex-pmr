import { supabase } from '../lib/supabase';
import { Negotiation, Message } from '../types';

export const negotiationService = {
  async getOrCreateNegotiation(orderId: string, buyerId: string, sellerId: string): Promise<Negotiation | null> {
    // Check if negotiation already exists
    const { data, error } = await supabase
      .from('negotiations')
      .select('*')
      .eq('order_id', orderId)
      .eq('buyer_id', buyerId)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching negotiation:', error);
      return null;
    }

    if (data) return data as Negotiation;

    // Create new negotiation if it doesn't exist
    const { data: newData, error: createError } = await supabase
      .from('negotiations')
      .insert([{
        order_id: orderId,
        buyer_id: buyerId,
        seller_id: sellerId,
        status: 'Active'
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating negotiation:', createError);
      return null;
    }

    return newData as Negotiation;
  },

  async updateNegotiationStatus(negotiationId: string, status: 'Active' | 'Accepted' | 'Rejected'): Promise<boolean> {
    const { error } = await supabase
      .from('negotiations')
      .update({ status })
      .eq('id', negotiationId);

    if (error) {
      console.error('Error updating negotiation status:', error);
      return false;
    }

    return true;
  },

  async getMessages(negotiationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('negotiation_id', negotiationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data as Message[];
  },

  async getUserNegotiations(userId: string): Promise<Negotiation[]> {
    const { data, error } = await supabase
      .from('negotiations')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user negotiations:', error);
      return [];
    }

    return data as Negotiation[];
  },

  async saveMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return null;
    }

    return data as Message;
  },

  subscribeToUserNegotiations(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user_negotiations_${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          table: 'negotiations', 
          schema: 'public',
          filter: `buyer_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          table: 'negotiations', 
          schema: 'public',
          filter: `seller_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
};
