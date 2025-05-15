
"use client";

import type { User as AppUser } from '@/types';
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
  signup: (name: string, email: string, pasword: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<AppUser>, newAvatarFile?: File | null) => Promise<void>;
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
        // Fetch user profile from Firestore
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser({ uid: fbUser.uid, ...userDocSnap.data() } as AppUser);
        } else {
          // This case might happen if Firestore doc creation failed during signup
          // Or if it's a new sign-in method for an existing Firebase Auth user without a profile
          console.warn("User document not found in Firestore for UID:", fbUser.uid);
          // Potentially create a basic profile here or prompt user
           setUser(null); // Or handle as an error/incomplete profile
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
      } else if (user && (isAuthPage || isLandingPage)) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user state and redirecting
    } catch (error: any) {
      setIsLoading(false);
      console.error("Login error:", error);
      throw error; // Re-throw to be caught by the form
    }
    // setIsLoading(false) will be handled by onAuthStateChanged
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      if (!email.endsWith('@mlrit.ac.in')) {
        throw new Error('Only MLRIT email addresses are allowed.');
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      await updateFirebaseProfile(fbUser, { displayName: name });

      const userProfile: Omit<AppUser, 'uid'> = {
        name,
        email,
        avatarUrl: `https://placehold.co/150x150.png?text=${name.substring(0,2).toUpperCase()}`, // Default avatar
        contactInfo: {},
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", fbUser.uid), userProfile);
      
      await sendEmailVerification(fbUser);
      
      // Setting user state here will be overridden by onAuthStateChanged, but useful for immediate UI update
      // setUser({ uid: fbUser.uid, ...userProfile, createdAt: new Date().toISOString() }); // Temp createdAt
      toast({ title: "Signup Successful", description: "Please check your email to verify your account." });
      router.push('/auth/verify-email');
    } catch (error: any) {
      setIsLoading(false);
      console.error("Signup error:", error);
      throw error; // Re-throw to be caught by the form
    }
    setIsLoading(false); // Ensure loading is false if route change doesn't trigger onAuthStateChanged immediately
  };

  const logout = async () => {
    setIsLoading(true);
    await firebaseSignOut(auth);
    // onAuthStateChanged will handle setting user to null and redirecting
    // No need to manually push to /auth/login, useEffect handles it.
  };

  const updateUserProfile = async (data: Partial<AppUser>, newAvatarFile?: File | null) => {
    if (!firebaseUser || !user) {
      throw new Error("User not authenticated.");
    }
    setIsLoading(true);
    try {
      let newAvatarUrl = data.avatarUrl || user.avatarUrl;

      if (newAvatarFile) {
        const storageRef = ref(storage, `avatars/${firebaseUser.uid}/${newAvatarFile.name}`);
        const snapshot = await uploadBytes(storageRef, newAvatarFile);
        newAvatarUrl = await getDownloadURL(snapshot.ref);
      }
      
      const updatedProfileData: Partial<AppUser> = { ...data, avatarUrl: newAvatarUrl };
      
      // Update Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userDocRef, updatedProfileData);

      // Update Firebase Auth profile (displayName, photoURL)
      if (data.name || newAvatarUrl) {
        await updateFirebaseProfile(firebaseUser, {
          displayName: data.name || firebaseUser.displayName,
          photoURL: newAvatarUrl || firebaseUser.photoURL,
        });
      }

      // Update local state
      setUser(prevUser => ({ ...prevUser!, ...updatedProfileData }));
      
      toast({ title: "Profile Updated", description: "Your information has been saved." });
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, signup, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
