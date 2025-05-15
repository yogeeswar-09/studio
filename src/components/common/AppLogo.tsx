import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

type AppLogoProps = {
  className?: string;
  iconSize?: number;
  textSize?: string;
};

export function AppLogo({ className, iconSize = 28, textSize = "text-2xl" }: AppLogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <ShoppingCart className="text-primary" size={iconSize} strokeWidth={2.5} />
      <span className={`font-bold ${textSize} text-primary tracking-tight`}>
        CampusKart
      </span>
    </Link>
  );
}
