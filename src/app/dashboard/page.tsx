'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUserType } from '@/context/UserTypeContext';
import PersonalDashboard from '@/components/dashboard/PersonalDashboard';
import BusinessDashboard from '@/components/dashboard/BusinessDashboard';

function DashboardContent() {
  const { userType } = useUserType();
  
  // Render the appropriate dashboard based on user type
  return userType === 'personal' ? <PersonalDashboard /> : <BusinessDashboard />;
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
