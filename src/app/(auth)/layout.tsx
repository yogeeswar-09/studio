import { AppLogo } from "@/components/common/AppLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <AppLogo iconSize={40} textSize="text-4xl" />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
