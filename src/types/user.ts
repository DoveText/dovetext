export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  // Add more settings as needed
}

export interface User {
  id: number;
  email: string;
  firebase_uid: string;
  display_name?: string;
  avatar_url?: string;
  settings: UserSettings;
  is_active: boolean;
  last_login_at?: Date;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface InvitationCode {
  code: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  platform?: string;
  description?: string;
  created_by?: number;
  created_at: Date;
}

export interface InvitationCodeUse {
  id: number;
  code: string;
  user_id: number;
  user_email: string;
  used_at: Date;
}
