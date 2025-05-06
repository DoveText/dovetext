import { ActionHandler } from '@/components/auth/ActionHandler';

/**
 * Page that handles Firebase auth action URLs
 * This replaces the server-side route handler
 */
export default function ActionPage() {
  return <ActionHandler />;
}
