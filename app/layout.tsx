import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import { AppSidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HotToaster } from "@/components/HotToaster";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });


export const metadata: Metadata = {
  metadataBase: new URL("https://crimsongg.com"),
  title: { default: "CrimsonGG — Esports Tournaments & Players", template: "%s — CrimsonGG" },
  description: "Discover esports tournaments, follow players, and join the competitive scene on CrimsonGG.",
  openGraph: { type: "website", images: ["/og-default.png"] },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="flex min-h-screen w-full">
          <Suspense>
            <AppSidebar />
          </Suspense>
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </div>
        <HotToaster />
      </body>
    </html>
  );
}