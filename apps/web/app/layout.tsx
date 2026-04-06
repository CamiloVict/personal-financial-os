// Fix Layout mapping for Allocator
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { DevSessionBar } from '@/shared/ui/DevSessionBar';
import { AppNavigation } from '@/shared/ui/AppNavigation';
import { ValuationBar } from '@/features/currency/components';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Finance OS",
  description: "Your comprehensive financial operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col relative`}>
        <Providers>
          <DevSessionBar />
          <AppNavigation />
          <ValuationBar />

          <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {children}
          </main>

          <Link 
            href="/glossary" 
            data-onboarding="glossary-fab"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            title="Glosario de Términos (Ayuda)"
          >
            <HelpCircle className="w-6 h-6" />
          </Link>
        </Providers>
      </body>
    </html>
  );
}
