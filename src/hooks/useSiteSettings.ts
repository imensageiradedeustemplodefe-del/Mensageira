"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { SiteSettingRow } from "@/types/database";

export interface SiteSettings {
  church_name: string;
  church_slogan: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  church_address: string;
  church_phone: string;
  church_email: string;
  contact_email_secretary: string;
  contact_address_full: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  whatsapp_number: string;
  sunday_service_time: string;
  wednesday_service_time: string;
  friday_service_time: string;
  live_youtube_id: string;
  live_facebook_url: string;
  church_description: string;
  pastor_name: string;
  church_founded_year: string;
  pastor_principal_name: string;
  pastor_principal_description: string;
  pastora_name: string;
  pastora_description: string;
  pastor_auxiliar_name: string;
  pastor_auxiliar_description: string;
  events_page_title: string;
  events_page_subtitle: string;
  events_section_title: string;
  events_section_description: string;
  ministries_section_title: string;
  ministries_section_description: string;
  events_cta_title: string;
  events_cta_description: string;
  prayer_page_title: string;
  prayer_page_subtitle: string;
  prayer_form_title: string;
  prayer_schedule_title: string;
  prayer_schedule_description: string;
  prayer_team_title: string;
  prayer_team_description: string;
  prayer_confidentiality_title: string;
  prayer_confidentiality_description: string;
  gallery_page_title: string;
  gallery_page_subtitle: string;
  gallery_stats_photos: string;
  gallery_stats_categories: string;
  gallery_stats_people: string;
  testimonies_page_title: string;
  testimonies_page_subtitle: string;
  testimonies_featured_title: string;
  testimonies_all_title: string;
  testimonies_form_title: string;
  testimonies_form_description: string;
  testimonies_empty_message: string;
  home_events_title: string;
  home_events_description: string;
  home_visit_title: string;
  home_visit_description: string;
  event_healing_title: string;
  event_healing_description: string;
  event_family_title: string;
  event_family_description: string;
  event_prayer_title: string;
  event_prayer_description: string;
}

export const defaultSettings: SiteSettings = {
  church_name: "Igreja Mensageira de Deus - Templo de Fé",
  church_slogan: "Proclamando a Palavra de Deus com Fé e Amor",
  hero_title: "Bem-vindos à Mensageira de Deus",
  hero_subtitle: "Templo de Fé",
  hero_description:
    "Uma igreja comprometida com a Palavra de Deus, onde vidas são transformadas e famílias são edificadas no amor de Cristo.",
  church_address: "",
  church_phone: "",
  church_email: "",
  contact_email_secretary: "",
  contact_address_full: "",
  facebook_url: "",
  instagram_url: "",
  youtube_url: "",
  whatsapp_number: "",
  sunday_service_time: "19:30",
  wednesday_service_time: "19:30",
  friday_service_time: "20:00",
  live_youtube_id: "",
  live_facebook_url: "",
  church_description: "",
  pastor_name: "",
  church_founded_year: "",
  pastor_principal_name: "",
  pastor_principal_description: "",
  pastora_name: "",
  pastora_description: "",
  pastor_auxiliar_name: "",
  pastor_auxiliar_description: "",

  events_page_title: "Eventos e Programação",
  events_page_subtitle: "Participe da nossa programação semanal e fortaleça sua fé em comunidade.",
  events_section_title: "Programação Regular",
  events_section_description: "Nossa programação semanal e mensal de cultos e eventos especiais.",
  ministries_section_title: "Atividades dos Ministérios",
  ministries_section_description: "Conheça os diferentes ministérios e suas atividades na igreja.",
  events_cta_title: "Venha Participar Conosco",
  events_cta_description:
    "Todos são bem-vindos em nossa igreja! Venha adorar, aprender e crescer espiritualmente em nossa comunidade de fé.",

  prayer_page_title: "Pedidos de Oração",
  prayer_page_subtitle: "Compartilhe seus pedidos de oração conosco. Nossa equipe estará intercedendo por você.",
  prayer_form_title: "Envie seu Pedido de Oração",
  prayer_schedule_title: "Horários de Oração",
  prayer_schedule_description: "Nossas reuniões de oração acontecem todas as terças-feiras. Participe conosco!",
  prayer_team_title: "Equipe de Intercessão",
  prayer_team_description:
    "Nossa equipe de oração está sempre intercedendo pelos pedidos recebidos. Você não está sozinho!",
  prayer_confidentiality_title: "Confidencialidade",
  prayer_confidentiality_description: "Todos os pedidos são tratados com total confidencialidade e amor cristão.",

  gallery_page_title: "Galeria de Fotos",
  gallery_page_subtitle: "Reviva os momentos especiais de nossa comunidade de fé através destas imagens.",
  gallery_stats_photos: "Fotos na Galeria",
  gallery_stats_categories: "Categorias",
  gallery_stats_people: "Pessoas nas Fotos",

  testimonies_page_title: "Testemunhos",
  testimonies_page_subtitle:
    "Veja como Deus tem transformado vidas em nossa comunidade e compartilhe seu próprio testemunho.",
  testimonies_featured_title: "Testemunhos em Destaque",
  testimonies_all_title: "Todos os Testemunhos",
  testimonies_form_title: "Compartilhe seu Testemunho",
  testimonies_form_description: "Conte-nos como Deus tem agido em sua vida. Seu testemunho pode encorajar outros!",
  testimonies_empty_message: "Nenhum testemunho publicado ainda. Seja o primeiro a compartilhar!",

  home_events_title: "Próximos Eventos",
  home_events_description: "Participe da nossa programação semanal e fortaleça sua fé em comunidade.",
  home_visit_title: "Visite Nossa Igreja",
  home_visit_description:
    "Venha fazer parte da nossa família! Todos são bem-vindos para adorar e crescer juntos na presença do Senhor.",

  event_healing_title: "Culto de Cura e Libertação",
  event_healing_description: "Venha buscar a cura e libertação em Jesus Cristo",
  event_family_title: "Culto da Família",
  event_family_description: "Culto especial para toda a família",
  event_prayer_title: "Culto de Oração",
  event_prayer_description: "Momento de oração e comunhão",
};

export function useSiteSettings() {
  const query = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const rows = await api<SiteSettingRow[]>("/api/settings");
      const map = rows.reduce<Partial<SiteSettings>>((acc, s) => {
        if (s.setting_value) acc[s.setting_key as keyof SiteSettings] = s.setting_value;
        return acc;
      }, {});
      return { ...defaultSettings, ...map };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    settings: query.data ?? defaultSettings,
    loading: query.isLoading,
    refresh: query.refetch,
  };
}
