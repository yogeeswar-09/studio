
import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
});

export const metadata: Metadata = {
  title: 'CampusKart - Student Marketplace',
  description: 'Buy and sell items within your campus community.',
  icons: {
    icon: '/icon.png', // General purpose icon (e.g., 192x192 or 512x512)
    shortcut: '/favicon.ico', // Traditional browser favicon (e.g., 32x32 or 16x16)
    apple: '/apple-icon.png', // Apple touch icon (e.g., 180x180)
    // You can also add other icons if needed, for example:
    // other: [
    //   { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
    //   { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    // ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
