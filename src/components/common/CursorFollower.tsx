'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Using refs for animation to avoid re-renders on mouse move
  const requestRef = useRef<number>();
  const mousePos = useRef({ x: 0, y: 0 });
  const circlePos = useRef({ x: 0, y: 0 });
  let previousTime: number | undefined;

  const animate = (time: number) => {
    if (previousTime !== undefined) {
      // Lerp (linear interpolation) for smooth following effect
      // A smaller value (e.g., 0.1) results in a smoother/slower follow
      circlePos.current.x += (mousePos.current.x - circlePos.current.x) * 0.12;
      circlePos.current.y += (mousePos.current.y - circlePos.current.y) * 0.12;
      
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mousePos.current.x}px, ${mousePos.current.y}px)`;
      }
      if (circleRef.current) {
        circleRef.current.style.transform = `translate(${circlePos.current.x}px, ${circlePos.current.y}px)`;
      }
    }
    previousTime = time;
    requestRef.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      const target = e.target as HTMLElement;
      // Check if the target or its parent has a 'pointer' cursor style
      if (window.getComputedStyle(target).getPropertyValue('cursor') === 'pointer' || 
          (target.parentElement && window.getComputedStyle(target.parentElement).getPropertyValue('cursor') === 'pointer')) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* The small dot that is directly at the cursor position */}
      <div
        ref={dotRef}
        className={cn(
          'hidden md:block',
          'fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-[9999] transition-[width,height,background-color] duration-200',
          'bg-primary',
          { 'opacity-0': !isVisible, 'opacity-100': isVisible },
          { 'w-2 h-2': !isPointer, 'w-8 h-8 bg-primary/30': isPointer } // Changes size and opacity on hover
        )}
      />
      {/* The larger, blurred circle that lags behind */}
      <div
        ref={circleRef}
        className={cn(
          'hidden md:block',
          'fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-[9999]',
          'border-2 border-primary/50',
          'transition-[width,height,opacity] duration-300 ease-out',
          { 'opacity-0': !isVisible, 'opacity-100': isVisible },
          { 'w-10 h-10': !isPointer, 'w-0 h-0 opacity-0': isPointer } // Circle disappears on hover
        )}
      />
    </>
  );
}
