import type { Listing } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ShoppingBag } from 'lucide-react';

interface ItemCardProps {
  item: Listing;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col group transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary">
      <Link href={`/listings/${item.id}`} className="block flex-grow flex flex-col">
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain group-hover:scale-105 transition-transform duration-300" // Changed from object-cover to object-contain
            data-ai-hint={`${item.category.toLowerCase()} item`}
          />
          {item.status === 'sold' && (
            <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 text-xs font-semibold rounded-md shadow flex items-center">
              <ShoppingBag className="mr-1 h-3 w-3" /> SOLD
            </div>
          )}
        </div>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary">
              {item.title}
            </CardTitle>
            <Badge variant="secondary" className="whitespace-nowrap shrink-0">{item.category}</Badge>
          </div>
          <CardDescription className="text-xl font-bold text-primary mt-1">
            ₹{item.price.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm text-muted-foreground flex-grow">
          <p className="line-clamp-3">{item.description}</p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0 mt-auto flex sm:flex-col items-stretch gap-2">
          <Link href={`/listings/${item.id}`} className="w-full" passHref legacyBehavior>
            <Button variant="outline" className="w-full">View Details</Button>
          </Link>
          <Link href={`/chat?newChatWith=${item.sellerId}&itemId=${item.id}`} className="w-full" passHref legacyBehavior>
            <Button 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={item.status === 'sold'}
            >
               <MessageCircle className="mr-2 h-4 w-4" /> Chat
            </Button>
          </Link>
      </CardFooter>
    </Card>
  );
}
