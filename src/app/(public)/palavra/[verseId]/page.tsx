import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShareButton } from "@/components/ShareButton";
import { getSharedVerse } from "@/lib/share-pages";
import { shareVerse } from "@/lib/share";

type Props = { params: Promise<{ verseId: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { verseId } = await params;
  const verse = await getSharedVerse(verseId);
  if (!verse) return { title: "Versículo não encontrado", robots: { index: false } };
  const title = `Palavra do Dia — ${verse.verseReference}`;
  const description = `“${verse.verseText}” — ${verse.verseReference}`;
  return {
    title,
    description,
    alternates: { canonical: `/palavra/${verse.id}` },
    openGraph: { title, description, type: "article", url: `/palavra/${verse.id}` },
    twitter: { title, description },
  };
}

export default async function Page({ params }: Props) {
  const { verseId } = await params;
  const verse = await getSharedVerse(verseId);
  if (!verse) notFound();

  const share = shareVerse({ id: verse.id, verse_text: verse.verseText, verse_reference: verse.verseReference });

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/10 to-peaceful-blue/20 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <BookOpen className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground">Palavra do Dia</h1>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Card className="bg-gradient-to-br from-card to-accent/30">
            <CardContent className="p-6 sm:p-10 text-center space-y-6">
              <blockquote className="text-xl sm:text-2xl leading-relaxed text-foreground italic">“{verse.verseText}”</blockquote>
              <p className="text-lg font-semibold text-primary">{verse.verseReference}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <ShareButton data={share} />
                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Conhecer a igreja
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
