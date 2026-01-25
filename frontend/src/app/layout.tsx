import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://thereadroom.vercel.app'),
  title: {
    default: 'The Read Room - Expert Knowledge for Indian Readers',
    template: '%s | The Read Room',
  },
  description: 'Your go-to destination for expert knowledge and insights across specialized niches for Indian readers.',
  keywords: ['blog', 'articles', 'India', 'knowledge', 'insights', 'how-to', 'guides'],
  authors: [{ name: 'The Read Room' }],
  creator: 'The Read Room',
  publisher: 'The Read Room',
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://thereadroom.vercel.app',
    siteName: 'The Read Room',
    title: 'The Read Room - Expert Knowledge for Indian Readers',
    description: 'Your go-to destination for expert knowledge and insights across specialized niches for Indian readers.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'The Read Room',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Read Room - Expert Knowledge for Indian Readers',
    description: 'Your go-to destination for expert knowledge and insights.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light scroll-smooth" style={{ colorScheme: 'light' }}>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <Header />
        <div className="min-h-screen">
          {children}
        </div>
        
        {/* Minimal Footer */}
        <footer className="bg-slate-900 text-slate-400 py-6">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm">
            © {new Date().getFullYear()} The Read Room
          </div>
        </footer>
      </body>
    </html>
  );
}

