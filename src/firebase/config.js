import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBYadUq_zY5BduiyhyiiOtmt-58mdZ9LK4",
  authDomain: "jai-debut.firebaseapp.com",
  projectId: "jai-debut",
  storageBucket: "jai-debut.firebasestorage.app",
  messagingSenderId: "637212767198",
  appId: "1:637212767198:web:5784fa0def029cd073a34f"
};

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)