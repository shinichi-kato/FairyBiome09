import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export let firebaseApp = null;
export let firestore = null;

export function initializeFirebaseApp(){
  if (window !== undefined) {
    if (getApps().length === 0) {
      firebaseApp = initializeApp({
        apiKey: process.env.GATSBY_FIREBASE_API_KEY,
        authDomain: process.env.GATSBY_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.GATSBY_FIREBASE_DATABASE_URL,
        projectId: process.env.GATSBY_FIREBASE_PROJECT_ID,
        storageBucket: process.env.GATSBY_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.GATSBY_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.GATSBY_FIREBASE_APP_ID,
      });
    }
    else {
      firebaseApp = getApp();
    }
    firestore = getFirestore(firebaseApp);
  }
}

export function saveChatbot(obj){
  // firestoreにチャットボットのデータを保存
  await addDoc(collection(firestore, "chatbot"))
}
