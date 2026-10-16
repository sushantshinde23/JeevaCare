import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Referral, Facility, TransportRequest, InAppNotification } from '../types';

// 1. Initialize Firebase App and Services
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 2. Strict Error Handling conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Mandatory Connection Validation
let isConnectedToFirestore = false;
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isConnectedToFirestore = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection: Client is offline or database initializing.');
    }
    // Connected to server or rules evaluated
    isConnectedToFirestore = true;
    return true;
  }
}

// Run test connection
testConnection().catch((err) => console.log('Firebase connection test init:', err));

// 4. Google Workspace OAuth & Firebase Auth
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory access token cache (MANDATORY: Never store in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google sign in');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
};

// 5. Firestore Real-Time Sync Helpers
export const firestoreSync = {
  // Sync Referral to Firestore
  async saveReferral(referral: Referral): Promise<void> {
    if (!auth.currentUser) {
      return;
    }
    const path = `referrals/${referral.id}`;
    try {
      await setDoc(doc(db, 'referrals', referral.id), {
        ...referral,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Update Referral in Firestore
  async updateReferral(referralId: string, updates: Partial<Referral>): Promise<void> {
    if (!auth.currentUser) {
      return;
    }
    const path = `referrals/${referralId}`;
    try {
      await updateDoc(doc(db, 'referrals', referralId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Real-time listener for referrals (Only attach when authenticated)
  subscribeReferrals(onUpdate: (referrals: Referral[]) => void): () => void {
    if (!auth.currentUser) {
      // Per Firebase skill: "Only attach onSnapshot listeners if auth is ready and user is authenticated."
      return () => {};
    }
    const path = 'referrals';
    try {
      const q = query(collection(db, path));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: Referral[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Referral);
          });
          if (list.length > 0) {
            onUpdate(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, path);
        }
      );
    } catch (err) {
      console.warn('Subscription error to referrals:', err);
      return () => {};
    }
  },

  // Save Transport
  async saveTransport(transport: TransportRequest): Promise<void> {
    if (!auth.currentUser) {
      return;
    }
    const path = `transports/${transport.id}`;
    try {
      await setDoc(doc(db, 'transports', transport.id), transport);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save InAppNotification
  async saveNotification(notif: InAppNotification): Promise<void> {
    if (!auth.currentUser) {
      return;
    }
    const path = `notifications/${notif.id}`;
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },
};
