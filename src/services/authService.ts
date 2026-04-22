import { supabase } from '../lib/supabase';
import { User } from '../types';

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile as User;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (error || !profile) {
          console.error('Error fetching profile on auth change:', error);
          callback(null);
          return;
        }
        callback(profile as User);
      } else {
        callback(null);
      }
    });
  }
};
