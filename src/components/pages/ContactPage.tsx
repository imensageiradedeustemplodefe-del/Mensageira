"use client";

import { useState } from "react";
import { MapPin, Mail, Clock, Send, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DEFAULT_EMAIL = "imensageiradedeustemplodefe@gmail.com";
const DEFAULT_ADDRESS = "R. Elias Biasi, 49 - Berger, Caçador - SC, 89500-000";

export function ContactPage() {
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const email = settings.contact_email_secretary || settings.church_email || DEFAULT_EMAIL;
  const address = settings.contact_address_full || settings.church_address || DEFAULT_ADDRESS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = encodeURIComponent(`Mensagem do site: ${formData.subject}`);
    const body = encodeURIComponent(
      `Nome: ${formData.name}\n` +
        `E-mail: ${formData.email}\n` +
        `Telefone: ${formData.phone || "Não informado"}\n` +
        `Assunto: ${formData.subject}\n\n` +
        `Mensagem:\n${formData.message}`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

    toast({
      title: "Cliente de E-mail Aberto!",
      description: "Seu cliente de e-mail foi aberto com a mensagem preenchida. Complete o envio por lá.",
    });

    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    { icon: MapPin, title: "Endereço", content: address, description: "Venha nos visitar pessoalmente" },
    { icon: Mail, title: "E-mail", content: email, description: "Envie sua mensagem" },
    {
      icon: Clock,
      title: "Horários",
      content: `Dom: ${settings.sunday_service_time || "19:30"} • Sex: ${settings.friday_service_time || "20:00"}`,
      description: "Horários dos cultos",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">Entre em Contato</h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Estamos aqui para você. Entre em contato conosco para dúvidas, pedidos de oração ou para conhecer melhor
            nossa igreja.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-card to-accent/20"
                >
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg text-foreground">{info.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium text-foreground">{info.content}</p>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-accent/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <Card className="bg-card/60 backdrop-blur border-none">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center">
                    <MessageCircle className="w-6 h-6 mr-2" />
                    Envie uma Mensagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Seu nome" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="seu@email.com" />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone (Opcional)</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(00) 00000-0000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto</Label>
                        <Input id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder="Assunto da mensagem" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea id="message" name="message" value={formData.message} onChange={handleInputChange} required rows={5} placeholder="Digite sua mensagem aqui..." />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/5 to-peaceful-blue/10 border-none">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Outras Formas de Contato</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <div className="flex items-start">
                      <Mail className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <a href={`mailto:${email}`} className="text-sm break-all hover:text-primary transition-colors">
                        {email}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-blue-600 rounded flex-shrink-0"></div>
                      <a
                        href={settings.facebook_url || "https://www.facebook.com/igrejamensageira"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary transition-colors"
                      >
                        Facebook: Igreja Mensageira De Deus Templo De Fé
                      </a>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded flex-shrink-0"></div>
                      <a
                        href={settings.instagram_url || "https://www.instagram.com/igrejamensageira"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary transition-colors"
                      >
                        Instagram: @igrejamensageira
                      </a>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white/50 dark:bg-white/5 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Pedidos de Oração</h4>
                    <p className="text-sm text-muted-foreground">
                      Envie seus pedidos de oração através do formulário ou durante nossas transmissões ao vivo. Nossa
                      equipe estará orando por você.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur border-none">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Localização</h3>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Localização da Igreja Mensageira de Deus Templo de Fé"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-muted-foreground text-sm">{address}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
