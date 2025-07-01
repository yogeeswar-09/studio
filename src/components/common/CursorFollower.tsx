'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function CursorFollower() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      if (window.getComputedStyle(target).getPropertyValue('cursor') === 'pointer') {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      className={cn(
        'hidden md:block',
        'fixed top-0 left-0 rounded-full pointer-events-none z-[9999]',
        'bg-primary/20 blur-lg',
        'transition-opacity duration-300',
        { 'opacity-100': isVisible, 'opacity-0': !isVisible },
        'transform-gpu transition-[transform] duration-200 ease-out',
        { 'scale-150': isPointer, 'scale-100': !isPointer }
      )}
      style={{
        width: '50px',
        height: '50px',
        transform: `translate(${position.x - 25}px, ${position.y - 25}px)`,
      }}
    />
  );
}
