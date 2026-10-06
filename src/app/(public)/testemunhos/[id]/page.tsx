import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShareButton } from "@/components/ShareButton";
import { getSharedTestimony } from "@/lib/share-pages";
import { shareTestimony } from "@/lib/share";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await getSharedTestimony(id);
  if (!t) return { title: "Testemunho não encontrado", robots: { index: false } };
  const title = `Testemunho de ${t.name}`;
  const description = t.content.length > 180 ? `${t.content.slice(0, 179)}…` : t.content;
  return {
    title,
    description,
    alternates: { canonical: `/testemunhos/${t.id}` },
    openGraph: { title, description, type: "article", url: `/testemunhos/${t.id}` },
    twitter: { title, description },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const t = await getSharedTestimony(id);
  if (!t) notFound();
  const share = shareTestimony({ id: t.id, name: t.name, content: t.content });

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground">Testemunho</h1>
          <p className="text-muted-foreground mt-2">O que Deus fez na vida de {t.name}</p>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Card>
            <CardContent className="p-6 sm:p-10 space-y-6">
              <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">“{t.content}”</p>
              <p className="font-semibold text-primary">— {t.name}</p>
              <ShareButton data={share} className="w-full sm:w-auto" />
            </CardContent>
          </Card>
          <div className="text-center mt-8">
            <Link href="/testemunhos">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ver todos os testemunhos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
