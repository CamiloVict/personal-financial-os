// Fix Layout mapping for Allocator
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Link from 'next/link';
import { Home, PieChart, Target, Landmark, Banknote, Network, Sparkles, Scale, HelpCircle } from 'lucide-react';
import { DevSessionBar } from '@/shared/ui/DevSessionBar';

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
          {/* Minimalist Top Navigation */}
          <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-14">
                <div className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar items-center">
                  <Link href="/" className="flex items-center px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    <Home className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <Link href="/cashflow" className="flex items-center px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    <Banknote className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Cashflow</span>
                  </Link>
                  <Link href="/debts" className="flex items-center px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    <Scale className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Deudas</span>
                  </Link>
                  <Link href="/investment-positions" className="flex items-center px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    <PieChart className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Portafolio</span>
                  </Link>
                  <Link href="/goals" className="flex items-center px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    <Target className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Metas</span>
                  </Link>
                  <Link href="/tax" className="flex items-center px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    <Landmark className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Fiscal</span>
                  </Link>
                  <Link href="/allocator" className="flex items-center px-3 py-2 text-sm font-semibold text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors">
                    <Network className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Allocator</span>
                  </Link>
                  <Link href="/simulator" className="flex items-center px-3 py-2 text-sm font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-100">
                    <Sparkles className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Simulador</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {children}
          </main>

          {/* Floating Help Button */}
          <Link 
            href="/glossary" 
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