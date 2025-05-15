
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
      setIsLoading(true); // Start loading when auth state changes
      try {
        if (fbUser) {
          console.log("AuthContext: onAuthStateChanged - Firebase user found:", fbUser.uid);
          setFirebaseUser(fbUser);
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            console.log("AuthContext: onAuthStateChanged - User document found in Firestore for:", fbUser.uid);
            const userData = userDocSnap.data();
            const appUser: AppUser = { 
              uid: fbUser.uid, 
              ...userData,
              createdAt: (userData.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
              updatedAt: (userData.updatedAt as Timestamp)?.toDate().toISOString() || undefined,
            } as AppUser;
            setUser(appUser);
          } else {
            console.warn("AuthContext: onAuthStateChanged - User document NOT found in Firestore for UID:", fbUser.uid, "This might occur if Firestore write failed after Auth creation or user was deleted from DB but not Auth.");
            setUser(null); 
          }
        } else {
          console.log("AuthContext: onAuthStateChanged - No Firebase user.");
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: onAuthStateChanged - Error processing auth state:", error);
        setUser(null); // Ensure clean state on error
        setFirebaseUser(fbUser); // Keep fbUser if error was during profile fetch
      } finally {
        setIsLoading(false); // CRITICAL: Always stop loading
        console.log("AuthContext: onAuthStateChanged - Processing finished, isLoading set to false.");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname === '/login' || pathname === '/signup';
      const isVerifyEmailRoute = pathname === '/verify-email';
      const isLandingPage = pathname === '/';
      
      console.log(`AuthContext: useEffect - Path: ${pathname}, User: ${!!user}, Verified: ${firebaseUser?.emailVerified}, isLoading: ${isLoading}`);

      if (!user && !isAuthRoute && !isVerifyEmailRoute && !isLandingPage) {
        console.log("AuthContext: useEffect - Redirecting to /login (user not found, not on auth/verify/landing)");
        router.push('/login');
      } else if (user && firebaseUser?.emailVerified && (isAuthRoute || isVerifyEmailRoute || isLandingPage)) {
        console.log("AuthContext: useEffect - Redirecting to /dashboard (user found, verified, on auth/verify/landing)");
        router.push('/dashboard');
      } else if (user && !firebaseUser?.emailVerified && !isVerifyEmailRoute && !isAuthRoute && !isLandingPage) {
        console.log("AuthContext: useEffect - Redirecting to /verify-email (user found, not verified, not on verify/auth/landing)");
        router.push('/verify-email');
      }
    }
  }, [user, firebaseUser, isLoading, pathname, router]);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and setIsLoading(false)
      if (!userCredential.user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email. You might be redirected shortly.",
          variant: "destructive",
          duration: 7000,
        });
      }
      // Successful login processing continues in onAuthStateChanged and useEffect
    } catch (error: any) {
      setIsLoading(false); // Ensure loading stops on login API error
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
         setIsLoading(false); // Stop loading if validation fails early
         throw new Error('Only MLRIT email addresses are allowed.');
      }

      console.log(`AuthContext: Creating user in Firebase Auth for ${email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      console.log(`AuthContext: Firebase Auth user created for ${email} with UID ${fbUser.uid}`);

      await updateFirebaseProfile(fbUser, { displayName: name });
      console.log(`AuthContext: Firebase Auth profile updated for ${email}`);

      const userProfile: Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        name,
        email,
        year,
        branch,
        avatarUrl: `https://placehold.co/150x150.png?text=${name.substring(0,2).toUpperCase()}`,
        contactInfo: {}, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log(`AuthContext: Storing user profile in Firestore for ${email}`);
      await setDoc(doc(db, "users", fbUser.uid), userProfile);
      console.log(`AuthContext: User profile stored in Firestore for ${email}`);
      
      console.log(`AuthContext: Preparing to send verification email to ${fbUser.email}...`);
      await sendEmailVerification(fbUser);
      console.log(`AuthContext: Verification email dispatched to ${fbUser.email}.`);
      
      toast({ 
        title: "Account Created! Verify Your Email", 
        description: `A verification link has been sent to ${fbUser.email}. Please check your inbox (and spam folder). You'll be redirected shortly.`, 
        duration: 10000 
      });
      // onAuthStateChanged and useEffect will handle redirection and final isLoading state
    } catch (error: any) {
      setIsLoading(false); // Ensure loading stops on signup API error
      console.error(`AuthContext: Signup error for ${email}:`, error.code, error.message);
      throw error; 
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await firebaseSignOut(auth);
    // onAuthStateChanged will set user to null and then setIsLoading(false)
  };

  const updateUserProfile = async (data: Partial<AppUser>, newAvatarFile?: File | null) => {
    if (!firebaseUser || !user) {
      toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
      throw new Error("User not authenticated.");
    }
    setIsLoading(true);
    try {
      let newAvatarUrl = data.avatarUrl || user.avatarUrl; 

      if (newAvatarFile) {
        if (user.avatarUrl && user.avatarUrl.includes('firebasestorage.googleapis.com') && !user.avatarUrl.includes('placehold.co')) {
            try {
                const oldAvatarPath = new URL(user.avatarUrl).pathname.split('/o/')[1].split('?')[0];
                const decodedOldAvatarPath = decodeURIComponent(oldAvatarPath);
                const oldAvatarRef = ref(storage, decodedOldAvatarPath);
                await deleteObject(oldAvatarRef);
            } catch (e) {
                console.warn("Could not delete old avatar from storage, it might not exist or path was incorrect:", e);
            }
        }
        const storageRefPath = `avatars/${firebaseUser.uid}/${Date.now()}_${newAvatarFile.name}`;
        const imageRef = ref(storage, storageRefPath);
        const snapshot = await uploadBytes(imageRef, newAvatarFile);
        newAvatarUrl = await getDownloadURL(snapshot.ref);
      } else if (data.avatarUrl && data.avatarUrl !== user.avatarUrl && user.avatarUrl && user.avatarUrl.includes('firebasestorage.googleapis.com') && !user.avatarUrl.includes('placehold.co')) {
         try {
            const oldAvatarPath = new URL(user.avatarUrl).pathname.split('/o/')[1].split('?')[0];
            const decodedOldAvatarPath = decodeURIComponent(oldAvatarPath);
            const oldAvatarRef = ref(storage, decodedOldAvatarPath);
            await deleteObject(oldAvatarRef);
        } catch (e) {
            console.warn("Could not delete old avatar from storage when switching to new URL:", e);
        }
      }
      
      const firestoreUpdateData: Partial<Omit<AppUser, 'uid' | 'email' | 'year' | 'branch' | 'createdAt'>> & {updatedAt: any} = { 
        name: data.name,
        contactInfo: data.contactInfo,
        avatarUrl: newAvatarUrl, 
        updatedAt: serverTimestamp(),
      };
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userDocRef, firestoreUpdateData);

      if ((data.name && data.name !== firebaseUser.displayName) || (newAvatarUrl && newAvatarUrl !== firebaseUser.photoURL)) {
        await updateFirebaseProfile(firebaseUser, {
          displayName: data.name || firebaseUser.displayName,
          photoURL: newAvatarUrl || firebaseUser.photoURL,
        });
      }
      
      setUser(prevUser => {
        const updatedUser = { 
          ...prevUser!, 
          name: data.name || prevUser!.name,
          contactInfo: data.contactInfo !== undefined ? data.contactInfo : prevUser!.contactInfo,
          avatarUrl: newAvatarUrl,
          uid: prevUser!.uid,
          email: prevUser!.email,
          year: prevUser!.year,
          branch: prevUser!.branch,
          createdAt: prevUser!.createdAt,
        };
        return updatedUser as AppUser;
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

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, signup, logout, updateUserProfile, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

