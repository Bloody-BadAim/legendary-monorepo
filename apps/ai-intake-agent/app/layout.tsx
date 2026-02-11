import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Intake Agent',
  description: 'AI-powered intake form with LiteLLM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
