
"use client";

import { AppLogo } from "@/components/common/AppLogo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; 
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, ShieldCheck, ShoppingCart, MessageSquare, Mail } from "lucide-react"; 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; 
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(0); 

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setProgress(10); 
      let currentProgress = 10;
      timer = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 10) + 5; 
        if (currentProgress >= 95) {
          setProgress(95); 
          clearInterval(timer);
        } else {
          setProgress(currentProgress);
        }
      }, 200); 
    } else {
      setProgress(100); 
    }
    return () => {
      clearInterval(timer);
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-center p-6 overflow-hidden">
        <div className="mb-12 animate-logo-pulse animate-shining-glow"> 
          <AppLogo iconSize={80} textSize="text-6xl" /> 
        </div>
        <Progress value={progress} className="w-1/2 md:w-1/3 mx-auto h-2.5 bg-primary/30 [&>div]:bg-primary" />
      </div>
    );
  }

  if (user) { 
    return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-center p-6 overflow-hidden">
        <div className="mb-12 animate-logo-pulse animate-shining-glow">
          <AppLogo iconSize={80} textSize="text-6xl" />
        </div>
        <Progress value={progress >= 95 ? 95 : progress} className="w-1/2 md:w-1/3 mx-auto h-2.5 bg-primary/30 [&>div]:bg-primary" />
      </div>
    );
  }
  
  const features = [
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary mb-4" />,
      title: "Trusted Campus Community",
      description: "Connect exclusively with fellow MLRIT students. All users are verified via their college email, ensuring a safer environment for everyone."
    },
    {
      icon: <ShoppingCart className="h-10 w-10 text-primary mb-4" />,
      title: "List, Discover, Deal",
      description: "Effortlessly list your unused items or browse a wide range of student essentials – from textbooks and electronics to lab equipment and more."
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-primary mb-4" />,
      title: "Seamless Communication",
      description: "Connect directly with buyers or sellers through our integrated chat. Ask questions, negotiate prices, and arrange meetups with ease."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 sm:p-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <AppLogo />
      </header>
      
      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-primary/10 via-background to-accent/10 bg-[length:200%_200%] animate-hero-gradient">
        <div className="max-w-3xl">
          <AppLogo iconSize={60} textSize="text-5xl sm:text-6xl" className="justify-center mb-6" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6 leading-tight">
            The Exclusive Marketplace <br className="hidden sm:inline" />for <span className="text-primary">MLRIT</span> Students
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Discover great deals or sell your unused items – books, electronics, calculators, Lab Equipments, and more – all within your trusted campus community.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/signup" legacyBehavior passHref>
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" legacyBehavior passHref>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-lg transition-transform hover:scale-105 border-primary/50 hover:border-primary">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* What We Provide Section */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12 sm:mb-16">
            What CampusKart Offers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card text-left">
                <CardHeader className="items-center md:items-start">
                  {feature.icon}
                  <CardTitle className="text-xl font-semibold text-center md:text-left">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center md:text-left">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto shadow-xl border-primary/20 hover:shadow-primary/10 transition-all duration-300">
            <CardHeader className="text-center">
              <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-3xl font-bold text-foreground">Get in Touch</CardTitle>
              <CardDescription className="text-lg text-muted-foreground pt-1">
                We'd love to hear from you!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Have questions, suggestions, or need help with something? 
                Our team is here to assist.
              </p>
              <p className="text-lg">
                <span className="font-medium text-foreground">Email us at:</span>
                <br />
                <a 
                  href="mailto:Codecraftersmlr@gmail.com" 
                  className="text-xl font-semibold text-primary hover:underline"
                >
                  Codecraftersmlr@gmail.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground pt-4">
                We'll do our best to get back to you as soon as possible.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="text-center p-6 border-t bg-background/80">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} CampusKart. All rights reserved.</p>
        <p className="text-xs text-muted-foreground mt-1">
          <Link href="/about" className="hover:text-primary hover:underline">
            About Us
          </Link>
        </p>
        <p className="text-xs text-muted-foreground mt-1">Created by Team - Code Crafters, from CSM - B</p>
      </footer>
    </div>
  );
}
