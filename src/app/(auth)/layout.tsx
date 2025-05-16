
"use client";

import { AppLogo } from "@/components/common/AppLogo";
import React from 'react'; // Ensure React is imported if JSX is used more complexly

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden"> {/* Added overflow-hidden */}
        <div className="mb-8 animate-slide-up-fade-in" style={{ animationDelay: '0.1s' }}>
          <AppLogo iconSize={40} textSize="text-4xl" />
        </div>
        <div className="w-full max-w-md animate-slide-up-fade-in" style={{ animationDelay: '0.2s' }}>
          {children}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in AuthLayout:", error);
    // Basic fallback UI
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-destructive">An error occurred loading this page. Please try again later.</p>
      </div>
    );
  }
}
