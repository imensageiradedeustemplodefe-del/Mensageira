// Papéis do painel e o que cada um pode acessar. Vale para o menu (o que aparece) e para a API
// (o que o servidor deixa fazer): quem não tem acesso recebe 403 mesmo chamando a API direto.

export const STAFF_ROLES = ["admin", "midia", "secretaria"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Administrador",
  midia: "Mídia",
  secretaria: "Secretaria",
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  admin: "Acesso a tudo, inclusive usuários e configurações",
  midia: "Eventos e inscrições, comunidade (orações, mensagens, testemunhos, notificações), mídia, transmissões, artes para as redes e sincronizar a galeria",
  secretaria: "Membros, carteirinhas e certificados",
};

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === "string" && (STAFF_ROLES as readonly string[]).includes(role);
}

/** Abas do painel liberadas para cada papel (admin vê todas). */
const TABS: Record<Exclude<StaffRole, "admin">, string[]> = {
  midia: [
    "events", "registrations", "templates",
    "prayers", "contact", "testimonies", "notifications",
    "drive", "media", "live", "art",
  ],
  secretaria: ["members", "certificates"],
};

export function canSeeTab(role: StaffRole, tab: string) {
  return role === "admin" || TABS[role].includes(tab);
}

/** Primeira aba ao entrar no painel. */
export function homeTab(role: StaffRole) {
  return role === "admin" ? "dashboard" : TABS[role][0];
}

/** Rotas /api/admin/... liberadas para cada papel. O que não está aqui é só do admin. */
const API: Record<Exclude<StaffRole, "admin">, string[]> = {
  midia: [
    // eventos e inscrições
    "/api/admin/events", "/api/admin/registrations", "/api/admin/templates",
    // comunidade (badges = contadores do menu; push = notificações e avisos no celular)
    "/api/admin/prayers", "/api/admin/contact-messages", "/api/admin/testimonies",
    "/api/admin/custom-notifications", "/api/admin/push", "/api/admin/push-alerts", "/api/admin/badges",
    // conteúdo: na galeria, só sincronizar (a configuração do Drive é do admin)
    "/api/admin/albums/sync", "/api/admin/media", "/api/admin/live",
    // artes para as redes (e as fotos de fundo delas)
    "/api/admin/art", "/api/admin/images",
  ],
  secretaria: ["/api/admin/members", "/api/admin/certificates"],
};
// rotas de qualquer pessoa da equipe (ex.: trocar a própria senha)
const API_ALL = ["/api/admin/me"];

export function canUseApi(role: StaffRole, pathname: string) {
  if (role === "admin") return true;
  const allowed = [...API[role], ...API_ALL];
  return allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
