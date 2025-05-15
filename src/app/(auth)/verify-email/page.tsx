
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MailCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const { firebaseUser, resendVerificationEmail, isLoading: authLoading, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If user becomes verified while on this page, redirect them.
    if (firebaseUser?.emailVerified) {
      router.push('/login?verified=true'); // Or directly to dashboard
    }
  }, [firebaseUser, router]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      // Toast is handled in AuthContext
    } catch (error) {
      // Toast is handled in AuthContext
      console.error("Failed to resend verification email from page", error);
    } finally {
      setIsResending(false);
    }
  };

  const handleLogoutAndLogin = async () => {
    await logout();
    router.push('/login');
  }

  // This message can be shown if the component loads but firebaseUser is not yet available
  // or if somehow the user is not logged in but on this page.
  if (authLoading) {
      return (
         <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                <CardTitle>Loading...</CardTitle>
            </CardHeader>
         </Card>
      )
  }
  
  if (!firebaseUser && !authLoading) {
     return (
         <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle>Session Expired or Not Logged In</CardTitle>
                 <CardDescription>
                    Please log in again to continue.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                 <Button onClick={() => router.push('/login')}>Go to Login</Button>
            </CardContent>
         </Card>
     )
  }


  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <MailCheck className="mx-auto h-16 w-16 text-primary mb-4" />
        <CardTitle>Check Your Email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to <span className="font-semibold text-foreground">{firebaseUser?.email}</span>.
          Please click the link in that email to activate your CampusKart account.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive an email? Check your spam folder or click below to resend.
        </p>
        <Button 
          onClick={handleResendEmail} 
          disabled={isResending || authLoading}
          className="w-full"
        >
          {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Resend Verification Email
        </Button>
        <p className="text-sm">
          If you've already verified or want to try logging in:
        </p>
        <Button variant="outline" onClick={handleLogoutAndLogin} className="w-full">
            Verified? Go to Login
        </Button>
      </CardContent>
    </Card>
  );
}
