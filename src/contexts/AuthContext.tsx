
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
  logout: () => Promise<void>;
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
    console.log("AuthContext: Initializing, isLoading set to true.");
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("AuthContext: onAuthStateChanged event. fbUser UID:", fbUser?.uid, "Current isLoading:", isLoading);
      // Keep isLoading true until all async operations inside are done
      setIsLoading(true); 
      if (fbUser) {
        console.log("AuthContext: Firebase user found. UID:", fbUser.uid, "Email Verified:", fbUser.emailVerified);
        setFirebaseUser(fbUser);
        try {
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const appUser: AppUser = { 
              uid: fbUser.uid, 
              ...userData,
              createdAt: (userData.createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
              updatedAt: (userData.updatedAt as Timestamp)?.toDate()?.toISOString() || undefined,
            } as AppUser;
            console.log("AuthContext: Firestore user document found, setting app user:", appUser.name);
            setUser(appUser);
          } else {
            console.warn("AuthContext: Firestore user document NOT found for UID:", fbUser.uid, ". Setting app user to null.");
            setUser(null); 
          }
        } catch (error: any) {
          console.error("AuthContext: Error fetching Firestore user document for UID:", fbUser.uid, error);
          toast({ title: "Profile Error", description: `Failed to load user profile: ${error.message}. Please try refreshing.`, variant: "destructive" });
          setUser(null);
        } finally {
           setIsLoading(false);
           console.log("AuthContext: Firebase user processing finished. New isLoading: false.");
        }
      } else {
        console.log("AuthContext: No Firebase user. Clearing firebaseUser and app user.");
        setFirebaseUser(null);
        setUser(null);
        setIsLoading(false);
        console.log("AuthContext: No Firebase user processing finished. New isLoading: false.");
      }
    });
    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [toast]); // Removed isLoading from here, it's managed internally by the effect

  useEffect(() => {
    console.log(`AuthContext Navigation Check: isLoading: ${isLoading}, Path: ${pathname}, AppUser: ${!!user}, FirebaseUser: ${!!firebaseUser}, Verified: ${firebaseUser?.emailVerified}`);

    if (isLoading) {
      console.log("AuthContext Navigation: Skipped, still loading auth state.");
      return;
    }
    
    const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
    const isVerifyEmailRoute = pathname === '/verify-email';
    const isLandingPage = pathname === '/';
      
    if (firebaseUser) { 
      if (!firebaseUser.emailVerified) {
        if (!isVerifyEmailRoute && !isAuthRoute && !isLandingPage) {
          console.log("AuthContext Navigation: Redirecting to /verify-email (User not verified, not on verify/auth/landing). Current path:", pathname);
          router.replace('/verify-email');
        } else {
          console.log("AuthContext Navigation: User not verified, but on allowed page (verify/auth/landing). No redirect.");
        }
      } else { // Firebase user is verified
        if (user) { // App user (from Firestore) also exists
          if (isAuthRoute || isVerifyEmailRoute || isLandingPage) {
            console.log("AuthContext Navigation: Redirecting to /dashboard (User verified & loaded, but on auth/verify/landing page). Current path:", pathname);
            router.replace('/dashboard');
          } else {
            console.log("AuthContext Navigation: User verified & loaded, on protected page. No redirect needed.");
          }
        } else { 
          // Firebase user verified, BUT app user (Firestore doc) is NULL.
          // This is an inconsistent state if on a protected route.
          if (!isAuthRoute && !isVerifyEmailRoute && !isLandingPage) {
            console.error("AuthContext Navigation: Inconsistent state! Firebase user verified but app user data missing. Forcing logout. Current path:", pathname);
            toast({ title: "Session Issue", description: "Your user profile data could not be loaded. Please log in again.", variant: "destructive", duration: 7000 });
            firebaseSignOut(auth).catch(err => console.error("AuthContext: Error during forced logout due to missing app user data:", err));
            // onAuthStateChanged will run, setting firebaseUser to null, which should trigger login redirect.
          } else {
             console.log("AuthContext Navigation: Firebase user verified, app user missing, but on auth/verify/landing. No redirect needed yet.");
          }
        }
      }
    } else { // No Firebase user (not logged in, or logged out)
      if (!isAuthRoute && !isVerifyEmailRoute && !isLandingPage) {
        console.log("AuthContext Navigation: Redirecting to /login (No Firebase user, not on auth/verify/landing). Current path:", pathname);
        router.replace('/login');
      } else {
        console.log("AuthContext Navigation: No Firebase user, but on allowed page (auth/verify/landing). No redirect.");
      }
    }
  }, [user, firebaseUser, isLoading, pathname, router, toast]);


  const login = async (email: string, password: string) => {
    console.log("AuthContext: Attempting login for email:", email);
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // isLoading will be set to false by onAuthStateChanged
      console.log("AuthContext: signInWithEmailAndPassword successful for:", email);
    } catch (error: any) {
      console.error("AuthContext: Login failed for:", email, error);
      setIsLoading(false); 
      throw error; 
    }
  };

  const signup = async (name: string, email: string, password: string, year: UserYear, branch: UserBranch) => {
    console.log("AuthContext: Attempting signup for email:", email);
    setIsLoading(true);
    try {
      if (!email.endsWith('@mlrit.ac.in')) {
         const err = new Error('Only MLRIT email addresses (@mlrit.ac.in) are allowed.');
         toast({ title: "Invalid Email Domain", description: err.message, variant: "destructive" });
         throw err;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      console.log("AuthContext: Firebase user created. UID:", fbUser.uid);

      await updateFirebaseProfile(fbUser, { displayName: name });
      console.log("AuthContext: Firebase profile updated with displayName:", name);

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
      console.log("AuthContext: Firestore user document created for UID:", fbUser.uid);
      
      await sendEmailVerification(fbUser);
      console.log("AuthContext: Verification email sent to:", fbUser.email);
      toast({ 
        title: "Account Created!", 
        description: `Please verify your email. A verification link has been sent to ${fbUser.email}.`, 
        duration: 10000 
      });
      // isLoading will be set to false by onAuthStateChanged
    } catch (error: any) {
      console.error("AuthContext: Signup failed for:", email, error);
      setIsLoading(false); 
      throw error; 
    }
  };

  const logout = async () => {
    console.log("AuthContext: Attempting logout for user:", firebaseUser?.uid);
    setIsLoading(true); 
    try {
        await firebaseSignOut(auth);
        console.log("AuthContext: firebaseSignOut successful.");
    } catch(error: any) {
        console.error("AuthContext: Error during logout:", error);
        toast({ title: "Logout Failed", description: error.message || "Could not log you out.", variant: "destructive"});
        setIsLoading(false); // Set loading false if logout itself fails, as onAuthStateChanged might not fire or might be delayed
    }
  };

  const updateUserProfile = async (data: Partial<AppUser>, newAvatarFile?: File | null) => {
    if (!firebaseUser || !user) {
      const err = new Error("User not authenticated for profile update.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      throw err;
    }
    console.log("AuthContext: Updating profile for user:", user.uid, "Data:", data);
    setIsLoading(true);

    let finalAvatarUrl: string | undefined | null = data.avatarUrl; 

    if (newAvatarFile) {
      console.log("AuthContext: New avatar file provided, attempting upload.");
      try {
        finalAvatarUrl = await uploadAvatarToCloudinaryCtx(newAvatarFile);
        console.log("AuthContext: Cloudinary upload successful, URL:", finalAvatarUrl);
      } catch (uploadError: any) {
        console.error("AuthContext: Cloudinary avatar upload failed:", uploadError);
        toast({ title: "Avatar Upload Failed", description: uploadError.message, variant: "destructive" });
        setIsLoading(false);
        throw uploadError;
      }
    } else if (data.avatarUrl === '') { // Explicitly clearing avatar URL
        finalAvatarUrl = null; // Use null to indicate removal
        console.log("AuthContext: Avatar URL explicitly cleared.");
    } else if (data.avatarUrl === undefined) { // No change to avatar URL from form, keep existing
        finalAvatarUrl = user.avatarUrl;
        console.log("AuthContext: No change to avatar URL from form, keeping:", finalAvatarUrl);
    }
    
    try {
      const firestoreUpdateData: any = { updatedAt: serverTimestamp() };
      if (data.name !== undefined && data.name !== user.name) firestoreUpdateData.name = data.name;
      if (data.year !== undefined && data.year !== user.year) firestoreUpdateData.year = data.year;
      if (data.contactInfo?.phone !== undefined) firestoreUpdateData['contactInfo.phone'] = data.contactInfo.phone || null;
      
      // Only update avatarUrl in Firestore if it has actually changed or is being removed
      if (finalAvatarUrl !== user.avatarUrl) {
        firestoreUpdateData.avatarUrl = finalAvatarUrl === null ? null : finalAvatarUrl; // Store null if removing
      }

      if (Object.keys(firestoreUpdateData).length > 1) { // if more than just updatedAt
        const userDocRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userDocRef, firestoreUpdateData);
        console.log("AuthContext: Firestore profile updated with:", firestoreUpdateData);
      }

      const firebaseProfileUpdates: { displayName?: string; photoURL?: string | null } = {};
      if (firestoreUpdateData.name && firestoreUpdateData.name !== firebaseUser.displayName) {
        firebaseProfileUpdates.displayName = firestoreUpdateData.name;
      }
      if (finalAvatarUrl !== firebaseUser.photoURL) { // Compare with current Firebase Auth photoURL
         firebaseProfileUpdates.photoURL = finalAvatarUrl === null ? null : finalAvatarUrl; // Pass null to Firebase to remove
      }

      if (Object.keys(firebaseProfileUpdates).length > 0) {
        await updateFirebaseProfile(firebaseUser, firebaseProfileUpdates);
        console.log("AuthContext: Firebase Auth profile updated with:", firebaseProfileUpdates);
      }
      
      // Optimistically update local state, or let onAuthStateChanged handle it if photoURL change triggers it
       setUser(prevUser => prevUser ? ({
        ...prevUser,
        name: firestoreUpdateData.name ?? prevUser.name,
        year: firestoreUpdateData.year ?? prevUser.year,
        contactInfo: { phone: firestoreUpdateData['contactInfo.phone'] === null ? undefined : (firestoreUpdateData['contactInfo.phone'] ?? prevUser.contactInfo?.phone) },
        avatarUrl: finalAvatarUrl === null ? undefined : (finalAvatarUrl ?? prevUser.avatarUrl),
        updatedAt: new Date().toISOString(), 
      }) : null);
      
      toast({ title: "Profile Updated", description: "Your information has been saved." });
    } catch (error: any) {
      console.error("AuthContext: Profile update failed:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!firebaseUser) {
      const err = new Error("No user logged in to resend verification email.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      throw err;
    }
    if (firebaseUser.emailVerified) {
      toast({ title: "Already Verified", description: "Your email is already verified." });
      router.replace('/dashboard'); 
      return;
    }
    console.log("AuthContext: Resending verification email for:", firebaseUser.email);
    setIsLoading(true);
    try {
      await sendEmailVerification(firebaseUser);
      toast({ title: "Verification Email Sent", description: "Please check your inbox." });
    } catch (error: any) {
      console.error("AuthContext: Error resending verification email:", error);
      toast({ title: "Error Sending Email", description: error.message || "Could not resend email.", variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    console.log("AuthContext: Sending password reset for email:", email);
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: `If an account exists for ${email}, a reset link has been sent.` });
    } catch (error: any)
     {
      console.error("AuthContext: Error sending password reset email:", error);
      // Still show a generic message for privacy, even on error
      toast({ title: "Request Submitted", description: `If an account exists for ${email}, a reset link has been sent. Check spam if not found.`, variant: "default" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, signup, logout, updateUserProfile, resendVerificationEmail, sendPasswordReset, toast }}>
      {children}
    </AuthContext.Provider>
  );
};
