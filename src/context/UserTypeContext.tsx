'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type UserType = 'personal' | 'business';

interface UserTypeContextType {
  userType: UserType;
}

const UserTypeContext = createContext<UserTypeContextType | null>(null);

export function UserTypeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Determine user type based on settings
  // Default to 'personal' if type is not set or is set to 'personal'
  const userType = user?.settings?.type === 'business' ? 'business' : 'personal';
  
  return (
    <UserTypeContext.Provider value={{ userType }}>
      {children}
    </UserTypeContext.Provider>
  );
}

export function useUserType() {
  const context = useContext(UserTypeContext);
  if (!context) {
    throw new Error('useUserType must be used within a UserTypeProvider');
  }
  return context;
}
