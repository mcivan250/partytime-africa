import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Party Time Africa - Event Platform for Africa",
  description: "Beautiful event invites, Mobile Money payments, table bookings & Sunday brunch. Turn up, African style. 🎉",
  keywords: ["events", "africa", "uganda", "kampala", "parties", "brunch", "mobile money", "rsvp", "tickets"],
  authors: [{ name: "Chris Ivan Mugabo" }],
  openGraph: {
    title: "Party Time Africa",
    description: "Turn up, African style. Beautiful events, easy RSVPs, Mobile Money payments.",
    url: "https://partytime.africa",
    siteName: "Party Time Africa",
    locale: "en_UG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Party Time Africa",
    description: "Turn up, African style. 🎉",
    creator: "@partytimeafrica",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
