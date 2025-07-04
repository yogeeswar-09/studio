
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Listing, ListingCategory } from '@/types';
import { mockCategories } from '@/lib/mock-data';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useState, ChangeEvent, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title too long."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000, "Description too long."),
  price: z.coerce.number({invalid_type_error: "Price must be a number."}).positive("Price must be a positive number.").min(0.01, "Price must be greater than 0."),
  originalPrice: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number({invalid_type_error: "Original price must be a number."}).positive("Original price must be positive.").optional()
  ),
  category: z.enum(mockCategories as [string, ...string[]], { required_error: "Category is required." }),
  imageUrl: z.string().url("Image URL is required if not uploading a file.").optional().or(z.literal('')),
}).refine(data => !data.originalPrice || data.originalPrice > data.price, {
    message: "Original price must be greater than the selling price.",
    path: ["originalPrice"],
});

type ListingFormValues = z.infer<typeof listingSchema>;

interface ListingFormProps {
  listing?: Listing;
  onSubmitSuccess?: (listingId: string) => void;
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const isCloudinaryConfigured = CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file: File): Promise<string> {
  if (!isCloudinaryConfigured) {
    console.error("Cloudinary environment variables NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET are not set.");
    throw new Error("Image upload service is not configured. Please contact support.");
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET!);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME!}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
  }

  const data = await response.json();
  return data.secure_url;
}


export function ListingForm({ listing, onSubmitSuccess }: ListingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      price: undefined, 
      originalPrice: undefined,
      category: undefined,
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (listing) {
      form.reset({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        originalPrice: listing.originalPrice,
        category: listing.category,
        imageUrl: listing.imageUrl || '',
      });
      setImagePreview(listing.imageUrl || null);
      setImageFile(null);
    } else {
      form.reset({
        title: '',
        description: '',
        price: undefined,
        originalPrice: undefined,
        category: undefined,
        imageUrl: '',
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [listing, form]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!isCloudinaryConfigured) {
        toast({ title: "Image Upload Unavailable", description: "Image upload service is not configured. Please use the URL field or contact support.", variant: "destructive", duration: 7000});
        event.target.value = ''; 
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB size limit
        toast({ title: "File Too Large", description: "Image size should not exceed 5MB.", variant: "destructive"});
        event.target.value = '';
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('imageUrl', ''); 
      form.clearErrors('imageUrl'); 
    }
  };
  
  const handlePastedUrl = (url: string) => {
    form.setValue('imageUrl', url);
    if (url) {
        setImagePreview(url);
        setImageFile(null); 
        form.clearErrors('imageUrl');
    } else {
        setImagePreview(null);
    }
  }

  const onSubmit = async (data: ListingFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    if (imageFile && !isCloudinaryConfigured) {
      toast({ title: "Configuration Error", description: "Cannot upload image: Cloudinary is not configured. Please use the URL field or contact support.", variant: "destructive" });
      return;
    }
    
    if (!imageFile && !data.imageUrl) {
        form.setError("imageUrl", { type: "manual", message: "Please upload an image or provide an image URL."});
        toast({ title: "Image Required", description: "Please upload an image or provide an image URL for your listing.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    let finalImageUrl = data.imageUrl;

    try {
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          finalImageUrl = await uploadToCloudinary(imageFile);
        } catch (uploadError: any) {
          toast({ title: "Image Upload Failed", description: uploadError.message || "Could not upload the image.", variant: "destructive" });
          setIsLoading(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      if (!finalImageUrl) {
        toast({ title: "Image Missing", description: "An image URL could not be determined. Please ensure the URL is valid or upload an image.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const listingData: Omit<Listing, 'id' | 'seller' | 'createdAt' | 'updatedAt'> & { createdAt?: any, updatedAt?: any } = {
        title: data.title,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice || undefined,
        category: data.category,
        imageUrl: finalImageUrl!,
        sellerId: user.uid,
        status: 'available',
      };

      let listingId = listing?.id;

      if (listing) { 
        listingData.updatedAt = serverTimestamp();
        const listingRef = doc(db, "listings", listing.id);
        await updateDoc(listingRef, listingData as Partial<Listing>); 
        toast({ title: "Listing Updated!", description: `"${data.title}" has been updated.` });
      } else { 
        listingData.createdAt = serverTimestamp();
        listingData.updatedAt = serverTimestamp();
        const docRef = await addDoc(collection(db, "listings"), listingData);
        listingId = docRef.id;
        toast({ title: "Listing Created!", description: `"${data.title}" has been listed.` });
        form.reset(); // Reset form only on new listing creation
        setImagePreview(null);
        setImageFile(null);
      }

      if (onSubmitSuccess && listingId) {
        onSubmitSuccess(listingId);
      } else if (listingId) {
        router.push(`/listings/${listingId}`);
      }
      
    } catch (error: any) {
      console.error("Error submitting listing:", error);
      toast({ title: "Submission Failed", description: error.message || "Could not save the listing.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{listing ? 'Edit Your Listing' : 'Create a New Listing'}</CardTitle>
        <CardDescription>Fill in the details below to sell your item on CampusKart.</CardDescription>
      </CardHeader>
      <CardContent>
        {!isCloudinaryConfigured && (
          <div className="mb-6 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Image Uploads Disabled</p>
              <p className="text-sm">Direct image uploads are currently unavailable. Please paste an image URL instead. Contact support if this issue persists.</p>
            </div>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Slightly used Python textbook" {...field} disabled={isLoading || isUploadingImage} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your item in detail..." {...field} rows={5} disabled={isLoading || isUploadingImage} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 1500.00" {...field} value={field.value ?? ''} disabled={isLoading || isUploadingImage} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="originalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price (₹) <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 2000.00" {...field} value={field.value ?? ''} disabled={isLoading || isUploadingImage} />
                    </FormControl>
                    <FormDescription>Shows a striked-out price to highlight a discount.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isUploadingImage}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                <div>
                    <Label 
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-muted/50 transition-colors ${isUploadingImage || !isCloudinaryConfigured ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-muted/75'}`}
                    >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="w-10 h-10 mb-3 animate-spin text-primary" />
                        <p className="text-sm">Uploading image...</p>
                      </div>
                    ) : imagePreview ? (
                        <Image src={imagePreview} alt="Preview" width={180} height={180} className="object-contain max-h-44 rounded-md" data-ai-hint="uploaded item"/>
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF (MAX. 5MB)</p>
                        </div>
                    )}
                    <Input 
                        id="image-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleImageUpload}
                        disabled={isLoading || isUploadingImage || !isCloudinaryConfigured}
                    />
                    </Label>
                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <Input 
                                type="text" 
                                placeholder="Or paste image URL here" 
                                className="mt-2"
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  handlePastedUrl(e.target.value);
                                }}
                                disabled={isLoading || !!imageFile || isUploadingImage} 
                            />
                        )}
                    />
                </div>
                </FormControl>
                <FormDescription>Upload an image (if Cloudinary is configured and enabled) or provide a URL. Uploaded images take precedence. Max 5MB.</FormDescription>
                <FormMessage>{form.formState.errors.imageUrl?.message}</FormMessage>
            </FormItem>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isLoading || isUploadingImage}>
              {(isLoading || isUploadingImage) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {listing ? 'Update Listing' : 'Create Listing'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
