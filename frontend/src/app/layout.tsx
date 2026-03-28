import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenLedger | REC & Carbon Credit Exchange",
  description:
    "India's premier Web3 marketplace for Renewable Energy Certificates (REC) and Carbon Credit Coins (CCC). Trade, verify, and comply with RPO targets on-chain.",
  keywords: "REC, Carbon Credits, NFT, Blockchain, Green Energy, India, Sepolia",
  openGraph: {
    title: "GreenLedger | Cyber-Solar REC & CCC Exchange",
    description: "Trade energy NFTs and carbon credits on the Sepolia blockchain.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ position: "relative", zIndex: 1 }}>
        {children}
      </body>
    </html>
  );
}
