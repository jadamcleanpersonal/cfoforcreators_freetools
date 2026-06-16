import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import PostHogProvider from "@/components/providers/PostHogProvider";

export const metadata: Metadata = {
  title: {
    default: "cfo for creators — taxes, sponsor rates, write-offs handled",
    template: "%s | cfo for creators",
  },
  description:
    "figure out what you owe in taxes, what to charge for sponsorships, and what you can actually write off. without becoming your own accountant.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecfoforcreators.com"),
  openGraph: {
    siteName: "cfo for creators",
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
