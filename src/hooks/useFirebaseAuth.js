import { useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Auth providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Configure providers
facebookProvider.addScope('public_profile');
appleProvider.addScope('name');
appleProvider.addScope('email');

export function useFirebaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Transform Firebase user to our app's user format
        setUser({
          firebaseUid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Player',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
          provider: firebaseUser.providerData[0]?.providerId || 'unknown',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return {
        firebaseUid: result.user.uid,
        name: result.user.displayName || 'Player',
        email: result.user.email,
        avatar: result.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.uid}`,
        provider: 'google.com',
      };
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in with Facebook
  const signInWithFacebook = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      return {
        firebaseUid: result.user.uid,
        name: result.user.displayName || 'Player',
        email: result.user.email,
        avatar: result.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.uid}`,
        provider: 'facebook.com',
      };
    } catch (err) {
      console.error('Facebook sign-in error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in with Apple
  const signInWithApple = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, appleProvider);
      return {
        firebaseUid: result.user.uid,
        name: result.user.displayName || 'Player',
        email: result.user.email,
        avatar: result.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.uid}`,
        provider: 'apple.com',
      };
    } catch (err) {
      console.error('Apple sign-in error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Sign-out error:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signOut,
  };
}

export default useFirebaseAuth;
