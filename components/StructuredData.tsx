import { ReactNode } from "react";

export default function StructuredData(): ReactNode {
  const structuredData = {
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
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
