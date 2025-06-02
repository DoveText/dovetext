'use client';

import { useUserType } from '../context/UserTypeContext';
import PersonalNavigation from './navigation/PersonalNavigation';
import BusinessNavigation from './navigation/BusinessNavigation';

export default function Navigation() {
  const { userType } = useUserType();
  
  // Render the appropriate navigation based on user type
  return userType === 'personal' ? <PersonalNavigation /> : <BusinessNavigation />;

}
