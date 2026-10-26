"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/fetcher";
import {
  Award,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  ChevronDown,
  ClipboardList,
  Cloud,
  Contact,
  Copy,
  ExternalLink,
  Heart,
  Image,
  Inbox,
  MessageCircle,
  Palette,
  Music,
  Radio,
  Search,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { canSeeTab, canUseApi, type StaffRole } from "@/lib/roles";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  role: StaffRole;
}

type BadgeKey = "contact" | "prayers" | "testimonies" | "live" | "registrations";

type MenuItem = { title: string; value: string; icon: typeof Calendar; description: string; badgeKey?: BadgeKey };

// Grupo sem título = itens soltos no topo (ex.: Dashboard)
const menuItems: { title?: string; icon?: typeof Calendar; items: MenuItem[] }[] = [
  { items: [{ title: "Dashboard", value: "dashboard", icon: BarChart3, description: "Resumo e números" }] },
  {
    title: "Eventos",
    icon: Calendar,
    items: [
      { title: "Eventos", value: "events", icon: Calendar, description: "Programação e cultos" },
      { title: "Inscrições", value: "registrations", icon: ClipboardList, description: "Inscritos e listas", badgeKey: "registrations" },
      { title: "Modelos", value: "templates", icon: Copy, description: "Eventos prontos para reusar" },
    ],
  },
  {
    title: "Comunidade",
    icon: Users,
    items: [
      { title: "Pedidos de Oração", value: "prayers", icon: Heart, description: "Orações recebidas", badgeKey: "prayers" },
      { title: "Mensagens", value: "contact", icon: Inbox, description: "Formulário de contato", badgeKey: "contact" },
      { title: "Testemunhos", value: "testimonies", icon: MessageCircle, description: "Histórias de fé", badgeKey: "testimonies" },
      { title: "Notificações", value: "notifications", icon: Bell, description: "Avisos para os celulares" },
    ],
  },
  {
    title: "Secretaria",
    icon: Briefcase,
    items: [
      { title: "Membros", value: "members", icon: Contact, description: "Cadastro, carteirinhas e números" },
      { title: "Certificados", value: "certificates", icon: Award, description: "Emitir e imprimir certificados" },
    ],
  },
  {
    title: "Conteúdo",
    icon: Image,
    items: [
      { title: "Galeria (Drive)", value: "drive", icon: Cloud, description: "Álbuns de fotos e vídeos" },
      { title: "Mídia e Rádios", value: "media", icon: Music, description: "Rádios, vídeos e áudios" },
      { title: "Transmissões", value: "live", icon: Radio, description: "Culto ao vivo", badgeKey: "live" },
      { title: "Artes para redes", value: "art", icon: Palette, description: "Posts de feed, story e reels" },
    ],
  },
  {
    title: "Sistema",
    icon: Settings,
    items: [
      { title: "Configurações", value: "settings", icon: Settings, description: "Textos, contatos e horários" },
      { title: "Usuários", value: "users", icon: UserCog, description: "Acessos ao painel" },
    ],
  },
];

export function AdminSidebar({ activeTab, onTabChange, role }: AdminSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const [searchQuery, setSearchQuery] = useState("");
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const [badges, setBadges] = useState<{ contact: number; prayers: number; testimonies: number; live: boolean; registrations?: number } | null>(null);

  useEffect(() => {
    // contadores (orações, mensagens...) só para quem cuida dessas áreas
    if (!canUseApi(role, "/api/admin/badges")) return;
    const load = () => api<typeof badges>("/api/admin/badges").then(setBadges).catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [activeTab, role]);

  const badgeFor = (key?: BadgeKey) => {
    if (!key || !badges) return null;
    if (key === "live") return badges.live ? "Ao vivo" : null;
    const n = badges[key] ?? 0;
    return n > 0 ? String(n) : null;
  };

  const q = searchQuery.trim().toLowerCase();
  const groups = menuItems
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => canSeeTab(role, item.value))
        .filter((item) => !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)),
    }))
    .filter((group) => group.items.length > 0);
  // com poucos grupos (mídia, secretaria) não precisa de busca
  const showSearch = !isCollapsed && !isMobile && menuItems.filter((g) => g.items.some((i) => canSeeTab(role, i.value))).length > 3;

  const select = (value: string) => {
    onTabChange(value);
    if (isMobile) setOpenMobile(false);
  };

  const renderItem = (item: MenuItem) => {
    const isActive = activeTab === item.value;
    const badge = badgeFor(item.badgeKey);
    return (
      <SidebarMenuItem key={item.value}>
        <SidebarMenuButton
          onClick={() => select(item.value)}
          isActive={isActive}
          tooltip={item.title}
          title={isCollapsed ? undefined : item.description}
          className={cn(
            // no computador, itens compactos (o padrão global de 44px fica para o toque no celular)
            "h-9 rounded-md transition-colors md:min-h-0 md:min-w-0 justify-start",
            isActive
              ? "bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
          )}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">{item.title}</span>
          {badge && !isCollapsed && (
            <span
              className={cn(
                "ml-auto rounded-full px-1.5 min-w-5 text-center text-[11px] font-semibold leading-5",
                item.badgeKey === "live" ? "bg-red-600 text-white" : "bg-destructive/10 text-destructive",
              )}
            >
              {badge}
            </span>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r bg-sidebar" collapsible="icon">
      <SidebarHeader className={cn("border-b border-sidebar-border", isCollapsed ? "p-2" : "px-4 py-3")}>
        <div className="flex items-center gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-icon.png"
            alt=""
            className={cn("rounded-full bg-white object-contain shrink-0 ring-1 ring-border", isCollapsed ? "w-8 h-8" : "w-10 h-10")}
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-bold text-sm text-sidebar-foreground truncate">Mensageira de Deus</span>
              <span className="text-xs text-muted-foreground truncate">Painel administrativo</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 gap-0">
        {showSearch && (
          <div className="px-1 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no menu"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm bg-sidebar-accent/50 border-sidebar-border focus:bg-background"
              />
            </div>
          </div>
        )}

        {groups.map((group, i) => {
          const key = group.title ?? `g${i}`;
          // grupo com o item ativo ou buscando: sempre aberto
          const open = !closedGroups[key] || !!q || group.items.some((item) => item.value === activeTab);
          return (
            <SidebarGroup key={key} className="p-0 py-1">
              {!group.title || isCollapsed ? (
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">{group.items.map(renderItem)}</SidebarMenu>
                </SidebarGroupContent>
              ) : (
                <Collapsible open={open} onOpenChange={(o) => setClosedGroups((prev) => ({ ...prev, [key]: !o }))}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-start gap-2 px-2 pt-2 pb-1 md:min-h-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                      <span className="flex-1 text-left">{group.title}</span>
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open ? "" : "-rotate-90")} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="gap-0.5">{group.items.map(renderItem)}</SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </SidebarGroup>
          );
        })}

        {q && groups.length === 0 && !isCollapsed && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nada encontrado</p>
        )}
      </SidebarContent>

      {!isCollapsed && (
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-start gap-2 rounded-md px-2 h-9 md:min-h-0 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="flex-1">Ver o site</span>
          </a>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
