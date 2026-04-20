// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAW0X2N5zViBC59Fvxb1u3DE5f9thCGK1Q",
    authDomain: "active-axle-493508-f2.firebaseapp.com",
    projectId: "active-axle-493508-f2",
    storageBucket: "active-axle-493508-f2.firebasestorage.app",
    messagingSenderId: "998328333687",
    appId: "1:998328333687:web:7de85c8de30a75c82f5d72",
    measurementId: "G-D8GTJHZ6DJ"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };