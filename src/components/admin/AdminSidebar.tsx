"use client";

import { useState } from "react";
import { 
  BarChart3, 
  MessageCircle, 
  Cloud, 
  Music, 
  Calendar, 
  Copy, 
  Heart, 
  Radio,
  Settings,
  ChevronRight,
  ChevronDown,
  Bell,
  Search,
  Image,
  Users,

  Zap,
  Home
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const menuItems = [
  {
    title: "Visão Geral",
    icon: Home,
    defaultOpen: true,
    items: [
      { title: "Dashboard", value: "dashboard", icon: BarChart3, description: "Estatísticas e métricas" },
    ]
  },
  {
    title: "Conteúdo",
    icon: Image,
    defaultOpen: true,
    items: [
      { title: "Google Drive", value: "drive", icon: Cloud, description: "Sincronização de fotos" },
      { title: "Mídia", value: "media", icon: Music, description: "Vídeos e áudios" },
      { title: "Transmissões", value: "live", icon: Radio, description: "Lives e streaming", badge: "Ao Vivo" },
    ]
  },
  {
    title: "Eventos",
    icon: Calendar,
    defaultOpen: false,
    items: [
      { title: "Eventos", value: "events", icon: Calendar, description: "Gerenciar eventos" },
      { title: "Modelos", value: "templates", icon: Copy, description: "Templates reutilizáveis" },
    ]
  },
  {
    title: "Comunidade",
    icon: Users,
    defaultOpen: false,
    items: [
      { title: "Pedidos de Oração", value: "prayers", icon: Heart, description: "Orações recebidas" },
      { title: "Testemunhos", value: "testimonies", icon: MessageCircle, description: "Histórias de fé" },
      { title: "Notificações", value: "notifications", icon: Bell, description: "Notificações personalizadas" },
    ]
  },
  {
    title: "Sistema",
    icon: Settings,
    defaultOpen: false,
    items: [
      { title: "Configurações", value: "settings", icon: Settings, description: "Textos, contatos e integrações" },
    ]
  }
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuItems.forEach(group => {
      initial[group.title] = group.defaultOpen;
    });
    return initial;
  });

  const filteredMenuItems = menuItems.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  const handleGroupToggle = (groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const handleItemClick = (value: string) => {
    onTabChange(value);
    if (isMobile) {
      const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
      trigger?.click();
    }
  };

  return (
    <Sidebar 
      className="border-r bg-sidebar" 
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className={cn(
        "border-b border-sidebar-border transition-all duration-200",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all duration-200",
            isCollapsed ? "w-8 h-8" : "w-10 h-10"
          )}>
            <Settings className={cn(isCollapsed ? "w-4 h-4" : "w-5 h-5")} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="font-bold text-sm text-sidebar-foreground">Admin Panel</span>
              <span className="text-xs text-muted-foreground">Mensageira de Deus</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Search */}
        {!isCollapsed && (
          <div className="mb-4 px-2 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-sidebar-accent/50 border-sidebar-border focus:bg-background"
              />
            </div>
          </div>
        )}

        {/* Menu Groups */}
        {filteredMenuItems.map((group) => {
          const isOpen = openGroups[group.title] ?? group.defaultOpen;
          const hasActiveItem = group.items.some(item => item.value === activeTab);

          return (
            <SidebarGroup key={group.title} className="mb-1">
              {isCollapsed ? (
                // Collapsed: Show items directly without group header
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = activeTab === item.value;
                      return (
                        <SidebarMenuItem key={item.value}>
                          <SidebarMenuButton
                            onClick={() => handleItemClick(item.value)}
                            tooltip={item.title}
                            className={cn(
                              "w-full transition-all duration-200 rounded-lg",
                              isActive 
                                ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                                : "hover:bg-sidebar-accent"
                            )}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              ) : (
                // Expanded: Show collapsible groups
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => handleGroupToggle(group.title)}
                >
                  <CollapsibleTrigger asChild>
                    <button className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      hasActiveItem 
                        ? "text-primary bg-primary/5" 
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}>
                      <group.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{group.title}</span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isOpen ? "" : "-rotate-90"
                      )} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-accordion-down">
                    <SidebarGroupContent className="mt-1 ml-2 pl-4 border-l border-sidebar-border/50">
                      <SidebarMenu>
                        {group.items.map((item) => {
                          const isActive = activeTab === item.value;
                          return (
                            <SidebarMenuItem key={item.value}>
                              <SidebarMenuButton
                                onClick={() => handleItemClick(item.value)}
                                className={cn(
                                  "w-full justify-start transition-all duration-200 rounded-lg group/item",
                                  isActive 
                                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                                    : "hover:bg-sidebar-accent"
                                )}
                              >
                                <item.icon className={cn(
                                  "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                                  "group-hover/item:scale-110"
                                )} />
                                <div className="flex-1 flex flex-col items-start gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{item.title}</span>
                                    {item.badge && (
                                      <Badge 
                                        variant="secondary" 
                                        className={cn(
                                          "text-[10px] px-1.5 py-0 h-4",
                                          isActive 
                                            ? "bg-primary-foreground/20 text-primary-foreground" 
                                            : "bg-destructive/10 text-destructive"
                                        )}
                                      >
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  {item.description && !isActive && (
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                                {isActive && (
                                  <ChevronRight className="w-4 h-4 flex-shrink-0 animate-fade-in" />
                                )}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </SidebarGroup>
          );
        })}

        {/* Empty state for search */}
        {searchQuery && filteredMenuItems.length === 0 && !isCollapsed && (
          <div className="px-4 py-8 text-center text-muted-foreground animate-fade-in">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum item encontrado</p>
          </div>
        )}
      </SidebarContent>

      {/* Footer */}
      {!isCollapsed && (
        <SidebarFooter className="border-t border-sidebar-border p-4 animate-fade-in">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Painel Ativo</p>
              <p className="text-[10px] text-muted-foreground">Todas as funcionalidades disponíveis</p>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
