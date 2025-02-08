interface BaseSession {
  signedIn: boolean;
}

export interface AuthenticatedSession extends BaseSession {
  signedIn: true;
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  settings?: Record<string, any>;
}

export interface AnonymousSession extends BaseSession {
  signedIn: false;
}

export type UserSession = AuthenticatedSession | AnonymousSession;

// Extend the default Request type
declare global {
  interface Request {
    session: UserSession;
  }
}
