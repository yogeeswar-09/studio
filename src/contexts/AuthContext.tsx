
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
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
          setUser({ uid: fbUser.uid, ...userDocSnap.data() } as AppUser);
        } else {
          console.warn("User document not found in Firestore for UID:", fbUser.uid);
          // This might happen if Firestore doc creation failed or is delayed.
          // For a brief period, fbUser might be set but AppUser profile is not.
          // Consider if a minimal AppUser object should be created here from fbUser, or if logout is safer.
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
      const isAuthPage = pathname?.startsWith('/auth');
      const isLandingPage = pathname === '/';
      
      if (!user && !isAuthPage && !isLandingPage) {
        router.push('/auth/login');
      } else if (user && user.email && firebaseUser?.emailVerified && (isAuthPage || isLandingPage)) {
        router.push('/dashboard');
      } else if (user && user.email && !firebaseUser?.emailVerified && !pathname?.startsWith('/auth/verify-email') && !isAuthPage) {
        // If user is logged in but email not verified, and not on verify page or other auth pages, redirect to verify.
        router.push('/auth/verify-email');
      }
    }
  }, [user, firebaseUser, isLoading, pathname, router]);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before logging in. Check your inbox for the verification link.",
          variant: "destructive",
          duration: 7000,
        });
        // firebaseSignOut(auth); // Sign out user if email not verified, let them go to verify page
        // router.push('/auth/verify-email'); // Or redirect them
        // For now, onAuthStateChanged will update state and might redirect based on the above useEffect.
        // Consider specific redirection logic here if needed.
      }
      // onAuthStateChanged will handle setting user state and redirecting
    } catch (error: any) {
      setIsLoading(false);
      console.error("Login error:", error);
      throw error; 
    }
  };

  const signup = async (name: string, email: string, password: string, year: UserYear, branch: UserBranch) => {
    setIsLoading(true);
    try {
      if (!email.endsWith('@mlrit.ac.in')) {
        throw new Error('Only MLRIT email addresses are allowed.');
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      await updateFirebaseProfile(fbUser, { displayName: name });

      const userProfile: Omit<AppUser, 'uid' | 'createdAt'> & { createdAt: any } = {
        name,
        email,
        year,
        branch,
        avatarUrl: `https://placehold.co/150x150.png?text=${name.substring(0,2).toUpperCase()}`,
        contactInfo: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", fbUser.uid), userProfile);
      
      await sendEmailVerification(fbUser);
      
      toast({ title: "Signup Successful!", description: "Please check your email to verify your account.", duration: 7000 });
      router.push('/auth/verify-email');
    } catch (error: any) {
      setIsLoading(false);
      console.error("Signup error:", error);
      throw error; 
    }
    // setIsLoading(false); // onAuthStateChanged will handle final loading state update after router push
  };

  const logout = async () => {
    setIsLoading(true);
    await firebaseSignOut(auth);
    // onAuthStateChanged will handle setting user to null and redirecting via useEffect.
  };

  const updateUserProfile = async (data: Partial<AppUser>, newAvatarFile?: File | null) => {
    if (!firebaseUser || !user) {
      throw new Error("User not authenticated.");
    }
    setIsLoading(true);
    try {
      let newAvatarUrl = data.avatarUrl || user.avatarUrl;

      if (newAvatarFile) {
        // Delete old avatar if it exists and is from Firebase Storage
        if (user.avatarUrl && user.avatarUrl.includes('firebasestorage.googleapis.com')) {
            try {
                const oldAvatarRef = ref(storage, user.avatarUrl);
                await deleteObject(oldAvatarRef);
            } catch (e) {
                console.warn("Could not delete old avatar, it might not exist or error:", e);
            }
        }
        const storageRefPath = `avatars/${firebaseUser.uid}/${Date.now()}_${newAvatarFile.name}`;
        const imageRef = ref(storage, storageRefPath);
        const snapshot = await uploadBytes(imageRef, newAvatarFile);
        newAvatarUrl = await getDownloadURL(snapshot.ref);
      }
      
      const profileToUpdateFirestore: Partial<AppUser> = { 
        ...data, 
        avatarUrl: newAvatarUrl,
        updatedAt: serverTimestamp(),
      };
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userDocRef, profileToUpdateFirestore);

      if (data.name || newAvatarUrl) {
        await updateFirebaseProfile(firebaseUser, {
          displayName: data.name || firebaseUser.displayName,
          photoURL: newAvatarUrl || firebaseUser.photoURL,
        });
      }

      setUser(prevUser => ({ ...prevUser!, ...profileToUpdateFirestore, avatarUrl: newAvatarUrl })); // Ensure avatarUrl is part of update
      
      toast({ title: "Profile Updated", description: "Your information has been saved." });
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
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
      router.push('/auth/login'); // Or dashboard if appropriate
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
