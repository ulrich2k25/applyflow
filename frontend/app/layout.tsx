import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ApplyFlow",
    template: "%s | ApplyFlow",
  },
  description:
    "Centralisez, suivez et organisez toutes vos candidatures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} min-h-screen antialiased`}
      >
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
