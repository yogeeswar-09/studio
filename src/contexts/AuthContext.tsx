
"use client";

import type { User as AppUser, UserYear, UserBranch } from '@/types';
import { auth, db, storage } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUserType
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUserType | null;
  isLoading: boolean;
  login: (email: string, pasword: string) => Promise<void>;
  signup: (name: string, email: string, pasword: string, year: UserYear, branch: UserBranch) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<AppUser>, newAvatarFile?: File | null) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          // Convert Firestore Timestamps to ISO strings if they exist
          const userData = userDocSnap.data();
          const appUser: AppUser = { 
            uid: fbUser.uid, 
            ...userData,
            createdAt: (userData.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            updatedAt: (userData.updatedAt as Timestamp)?.toDate().toISOString() || undefined,
          } as AppUser;
          setUser(appUser);
        } else {
          console.warn("User document not found in Firestore for UID:", fbUser.uid);
          // Potentially a user exists in Auth but not Firestore (e.g. if Firestore doc creation failed post-signup)
          // For now, treat as logged out from app perspective, or create a default profile.
          // Creating profile here might be complex if essential signup info isn't available.
          setUser(null); 
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname === '/login' || pathname === '/signup';
      const isVerifyEmailRoute = pathname === '/verify-email';
      const isLandingPage = pathname === '/';
      
      if (!user && !isAuthRoute && !isVerifyEmailRoute && !isLandingPage) {
        router.push('/login');
      } else if (user && firebaseUser?.emailVerified && (isAuthRoute || isVerifyEmailRoute || isLandingPage)) {
        // If user is logged in, email verified, and on an auth/landing/verify page, redirect to dashboard
        router.push('/dashboard');
      } else if (user && !firebaseUser?.emailVerified && !isVerifyEmailRoute && !isAuthRoute && !isLandingPage) {
        // If user is logged in, email NOT verified, and NOT on verify/auth/landing page, redirect to verify email
        router.push('/verify-email');
      }
    }
  }, [user, firebaseUser, isLoading, pathname, router]);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        // User is not cleared, isLoading remains true, AuthContext useEffect will redirect to /verify-email
        toast({
          title: "Email Not Verified",
          description: "Please verify your email. Redirecting to verification page...",
          variant: "destructive",
          duration: 7000,
        });
        // No explicit redirect here, relying on onAuthStateChanged and subsequent useEffect
      } else {
        // Successful login with verified email - onAuthStateChanged will update user, useEffect will redirect.
        // Toast is handled in LoginForm on successful try for "Login Successful"
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("Login error:", error);
      throw error; 
    }
    // setIsLoading(false) will be handled by onAuthStateChanged flow or catch block
  };

  const signup = async (name: string, email: string, password: string, year: UserYear, branch: UserBranch) => {
    setIsLoading(true);
    try {
      if (!email.endsWith('@mlrit.ac.in')) {
         toast({ title: "Invalid Email Domain", description: "Only MLRIT email addresses (@mlrit.ac.in) are allowed.", variant: "destructive" });
         throw new Error('Only MLRIT email addresses are allowed.');
      }

      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Step 2: Update Firebase Auth profile (e.g., displayName)
      await updateFirebaseProfile(fbUser, { displayName: name });

      // Step 3: Prepare user profile data for Firestore
      const userProfile: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        name,
        email,
        year,
        branch,
        avatarUrl: `https://placehold.co/150x150.png?text=${name.substring(0,2).toUpperCase()}`,
        contactInfo: {}, // Initialize empty contact info
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Step 4: Store user profile in Firestore
      await setDoc(doc(db, "users", fbUser.uid), userProfile);
      
      // Step 5: Send email verification
      await sendEmailVerification(fbUser);
      
      toast({ title: "Signup Successful!", description: "Please check your email to verify your account.", duration: 7000 });
      // setIsLoading(false) is not explicitly set here because router.push will unmount or change context
      router.push('/verify-email'); // Redirect to verification page
    } catch (error: any) {
      setIsLoading(false); // Ensure loading is false on error
      console.error("Signup error:", error);
      throw error; 
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await firebaseSignOut(auth);
    // setUser and setFirebaseUser to null will be handled by onAuthStateChanged
    // isLoading will be set to false by onAuthStateChanged
    router.push('/login'); // Explicit redirect after sign out
  };

  const updateUserProfile = async (data: Partial<AppUser>, newAvatarFile?: File | null) => {
    if (!firebaseUser || !user) {
      toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
      throw new Error("User not authenticated.");
    }
    setIsLoading(true);
    try {
      let newAvatarUrl = data.avatarUrl || user.avatarUrl; // Start with passed URL or existing one

      // If a new file is provided, upload it and update the URL
      if (newAvatarFile) {
        // Attempt to delete old avatar if it was from Firebase Storage
        if (user.avatarUrl && user.avatarUrl.includes('firebasestorage.googleapis.com')) {
            try {
                const oldAvatarPath = new URL(user.avatarUrl).pathname.split('/o/')[1].split('?')[0];
                const decodedOldAvatarPath = decodeURIComponent(oldAvatarPath);
                const oldAvatarRef = ref(storage, decodedOldAvatarPath);
                await deleteObject(oldAvatarRef);
            } catch (e) {
                console.warn("Could not delete old avatar, it might not exist or path was incorrect:", e);
            }
        }
        const storageRefPath = `avatars/${firebaseUser.uid}/${Date.now()}_${newAvatarFile.name}`;
        const imageRef = ref(storage, storageRefPath);
        const snapshot = await uploadBytes(imageRef, newAvatarFile);
        newAvatarUrl = await getDownloadURL(snapshot.ref);
      } else if (data.avatarUrl && data.avatarUrl !== user.avatarUrl && user.avatarUrl && user.avatarUrl.includes('firebasestorage.googleapis.com')) {
        // If URL is explicitly changed from a Firebase Storage URL to a new non-file URL, delete old storage avatar.
         try {
            const oldAvatarPath = new URL(user.avatarUrl).pathname.split('/o/')[1].split('?')[0];
            const decodedOldAvatarPath = decodeURIComponent(oldAvatarPath);
            const oldAvatarRef = ref(storage, decodedOldAvatarPath);
            await deleteObject(oldAvatarRef);
        } catch (e) {
            console.warn("Could not delete old avatar when switching to new URL:", e);
        }
      }
      
      // Data to update in Firestore (excluding uid, email, year, branch unless made editable)
      const firestoreUpdateData: Partial<Omit<AppUser, 'uid' | 'email' | 'year' | 'branch' | 'createdAt'>> & {updatedAt: any} = { 
        name: data.name,
        contactInfo: data.contactInfo,
        avatarUrl: newAvatarUrl, // Use the potentially new avatar URL
        updatedAt: serverTimestamp(),
      };
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userDocRef, firestoreUpdateData);

      // Update Firebase Auth profile (displayName and photoURL)
      if (data.name || newAvatarUrl) {
        await updateFirebaseProfile(firebaseUser, {
          displayName: data.name || firebaseUser.displayName,
          photoURL: newAvatarUrl || firebaseUser.photoURL,
        });
      }

      // Update local user state
      setUser(prevUser => ({ 
          ...prevUser!, 
          ...firestoreUpdateData, 
          name: data.name || prevUser!.name, // ensure name is updated
          avatarUrl: newAvatarUrl, // ensure avatar is updated
        }));
      
      toast({ title: "Profile Updated", description: "Your information has been saved." });
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!firebaseUser) {
      toast({ title: "Error", description: "No user logged in to resend verification for.", variant: "destructive" });
      throw new Error("No user logged in.");
    }
    if (firebaseUser.emailVerified) {
      toast({ title: "Already Verified", description: "Your email is already verified." });
      router.push('/dashboard'); // redirect if already verified
      return;
    }
    setIsLoading(true);
    try {
      await sendEmailVerification(firebaseUser);
      toast({ title: "Verification Email Sent", description: "Please check your inbox for the new verification link." });
    } catch (error: any) {
      console.error("Resend verification email error:", error);
      toast({ title: "Error Sending Email", description: error.message || "Could not resend verification email.", variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, signup, logout, updateUserProfile, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

