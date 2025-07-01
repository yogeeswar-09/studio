"use client";

import { AppLogo } from "@/components/common/AppLogo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, ShieldCheck, ShoppingCart, MessageSquare, Mail, Star, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  if (isLoading || user) { // Keep showing loading screen if user exists to avoid flash of content before redirect
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-center p-6 overflow-hidden">
        <div className="mb-12 animate-logo-pulse animate-shining-glow">
          <AppLogo iconSize={80} textSize="text-6xl" />
        </div>
        <Progress value={progress} className="w-1/2 md:w-1/3 mx-auto h-2.5 bg-primary/30 [&>div]:bg-primary" />
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

  const testimonials = [
    {
      name: "Priya S.",
      year: "3rd Year, CSE",
      avatar: "PS",
      quote: "CampusKart is a game-changer! I sold my old textbooks in two days and found a graphic calculator for half the price. It's so much easier than using generic social media groups."
    },
    {
      name: "Rohan V.",
      year: "2nd Year, ECE",
      avatar: "RV",
      quote: "Finally, a dedicated place for us. I trust buying from other MLRIT students. The in-app chat made arranging the pickup near the library super convenient. Highly recommend!"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="p-4 sm:p-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <AppLogo />
      </header>
      
      {/* Hero Section */}
      <main className="relative flex-grow flex flex-col items-center justify-center text-center p-6 overflow-hidden">
        <div className="absolute inset-0 w-full h-full animated-particle-bg z-0"></div>
        <div className="relative z-10 max-w-4xl animate-slide-up-fade-in">
          <AppLogo iconSize={60} textSize="text-5xl sm:text-6xl" className="justify-center mb-6" />
          <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground mb-4 leading-tight tracking-tight">
            The Exclusive Marketplace for <span className="text-primary">MLRIT</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Discover great deals or sell your unused items – books, electronics, calculators, and more – all within your trusted campus community.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/signup" legacyBehavior passHref>
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" legacyBehavior passHref>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border-border hover:bg-accent/50">
                I have an account
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* What We Provide Section */}
      <section id="features" className="py-20 sm:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
              A Platform Built for Student Life
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">CampusKart simplifies how you buy, sell, and connect on campus.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center shadow-md transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 border-transparent hover:border-primary/30">
                <CardHeader className="items-center">
                  {feature.icon}
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-28 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight flex items-center justify-center gap-3">
              <Users className="h-9 w-9 text-accent"/> What Students Are Saying
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Real experiences from your fellow campus mates.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-lg bg-card">
                 <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{testimonial.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-lg text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.year}</p>
                      </div>
                      <div className="ml-auto flex text-yellow-500">
                        <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
                      </div>
                  </div>
                   <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                 </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20 sm:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto animate-pulsing-glow-border rounded-lg">
            <Card className="border-0 overflow-hidden bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground">
              <div className="p-8 sm:p-12">
                <div className="text-center">
                  <Mail className="mx-auto h-12 w-12 mb-4" />
                  <CardTitle className="text-3xl font-bold">Get in Touch</CardTitle>
                  <CardDescription className="text-lg text-primary-foreground/90 pt-1">
                    We'd love to hear from you!
                  </CardDescription>
                </div>
                <div className="text-center space-y-4 mt-6">
                  <p className="text-primary-foreground/90">
                    Have questions, suggestions, or need help with something? Our team is here to assist.
                  </p>
                  <p className="text-lg">
                    <span className="font-medium">Email us at:</span>
                    <br />
                    <a 
                      href="mailto:Codecraftersmlr@gmail.com" 
                      className="text-xl font-semibold hover:underline"
                    >
                      Codecraftersmlr@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t bg-background/80">
        <div className="container mx-auto py-8 px-4 text-center">
            <AppLogo className="justify-center mb-4"/>
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} CampusKart. A Project by Team - Code Crafters, CSM-B.</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                About Us
              </Link>
              <Link href="/about#terms" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                Terms & Conditions
              </Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
