"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Calendar, Play, Phone, Heart, Camera, MessageCircle, ChevronDown, User, ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { useNotificationCount } from "@/hooks/useNotificationCount";

const Navigation = () => {
  const { count: notificationCount } = useNotificationCount();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const navigation = [
    { name: "Início", href: "/", icon: Home },
    { name: "Sobre", href: "/sobre", icon: Users },
    { name: "Eventos", href: "/eventos", icon: Calendar },
    { name: "Live", href: "/live", icon: Play },
    { name: "Contato", href: "/contato", icon: Phone },
  ];

  const ministryPages = [
    { name: "Pedidos de Oração", href: "/oracoes", icon: Heart },
    { name: "Galeria", href: "/galeria", icon: Camera },
    { name: "Testemunhos", href: "/testemunhos", icon: MessageCircle },
  ];

  const isActive = (href: string) => pathname === href;

  // Mobile app-style header for specific pages
  const showMobileAppHeader = isMobile && pathname !== "/";
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      "/eventos": "Eventos",
      "/live": "Live",
      "/oracoes": "Pedidos de Oração",
      "/sobre": "Sobre",
      "/contato": "Contato",
      "/galeria": "Galeria",
      "/testemunhos": "Testemunhos",
      "/notificacoes": "Notificações",
      "/menu": "Menu",
    };
    return titles[pathname] || "Página";
  };

  if (showMobileAppHeader) {
    return (
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2 min-h-[44px] min-w-[44px]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Link href="/" className="flex items-center space-x-2">
                <Image src="/images/logo.png" alt="Logo" className="w-6 h-6 object-contain" width={24} height={24} priority />
                <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" asChild className="min-h-[44px] min-w-[44px] relative" title="Notificações">
                <Link href="/notificacoes">
                  <Bell className="h-5 w-5" />
                  <NotificationBadge count={notificationCount} />
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Logo Igreja Mensageira de Deus Templo de Fé"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              width={40}
              height={40}
              priority
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">Mensageira de Deus</h1>
              <p className="text-sm text-muted-foreground -mt-1">Templo de Fé</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center max-w-2xl mx-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}

            {/* Ministry Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDropdownOpen ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Heart className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Ministérios</span>
                <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-[100] overflow-hidden">
                  <div className="py-1">
                    {ministryPages.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isActive(item.href) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                          }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild className="relative" title="Perfil">
                <Link href="/admin/login">
                  <User className="h-[1.2rem] w-[1.2rem]" />
                </Link>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild className="relative" title="Notificações">
                <Link href="/notificacoes">
                  <Bell className="h-[1.2rem] w-[1.2rem]" />
                  <NotificationBadge count={notificationCount} />
                </Link>
              </Button>
            </div>

            <div className="md:hidden flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild className="min-h-[44px] min-w-[44px]" title="Perfil">
                <Link href="/admin/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild className="min-h-[44px] min-w-[44px] relative" title="Notificações">
                <Link href="/notificacoes">
                  <Bell className="h-5 w-5" />
                  <NotificationBadge count={notificationCount} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for dropdown */}
      {isDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsDropdownOpen(false)} />}
    </nav>
  );
};

export default Navigation;
