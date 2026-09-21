// Constantes e dados estruturados (schema.org) usados no SEO do site.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://imensageiradedeus.com.br").replace(/\/$/, "");
export const SITE_NAME = "Mensageira de Deus Templo de Fé";
export const CITY = "Caçador";
export const STATE = "SC";

/** Título padrão: nome + cidade, que é o que mais pesa em buscas locais ("igreja em Caçador"). */
export const DEFAULT_TITLE = `${SITE_NAME} | Igreja Evangélica em ${CITY} - ${STATE}`;

/** Nome e texto usados nos previews de compartilhamento (WhatsApp, Facebook) — sem a parte de SEO local. */
export const SHARE_TITLE = "Igreja Mensageira De Deus Templo De Fé";
export const SHARE_DESCRIPTION =
  "Cultos de sexta e domingo, Santa Ceia, culto ao vivo, pedidos de oração, eventos e galeria de fotos. Venha fazer parte da nossa família de fé.";

export const DESCRIPTION =
  `Igreja Evangélica Mensageira de Deus Templo de Fé em ${CITY} - ${STATE}. Cultos de sexta e domingo, ` +
  "Santa Ceia, culto ao vivo, pedidos de oração, eventos e galeria de fotos. Venha fazer parte da nossa família de fé.";

export const ADDRESS = {
  street: "R. Elias Biasi, 49 - Berger",
  city: CITY,
  state: STATE,
  postalCode: "89500-000",
  country: "BR",
};

export const SOCIAL = {
  facebook: "https://www.facebook.com/igrejamensageira",
  instagram: "https://www.instagram.com/igrejamensageira",
  youtube: "https://www.youtube.com/@imensageiradedeustemlodefe",
};

export const KEYWORDS = [
  `igreja evangélica ${CITY}`,
  `igreja em ${CITY} ${STATE}`,
  "Mensageira de Deus",
  "Templo de Fé",
  "Igreja Mensageira de Deus Templo de Fé",
  `culto ao vivo ${CITY}`,
  "culto de cura e libertação",
  "santa ceia",
  "pedido de oração",
  "igreja pentecostal",
  "eventos cristãos",
  "palavra de Deus",
];

/** JSON-LD da igreja (Church é subtipo de LocalBusiness/PlaceOfWorship no schema.org). */
export const churchJsonLd = {
  "@context": "https://schema.org",
  "@type": "Church",
  "@id": `${SITE_URL}/#igreja`,
  name: "Igreja Mensageira de Deus Templo de Fé",
  alternateName: ["Mensageira de Deus", "Templo de Fé", "Igreja Mensageira de Deus"],
  description: DESCRIPTION,
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512.png`,
  image: `${SITE_URL}/og-image.jpg`,
  email: "imensageiradedeustemplodefe@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.street,
    addressLocality: ADDRESS.city,
    addressRegion: ADDRESS.state,
    postalCode: ADDRESS.postalCode,
    addressCountry: ADDRESS.country,
  },
  areaServed: { "@type": "City", name: `${CITY} - ${STATE}` },
  sameAs: Object.values(SOCIAL),
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "20:00", closes: "22:00", description: "Culto de Cura e Libertação" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "19:30", closes: "21:30", description: "Culto da Família / Santa Ceia" },
  ],
  potentialAction: {
    "@type": "WatchAction",
    target: `${SITE_URL}/live`,
    name: "Assistir ao culto ao vivo",
  },
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#site`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "pt-BR",
  publisher: { "@id": `${SITE_URL}/#igreja` },
};

interface EventLike {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  imageUrl: string | null;
  registrationRequired: boolean;
}

/** JSON-LD de eventos (aparecem como "rich results" de evento na busca do Google). */
export function eventsJsonLd(events: EventLike[]) {
  return {
    "@context": "https://schema.org",
    "@graph": events.map((e) => ({
      "@type": "Event",
      "@id": `${SITE_URL}/eventos#${e.id}`,
      name: e.title,
      description: e.description ?? undefined,
      startDate: e.eventDate.toISOString(),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: e.imageUrl ?? `${SITE_URL}/og-image.jpg`,
      location: {
        "@type": "Place",
        name: e.location ?? "Igreja Mensageira de Deus Templo de Fé",
        address: {
          "@type": "PostalAddress",
          streetAddress: ADDRESS.street,
          addressLocality: ADDRESS.city,
          addressRegion: ADDRESS.state,
          postalCode: ADDRESS.postalCode,
          addressCountry: ADDRESS.country,
        },
      },
      organizer: { "@id": `${SITE_URL}/#igreja` },
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
        url: e.registrationRequired ? `${SITE_URL}/eventos/${e.id}/inscricao` : `${SITE_URL}/eventos`,
      },
    })),
  };
}
