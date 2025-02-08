import { db } from './config';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

export interface InvitationCode {
  code: string;
  platform: string;
  distributedBy: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  usageHistory: Array<{
    email: string;
    usedAt: Date;
    userAgent: string;
  }>;
}

export async function validateInvitationCode(code: string): Promise<boolean> {
  try {
    const codeRef = doc(db, 'invitation_codes', code);
    const codeDoc = await getDoc(codeRef);
    
    if (!codeDoc.exists()) {
      return false;
    }

    const codeData = codeDoc.data() as InvitationCode;
    return codeData.isActive && codeData.usedCount < codeData.maxUses;
  } catch (error) {
    console.error('Error validating invitation code:', error);
    return false;
  }
}

export async function recordInvitationCodeUsage(code: string, email: string): Promise<void> {
  try {
    const codeRef = doc(db, 'invitation_codes', code);
    
    await updateDoc(codeRef, {
      usedCount: increment(1),
      usageHistory: arrayUnion({
        email,
        usedAt: new Date(),
        userAgent: window.navigator.userAgent
      })
    });
  } catch (error) {
    console.error('Error recording invitation code usage:', error);
    throw error;
  }
}
