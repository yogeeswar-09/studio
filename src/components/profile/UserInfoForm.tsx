
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
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { ChangeEvent, useState, useEffect } from 'react';
import type { User as AppUser } from '@/types';

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().optional().refine(val => !val || /^\d{10,15}$/.test(val), {
    message: "Invalid phone number format (10-15 digits)."
  }),
  avatarUrl: z.string().url("Invalid URL for pasted link.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function UserInfoForm() {
  const { user, firebaseUser, isLoading: authLoading, updateUserProfile } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      avatarUrl: '',
    },
  });
  
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        phone: user.contactInfo?.phone || '',
        avatarUrl: user.avatarUrl || '',
      });
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user, form.reset]);


  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        form.setValue('avatarUrl', ''); // Clear pasted URL if file is chosen
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePastedAvatarUrl = (url: string) => {
    setAvatarPreview(url);
    setAvatarFile(null); // Clear file if URL is pasted
    form.setValue('avatarUrl', url);
  }

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !firebaseUser) return;
    setFormLoading(true);
    
    const profileUpdateData: Partial<AppUser> = {
      name: data.name,
      contactInfo: { phone: data.phone || undefined },
      // avatarUrl will be handled by updateUserProfile based on avatarFile or data.avatarUrl
    };
    if(data.avatarUrl && !avatarFile) { // if URL was pasted and no new file selected
        profileUpdateData.avatarUrl = data.avatarUrl;
    }


    try {
        await updateUserProfile(profileUpdateData, avatarFile);
    } catch (error) {
        // Error toast is handled in updateUserProfile
        console.error("Failed to update profile:", error);
    } finally {
        setFormLoading(false);
        setAvatarFile(null); // Reset file state
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
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
            <FormItem className="flex flex-col items-center">
              <FormLabel>Profile Picture</FormLabel>
              <FormControl>
                <div className="mt-2 flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={avatarPreview || undefined} alt={user.name} />
                    <AvatarFallback className="text-3xl">
                      {getInitials(user.name)}
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
                      disabled={formLoading}
                    />
                  </Label>
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                       <Input 
                          type="text" 
                          placeholder="Or paste image URL" 
                          className="mt-1 text-xs w-full max-w-xs"
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handlePastedAvatarUrl(e.target.value);
                          }}
                          disabled={formLoading}
                        />
                    )}
                  />
                   <FormMessage>{form.formState.errors.avatarUrl?.message}</FormMessage>
                </div>
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} disabled={formLoading} />
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
                    <Input type="tel" placeholder="e.g., 9876543210" {...field} disabled={formLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={formLoading || authLoading}>
              {(formLoading || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
