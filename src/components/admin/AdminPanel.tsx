"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import DashboardStats from "@/components/admin/DashboardStats";
import { TestimoniesManager } from "@/components/admin/TestimoniesManager";
import { GoogleDriveManager } from "@/components/admin/GoogleDriveManager";
import { MediaManager } from "@/components/admin/MediaManager";
import PrayerRequestsManager from "@/components/admin/PrayerRequestsManager";
import { ContactMessagesManager } from "@/components/admin/ContactMessagesManager";
import EventsManager from "@/components/admin/EventsManager";
import EventTemplatesManager from "@/components/admin/EventTemplatesManager";
import LiveStreamsManager from "@/components/admin/LiveStreamsManager";
import { CustomNotificationsManager } from "@/components/admin/CustomNotificationsManager";
import { SiteSettingsManager } from "@/components/admin/SiteSettingsManager";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  testimonies: "Gerenciar Testemunhos",
  drive: "Integração Google Drive",
  media: "Biblioteca de Mídia",
  events: "Gerenciar Eventos",
  templates: "Modelos de Eventos",
  prayers: "Pedidos de Oração",
  contact: "Mensagens de Contato",
  live: "Transmissões ao Vivo",
  notifications: "Notificações Personalizadas",
  settings: "Configurações do Site",
};

const DESCRIPTIONS: Record<string, string> = {
  dashboard: "Visão geral das atividades e estatísticas",
  testimonies: "Aprove e gerencie os testemunhos recebidos",
  drive: "Sincronize fotos automaticamente do Google Drive",
  media: "Gerencie vídeos, áudios e músicas",
  events: "Crie e publique eventos da igreja",
  templates: "Crie modelos reutilizáveis para eventos",
  prayers: "Gerencie os pedidos de oração recebidos",
  contact: "Mensagens enviadas pelo formulário da página Contato",
  live: "Configure transmissões ao vivo",
  notifications: "Envie notificações personalizadas aos usuários",
  settings: "Textos, contatos, horários e integrações",
};

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const title = TITLES[activeTab] || "Painel Administrativo";

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-6">
              <SidebarTrigger className="flex-shrink-0" />

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Breadcrumb className="hidden sm:block">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                <h1 className="sm:hidden text-sm font-semibold truncate">{title}</h1>
              </div>

              <Button onClick={handleLogout} variant="ghost" size="sm" className="ml-auto flex-shrink-0">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline sm:ml-2">Sair</span>
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              <div className="space-y-1 hidden sm:block">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{DESCRIPTIONS[activeTab]}</p>
              </div>

              <div className="animate-fade-in" key={activeTab}>
                {activeTab === "dashboard" && <DashboardStats />}
                {activeTab === "testimonies" && <TestimoniesManager />}
                {activeTab === "drive" && <GoogleDriveManager />}
                {activeTab === "media" && <MediaManager />}
                {activeTab === "events" && <EventsManager />}
                {activeTab === "templates" && <EventTemplatesManager />}
                {activeTab === "prayers" && <PrayerRequestsManager />}
                {activeTab === "contact" && <ContactMessagesManager />}
                {activeTab === "live" && <LiveStreamsManager />}
                {activeTab === "notifications" && <CustomNotificationsManager />}
                {activeTab === "settings" && <SiteSettingsManager />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
