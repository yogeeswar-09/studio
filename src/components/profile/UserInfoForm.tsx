
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChangeEvent, useState, useEffect } from 'react';
import type { User as AppUser, UserYear } from '@/types';
import { userYears } from '@/types'; // Import userYears
import Image from 'next/image'; // For preview

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  year: z.enum(userYears, { required_error: "Please select your year of study." }), // Add year to schema
  phone: z.string().optional().refine(val => !val || /^\d{10,15}$/.test(val), {
    message: "Invalid phone number format (10-15 digits)."
  }),
  avatarUrl: z.string().url("Invalid URL for pasted link.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadAvatarToCloudinary(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary environment variables not set for avatar upload.");
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
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

export function UserInfoForm() {
  const { user, firebaseUser, isLoading: authLoading, updateUserProfile, toast } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      year: undefined, // Initialize year
      phone: '',
      avatarUrl: '',
    },
  });
  
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        year: user.year || undefined, // Set year from user data
        phone: user.contactInfo?.phone || '',
        avatarUrl: user.avatarUrl || '',
      });
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user, form]);


  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('avatarUrl', ''); 
    }
  };

  const handlePastedAvatarUrl = (url: string) => {
    form.setValue('avatarUrl', url);
    setAvatarPreview(url);
    setAvatarFile(null); 
  }

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !firebaseUser) return;

    if (avatarFile && (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET)) {
      toast({ title: "Configuration Error", description: "Cloudinary is not configured for avatar uploads.", variant: "destructive" });
      console.error("Cloudinary environment variables for avatar upload are not set.");
      return;
    }
    setFormLoading(true);
    
    let newAvatarCloudinaryUrl: string | undefined = data.avatarUrl;

    try {
      if (avatarFile) {
        newAvatarCloudinaryUrl = await uploadAvatarToCloudinary(avatarFile);
      }

      const profileUpdateData: Partial<AppUser> = {
        name: data.name,
        year: data.year, // Include year in update data
        contactInfo: { phone: data.phone || undefined },
        avatarUrl: newAvatarCloudinaryUrl || user.avatarUrl,
      };
      
      await updateUserProfile(profileUpdateData, avatarFile);
      setAvatarFile(null);

    } catch (error: any) {
        console.error("Failed to update profile:", error);
        toast({ title: "Update Failed", description: error.message || "Could not update your profile.", variant: "destructive" });
    } finally {
        setFormLoading(false);
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
        <CardDescription>Update your personal details. Your MLRIT email ({user.email}) and branch cannot be changed here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormItem className="flex flex-col items-center">
              <FormLabel>Profile Picture</FormLabel>
              <FormControl>
                <div className="mt-2 flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    {avatarPreview ? (
                       <Image src={avatarPreview} alt={user.name || "User Avatar"} layout="fill" objectFit="cover" className="rounded-full" data-ai-hint="user avatar"/>
                    ) : (
                      <AvatarFallback className="text-3xl">
                        {getInitials(form.getValues('name') || user.name)}
                      </AvatarFallback>
                    )}
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
                          disabled={formLoading || !!avatarFile}
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
              <Input value={user.email} disabled className="bg-muted/50 cursor-not-allowed" />
              <FormDescription>Your MLRIT email is verified and cannot be changed.</FormDescription>
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      value={field.value} 
                      disabled={formLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userYears.map(yearValue => (
                          <SelectItem key={yearValue} value={yearValue}>{yearValue}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <Input value={user.branch || 'Not set'} disabled className="bg-muted/50 cursor-not-allowed" />
                <FormDescription>Your branch (set at signup).</FormDescription>
              </FormItem>
            </div>


            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g., 9876543210" {...field} value={field.value || ''} disabled={formLoading} />
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
