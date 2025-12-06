

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";

const firebaseConfig = {
  apiKey: "AIzaSyDCF9-QchK4cVsQH6IwFN1ZNl3be0-lI50",
  authDomain: "shakibul-islam-ltd-server.firebaseapp.com",
  databaseURL: "https://shakibul-islam-ltd-server-default-rtdb.firebaseio.com",
  projectId: "shakibul-islam-ltd-server",
  storageBucket: "shakibul-islam-ltd-server.appspot.com",
  messagingSenderId: "896191957877",
  appId: "1:896191957877:web:54a3b0018a64bef5a5e13c",
  measurementId: "G-WTHX1NDVFB"
};

// Use the imported firebase object (which maps to window.firebase from index.html)
const firebaseNamespace = (firebase as any).default || firebase;

// Initialize Firebase only if it hasn't been initialized yet
if (!firebaseNamespace.apps.length) {
    firebaseNamespace.initializeApp(firebaseConfig);
}

// Access services directly from the namespace. 
// Since we loaded the scripts globally, .auth() and .database() are guaranteed to be attached.
export const auth = firebaseNamespace.auth();
export const db = firebaseNamespace.database();
export const googleProvider = new firebaseNamespace.auth.GoogleAuthProvider();

// Explicitly set persistence. This is crucial for environments where Firebase
// might struggle to auto-detect storage capabilities, such as with the
// current import map setup. We try 'local' first for persistent logins,
// then fall back to 'session' if needed.
auth.setPersistence(firebaseNamespace.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.warn(
      `Firebase local persistence failed (code: ${error.code}, message: ${error.message}). ` +
      `This can happen in private browsing. Falling back to session persistence.`
    );
    return auth.setPersistence(firebaseNamespace.auth.Auth.Persistence.SESSION);
  })
  .catch((error) => {
    console.error(
      `Firebase session persistence also failed (code: ${error.code}, message: ${error.message}). ` +
      `Auth state will not be persisted across page reloads.`
    );
  });