
import React from 'react';
import { cn } from '@/lib/utils';

interface WaveLoaderProps {
  className?: string;
}

export function WaveLoader({ className }: WaveLoaderProps) {
  return (
    <div className={cn("wave-loader", className)}>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
    </div>
  );
}
