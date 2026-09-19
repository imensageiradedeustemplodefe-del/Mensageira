import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Clock className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">Em Breve</h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
            Estamos preparando algo especial para você. Esta funcionalidade estará disponível em breve.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Sermões</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em breve você terá acesso à nossa biblioteca completa de sermões em áudio e vídeo.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-xl">Estudos Bíblicos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Estudos bíblicos interativos e materiais de apoio estarão disponíveis em breve.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Enquanto isso, confira nossa programação de eventos e participe dos nossos cultos presenciais.
            </p>
            <Link href="/eventos">
              <Button variant="outline" size="lg">
                Ver Programação
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
