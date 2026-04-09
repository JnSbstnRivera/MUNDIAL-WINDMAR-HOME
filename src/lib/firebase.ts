import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, getDocFromServer, addDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let isSeeding = false;
export async function seedDatabase() {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const teamsRef = collection(db, 'teams');
    const snapshot = await getDocs(teamsRef);
    if (snapshot.empty) {
      console.log('Seeding database...');
      const initialTeams = [
        { name: 'Argentina', countryCode: 'ARG', points: 0, goals: 0, callCenterGroup: 'Ventas A' },
        { name: 'Brasil', countryCode: 'BRA', points: 0, goals: 0, callCenterGroup: 'Soporte B' },
        { name: 'Francia', countryCode: 'FRA', points: 0, goals: 0, callCenterGroup: 'Retención C' },
        { name: 'España', countryCode: 'ESP', points: 0, goals: 0, callCenterGroup: 'Ventas B' },
        { name: 'Alemania', countryCode: 'DEU', points: 0, goals: 0, callCenterGroup: 'Soporte A' },
        { name: 'México', countryCode: 'MEX', points: 0, goals: 0, callCenterGroup: 'Atención D' },
        { name: 'Colombia', countryCode: 'COL', points: 0, goals: 0, callCenterGroup: 'Ventas C' },
        { name: 'Japón', countryCode: 'JPN', points: 0, goals: 0, callCenterGroup: 'Soporte C' },
      ];

      for (const team of initialTeams) {
        await addDoc(teamsRef, {
          ...team,
          lastMatchDate: new Date().toISOString()
        });
      }
      console.log('Database seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    isSeeding = false;
  }
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
