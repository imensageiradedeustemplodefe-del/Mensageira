"use client";

import Image from "next/image";
import { Heart, Target, Eye, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function AboutPage() {
  const { settings } = useSiteSettings();

  const pastors = [
    {
      name: "Profeta João",
      role: "Profeta (em memória)",
      description:
        "Era a base e o alicerce de nossa igreja. Mesmo não estando mais entre nós, sua influência e ensinamentos continuam guiando nossa comunidade de fé.",
      image: "/images/logo-icon.png",
    },
    {
      name: "Pra. Vera Lucia",
      role: "Pastora Responsável",
      description: "Lidera a igreja juntamente com o Pastor Gilmar, atuando especialmente na área de libertação.",
      image: "/images/pastora-vera.png",
    },
    {
      name: settings.pastor_principal_name || "Pr. Gilmar Radaelli",
      role: "Pastor Responsável",
      description: "Lidera a igreja em conjunto com a Pastora Vera, atuando especialmente na área de prosperidade.",
      image: "/images/pastor-gilmar.png",
    },
    {
      name: settings.pastor_auxiliar_name || "Pr. João Batista",
      role: "Pastor Auxiliar",
      description: "Dá suporte aos pastores responsáveis, atuando especialmente na área de ensinamento bíblico.",
      image: "/images/pastor-joao.png",
    },
    // Pastores auxiliares (fotos: substituir "/images/logo-icon.png" pelos arquivos quando chegarem)
    {
      name: "Pr. Daniel Ribas",
      role: "Pastor Auxiliar",
      description: "Auxilia os pastores responsáveis no cuidado pastoral e na condução dos cultos e da congregação.",
      image: "/images/logo-icon.png",
    },
    {
      name: "Pr. Ademar Malmann",
      role: "Pastor Auxiliar",
      description: "Auxilia os pastores responsáveis, com atuação especial no ministério de oração Guerreiros de Fé.",
      image: "/images/logo-icon.png",
    },
    {
      name: "Pr. Odirlei Segatto",
      role: "Pastor Auxiliar",
      description: "Auxilia os pastores responsáveis no cuidado pastoral e no acompanhamento das famílias da igreja.",
      image: "/images/logo-icon.png",
    },
    {
      name: "Pr. João Leno",
      role: "Pastor Auxiliar",
      description: "Auxilia os pastores responsáveis no cuidado pastoral e nas atividades da congregação.",
      image: "/images/logo-icon.png",
    },
  ];

  const ministries = [
    { name: "Geração de Samuel", leaders: "André Dale Laste e Silvano Cardoso", type: "Grupo De Louvor", icon: "🎵" },
    { name: "Jovens Adoradores", leaders: "Silvano e Leonice Cardoso", type: "Grupo De Jovens", icon: "👥" },
    { name: "Mirian's", leaders: "Leonice Cardoso", type: "Grupo De Meninas", icon: "🩰" },
    { name: "Guerreiros De Fé", leaders: "Márcia e Ademar Malmann", type: "Grupo De Oração", icon: "🙏" },
    { name: "Palavra Viva", leaders: "Jessica Vacelkoski e Elisa Maria", type: "Mídia", icon: "📱" },
    { name: "Ourinhos de Cristo", leaders: "Leonice Cardoso", type: "Grupo De Crianças", icon: "👶" },
    { name: "Nova Geração Kids", leaders: "Daniela Azeredo", type: "Grupo De Crianças", icon: "👶" },
    { name: "Mensageiras Do Cristo Rei", leaders: "Ana Venconi", type: "Grupo De Mulheres", icon: "👩" },
  ];

  const values = [
    { icon: Heart, title: "Amor", description: "O amor de Cristo é o centro de tudo que fazemos, servindo uns aos outros com compaixão." },
    { icon: Target, title: "Missão", description: "Proclamar o evangelho de Jesus Cristo e fazer discípulos em nossa comunidade e além." },
    { icon: Eye, title: "Visão", description: "Ser uma igreja transformadora que impacta vidas através da Palavra de Deus." },
    { icon: Users2, title: "Comunidade", description: "Cultivar relacionamentos genuínos e apoio mútuo entre os irmãos na fé." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">Nossa História</h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            {settings.church_description ||
              "A Mensageira de Deus Templo de Fé é uma comunidade de fé comprometida com a pregação da Palavra de Deus e o cuidado pastoral das famílias."}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Nossos Valores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
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

      <section className="py-16 bg-accent/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Liderança Pastoral</h2>
            <p className="text-lg text-muted-foreground">Conheça nossa equipe pastoral dedicada ao serviço do Reino de Deus.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {pastors.map((pastor, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
                    <Image src={pastor.image} alt={pastor.name} width={96} height={96} className="w-full h-full object-cover" />
                  </div>
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

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ministérios</h2>
            <p className="text-lg text-muted-foreground">Conheça os diferentes ministérios que servem nossa comunidade.</p>
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
