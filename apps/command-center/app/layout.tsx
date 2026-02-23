import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { TabNavigation } from '@/components/layout/tab-navigation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Matin Command Center',
  description: 'AI Automation Freelancer | HBO-ICT | matmat.me',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <div className="mx-auto min-h-screen max-w-7xl px-6 py-6">
          <header className="mb-6">
            <h1 className="font-mono text-xl font-bold tracking-tight bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink bg-clip-text text-transparent">
              MATIN COMMAND CENTER
            </h1>
            <p className="mt-1 font-mono text-xs text-muted">
              AI Automation Freelancer | HBO-ICT | matmat.me
            </p>
          </header>

          <TabNavigation />

          <main className="mt-6 transition-all duration-300">{children}</main>

          <footer className="mt-8 border-t border-border pt-4 text-center">
            <span className="font-mono text-[11px] text-slate-500">
              Built with focus, not chaos 🧠 | Last updated: Feb 2026
            </span>
          </footer>
        </div>
      </body>
    </html>
  );
}
