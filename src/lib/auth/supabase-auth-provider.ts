import { createClient, SupabaseClient, User as SupabaseUser, OAuthResponse } from '@supabase/supabase-js';
import { AuthProviderInterface, BaseUser, UserSettings, OAuthProviderType } from './types';

// Extend BaseUser with Supabase-specific properties
export interface SupabaseAuthUser extends BaseUser {
  // Add any Supabase-specific properties here
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata?: {
    [key: string]: any;
  };
  aud?: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  recovery_sent_at?: string;
}

export class SupabaseAuthProvider implements AuthProviderInterface<SupabaseAuthUser> {
  private supabase: SupabaseClient;
  
  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and anon key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  // Helper method to convert Supabase user to our SupabaseAuthUser
  private async enrichSupabaseUser(supabaseUser: SupabaseUser | null): Promise<SupabaseAuthUser | null> {
    if (!supabaseUser) return null;
    
    try {
      // Get the user's profile from our backend
      const token = await this.supabase.auth.getSession().then(({ data }) => data.session?.access_token || null);
      
      if (!token) return null;
      
      // Fetch user data from our backend
      const response = await fetch('/api/v1/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const userData = await response.json();
      
      // Create a properly typed SupabaseAuthUser object
      const enrichedUser: SupabaseAuthUser = {
        // BaseUser properties
        uid: supabaseUser.id,
        email: supabaseUser.email,
        displayName: supabaseUser.user_metadata?.full_name || null,
        photoURL: supabaseUser.user_metadata?.avatar_url || null,
        emailVerified: supabaseUser.email_confirmed_at ? true : false,
        isAnonymous: false, // Supabase doesn't support anonymous auth by default
        settings: userData.settings || {},
        is_active: userData.is_active || false,
        email_verified: userData.email_verified || (supabaseUser.email_confirmed_at ? true : false),
        created_at: new Date(supabaseUser.created_at || Date.now()),
        updated_at: new Date(supabaseUser.updated_at || Date.now()),
        last_login_at: supabaseUser.last_sign_in_at ? new Date(supabaseUser.last_sign_in_at) : undefined,
        getIdToken: async (forceRefresh?: boolean) => {
          const { data } = await this.supabase.auth.getSession();
          return data.session?.access_token || '';
        },
        
        // Supabase-specific properties
        app_metadata: supabaseUser.app_metadata,
        user_metadata: supabaseUser.user_metadata
      };
      
      return enrichedUser;
    } catch (error) {
      console.error('Error enriching Supabase user:', error);
      return null;
    }
  }

  // User management
  async getCurrentUser(): Promise<SupabaseAuthUser | null> {
    const { data } = await this.supabase.auth.getUser();
    return this.enrichSupabaseUser(data.user);
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<SupabaseAuthUser> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      const enrichedUser = await this.enrichSupabaseUser(data.user);
      if (!enrichedUser) {
        throw new Error('Failed to enrich user data after sign in');
      }
      return enrichedUser;
    } catch (error: any) {
      console.error('Supabase sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string): Promise<SupabaseAuthUser> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      const enrichedUser = await this.enrichSupabaseUser(data.user);
      if (!enrichedUser) {
        throw new Error('Failed to enrich user data after sign up');
      }
      return enrichedUser;
    } catch (error: any) {
      console.error('Supabase sign up error:', error);
      throw error;
    }
  }

  async signInWithOAuth(providerType: OAuthProviderType, options?: any): Promise<SupabaseAuthUser> {
    try {
      // Map our generic provider types to Supabase provider strings if needed
      const providerMap: Record<OAuthProviderType, string> = {
        google: 'google',
        github: 'github',
        facebook: 'facebook',
        twitter: 'twitter',
        microsoft: 'azure',
        apple: 'apple'
      };
      
      const provider = providerMap[providerType];
      if (!provider) {
        throw new Error(`Unsupported OAuth provider: ${providerType}`);
      }
      
      // Configure OAuth options
      const oauthOptions: any = {
        provider,
        options: {}
      };
      
      // Apply additional options if provided
      if (options?.redirectTo) {
        oauthOptions.options.redirectTo = options.redirectTo;
      }
      
      if (options?.scopes) {
        oauthOptions.options.scopes = options.scopes.join(' ');
      }
      
      const { data, error } = await this.supabase.auth.signInWithOAuth(oauthOptions);
      
      if (error) throw error;
      
      // Supabase OAuth redirects to the OAuth provider, so we need to handle the redirect
      // This will be handled by the onAuthStateChanged listener
      
      // For now, just return the current user
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error(`Failed to get user after ${providerType} sign in`);
      }
      return currentUser;
    } catch (error: any) {
      console.error(`Supabase ${providerType} sign in error:`, error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<SupabaseAuthUser> {
    return this.signInWithOAuth('google');
  }

  async logout(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Supabase logout error:', error);
      throw error;
    }
  }

  // Email verification
  async sendVerificationEmail(user?: SupabaseAuthUser): Promise<void> {
    try {
      const email = user?.email || (await this.getCurrentUser())?.email;
      if (!email) {
        throw new Error('No user email available');
      }
      
      // Supabase doesn't have a direct method for this, but we can use OTP
      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Supabase send verification email error:', error);
      throw error;
    }
  }

  async applyActionCode(oobCode: string): Promise<void> {
    try {
      // Supabase handles this automatically when the user clicks the link
      // This method is just for compatibility with our interface
      console.log('Supabase handles email verification via direct links, oobCode not used:', oobCode);
    } catch (error: any) {
      console.error('Supabase apply action code error:', error);
      throw error;
    }
  }

  // Password management
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error: any) {
      console.error('Supabase send password reset email error:', error);
      throw error;
    }
  }

  async confirmPasswordReset(oobCode: string, newPassword: string, email: string): Promise<void> {
    try {
      // Supabase handles password reset differently
      // The user receives a link, clicks it, and is redirected to a page where they can enter a new password
      // The oobCode is not used directly
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Supabase confirm password reset error:', error);
      throw error;
    }
  }

  async checkActionCode(oobCode: string): Promise<any> {
    try {
      // Supabase doesn't have an equivalent method
      // This is just for compatibility with our interface
      console.log('Supabase does not support checking action codes, oobCode not used:', oobCode);
      return { operation: 'UNKNOWN' };
    } catch (error: any) {
      console.error('Supabase check action code error:', error);
      throw error;
    }
  }

  // Token management
  async getIdToken(): Promise<string | null> {
    try {
      const { data } = await this.supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (error: any) {
      console.error('Supabase get ID token error:', error);
      return null;
    }
  }

  // Auth state
  onAuthStateChanged(callback: (user: SupabaseAuthUser | null) => void): () => void {
    // Set up auth state listener
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const user = session?.user || null;
        const enrichedUser = await this.enrichSupabaseUser(user);
        callback(enrichedUser);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
    
    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  // User status
  async refreshUserStatus(): Promise<any> {
    try {
      // Refresh the session
      const { data, error } = await this.supabase.auth.refreshSession();
      if (error) throw error;
      
      // Get the user's profile
      const token = data.session?.access_token;
      if (!token) {
        throw new Error('No access token available');
      }
      
      // Fetch updated user data from our backend
      const response = await fetch('/api/v1/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return await response.json();
    } catch (error: any) {
      console.error('Supabase refresh user status error:', error);
      throw error;
    }
  }
  
  // For backward compatibility
  getAuthInstance() {
    return this.supabase.auth;
  }
}
