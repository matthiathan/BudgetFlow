import { supabase } from './supabase';

export const authService = {
  async sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    
    if (error) throw error;
    return { success: true };
  },

  async verifyOtpAndSetPassword(email: string, token: string, password?: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    
    if (error) throw error;

    if (password && data.user) {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      
      if (updateError) throw updateError;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email!,
          username: data.user.email!.split('@')[0],
        });

      if (profileError) throw profileError;

      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: data.user.id,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          notifications_enabled: true,
        });

      if (settingsError) throw settingsError;
    }
    
    return { user: data.user, session: data.session };
  },

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { user: data.user, session: data.session };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};
