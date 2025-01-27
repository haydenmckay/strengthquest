import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { Providers } from "./components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'StrengthQuest - Intelligent Strength Tracking',
  description: 'Track and optimize your strength training journey with intelligent progress tracking and analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
