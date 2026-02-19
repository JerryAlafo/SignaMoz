import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Signa Moz - Tradução IA para Libras e Língua Gestual Moçambicana",
  description:
    "Signa Moz: Tradutor de vídeo assistido por IA para Libras e Língua Gestual Moçambicana. Aprenda e traduza gestos com inteligência artificial em tempo real.",
  keywords: [
    "Signa Moz",
    "tradutor Libras",
    "língua gestual moçambicana",
    "tradução IA",
    "tradutor de gestos",
    "acessibilidade inclusão",
  ],
  authors: [{ name: "Signa Moz" }],
  creator: "Signa Moz",
  publisher: "Signa Moz",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Signa Moz - Tradução IA para Libras e Língua Gestual",
    description:
      "Ferramenta de tradução assistida por IA para Libras e Língua Gestual Moçambicana. Acesse agora!",
    url: "https://signa-moz.vercel.app",
    siteName: "Signa Moz",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "https://signa-moz.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Signa Moz - Tradução para Libras",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Signa Moz - Tradução IA para Libras e Língua Gestual",
    description:
      "Ferramenta de tradução assistida por IA para Libras e Língua Gestual Moçambicana",
    images: ["https://signa-moz.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
    other: {
      "msvalidate.01": "bing-verification-code",
    },
  },
  alternates: {
    canonical: "https://signa-moz.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="canonical" href="https://signa-moz.vercel.app" />
        <link
          rel="alternate"
          href="https://signa-moz.vercel.app"
          hrefLang="pt-BR"
        />
        <link
          rel="alternate"
          href="https://signa-moz.vercel.app"
          hrefLang="x-default"
        />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="atom+xml"
          type="application/atom+xml"
          href="/feed.xml"
          title="Signa Moz Feed"
        />
        {/* Google Search Console Verification */}
        {/* Replace with your actual verification code */}
        <meta
          name="google-site-verification"
          // content="your-google-verification-code"
          content="aYNDkUemAuUhX8RQU05xjFAR4rPaGbpT5eOJXsJfPEA"
          // <meta name="google-site-verification" content="aYNDkUemAuUhX8RQU05xjFAR4rPaGbpT5eOJXsJfPEA" />
        />
        {/* Bing Webmaster Tools Verification */}
        <meta name="msvalidate.01" content="your-bing-verification-code" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Signa Moz",
              alternateName: ["Signa Moz Libras", "Signa Moz - Tradutor IA"],
              url: "https://signa-moz.vercel.app",
              logo: "https://signa-moz.vercel.app/logo.png",
              description:
                "Ferramenta de tradução assistida por IA para Libras e Língua Gestual Moçambicana",
              sameAs: [
                "https://twitter.com/signamoz",
                "https://github.com/signamoz",
                "https://linkedin.com/company/signamoz",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Support",
                url: "https://signa-moz.vercel.app/contact",
              },
            }),
          }}
        />
        {/* Breadcrumb Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://signa-moz.vercel.app",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Contato",
                  item: "https://signa-moz.vercel.app/contact",
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
