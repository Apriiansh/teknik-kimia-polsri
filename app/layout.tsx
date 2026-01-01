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
