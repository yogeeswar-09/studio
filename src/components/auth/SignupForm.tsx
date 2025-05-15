
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { userYears, userBranches, type UserYear, type UserBranch } from '@/types';
import Link from 'next/link';

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).endsWith("@mlrit.ac.in", { message: "Must be an MLRIT email address." }),
  year: z.enum(userYears, { required_error: "Please select your year of study." }),
  branch: z.enum(userBranches, { required_error: "Please select your branch." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { signup, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      year: undefined,
      branch: undefined,
      password: '',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setFormError(null);
    setIsSubmitting(true);
    let caughtError: any = null; 

    console.log("Attempting signup with data:", data); // Log data being submitted

    try {
      await signup(data.name, data.email, data.password, data.year, data.branch);
      // Navigation and success toast are handled by AuthContext
    } catch (error: any) {
      caughtError = error; 
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already registered. Please login instead.";
             toast({
                title: "Email Already Registered",
                description: (
                <>
                    This email is already in use. Please{' '}
                    <Link href="/login" className="underline text-primary">
                    login
                    </Link>
                    .
                </>
                ),
                variant: "destructive",
                duration: 7000,
            });
            setIsSubmitting(false); 
            return; 
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email format.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password is too weak. Please choose a stronger password.";
        } else {
            errorMessage = error.message || "An unknown Firebase error occurred.";
        }
      } else if (error instanceof Error) {
         errorMessage = error.message;
      }
      
      setFormError(errorMessage); // Set formError only if it's not 'auth/email-already-in-use'
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      if (caughtError?.code !== 'auth/email-already-in-use') {
        setIsSubmitting(false);
      }
    }
  };

  const isLoading = authIsLoading || isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>Join CampusKart using your MLRIT email and details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              {...form.register('name')}
              className={form.formState.errors.name ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select
                onValueChange={(value) => form.setValue('year', value as UserYear)}
                defaultValue={form.getValues('year')}
                disabled={isLoading}
              >
                <SelectTrigger id="year" className={form.formState.errors.year ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {userYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.year && (
                <p className="text-sm text-destructive">{form.formState.errors.year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
               <Select
                onValueChange={(value) => form.setValue('branch', value as UserBranch)}
                defaultValue={form.getValues('branch')}
                disabled={isLoading}
              >
                <SelectTrigger id="branch" className={form.formState.errors.branch ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {userBranches.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.branch && (
                <p className="text-sm text-destructive">{form.formState.errors.branch.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">MLRIT Email</Label>
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              className={form.formState.errors.password ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
           {formError && ( 
            <p className="text-sm text-destructive text-center">{formError}</p>
          )}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
