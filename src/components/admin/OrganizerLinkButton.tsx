"use client";

import { useState } from "react";
import { Link2, Copy, Check, MessageCircle, ExternalLink, RefreshCw, Loader2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

/** Botão "Link das organizadoras": gera/mostra o link só de leitura com os inscritos e pagamentos do evento. */
export function OrganizerLinkButton({ eventId, eventTitle }: { eventId: string; eventTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null | undefined>(undefined); // undefined = carregando
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const endpoint = `/api/admin/events/${eventId}/organizer-link`;

  const run = async (method: "GET" | "POST" | "DELETE") => {
    setBusy(true);
    try {
      const res = await api<{ url: string | null }>(endpoint, { method });
      setUrl(res.url);
      if (method === "POST") toast({ title: "Link pronto!", description: "Copie ou envie pelo WhatsApp para as organizadoras." });
      if (method === "DELETE") toast({ title: "Link desativado", description: "Quem tinha o link não consegue mais abrir." });
    } catch (err) {
      toast({ title: "Não foi possível", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      setUrl(undefined);
      run("GET");
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const message = url
    ? `Olá! Aqui está o link para acompanhar as inscrições e os pagamentos${eventTitle ? ` do ${eventTitle}` : ""}:\n${url}\n\nÉ só abrir e tocar em "Atualizar" para ver as novidades. Por favor, não repasse este link: ele mostra os dados de quem se inscreveu.`
    : "";

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => onOpenChange(true)}>
        <Link2 className="w-4 h-4" /> Link das organizadoras
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link para as organizadoras</DialogTitle>
            <DialogDescription>
              Quem tiver este link vê a lista de inscritos e a situação dos pagamentos deste evento, sem entrar no painel e sem poder
              alterar nada.
            </DialogDescription>
          </DialogHeader>

          {url === undefined ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : url ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="text-xs" />
                <Button variant="outline" size="icon" onClick={copy} aria-label="Copiar link" className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" /> Abrir
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  disabled={busy}
                  onClick={() => confirm("Gerar um link novo? O link atual para de funcionar.") && run("POST")}
                >
                  <RefreshCw className="w-4 h-4" /> Gerar outro link
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  disabled={busy}
                  onClick={() => confirm("Desativar o link? Quem tem o link não vai mais conseguir abrir.") && run("DELETE")}
                >
                  <Ban className="w-4 h-4" /> Desativar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Se o link cair em mãos erradas, gere outro: o antigo para de funcionar na hora.</p>
            </div>
          ) : (
            <Button className="w-full gap-2" disabled={busy} onClick={() => run("POST")}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Gerar link
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
