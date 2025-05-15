import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <MailCheck className="mx-auto h-16 w-16 text-primary mb-4" />
        <CardTitle>Check Your Email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to your MLRIT email address.
          Please click the link to activate your CampusKart account.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Didn&apos;t receive an email? Check your spam folder or try resending.
        </p>
        {/* In a real app, a resend button would trigger a backend action */}
        <Button variant="outline" className="mb-4" disabled>Resend Email (Coming Soon)</Button>
        <p className="text-sm">
          <Link href="/auth/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
