
import { SignupForm } from '@/components/auth/SignupForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
