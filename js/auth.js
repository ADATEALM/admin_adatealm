import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Login function
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Check suspension immediately after login
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists() && userDoc.data().accountStatus === 'suspended') {
            await signOut(auth);
            throw new Error("تم تعطيل حسابك. يرجى التواصل مع الإدارة.");
        }
        return userCredential.user;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

// Signup function with enhanced user profile
export async function signup(email, password, displayName) {
    try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Generate unique username from email
        const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const randomSuffix = Math.floor(Math.random() * 1000);
        const username = `${baseUsername}_${randomSuffix}`;

        // Update display name
        await updateProfile(user, {
            displayName: displayName
        });

        // Create comprehensive user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            // Basic Info
            uid: user.uid,
            displayName: displayName,
            username: username, // Unique username
            email: email,
            phoneNumber: null, // Optional phone number
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff`,

            // Account Status
            role: 'trainee', // Default role for new users
            rank: 'متدرب', // Arabic rank name
            level: 1,
            points: 0, // Start with 0 points

            // Weekly Progress
            weeklyProgress: {
                count: 0, // Posts this week
                target: 20, // Weekly target
                lastReset: serverTimestamp(),
                weekStartDate: serverTimestamp()
            },

            // Statistics
            stats: {
                totalSubmissions: 0,
                approvedSubmissions: 0,
                rejectedSubmissions: 0,
                totalPointsEarned: 0,
                currentStreak: 0,
                longestStreak: 0
            },

            // Achievements & Badges
            badges: [],
            achievements: [],

            // Account Metadata
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            accountStatus: 'active', // active, suspended, banned

            // Preferences
            preferences: {
                notifications: true,
                darkMode: false,
                language: 'ar'
            }
        });

        console.log("User account created successfully with default values");
        return user;
    } catch (error) {
        console.error("Signup error:", error);
        throw error;
    }
}

// Password Reset function
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email, {
            url: window.location.origin + '/index.html',
            handleCodeInApp: false
        });
        return true;
    } catch (error) {
        console.error("Password reset error:", error);
        throw error;
    }
}

// Logout function
export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
}

// Auth state observer & Weekly Logic
export function initAuthObserver(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();

                    // 1. Check Suspension
                    if (userData.accountStatus === 'suspended') {
                        await signOut(auth);
                        alert("عذراً، تم تعطيل حسابك بشكل دائم من قبل الإدارة.");
                        window.location.reload();
                        return;
                    }

                    // 2. Update Last Login
                    await updateDoc(userRef, { lastLogin: serverTimestamp() });

                    // 3. Check Weekly Reset
                    await checkAndResetWeeklyProgress(user.uid, userData);
                }
            } catch (error) {
                console.error("Auth check error:", error);
            }
        }
        callback(user);
    });
}

// Helper: Check and Reset Weekly Progress
async function checkAndResetWeeklyProgress(uid, userData) {
    // Logic: Compare current week vs last reset week
    // Simple approach: Check if "Sunday" has passed since lastReset
    // OR: Store 'lastResetWeek' number.

    // Better: If (Now - LastReset) > 7 days? No, that's not precise for a specific day reset (e.g. Friday).
    // Let's assume reset is every Friday or Saturday.
    // Let's stick to a simpler logic: Store date string "YYYY-WeekNum". If different, reset.

    const now = new Date();
    // Get ISO week number or just check if diff in time is huge.
    // Let's just use a simple 7-day diff check for now, or check if LastReset is in a previous week.

    const lastReset = userData.weeklyProgress?.lastReset?.toDate ? userData.weeklyProgress.lastReset.toDate() : new Date(0);

    // Check if we are in a new week (Start of week usually Sunday or Saturday in Arab world)
    // Let's assume Saturday is start of week.
    const dayOfWeek = 6; // Saturday
    const lastResetDay = lastReset.getDay();
    const currentDay = now.getDay();

    // Simple Diff: If difference > 7 days, definitely reset.
    const diffTime = Math.abs(now - lastReset);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Robust Logic: Reset if we passed a Saturday since last reset
    // We can use a stored "nextResetDate" in DB. 
    // If now > nextResetDate -> Reset & Update nextResetDate.

    let shouldReset = false;

    if (!userData.weeklyProgress?.nextResetDate) {
        // Initialize if missing
        shouldReset = true; // First time run might reset if logic dictates, but let's just set the date.
        // Actually, don't reset count immediately if just initializing structure, unless it's old.
        // Let's just check if it's been more than 7 days strictly to be safe.
        if (diffDays > 7) shouldReset = true;
    } else {
        const nextReset = userData.weeklyProgress.nextResetDate.toDate();
        if (now > nextReset) shouldReset = true;
    }

    if (shouldReset) {
        // Calculate NEXT Saturday (or Friday midnight)
        const nextDate = new Date();
        nextDate.setDate(now.getDate() + (6 + 7 - now.getDay()) % 7); // Next Saturday
        nextDate.setHours(23, 59, 59, 999); // End of that day

        await updateDoc(doc(db, "users", uid), {
            "weeklyProgress.count": 0,
            "weeklyProgress.lastReset": serverTimestamp(),
            "weeklyProgress.nextResetDate": nextDate
        });
        console.log("Weekly progress reset for user:", uid);
    }
}

// Get user rank based on points
export function getUserRank(points) {
    if (points >= 5000) return { name: 'قائد', icon: 'fas fa-crown', color: '#9333ea' };
    if (points >= 3000) return { name: 'نائب القائد', icon: 'fas fa-star', color: '#eab308' };
    if (points >= 1500) return { name: 'مشرف أول', icon: 'fas fa-shield-alt', color: '#3b82f6' };
    if (points >= 500) return { name: 'مشرف نشيط', icon: 'fas fa-user-shield', color: '#10b981' };
    return { name: 'متدرب', icon: 'fas fa-user', color: '#6b7280' };
}

// Calculate user level
export function getUserLevel(points) {
    return Math.floor(points / 100) + 1;
}
