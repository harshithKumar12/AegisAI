import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase with config
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId using getFirestore
const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Initialize Auth
const auth = getAuth(app);

export { 
  app, 
  db, 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit
};
export type { User };
