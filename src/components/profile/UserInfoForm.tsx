"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { ChangeEvent, useState } from 'react';
import type { User } from '@/types';

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().optional().refine(val => !val || /^\d{10,15}$/.test(val), {
    message: "Invalid phone number format (10-15 digits)."
  }),
  avatarUrl: z.string().url("Invalid URL.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function UserInfoForm() {
  const { user, isLoading: authLoading, login } = useAuth(); // Assuming login can update user or a dedicated updateUser function
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.contactInfo?.phone || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });
  
  // Reset form if user changes (e.g. after login)
  useState(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        phone: user.contactInfo?.phone || '',
        avatarUrl: user.avatarUrl || '',
      });
      setAvatarPreview(user.avatarUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form.reset]);


  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        // In a real app, upload this and get URL. For mock:
        form.setValue('avatarUrl', 'https://placehold.co/150x150.png?text=New'); 
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setFormLoading(true);
    
    // Simulate API call to update user
    await new Promise(resolve => setTimeout(resolve, 1000));
    const updatedUser: User = {
      ...user,
      name: data.name,
      contactInfo: { phone: data.phone || undefined },
      avatarUrl: data.avatarUrl || user.avatarUrl, // Keep old if new is empty
    };
    
    // In a real app, AuthContext would have an updateUser method.
    // For mock, we can try to simulate this by re-triggering a "login" with updated data if available,
    // or by directly updating a mutable user object in AuthContext (not ideal).
    // Simplest mock: just update localStorage and tell user to "re-login" conceptually for changes to fully reflect.
    localStorage.setItem('campusKartUser', JSON.stringify(updatedUser));
    // To see changes reflected immediately in the auth context, `login` would need to be called
    // or `user` state in `AuthContext` updated.
    // For now, this is a simplified mock.

    setFormLoading(false);
    toast({ title: "Profile Updated", description: "Your information has been saved." });
  };

  if (authLoading || !user) {
    return <Card><CardContent className="p-6 text-center">Loading profile...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal details. Your MLRIT email ({user.email}) cannot be changed.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel>Profile Picture</FormLabel>
                  <FormControl>
                    <div className="mt-2 flex flex-col items-center gap-4">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={avatarPreview || user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="text-3xl">
                          {user.name?.split(' ').map(n=>n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Label 
                        htmlFor="avatar-upload"
                        className="cursor-pointer text-sm text-primary hover:underline"
                      >
                        Change Picture
                        <Input 
                          id="avatar-upload" 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                      </Label>
                       <Input 
                          type="text" 
                          placeholder="Or paste image URL" 
                          className="mt-1 text-xs w-full max-w-xs"
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setAvatarPreview(e.target.value);
                          }}
                        />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Email (Verified)</FormLabel>
              <Input value={user.email} disabled className="bg-muted/50" />
              <FormDescription>Your MLRIT email is verified and cannot be changed.</FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g., 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
