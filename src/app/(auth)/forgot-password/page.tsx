"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { FirebaseError } from 'firebase/app';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).endsWith("@mlrit.ac.in", { message: "Must be an MLRIT email." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { sendPasswordReset, isLoading: authIsLoading } = useAuth();
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setFormMessage(null);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(data.email);
      setFormMessage({ type: 'success', text: "Password reset email sent! Please check your inbox (and spam folder)." });
      form.reset(); // Clear the form on success
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = "No account found with this email address.";
            break;
          case 'auth/invalid-email':
            errorMessage = "The email address is not valid.";
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setFormMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = authIsLoading || isSubmitting;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
            <KeyRound className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Forgot Your Password?</CardTitle>
        <CardDescription>
          No problem! Enter your MLRIT email address below and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="yourname@mlrit.ac.in"
              {...form.register('email')}
              className={form.formState.errors.email ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {formMessage && (
            <p className={`text-sm text-center ${formMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
              {formMessage.text}
            </p>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
