
import type { Listing } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface ItemCardProps {
  item: Listing;
}

export function ItemCard({ item }: ItemCardProps) {
  // Ensure item and its properties are defined before accessing
  const title = item?.title || 'Untitled Listing';
  const description = item?.description || 'No description available.';
  const price = item?.price || 0;
  const category = item?.category || 'Other';
  const imageUrl = item?.imageUrl || 'https://placehold.co/600x400.png'; // Default placeholder
  const sellerId = item?.sellerId;
  const itemId = item?.id;

  return (
    <Card className="overflow-hidden h-full flex flex-col group transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary">
      <Link href={itemId ? `/listings/${itemId}` : '#'} className="block">
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            data-ai-hint={`${category.toLowerCase()} item`}
            onError={(e) => {
              // In case of image error, you could set a fallback or log
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400.png';
            }}
          />
        </div>
      </Link>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-2">
          <Link href={itemId ? `/listings/${itemId}` : '#'} className="block">
            <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary">
              {title}
            </CardTitle>
          </Link>
          <Badge variant="secondary" className="whitespace-nowrap shrink-0">{category}</Badge>
    </div>
        <CardDescription className="text-xl font-bold text-primary mt-1">
          ₹{price.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm text-muted-foreground flex-grow">
        <p className="line-clamp-3">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <Link href={itemId ? `/listings/${itemId}` : '#'} className="w-full sm:w-auto" passHref legacyBehavior>
          <Button variant="outline" className="w-full" disabled={!itemId}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        {sellerId && itemId && item.status !== 'sold' ? ( // Check for item status
          <Link href={`/chat?newChatWith=${sellerId}&itemId=${itemId}`} className="w-full sm:w-auto" passHref legacyBehavior>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
               <MessageCircle className="mr-2 h-4 w-4" /> Chat
            </Button>
          </Link>
        ) : (
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled>
            <MessageCircle className="mr-2 h-4 w-4" /> Chat
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
