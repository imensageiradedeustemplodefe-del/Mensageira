import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Texto pequeno acima do título (ex.: "Evento realizado") */
  eyebrow?: React.ReactNode;
  icon?: LucideIcon;
  /** Busca, filtros etc., logo abaixo do subtítulo */
  children?: React.ReactNode;
  className?: string;
}

/** Cabeçalho padrão das páginas públicas. Compacto de propósito: o conteúdo aparece sem precisar rolar. */
export function PageHero({ title, subtitle, eyebrow, icon: Icon, children, className }: PageHeroProps) {
  return (
    <section className={cn("bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-6 sm:py-10", className)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {Icon && <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary mx-auto mb-2 sm:mb-3" />}
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-1">{eyebrow}</p>}
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-2 text-base sm:text-lg text-muted-foreground leading-relaxed">{subtitle}</p>}
        {children && <div className="mt-4 sm:mt-5">{children}</div>}
      </div>
    </section>
  );
}
