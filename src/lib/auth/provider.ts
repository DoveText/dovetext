import { AuthProviderInterface, AuthProviderType, BaseUser } from './types';
import { FirebaseAuthProvider } from './firebase-auth-provider';
import { SupabaseAuthProvider } from './supabase-auth-provider';
import { LocalAuthProvider } from './local-auth-provider';

/**
 * Get the configured auth provider type from environment
 * @returns The provider type to use
 */
function getProviderType(): AuthProviderType {
  // Check environment variable first
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AUTH_PROVIDER) {
    const providerType = process.env.NEXT_PUBLIC_AUTH_PROVIDER as AuthProviderType;
    if (['firebase', 'supabase', 'local'].includes(providerType)) {
      return providerType;
    }
  }
  
  // Default to firebase
  return 'firebase';
}

/**
 * Create the appropriate auth provider based on configuration
 */
function createAuthProvider<T extends BaseUser = BaseUser>(): AuthProviderInterface<T> {
  const providerType = getProviderType();
  
  switch (providerType) {
    case 'firebase':
      return new FirebaseAuthProvider() as unknown as AuthProviderInterface<T>;
    case 'supabase':
      return new SupabaseAuthProvider() as unknown as AuthProviderInterface<T>;
    case 'local':
      return new LocalAuthProvider() as unknown as AuthProviderInterface<T>;
    default:
      // Default to Firebase
      return new FirebaseAuthProvider() as unknown as AuthProviderInterface<T>;
  }
}

// Export a singleton instance of the configured auth provider
export const authProvider = createAuthProvider();

// Export the auth instance for backward compatibility
export const auth = authProvider.getAuthInstance();
