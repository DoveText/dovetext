import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  checkActionCode as firebaseCheckActionCode,
  applyActionCode as firebaseApplyActionCode,
  User as FirebaseUser,
  getAuth
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { AuthProviderInterface, BaseUser, UserSettings, OAuthProviderType } from './types';

// Extend BaseUser with Firebase-specific properties
export interface FirebaseAuthUser extends BaseUser {
  // Add Firebase-specific properties that aren't in BaseUser
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }>;
  refreshToken: string;
  tenantId: string | null;
  delete: () => Promise<void>;
  reload: () => Promise<void>;
  toJSON: () => object;
}

export class FirebaseAuthProvider implements AuthProviderInterface<FirebaseAuthUser> {
  private auth: ReturnType<typeof getAuth>;
  
  constructor() {
    // Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    // Initialize Firebase app
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize Firebase auth
    this.auth = getAuth(app);
  }

  // Helper method to convert Firebase user to our FirebaseAuthUser
  private async enrichFirebaseUser(firebaseUser: FirebaseUser | null): Promise<FirebaseAuthUser | null> {
    if (!firebaseUser) return null;
    
    try {
      // Get the ID token without forcing refresh
      const token = await firebaseUser.getIdToken(false);
      
      // Fetch user data from our backend
      const response = await fetch('/api/v1/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const userData = await response.json();
      
      // Create a properly typed FirebaseAuthUser object
      const enrichedUser: FirebaseAuthUser = {
        // BaseUser properties
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        isAnonymous: firebaseUser.isAnonymous,
        settings: userData.settings || {},
        is_active: userData.is_active || false,
        email_verified: userData.email_verified || firebaseUser.emailVerified,
        created_at: new Date(userData.created_at || firebaseUser.metadata.creationTime || Date.now()),
        updated_at: new Date(userData.updated_at || Date.now()),
        last_login_at: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : undefined,
        getIdToken: (forceRefresh?: boolean) => firebaseUser.getIdToken(forceRefresh),
        
        // Firebase-specific properties
        metadata: {
          creationTime: firebaseUser.metadata.creationTime,
          lastSignInTime: firebaseUser.metadata.lastSignInTime
        },
        providerData: firebaseUser.providerData.map(provider => ({
          providerId: provider.providerId,
          uid: provider.uid,
          displayName: provider.displayName,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          photoURL: provider.photoURL
        })),
        refreshToken: firebaseUser.refreshToken,
        tenantId: firebaseUser.tenantId,
        delete: () => firebaseUser.delete(),
        reload: () => firebaseUser.reload(),
        toJSON: () => firebaseUser.toJSON()
      };
      
      return enrichedUser;
    } catch (error) {
      console.error('Error enriching Firebase user:', error);
      return null;
    }
  }

  // User management
  async getCurrentUser(): Promise<FirebaseAuthUser | null> {
    const firebaseUser = this.auth.currentUser;
    return this.enrichFirebaseUser(firebaseUser);
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<FirebaseAuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const enrichedUser = await this.enrichFirebaseUser(userCredential.user);
      if (!enrichedUser) {
        throw new Error('Failed to enrich user data after sign in');
      }
      return enrichedUser;
    } catch (error: any) {
      console.error('Firebase sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string): Promise<FirebaseAuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const enrichedUser = await this.enrichFirebaseUser(userCredential.user);
      if (!enrichedUser) {
        throw new Error('Failed to enrich user data after sign up');
      }
      return enrichedUser;
    } catch (error: any) {
      console.error('Firebase sign up error:', error);
      throw error;
    }
  }

  async signInWithOAuth(providerType: OAuthProviderType, options?: any): Promise<FirebaseAuthUser> {
    try {
      let provider;
      
      switch (providerType) {
        case 'google':
          provider = new GoogleAuthProvider();
          break;
        case 'github':
          // These would need to be imported from firebase/auth
          // provider = new GithubAuthProvider();
          throw new Error('GitHub authentication not implemented yet');
        case 'facebook':
          // provider = new FacebookAuthProvider();
          throw new Error('Facebook authentication not implemented yet');
        case 'twitter':
          // provider = new TwitterAuthProvider();
          throw new Error('Twitter authentication not implemented yet');
        case 'microsoft':
          // provider = new OAuthProvider('microsoft.com');
          throw new Error('Microsoft authentication not implemented yet');
        case 'apple':
          // provider = new OAuthProvider('apple.com');
          throw new Error('Apple authentication not implemented yet');
        default:
          throw new Error(`Unsupported OAuth provider: ${providerType}`);
      }
      
      // Apply additional options if provided
      if (options?.scopes) {
        options.scopes.forEach((scope: string) => {
          if (provider.addScope) {
            provider.addScope(scope);
          }
        });
      }
      
      const userCredential = await signInWithPopup(this.auth, provider);
      const enrichedUser = await this.enrichFirebaseUser(userCredential.user);
      if (!enrichedUser) {
        throw new Error(`Failed to enrich user data after ${providerType} sign in`);
      }
      return enrichedUser;
    } catch (error: any) {
      console.error(`Firebase ${providerType} sign in error:`, error);
      throw error;
    }
  }
  
  // Keep for backward compatibility
  async signInWithGoogle(): Promise<FirebaseAuthUser> {
    return this.signInWithOAuth('google');
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      console.error('Firebase logout error:', error);
      throw error;
    }
  }

  // Email verification
  async sendVerificationEmail(user?: FirebaseAuthUser): Promise<void> {
    try {
      const currentUser = user || this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is signed in');
      }
      await sendEmailVerification(currentUser);
    } catch (error: any) {
      console.error('Firebase send verification email error:', error);
      throw error;
    }
  }

  async applyActionCode(oobCode: string): Promise<void> {
    try {
      await firebaseApplyActionCode(this.auth, oobCode);
    } catch (error: any) {
      console.error('Firebase apply action code error:', error);
      throw error;
    }
  }

  // Password management
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      console.error('Firebase send password reset email error:', error);
      throw error;
    }
  }

  async confirmPasswordReset(oobCode: string, newPassword: string, email: string): Promise<void> {
    try {
      await confirmPasswordReset(this.auth, oobCode, newPassword);
    } catch (error: any) {
      console.error('Firebase confirm password reset error:', error);
      throw error;
    }
  }

  async checkActionCode(oobCode: string): Promise<any> {
    try {
      return await firebaseCheckActionCode(this.auth, oobCode);
    } catch (error: any) {
      console.error('Firebase check action code error:', error);
      throw error;
    }
  }

  // Token management
  async getIdToken(): Promise<string | null> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        return null;
      }
      return await currentUser.getIdToken(true);
    } catch (error: any) {
      console.error('Firebase get ID token error:', error);
      return null;
    }
  }

  // Auth state
  onAuthStateChanged(callback: (user: FirebaseAuthUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(this.auth, async (firebaseUser) => {
      const enrichedUser = await this.enrichFirebaseUser(firebaseUser);
      callback(enrichedUser);
    });
  }

  // User status
  async refreshUserStatus(): Promise<any> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is signed in');
      }
      
      // Get the ID token, forcing a refresh
      const token = await currentUser.getIdToken(true);
      
      // Fetch updated user data from our backend
      const response = await fetch('/api/v1/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return await response.json();
    } catch (error: any) {
      console.error('Firebase refresh user status error:', error);
      throw error;
    }
  }
  
  // Expose the raw auth object for backward compatibility
  getAuthInstance() {
    return this.auth;
  }
}
