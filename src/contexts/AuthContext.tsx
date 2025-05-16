
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
  type User as FirebaseUserType
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp, type FieldValue } from 'firebase/firestore'; // Added FieldValue
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
      console.log("AuthContext: onAuthStateChanged triggered. fbUser UID:", fbUser?.uid, "Current isLoading state:", isLoading);
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
            console.warn("AuthContext: User document NOT found in Firestore for UID:", fbUser.uid, "Logging out.");
            await firebaseSignOut(auth); 
            setUser(null); 
            setFirebaseUser(null);
          }
        } else {
          console.log("AuthContext: No Firebase user.");
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error processing auth state:", error);
        setUser(null); 
        setFirebaseUser(fbUser); // Keep fbUser if processing failed, might be an intermittent Firestore issue
      } finally {
        setIsLoading(false); 
        console.log("AuthContext: onAuthStateChanged processing finished. New isLoading:", false, "User UID:", user?.uid);
      }
    });

    return () => unsubscribe();
  }, []); // Removed user & firebaseUser from deps to avoid re-runs based on their own setting

  useEffect(() => {
    if (isLoading) {
      console.log("AuthContext: Navigation check skipped, isLoading is true.");
      return;
    }
    
    const isAuthRoute = pathname === '/login' || pathname === '/signup';
    const isVerifyEmailRoute = pathname === '/verify-email';
    const isLandingPage = pathname === '/';
      
    console.log(`AuthContext Navigation Check: Path: ${pathname}, User: ${!!user}, Verified: ${!!firebaseUser?.emailVerified}, isLoading: ${isLoading}`);

    if (!user && !isAuthRoute && !isVerifyEmailRoute && !isLandingPage) {
      console.log("AuthContext: Redirecting to /login (user not found, not on auth/verify/landing pages)");
      router.push('/login');
    } else if (user && firebaseUser?.emailVerified && (isAuthRoute || isVerifyEmailRoute || isLandingPage)) {
      console.log("AuthContext: Redirecting to /dashboard (user found & verified, on auth/verify/landing page)");
      router.push('/dashboard');
    } else if (user && !firebaseUser?.emailVerified && !isVerifyEmailRoute && !isAuthRoute && !isLandingPage) {
      console.log("AuthContext: Redirecting to /verify-email (user found but not verified, not on verify/auth/landing page)");
      router.push('/verify-email');
    } else {
      console.log("AuthContext: No navigation redirection needed based on current state.");
    }

  }, [user, firebaseUser, isLoading, pathname, router]);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: Login successful for", email, "Verified:", userCredential.user.emailVerified);
      if (!userCredential.user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email. You will be redirected to the verification page.",
          variant: "destructive",
          duration: 7000,
        });
      } else {
        toast({ title: "Login Successful", description: "Welcome back!"});
      }
    } catch (error: any) {
      setIsLoading(false); 
      console.error("AuthContext: Login error -", error.code, error.message);
      throw error; 
    }
  };

  const signup = async (name: string, email: string, password: string, year: UserYear, branch: UserBranch) => {
    setIsLoading(true);
    console.log(`AuthContext: Attempting signup for ${email}`);
    try {
      if (!email.endsWith('@mlrit.ac.in')) {
         toast({ title: "Invalid Email Domain", description: "Only MLRIT email addresses (@mlrit.ac.in) are allowed.", variant: "destructive" });
         setIsLoading(false);
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

      console.log(`AuthContext: Storing user profile in Firestore for ${email}:`, JSON.stringify(userProfile, null, 2)); // More detailed log
      await setDoc(doc(db, "users", fbUser.uid), userProfile);
      console.log(`AuthContext: User profile stored in Firestore for ${email}`);
      
      console.log(`AuthContext: Preparing to send verification email to ${fbUser.email}...`);
      await sendEmailVerification(fbUser);
      console.log(`AuthContext: Verification email dispatched to ${fbUser.email}.`);
      
      toast({ 
        title: "Account Created! Please Verify Your Email.", 
        description: `A verification link has been sent to ${fbUser.email}. Check your inbox (and spam folder!). You will be redirected.`, 
        duration: 10000 
      });
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
        setUser(null);
        setFirebaseUser(null);
        // No need to push to /login here if onAuthStateChanged handles it, but can be explicit
        router.push('/login'); 
    } catch(error) {
        console.error("AuthContext: Error during logout:", error);
        toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive"});
    } finally {
        setIsLoading(false);
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
      
      const firestoreUpdateData: {
        updatedAt: FieldValue;
        name?: string;
        year?: UserYear;
        contactInfo?: { phone?: string | undefined };
        avatarUrl?: string;
      } = {
        updatedAt: serverTimestamp(),
      };

      if (data.name && data.name !== user.name) firestoreUpdateData.name = data.name;
      if (data.year && data.year !== user.year) firestoreUpdateData.year = data.year;
      
      if (data.contactInfo !== undefined) { // Check if contactInfo object itself is part of the update
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
      
      setUser(prevUser => {
        if (!prevUser) return null;
        // Create a new object for the updated user state
        const updatedAppUser = { ...prevUser };
        if (firestoreUpdateData.name) updatedAppUser.name = firestoreUpdateData.name;
        if (firestoreUpdateData.year) updatedAppUser.year = firestoreUpdateData.year;
        if (firestoreUpdateData.contactInfo) updatedAppUser.contactInfo = firestoreUpdateData.contactInfo;
        if (firestoreUpdateData.avatarUrl) updatedAppUser.avatarUrl = firestoreUpdateData.avatarUrl;
        updatedAppUser.updatedAt = new Date().toISOString(); // Reflect update time
        return updatedAppUser;
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
    } catch (error: any) { // Added opening brace for catch block
      console.error("Resend verification email error:", error);
      toast({ title: "Error Sending Email", description: error.message || "Could not resend verification email.", variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, signup, logout, updateUserProfile, resendVerificationEmail, toast }}>
      {children}
    </AuthContext.Provider>
  );
};

