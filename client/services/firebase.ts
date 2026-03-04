import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC88UptgjQ5JR9uvyt5fR0kYUKjoCKtRgk",
    authDomain: "be-endless.firebaseapp.com",
    projectId: "be-endless",
    storageBucket: "be-endless.firebasestorage.app",
    messagingSenderId: "194215034873",
    appId: "1:194215034873:web:91aea4c314bbf1900b8728",
    measurementId: "G-EH2HJDYPWZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Analytics (Optional but good to have)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
