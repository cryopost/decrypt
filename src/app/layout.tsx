import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cryopost Decryptor - Decrypt Timelock Messages",
  description: "Decrypt your Cryopost timelock encrypted messages when ready. A secure, browser-only tool for unlocking messages using the drand timelock network.",
  keywords: "cryopost, decryptor, timelock, encryption, drand, secure messaging, decrypt messages",
  authors: [{ name: "Cryopost Team" }],
  creator: "Cryopost",
  publisher: "Cryopost",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cryopost.com",
    title: "Cryopost Decryptor - Decrypt Timelock Messages",
    description: "Decrypt your Cryopost timelock encrypted messages when ready. Secure, browser-only decryption tool.",
    siteName: "Cryopost Decryptor",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cryopost Decryptor - Decrypt Timelock Messages"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Cryopost Decryptor - Decrypt Timelock Messages",
    description: "Decrypt your Cryopost timelock encrypted messages when ready. Secure, browser-only decryption tool.",
    images: ["/og-image.png"]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#3b82f6" }
    ]
  },
  manifest: "/site.webmanifest",
  themeColor: "#3b82f6",
  colorScheme: "dark light",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Cryopost Decryptor" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cryopost Decryptor" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/favicon.svg" color="#3b82f6" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://cryopost.com" />
        <meta name="twitter:title" content="Cryopost Decryptor - Decrypt Timelock Messages" />
        <meta name="twitter:description" content="Decrypt your Cryopost timelock encrypted messages when ready. Secure, browser-only decryption tool." />
        <meta name="twitter:image" content="/og-image.png" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Cryopost Decryptor - Decrypt Timelock Messages" />
        <meta property="og:description" content="Decrypt your Cryopost timelock encrypted messages when ready. Secure, browser-only decryption tool." />
        <meta property="og:site_name" content="Cryopost Decryptor" />
        <meta property="og:url" content="https://cryopost.com" />
        <meta property="og:image" content="/og-image.png" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
