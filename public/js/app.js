import { auth, db, provider } from './js/firebase-config.js';
import { signInWithRedirect, signOut, getRedirectResult, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import { doc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.11.0/firestore.js';

window.firebaseSignIn = () => signInWithRedirect(auth, provider);
window.firebaseSignOut = () => signOut(auth);

document.addEventListener('DOMContentLoaded', () => {
    const authBtn = document.getElementById('auth-btn');
    const authStatus = document.getElementById('auth-status');

    onAuthStateChanged(auth, (user) => {
        if (user && authBtn && authStatus) {
            authBtn.innerText = 'Sign Out';
            authStatus.innerText = 'Signed in as ' + user.displayName;
        } else if (authBtn && authStatus) {
            authBtn.innerText = 'Sign in with Google';
            authStatus.innerText = '';
        }
    });

    getRedirectResult(auth).then((result) => {
        if (result?.user) {
            setDoc(doc(db, "users", result.user.uid), {
                name: result.user.displayName,
                email: result.user.email,
                lastLogin: new Date().toISOString()
            }, { merge: true });
        }
    }).catch(e => console.error("Auth Error:", e));

    if (authBtn) {
        authBtn.addEventListener('click', () => {
            authBtn.innerText === 'Sign Out' ? window.firebaseSignOut() : window.firebaseSignIn();
        });
    }

    onSnapshot(doc(db, "venue_status", "current"), (ds) => {
        if (ds.exists()) {
            const data = ds.data();
            document.getElementById('crowd-level-text').innerText = data.crowd_level || "Moderate";
            document.getElementById('best-gate').innerText = data.best_gate || "West Gate";
        }
    });
});
