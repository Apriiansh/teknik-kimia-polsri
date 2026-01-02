import { Poppins, Montserrat } from "next/font/google";
// @ts-ignore
import "./globals.css";

import LayoutWrapper from "@/components/LayoutWrapper";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  variable: "--font-poppins",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  weight: ['300', '400', '500', '700'],
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(defaultUrl), 
  title: "Sistem Informasi Teknik Kimia",
  description: "Teknik Kimia Politeknik Negeri Sriwijaya",
  keywords: "Teknik Kimia, Politeknik Negeri Sriwijaya, Tekkim, Tekkim Polsri, Kimia Polsri",
  authors: [{ name: "Teknik Kimia POLSRI" }],
  creator: "Teknik Kimia POLSRI",
  publisher: "Politeknik Negeri Sriwijaya",
  openGraph: {
    title: "Sistem Informasi Teknik Kimia",
    description: "Teknik Kimia Politeknik Negeri Sriwijaya",
    url: defaultUrl,
    siteName: "Teknik Kimia POLSRI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Teknik Kimia POLSRI",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistem Informasi Teknik Kimia",
    description: "Teknik Kimia Politeknik Negeri Sriwijaya",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} ${montserrat.variable} antialiased min-h-screen flex flex-col`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
