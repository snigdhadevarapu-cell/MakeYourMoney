import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import the Firebase configuration
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);

// Initialize Firestore safely: prioritize named database ID, fallback gracefully if quota/region restricted
let firestoreInstance;
try {
  firestoreInstance = firebaseConfig.firestoreDatabaseId 
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
} catch (err) {
  console.warn("Falling back to default Firestore database due to region/quota error:", err);
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

// Authentication helpers
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error logging in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    localStorage.removeItem('makeyourmoney_demo_user');
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out", error);
    throw error;
  }
};
