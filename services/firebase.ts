
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, getDoc, query, orderBy, limit, addDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { ProjectSettings } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyB2gX10LurDdR8Pwlb0RpPLnjEVft58fBk",
  authDomain: "plyform-ut-tracker.firebaseapp.com",
  projectId: "plyform-ut-tracker",
  storageBucket: "plyform-ut-tracker.firebasestorage.app",
  messagingSenderId: "380531712994",
  appId: "1:380531712994:web:8bad3dca62a9fecb9e8fbb",
  measurementId: "G-WDHV2SZGJM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Collection References
export const TASKS_COLLECTION = 'tasks';
export const LOGS_COLLECTION = 'project_logs';
export const SETTINGS_COLLECTION = 'settings';
export const NEEDS_COLLECTION = 'emerging_needs';
export const USER_STORIES_COLLECTION = 'user_stories'; // Changed from 'objectives'
export const SETTINGS_DOC_ID = 'general_config';

export const ensureAuth = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log("Authenticated anonymously");
    } catch (e) {
      console.warn("Anonymous auth failed (this is expected if auth is disabled in console)", e);
    }
  }
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    await ensureAuth();
    // Try a minimal read operation to verify rules and connection
    await getDocs(query(collection(db, TASKS_COLLECTION), limit(1)));
    return true;
  } catch (e) {
    console.warn("Connection check failed:", e);
    return false;
  }
};

export const getProjectSettings = async (): Promise<ProjectSettings | null> => {
    await ensureAuth();
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as ProjectSettings;
        }
        return null;
    } catch (e) {
        console.error("Error fetching settings:", e);
        return null;
    }
};

export const saveProjectSettings = async (settings: ProjectSettings) => {
    await ensureAuth();
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        // Ensure lastUpdated is set if not present
        const dataToSave = {
            ...settings,
            lastUpdated: new Date().toISOString()
        };
        await setDoc(docRef, dataToSave, { merge: true });
        return dataToSave.lastUpdated;
    } catch (e) {
        console.error("Error saving settings:", e);
        throw e;
    }
};

// Update only the timestamp (useful for other modules)
export const updateLastSaved = async (): Promise<string> => {
    await ensureAuth();
    const now = new Date().toISOString();
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(docRef, { lastUpdated: now }, { merge: true });
        return now;
    } catch (e) {
        console.error("Error updating timestamp", e);
        return now; // Return local time even if save fails for UI responsiveness
    }
};

export const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Mai';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};

/**
 * Helper to simulate initial data seeding if DB is empty
 */
export const seedInitialData = async (initialData: any[]) => {
  await ensureAuth();
  try {
    const querySnapshot = await getDocs(collection(db, TASKS_COLLECTION));
    if (querySnapshot.empty) {
      console.log("Seeding database...");
      const promises = [];
      for (const day of initialData) {
         for (const task of day.tasks) {
            promises.push(
                setDoc(doc(db, TASKS_COLLECTION, task.id), {
                    ...task,
                    dayId: day.day
                })
            );
         }
      }
      await Promise.all(promises);
      console.log("Seeding complete.");
    }
  } catch (e: any) {
    console.warn("Firebase error during seeding:", e.code || e.message);
    throw e; 
  }
};
