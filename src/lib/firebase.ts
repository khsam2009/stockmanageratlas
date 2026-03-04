// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/*const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID 
};*/ 
const firebaseConfig = {
  apiKey: "AIzaSyCLOK2XScNoW9WOrKbvPQ1N7Hc708hIw5A",
  authDomain: "stockmanager-e8004.firebaseapp.com",
//  databaseURL: "https://stockmanager-e8004-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stockmanager-e8004",
  storageBucket: "stockmanager-e8004.firebasestorage.app",
  messagingSenderId: "215538959059",
  appId: "1:215538959059:web:e506d2f2a0dc6e0121ca26",
  measurementId: "G-WLCFNXM9FH"
};
console.log(firebaseConfig.databaseURL);
// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
//const analytics = getAnalytics(app);


export const db = initializeFirestore(app, { localCache: persistentLocalCache()});

//export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
