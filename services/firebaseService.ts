// Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCE5JbxFpsfRsmD6dpbjGcD3WRwAkSWoHY",
  authDomain: "student-expense-ai.firebaseapp.com",
  projectId: "student-expense-ai",
  storageBucket: "student-expense-ai.firebasestorage.app",
  messagingSenderId: "1043636552170",
  appId: "1:1043636552170:web:c34a14f5bc38ba074d3293",
  measurementId: "G-8TCBVHZ791"
};

// Initialize Firebase (called from window context)
export const initializeFirebase = async () => {
  try {
    const firebase = (window as any).firebase;
    
    if (!firebase || !firebase.initializeApp) {
      throw new Error("Firebase SDK not loaded properly");
    }

    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    return firebase;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
};

// Sign in with Google using popup
export const signInWithGoogle = async () => {
  try {
    const firebase = (window as any).firebase;
    
    if (!firebase || !firebase.auth) {
      throw new Error("Firebase SDK not loaded properly");
    }

    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();
    
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    const firebase = (window as any).firebase;
    
    if (!firebase || !firebase.auth) {
      throw new Error("Firebase SDK not loaded properly");
    }

    const auth = firebase.auth();
    await auth.signOut();
  } catch (error: any) {
    console.error("Sign-Out Error:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const firebase = (window as any).firebase;
      
      if (!firebase || !firebase.auth) {
        reject(new Error("Firebase SDK not loaded properly"));
        return;
      }

      const auth = firebase.auth();
      
      const unsubscribe = auth.onAuthStateChanged((user: any) => {
        unsubscribe();
        resolve(user);
      }, (error: any) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Listen to auth state changes
export const onAuthStateChanged = (callback: (user: any) => void) => {
  try {
    const firebase = (window as any).firebase;
    
    if (!firebase || !firebase.auth) {
      console.error("Firebase SDK not loaded properly");
      return () => {};
    }

    const auth = firebase.auth();
    return auth.onAuthStateChanged(callback);
  } catch (error) {
    console.error("Failed to set up auth listener:", error);
    return () => {};
  }
};
