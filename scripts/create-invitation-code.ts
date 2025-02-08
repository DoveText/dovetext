import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { Timestamp } from 'firebase-admin/firestore';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

async function createInvitationCode() {
  try {
    const db = admin.firestore();

    const codeData = {
      code: "BETA2024",
      platform: "twitter",
      distributedBy: "admin",
      maxUses: 50,
      usedCount: 0,
      isActive: true,
      createdAt: Timestamp.now(),
      usageHistory: []
    };

    // Use the code as the document ID
    await db.collection('invitation_codes').doc(codeData.code).set(codeData);
    console.log('Successfully created invitation code:', codeData.code);
    process.exit(0);
  } catch (error) {
    console.error('Error creating invitation code:', error);
    process.exit(1);
  }
}

// Execute the function
createInvitationCode();
