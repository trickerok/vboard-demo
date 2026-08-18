import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0647585057",
  appId: "1:595256598018:web:422c3f91d51e6391c0111b",
  apiKey: "AIzaSyBEUClxBztYcjnDayvaZV952UwAzHZ5hBA",
  authDomain: "gen-lang-client-0647585057.firebaseapp.com",
  storageBucket: "gen-lang-client-0647585057.firebasestorage.app",
  messagingSenderId: "595256598018"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-stemboard-1ac45d45-2835-41e0-8d56-56cd75471b0f");
