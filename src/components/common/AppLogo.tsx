import { CampusKartIcon } from './CampusKartIcon'; // Changed import
import Link from 'next/link';

type AppLogoProps = {
  className?: string;
  iconSize?: number;
  textSize?: string;
};

export function AppLogo({ className, iconSize = 28, textSize = "text-2xl" }: AppLogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 transition-all duration-300 ease-in-out hover:scale-[1.03] hover-gradient-glow ${className}`}>
      <CampusKartIcon className="text-primary" style={{ width: iconSize, height: iconSize }} /> {/* Used CampusKartIcon */}
      <span className={`font-bold ${textSize} text-primary tracking-tight`}>
        CampusKart
      </span>
    </Link>
  );
}
