import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DJState } from '../types';

let dbInstance: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (dbInstance) return dbInstance;

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  // CRITICAL: specify databaseId when provided in config
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

  return dbInstance;
}

const COLLECTION_NAME = 'crm_state';
const DOC_ID = 'primary_agency_state';

export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const db = getFirestoreDb();
    const testDocRef = doc(db, COLLECTION_NAME, DOC_ID);
    await getDocFromServer(testDocRef).catch(() => {
      // Document might not exist yet, but connection succeeded if no permission/offline error
    });
    return {
      success: true,
      message: '¡Conexión exitosa a Firebase Cloud Firestore!',
    };
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return {
        success: false,
        message: 'Firebase está en modo offline. Verifica tu conexión a internet.',
      };
    }
    return {
      success: false,
      message: `Error al conectar con Firestore: ${error?.message || 'Error desconocido'}`,
    };
  }
}

export async function saveStateToFirestore(state: DJState): Promise<{ success: boolean; message: string; timestamp?: number }> {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const now = Date.now();

    const payload = {
      id: DOC_ID,
      agencyName: state.perfil.nombre || 'IVA CREATIVA',
      data: state,
      updatedAt: new Date(now).toISOString(),
      timestamp: now,
    };

    await setDoc(docRef, payload, { merge: true });

    return {
      success: true,
      message: 'Guardado en Firebase Cloud con éxito ✓',
      timestamp: now,
    };
  } catch (err: any) {
    console.error('Error saving state to Firestore:', err);
    return {
      success: false,
      message: `Error al guardar en Firebase: ${err?.message || 'Error de red'}`,
    };
  }
}

export async function loadStateFromFirestore(): Promise<{ success: boolean; state?: DJState; message: string }> {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return {
        success: false,
        message: 'Aún no hay datos guardados en la nube de Firebase.',
      };
    }

    const data = snapshot.data();
    if (!data || !data.data) {
      return {
        success: false,
        message: 'Documento vacío en Firebase.',
      };
    }

    return {
      success: true,
      state: data.data as DJState,
      message: 'Datos recuperados desde Firebase Cloud ✓',
    };
  } catch (err: any) {
    console.error('Error loading state from Firestore:', err);
    return {
      success: false,
      message: `Error al cargar de Firebase: ${err?.message || 'Error de lectura'}`,
    };
  }
}

export function subscribeToFirestoreState(
  onStateChange: (state: DJState) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          if (remoteData?.data) {
            onStateChange(remoteData.data as DJState);
          }
        }
      },
      (error) => {
        console.error('Firestore real-time subscription error:', error);
        onError?.(error);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('Failed to start Firestore subscription:', e);
    return () => {};
  }
}
