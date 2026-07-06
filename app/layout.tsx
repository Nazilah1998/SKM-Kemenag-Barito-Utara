import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARUS - Survei Kepuasan Masyarakat",
  description: "Sistem Informasi Analisis Rekapitulasi Ulasan Survei Kepuasan Masyarakat - Kemenag Barito Utara",
  icons: [{ rel: "icon", url: "/kemenag.svg", type: "image/svg+xml" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
