import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import PostHogProvider from "@/components/providers/PostHogProvider";

export const metadata: Metadata = {
  title: {
    default: "CFO for Creators — AI financial operator for content creators",
    template: "%s | CFO for Creators",
  },
  description:
    "An AI CFO built for content creators. Get straight answers on taxes, sponsor rates, write-offs, and where your money's actually going — without becoming your own accountant.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecfoforcreators.com"),
  openGraph: {
    siteName: "CFO for Creators",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <PostHogProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </PostHogProvider>
      </body>
    </html>
  );
}
