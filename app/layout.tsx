import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "SI-ARUS - Survei Kepuasan Masyarakat Kemenag Barito Utara",
    template: "%s | SI-ARUS Kemenag Barito Utara",
  },
  description: "SI-ARUS - Sistem Informasi Analisis Rekapitulasi Ulasan Survei Kepuasan Masyarakat Kantor Kementerian Agama Kabupaten Barito Utara.",
  keywords: [
    "SI-ARUS",
    "Survei Kepuasan Masyarakat",
    "Kemenag Barito Utara",
    "Kementerian Agama Barito Utara",
    "PTSP Kemenag",
    "IPKP",
    "IPAK",
    "Muara Teweh",
    "PermenPAN-RB No 14 Tahun 2017",
    "Layanan Publik Kemenag",
  ],
  authors: [{ name: "Kantor Kementerian Agama Kabupaten Barito Utara", url: "https://baritoutara.kemenag.go.id" }],
  applicationName: "SI-ARUS",
  generator: "Next.js",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/kemenag.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "SI-ARUS - Survei Kepuasan Masyarakat Kemenag Barito Utara",
    description: "Sistem Informasi Analisis Rekapitulasi Ulasan Survei Kepuasan Masyarakat Kantor Kementerian Agama Kabupaten Barito Utara.",
    siteName: "SI-ARUS Kemenag Barito Utara",
    images: [
      {
        url: "/arus.png",
        width: 1200,
        height: 630,
        alt: "SI-ARUS Kemenag Barito Utara",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SI-ARUS - Survei Kepuasan Masyarakat Kemenag Barito Utara",
    description: "Sistem Informasi Analisis Rekapitulasi Ulasan Survei Kepuasan Masyarakat Kantor Kementerian Agama Kabupaten Barito Utara.",
    images: ["/arus.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google-site-verification-placeholder",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": "SI-ARUS - Kantor Kementerian Agama Kabupaten Barito Utara",
    "alternateName": "Sistem Informasi Analisis Rekapitulasi Ulasan Survei Kepuasan Masyarakat",
    "url": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/kemenag.svg`,
    "image": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/arus.png`,
    "description": "Aplikasi resmi Survei Kepuasan Masyarakat (SKM) Indeks Persepsi Kualitas Pelayanan (IPKP) & Indeks Persepsi Anti Korupsi (IPAK).",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Jl. Ahmad Yani No. 1",
      "addressLocality": "Muara Teweh",
      "addressRegion": "Kalimantan Tengah",
      "postalCode": "73812",
      "addressCountry": "ID"
    }
  };

  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
