import * as admin from 'firebase-admin';
import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  try {
    const config: admin.AppOptions = {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      } as admin.ServiceAccount),
    };

    // Configure proxy if available
    if (process.env.NEXT_PUBLIC_PROXY_URL) {
      console.log('Configuring proxy for Firebase Admin:', process.env.NEXT_PUBLIC_PROXY_URL);
      const proxyAgent = new HttpsProxyAgent(process.env.NEXT_PUBLIC_PROXY_URL);
      
      // Test proxy connection
      const testProxyConnection = () => {
        return new Promise((resolve, reject) => {
          const req = https.get('https://www.googleapis.com', {
            agent: proxyAgent,
            timeout: 5000
          }, (res) => {
            console.log('Proxy test response status:', res.statusCode);
            resolve(true);
          });

          req.on('error', (err) => {
            console.error('Proxy test error:', err);
            reject(err);
          });
        });
      };

      // Run proxy test
      testProxyConnection()
        .then(() => console.log('Proxy connection test successful'))
        .catch(err => console.error('Proxy connection test failed:', err));

      config.httpAgent = proxyAgent;
    } else {
      console.log('No proxy configuration found for Firebase Admin');
    }

    admin.initializeApp(config);
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export const adminAuth = admin.auth();
export const getAuth = () => admin.auth();
export default adminAuth;
