import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Waardian – Revolutionizing Smart Living',
  description:
    'Waardian is an all-in-one society management platform designed for gated communities. Streamline visitor management, staff tracking, rent collection, maintenance billing, and more – all from one powerful dashboard.',
  keywords:
    'Waardian, society management software, gated community management, visitor management system, rent collection app, residential security, maintenance billing, smart apartment living, PG & tenant management, staff attendance tracking',
  metadataBase: new URL('https://waardian.com'),
  authors: [{ name: 'Waardian Team' }],
  creator: 'Waardian',
  publisher: 'Waardian',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
    ],
    shortcut: [
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#000000',
      },
    ],
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://waardian.com',
    title: 'Waardian – Revolutionizing Smart Living',
    description: 'All-in-one society management platform for gated communities',
    siteName: 'Waardian',
    images: [{
      url: '/assets/waardian_ai_logo.svg',
      width: 603,
      height: 574,
      alt: 'Waardian Logo',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Waardian – Revolutionizing Smart Living',
    description: 'All-in-one society management platform for gated communities',
    images: ['/assets/waardian_ai_logo.svg'],
    creator: '@waardian',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// 🛡️ Final SSR Defense - Polyfill global localStorage to prevent crashes from shared utilities
if (typeof window === 'undefined') {
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
    key: () => null,
    length: 0,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${outfit.variable} antialiased font-sans`}
      >
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
