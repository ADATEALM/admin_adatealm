import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// We need to write user data to Firestore on signup
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Login
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Signup
export async function signup(email, password, username) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        await updateProfile(user, { displayName: username });

        // Create User Document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: email,
            role: 'trainee', // Default rank
            points: 0,
            joinedAt: serverTimestamp(),
            weeklyProgress: {
                count: 0,
                lastReset: serverTimestamp()
            }
        });

        return user;
    } catch (error) {
        throw error;
    }
}

// Logout
export async function logout() {
    try {
        await firebaseSignOut(auth);
        window.location.hash = 'login';
    } catch (error) {
        console.error("Logout Error", error);
    }
}

// State Observer
export function initAuthObserver(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is signed in:", user.email);
            // Optionally fetch additional user data here
        } else {
            console.log("User is signed out");
        }
        callback(user);
    });
}
