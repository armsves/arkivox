import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: BRAND.title,
  description: BRAND.appKitDescription,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://arkivox.vercel.app",
  ),
  openGraph: {
    title: BRAND.title,
    description: BRAND.tagline,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.title,
    description: BRAND.tagline,
  },
  keywords: [
    "Arkiv",
    "iExec Nox",
    "confidential tokens",
    "selective disclosure",
    "Arbitrum Sepolia",
    "ERC-7984",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookies = headersList.get("cookie");

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers cookies={cookies}>{children}</Providers>
      </body>
    </html>
  );
}
