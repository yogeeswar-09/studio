"use client";

import { useForm, Controller } from 'react-hook-form';
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
import { Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useState, ChangeEvent } from 'react';

const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title too long."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000, "Description too long."),
  price: z.coerce.number().positive("Price must be a positive number."),
  category: z.enum(mockCategories, { required_error: "Category is required." }),
  imageUrl: z.string().url("Must be a valid image URL.").optional().or(z.literal('')), // For now, treat as optional or allow empty for file upload case
});

type ListingFormValues = z.infer<typeof listingSchema>;

interface ListingFormProps {
  listing?: Listing; // For editing existing listing
  onSubmitSuccess?: (listingId: string) => void;
}

export function ListingForm({ listing, onSubmitSuccess }: ListingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(listing?.imageUrl || null);
  // In a real app, you'd use a state for the actual File object:
  // const [imageFile, setImageFile] = useState<File | null>(null);


  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: listing ? {
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category,
      imageUrl: listing.imageUrl || '',
    } : {
      title: '',
      description: '',
      price: 0,
      category: undefined,
      imageUrl: '',
    },
  });

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // setImageFile(file); // Store the file object
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // For now, we will put a placeholder URL if a file is selected.
        // In a real app, you'd upload this file and get back a URL.
        form.setValue('imageUrl', 'https://placehold.co/600x400.png'); 
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ListingFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a listing.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newOrUpdatedListingId = listing ? listing.id : `listing${Date.now()}`;
    const submissionData = {
      ...data,
      id: newOrUpdatedListingId,
      sellerId: user.id,
      createdAt: new Date().toISOString(),
      // If imageFile exists, imageUrl would come from uploading it.
      // For this mock, we use the value from the form (either pasted URL or placeholder from "upload")
      imageUrl: data.imageUrl || 'https://placehold.co/600x400.png', // Ensure there's a fallback
    };
    
    console.log("Submitting listing:", submissionData);
    // In a real app: save to DB, mockListings.push(newListing) or update existing.

    setIsLoading(false);
    toast({
      title: listing ? "Listing Updated!" : "Listing Created!",
      description: `Your item "${data.title}" has been ${listing ? 'updated' : 'listed'}.`,
    });

    if (onSubmitSuccess) {
      onSubmitSuccess(newOrUpdatedListingId);
    } else {
      router.push(`/listings/${newOrUpdatedListingId}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{listing ? 'Edit Your Listing' : 'Create a New Listing'}</CardTitle>
        <CardDescription>Fill in the details below to sell your item on CampusKart.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Slightly used Python textbook" {...field} />
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
                    <Textarea placeholder="Describe your item in detail..." {...field} rows={5} />
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
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 25.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>
            
            <FormField
              control={form.control}
              name="imageUrl" 
              render={({ field }) => ( // field includes onChange, onBlur, value, name, ref
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <div>
                      <Label 
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors"
                      >
                        {imagePreview ? (
                           <Image src={imagePreview} alt="Preview" width={180} height={180} className="object-contain max-h-44 rounded-md" data-ai-hint="uploaded item"/>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                          </div>
                        )}
                        <Input 
                          id="image-upload" 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload} // Use custom handler
                        />
                      </Label>
                       <Input 
                          type="text" 
                          placeholder="Or paste image URL here" 
                          className="mt-2"
                          value={field.value || ''} // Control this input with RHF
                          onChange={(e) => {
                            field.onChange(e.target.value); // Update RHF state
                            setImagePreview(e.target.value); // Update preview
                          }}
                        />
                    </div>
                  </FormControl>
                  <FormDescription>Upload an image or provide a URL for your item.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {listing ? 'Update Listing' : 'Create Listing'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
