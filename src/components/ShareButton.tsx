"use client";

import { useState } from "react";
import { Share2, Facebook, MessageCircle, Copy, Check, Link2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { shareMessage, type ShareData } from "@/lib/share";

interface ShareButtonProps {
  data: ShareData;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  /** Texto do botão (padrão "Compartilhar"); com size="icon" só aparece o ícone */
  label?: string;
}

const isMobile = () =>
  typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/**
 * Botão de compartilhar padrão do site.
 * - Celular: abre a folha de compartilhamento do sistema (WhatsApp, Instagram, etc.) com a mensagem
 *   já formatada e o link da página do item (que tem preview próprio).
 * - Computador: menu com WhatsApp, Facebook, Telegram, copiar mensagem e copiar link.
 */
export const ShareButton = ({ data, className = "", variant = "outline", size = "default", label = "Compartilhar" }: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"msg" | "link" | null>(null);
  const { toast } = useToast();
  const message = shareMessage(data);

  const copy = async (what: "msg" | "link") => {
    try {
      await navigator.clipboard.writeText(what === "msg" ? message : data.url);
      setCopied(what);
      toast({ title: what === "msg" ? "Mensagem copiada!" : "Link copiado!", description: "É só colar onde quiser." });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const openUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile() && typeof navigator.share === "function") {
      try {
        // Só "text": a mensagem já contém o link, assim WhatsApp & cia. recebem tudo formatado
        await navigator.share({ title: data.title, text: message });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setOpen(true); // falhou: mostra o menu
      }
      return;
    }
    setOpen((v) => !v);
  };

  const trigger = (
    <Button variant={variant} size={size} onClick={onClick} className={className} aria-label={label}>
      <Share2 className={size === "icon" ? "w-4 h-4" : "w-4 h-4 mr-2"} />
      {size !== "icon" && label}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="end" onClick={(e) => e.stopPropagation()}>
        <p className="px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground">Compartilhar</p>
        <div className="space-y-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => openUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`)}
          >
            <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
            WhatsApp
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`)}
          >
            <Facebook className="w-4 h-4 mr-2 text-blue-600" />
            Facebook
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() =>
              openUrl(`https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}`)
            }
          >
            <Send className="w-4 h-4 mr-2 text-sky-500" />
            Telegram
          </Button>
          <div className="my-1 h-px bg-border" />
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => copy("msg")}>
            {copied === "msg" ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied === "msg" ? "Copiada!" : "Copiar mensagem"}
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => copy("link")}>
            {copied === "link" ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Link2 className="w-4 h-4 mr-2" />}
            {copied === "link" ? "Copiado!" : "Copiar link"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
