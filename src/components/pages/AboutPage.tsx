"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContent } from "@/hooks/useSiteSettings";
import { PageHero } from "@/components/layout/PageHero";
import { PhotoCircle } from "@/components/content/PhotoCircle";
import { VALUE_ICON_COMPONENTS } from "@/components/content/value-icons";
import { DEFAULT_MINISTRIES, DEFAULT_PASTORS, DEFAULT_VALUES, type Ministry, type Pastor, type ValueItem } from "@/lib/about-content";

export function AboutPage() {
  // textos, valores, pastores e ministérios vêm do painel (Configurações → Conteúdo do site)
  const { text, list } = useContent();
  const pastors = list<Pastor>("about_pastors", DEFAULT_PASTORS);
  const ministries = list<Ministry>("about_ministries", DEFAULT_MINISTRIES);
  const values = list<ValueItem>("about_values", DEFAULT_VALUES);

  return (
    <div className="min-h-screen bg-background">
      <PageHero title={text("about_title")} subtitle={text("church_description")} />

      <section className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-6 sm:mb-8">{text("about_values_title")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((value, index) => {
              const Icon = (VALUE_ICON_COMPONENTS[value.icon] ?? VALUE_ICON_COMPONENTS.heart).icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-accent/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">{text("about_pastors_title")}</h2>
            <p className="text-lg text-muted-foreground">{text("about_pastors_description")}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {pastors.map((pastor, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <PhotoCircle photo={pastor.photo} alt={pastor.name} className="w-24 h-24 mx-auto mb-4" />
                  <CardTitle className="text-xl">{pastor.name}</CardTitle>
                  <p className="text-primary font-medium">{pastor.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{pastor.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">{text("about_ministries_title")}</h2>
            <p className="text-lg text-muted-foreground">{text("about_ministries_description")}</p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {ministries.map((ministry, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{ministry.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{ministry.name}</CardTitle>
                      <p className="text-sm text-primary font-medium">{ministry.type}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    <strong>Líderes:</strong> {ministry.leaders}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
