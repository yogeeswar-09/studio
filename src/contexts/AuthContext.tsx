
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
  sendPasswordResetEmail, // Import sendPasswordResetEmail
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
  logout: () => void;
  updateUserProfile: (data: Partial<AppUser>, newAvatarFile?: File | null) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>; // Add sendPasswordReset
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
            console.warn("AuthContext: User document NOT found in Firestore for UID:", fbUser.uid, "Logging out if not on signup/verify path.");
            // Avoid logout if user is in the process of signup or verification
            if (pathname !== '/signup' && pathname !== '/verify-email') {
              await firebaseSignOut(auth); 
            }
            setUser(null); 
            // setFirebaseUser(null); // fbUser is already set, keep it if doc fetch failed but auth state is valid
          }
        } else {
          console.log("AuthContext: No Firebase user.");
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error processing auth state:", error);
        setUser(null); 
        setFirebaseUser(fbUser); 
      } finally {
        setIsLoading(false); 
        console.log("AuthContext: onAuthStateChanged processing finished. New isLoading:", false);
      }
    });

    return () => unsubscribe();
  }, [pathname]);

  useEffect(() => {
    if (isLoading) {
      console.log("AuthContext: Navigation check skipped, isLoading is true.");
      return;
    }
    
    const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
    const isVerifyEmailRoute = pathname === '/verify-email';
    const isLandingPage = pathname === '/';
      
    console.log(`AuthContext Navigation Check: Path: ${pathname}, User: ${!!user}, FirebaseUser: ${!!firebaseUser}, Verified: ${!!firebaseUser?.emailVerified}, isLoading: ${isLoading}`);

    if (!firebaseUser && !isAuthRoute && !isVerifyEmailRoute && !isLandingPage) {
      console.log("AuthContext: Redirecting to /login (no firebaseUser, not on auth/verify/landing pages)");
      router.push('/login');
    } else if (firebaseUser && firebaseUser.emailVerified && (isAuthRoute || isVerifyEmailRoute || isLandingPage)) {
      console.log("AuthContext: Redirecting to /dashboard (firebaseUser found & verified, on auth/verify/landing page)");
      router.push('/dashboard');
    } else if (firebaseUser && !firebaseUser.emailVerified && !isVerifyEmailRoute && !isAuthRoute && !isLandingPage) {
      console.log("AuthContext: Redirecting to /verify-email (firebaseUser found but not verified, not on verify/auth/landing page)");
      router.push('/verify-email');
    } else {
      console.log("AuthContext: No navigation redirection needed based on current state.");
    }

  }, [firebaseUser, isLoading, pathname, router]);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: Login successful for", email, "Verified:", userCredential.user.emailVerified);
      // User and firebaseUser states will be updated by onAuthStateChanged
      // Navigation will be handled by the useEffect hook that watches firebaseUser and pathname
    } catch (error: any) {
      setIsLoading(false); 
      console.error("AuthContext: Login error -", error.code, error.message);
      throw error; 
    }
    // setIsLoading(false) will be handled by onAuthStateChanged's finally block
  };

  const signup = async (name: string, email: string, password: string, year: UserYear, branch: UserBranch) => {
    setIsLoading(true);
    console.log(`AuthContext: Attempting signup for ${email}`);
    try {
      if (!email.endsWith('@mlrit.ac.in')) {
         toast({ title: "Invalid Email Domain", description: "Only MLRIT email addresses (@mlrit.ac.in) are allowed.", variant: "destructive" });
         setIsLoading(false); // Crucial to set loading false here
         throw new Error('Only MLRIT email addresses are allowed.');
      }

      console.log(`AuthContext: Creating user in Firebase Auth for ${email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      console.log(`AuthContext: Firebase Auth user created for ${email} with UID ${fbUser.uid}`);

      await updateFirebaseProfile(fbUser, { displayName: name });
      console.log(`AuthContext: Firebase Auth profile updated for ${email}`);

      const userProfile: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'> & { createdAt: FieldValue, updatedAt: FieldValue } = {
        name,
        email,
        year,
        branch,
        avatarUrl: `https://placehold.co/150x150.png?text=${name.substring(0,2).toUpperCase()}`,
        contactInfo: {}, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log(`AuthContext: Storing user profile in Firestore for ${email}:`, JSON.stringify(userProfile, null, 2));
      await setDoc(doc(db, "users", fbUser.uid), userProfile);
      console.log(`AuthContext: User profile stored in Firestore for ${email}`);
      
      console.log(`AuthContext: Preparing to send verification email to ${fbUser.email}...`);
      await sendEmailVerification(fbUser);
      console.log(`AuthContext: Verification email dispatched to ${fbUser.email}. User will be redirected by onAuthStateChanged and useEffect.`);
      
      toast({ 
        title: "Account Created!", 
        description: `Please verify your email. A verification link has been sent to ${fbUser.email}. Check your inbox (and spam folder!).`, 
        duration: 10000 
      });
      // setIsLoading(false) will be handled by onAuthStateChanged listener.
      // User and firebaseUser state will be updated by onAuthStateChanged
      // Navigation will be handled by the useEffect hook
    } catch (error: any) {
      setIsLoading(false); 
      console.error(`AuthContext: Signup error for ${email}:`, error.code, error.message, error);
      throw error; 
    }
  };

  const logout = async () => {
    console.log("AuthContext: logout initiated");
    setIsLoading(true);
    try {
        await firebaseSignOut(auth);
        console.log("AuthContext: firebaseSignOut completed");
        // setUser(null); // Handled by onAuthStateChanged
        // setFirebaseUser(null); // Handled by onAuthStateChanged
        // router.push('/login'); // Handled by useEffect watching firebaseUser
    } catch(error) {
        console.error("AuthContext: Error during logout:", error);
        toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive"});
    } finally {
        // setIsLoading(false); // Handled by onAuthStateChanged
    }
  };

  const updateUserProfile = async (data: Partial<AppUser>, newAvatarFile?: File | null) => {
    if (!firebaseUser || !user) {
      toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
      throw new Error("User not authenticated.");
    }
    setIsLoading(true);
    try {
      let finalAvatarUrl = data.avatarUrl || user.avatarUrl; 

      if (newAvatarFile) {
        console.log("New avatar file provided, will upload to Cloudinary.");
        finalAvatarUrl = await uploadAvatarToCloudinaryCtx(newAvatarFile);
      } else if (data.avatarUrl && data.avatarUrl !== user.avatarUrl) {
        console.log("Avatar URL changed to a new pasted URL.");
        finalAvatarUrl = data.avatarUrl;
      }
      
      // Type for Firestore update
      type FirestoreUserUpdateData = {
        updatedAt: FieldValue;
        name?: string;
        year?: UserYear;
        contactInfo?: { phone?: string | undefined };
        avatarUrl?: string;
      };

      const firestoreUpdateData: FirestoreUserUpdateData = {
        updatedAt: serverTimestamp(),
      };

      if (data.name && data.name !== user.name) firestoreUpdateData.name = data.name;
      if (data.year && data.year !== user.year) firestoreUpdateData.year = data.year;
      
      if (data.contactInfo !== undefined) {
        firestoreUpdateData.contactInfo = { phone: data.contactInfo.phone || undefined };
      }
      
      if (finalAvatarUrl && finalAvatarUrl !== user.avatarUrl) firestoreUpdateData.avatarUrl = finalAvatarUrl;
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userDocRef, firestoreUpdateData);

      if ((firestoreUpdateData.name && firestoreUpdateData.name !== firebaseUser.displayName) || 
          (firestoreUpdateData.avatarUrl && firestoreUpdateData.avatarUrl !== firebaseUser.photoURL)) {
        await updateFirebaseProfile(firebaseUser, {
          displayName: firestoreUpdateData.name || firebaseUser.displayName,
          photoURL: firestoreUpdateData.avatarUrl || firebaseUser.photoURL,
        });
      }
      
      // Optimistically update local user state
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          ...firestoreUpdateData, // Apply changes
          avatarUrl: finalAvatarUrl || prevUser.avatarUrl, // Ensure avatarUrl is correctly updated
          updatedAt: new Date().toISOString(), // Reflect update time locally
        } as AppUser; // Cast as AppUser because serverTimestamp isn't a string/Timestamp yet
      });
      
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
      router.push('/dashboard'); 
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

  const sendPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: `If an account exists for ${email}, a password reset link has been sent. Please check your inbox.` });
    } catch (error: any) {
      console.error("Send password reset email error:", error);
      // Avoid giving specific error messages like "user not found" for security
      toast({ title: "Request Submitted", description: `If an account exists for ${email}, a password reset link has been sent. If you don't see it, check your spam folder or try again later.`, variant: "default" });
      // We throw the error so the form can potentially handle it, even if the toast is generic
      throw error;
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
