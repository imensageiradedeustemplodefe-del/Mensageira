import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const SITE_NAME = "Mensageira de Deus Templo de Fé";
const DESCRIPTION =
  "Venha fazer parte da nossa família de fé. Aqui você encontrará acolhimento, crescimento espiritual e uma comunidade que se importa com você.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  authors: [{ name: SITE_NAME }],
  keywords: ["igreja evangélica", "culto ao vivo", "mensageira de deus", "templo de fé", "palavra de deus", "oração", "eventos cristãos"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mensageira de Deus",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1E90FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Church",
  name: "Igreja Mensageira de Deus Templo de Fé",
  description: DESCRIPTION,
  logo: "https://imensageiradedeus.com.br/icons/icon-512.png",
  url: "https://imensageiradedeus.com.br",
  address: {
    "@type": "PostalAddress",
    streetAddress: "R. Elias Biasi, 49 - Berger",
    addressLocality: "Caçador",
    addressRegion: "SC",
    postalCode: "89500-000",
    addressCountry: "BR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Pular para o conteúdo principal
        </a>
        <Providers>{children}</Providers>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
