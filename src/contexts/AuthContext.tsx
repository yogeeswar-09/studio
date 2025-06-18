
"use client";

import type { User as AppUser, UserYear, UserBranch } from '@/types';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail,
  type User as FirebaseUserType
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp, type FieldValue } from 'firebase/firestore';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUserType | null;
  isLoading: boolean;
  login: (email: string, pasword: string) => Promise<void>;
  signup: (name: string, email: string, pasword: string, year: UserYear, branch: UserBranch) => Promise<void>;
  logout: () => Promise<void>; // Changed to Promise<void>
  updateUserProfile: (data: Partial<AppUser>, newAvatarFile?: File | null) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  toast: ReturnType<typeof useToast>['toast'];
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CLOUDINARY_CLOUD_NAME_CTX = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET_CTX = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadAvatarToCloudinaryCtx(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME_CTX || !CLOUDINARY_UPLOAD_PRESET_CTX) {
    throw new Error("Cloudinary environment variables not set for avatar upload (AuthContext).");
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET_CTX);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME_CTX}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudinary avatar upload failed: ${errorData.error.message}`);
  }
  const data = await response.json();
  return data.secure_url;
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("AuthContext: onAuthStateChanged triggered. fbUser UID:", fbUser?.uid);
      setIsLoading(true); 
      try {
        if (fbUser) {
          console.log("AuthContext: Firebase user found:", fbUser.uid, "Email verified:", fbUser.emailVerified);
          setFirebaseUser(fbUser); 

          const userDocRef = doc(db, "users", fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            console.log("AuthContext: User document found in Firestore for:", fbUser.uid);
            const userData = userDocSnap.data();
            const appUser: AppUser = { 
              uid: fbUser.uid, 
              ...userData,
              createdAt: (userData.createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
              updatedAt: (userData.updatedAt as Timestamp)?.toDate()?.toISOString() || undefined,
            } as AppUser;
            setUser(appUser);
          } else {
            console.warn("AuthContext: User document NOT found in Firestore for UID:", fbUser.uid);
            setUser(null); 
            // If verified but no doc, this is an issue the navigation useEffect will handle (force logout).
          }
        } else {
          console.log("AuthContext: No Firebase user.");
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error: any) {
        console.error("AuthContext: Error processing auth state (e.g., Firestore read failed):", error);
        toast({ title: "Authentication Error", description: `Failed to load user profile: ${error.message}`, variant: "destructive" });
        setUser(null); 
        setFirebaseUser(fbUser); // Keep fbUser if read failed, navigation will handle.
      } finally {
        setIsLoading(false); 
        console.log("AuthContext: onAuthStateChanged processing finished. New isLoading:", false);
      }
    });
    return () => unsubscribe();
  }, [toast]); 

  useEffect(() => {
    if (isLoading) {
      console.log("AuthContext Navigation: Skipped, isLoading is true.");
      return;
    }
    
    const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
    const isVerifyEmailRoute = pathname === '/verify-email';
    const isLandingPage = pathname === '/';
      
    console.log(`AuthContext Navigation Check: Path: ${pathname}, AppUser: ${!!user}, FirebaseUser: ${!!firebaseUser}, Verified: ${firebaseUser?.emailVerified === undefined ? 'N/A' : firebaseUser.emailVerified }`);

    if (firebaseUser) { 
      if (!firebaseUser.emailVerified) {
        if (!isVerifyEmailRoute && !isAuthRoute && !isLandingPage) {
          console.log("AuthContext Navigation: Redirecting to /verify-email (User not verified, not on verify/auth/landing)");
          router.replace('/verify-email');
        }
      } else { // Firebase user is verified
        if (user) { // App user (from Firestore) also exists
          if (isAuthRoute || isVerifyEmailRoute || isLandingPage) {
            console.log("AuthContext Navigation: Redirecting to /dashboard (User verified & loaded, but on auth/verify/landing page)");
            router.replace('/dashboard');
          }
        } else { 
          // Firebase user verified, BUT app user (Firestore doc) is NULL.
          // This is an inconsistent state if on a protected route.
          if (!isAuthRoute && !isVerifyEmailRoute && !isLandingPage) {
            console.error("AuthContext Navigation: Firebase user verified but app user data missing. Forcing logout.");
            toast({ title: "Session Issue", description: "User profile data not found. Logging out to resolve.", variant: "destructive", duration: 7000 });
            firebaseSignOut(auth).catch(err => console.error("AuthContext: Error during forced logout:", err));
            // onAuthStateChanged will run, setting firebaseUser to null, leading to login redirect.
          } else {
             console.log("AuthContext Navigation: Firebase user verified, app user missing, but on auth/verify/landing. No redirect needed yet.");
          }
        }
      }
    } else { // No Firebase user (not logged in, or logged out)
      if (!isAuthRoute && !isVerifyEmailRoute && !isLandingPage) {
        console.log("AuthContext Navigation: Redirecting to /login (No Firebase user, not on auth/verify/landing)");
        router.replace('/login');
      }
    }
  }, [user, firebaseUser, isLoading, pathname, router, toast]);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setIsLoading(false); 
      throw error; 
    }
  };

  const signup = async (name: string, email: string, password: string, year: UserYear, branch: UserBranch) => {
    setIsLoading(true);
    try {
      if (!email.endsWith('@mlrit.ac.in')) {
         const err = new Error('Only MLRIT email addresses (@mlrit.ac.in) are allowed.');
         toast({ title: "Invalid Email Domain", description: err.message, variant: "destructive" });
         throw err;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      await updateFirebaseProfile(fbUser, { displayName: name });

      const userProfileData: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'> & { createdAt: FieldValue, updatedAt: FieldValue } = {
        name,
        email,
        year,
        branch,
        avatarUrl: `https://placehold.co/150x150.png?text=${name.substring(0,2).toUpperCase()}`,
        contactInfo: {}, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", fbUser.uid), userProfileData);
      
      await sendEmailVerification(fbUser);
      toast({ 
        title: "Account Created!", 
        description: `Please verify your email. A verification link has been sent to ${fbUser.email}.`, 
        duration: 10000 
      });
    } catch (error: any) {
      setIsLoading(false); 
      throw error; 
    }
  };

  const logout = async () => {
    setIsLoading(true); 
    try {
        await firebaseSignOut(auth);
    } catch(error: any) {
        console.error("AuthContext: Error during logout:", error);
        toast({ title: "Logout Failed", description: error.message || "Could not log you out.", variant: "destructive"});
    } finally {
        // isLoading will be set to false by onAuthStateChanged after sign out completes
        // However, if signout itself fails, we might need to set it false here.
        // Let onAuthStateChanged handle it for consistency. If it gets stuck, then reconsider.
    }
  };

  const updateUserProfile = async (data: Partial<AppUser>, newAvatarFile?: File | null) => {
    if (!firebaseUser || !user) {
      const err = new Error("User not authenticated.");
      toast({ title: "Error", description: "You must be logged in to update profile.", variant: "destructive" });
      throw err;
    }

    let finalAvatarUrl = data.avatarUrl === '' ? null : (data.avatarUrl || user.avatarUrl); // Handle empty string to remove avatar

    try {
      if (newAvatarFile) {
        finalAvatarUrl = await uploadAvatarToCloudinaryCtx(newAvatarFile);
      }
      
      const firestoreUpdateData: any = { // Use `any` temporarily for dynamic field assignment
        updatedAt: serverTimestamp(),
      };

      if (data.name !== undefined && data.name !== user.name) firestoreUpdateData.name = data.name;
      if (data.year !== undefined && data.year !== user.year) firestoreUpdateData.year = data.year;
      if (data.contactInfo !== undefined) firestoreUpdateData.contactInfo = { phone: data.contactInfo.phone || null }; // Store null if empty
      if (finalAvatarUrl !== user.avatarUrl) firestoreUpdateData.avatarUrl = finalAvatarUrl;
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userDocRef, firestoreUpdateData);

      if ((firestoreUpdateData.name && firestoreUpdateData.name !== firebaseUser.displayName) || 
          (finalAvatarUrl !== undefined && finalAvatarUrl !== firebaseUser.photoURL)) {
        await updateFirebaseProfile(firebaseUser, {
          displayName: firestoreUpdateData.name || firebaseUser.displayName,
          photoURL: finalAvatarUrl === null ? "" : (finalAvatarUrl || firebaseUser.photoURL), // Send empty string to Firebase Auth to remove photo
        });
      }
      
      setUser(prevUser => prevUser ? ({
        ...prevUser,
        ...firestoreUpdateData, // Spread the updates
        avatarUrl: finalAvatarUrl ?? undefined, // Ensure avatarUrl is correctly set or undefined
        updatedAt: new Date().toISOString(), 
      }) : null);
      
      toast({ title: "Profile Updated", description: "Your information has been saved." });
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (!firebaseUser) {
      const err = new Error("No user logged in.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      throw err;
    }
    if (firebaseUser.emailVerified) {
      toast({ title: "Already Verified", description: "Your email is already verified." });
      router.replace('/dashboard'); 
      return;
    }
    try {
      await sendEmailVerification(firebaseUser);
      toast({ title: "Verification Email Sent", description: "Please check your inbox." });
    } catch (error: any) {
      toast({ title: "Error Sending Email", description: error.message || "Could not resend email.", variant: "destructive" });
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: `If an account exists for ${email}, a reset link has been sent.` });
    } catch (error: any) {
      toast({ title: "Request Submitted", description: `If an account exists for ${email}, a reset link has been sent. Check spam if not found.`, variant: "default" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, signup, logout, updateUserProfile, resendVerificationEmail, sendPasswordReset, toast }}>
      {children}
    </AuthContext.Provider>
  );
};
