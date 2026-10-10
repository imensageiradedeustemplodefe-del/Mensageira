"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { pixPayload, formatBRL } from "@/lib/pix";

/** Botão "Pagar com PIX" que abre o QR Code e o "copia e cola" com o valor da contribuição. */
export function PixPayment({
  amountCents,
  note,
  txid,
  description,
  receiver,
  label = "Pagar com PIX",
  className = "",
}: {
  amountCents: number;
  note?: string | null;
  txid?: string;
  description?: string;
  /** recebedor próprio (ex.: do evento); sem isso usa o PIX padrão de Configurações */
  receiver?: { key?: string | null; name?: string | null; city?: string | null };
  label?: string;
  className?: string;
}) {
  const { settings } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Recebedor do evento (se tiver chave e nome) ou o padrão da igreja
  const own = !!receiver?.key?.trim() && !!receiver?.name?.trim();
  const pixKey = (own ? receiver?.key : settings.pix_key)?.trim() ?? "";
  const pixName = (own ? receiver?.name : settings.pix_name)?.trim() ?? "";
  const pixCity = (own ? receiver?.city : settings.pix_city)?.trim() || "Cacador";
  const configured = !!pixKey && !!pixName;
  const code = useMemo(
    () => (configured ? pixPayload({ key: pixKey, name: pixName, city: pixCity, amountCents, txid, description }) : ""),
    [configured, pixKey, pixName, pixCity, amountCents, txid, description]
  );

  useEffect(() => {
    if (!open || !code) return;
    let cancelled = false;
    QRCode.toDataURL(code, { width: 320, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [open, code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  if (!configured) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className={`gap-2 bg-[#32BCAD] hover:bg-[#2aa496] text-white ${className}`}>
          <QrCode className="w-4 h-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Contribuição via PIX</DialogTitle>
          <DialogDescription>
            Valor: <strong className="text-foreground">{formatBRL(amountCents)}</strong>
            {note ? ` — ${note}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR Code do PIX" width={240} height={240} className="w-60 h-60" />
            ) : (
              <div className="w-60 h-60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Abra o app do seu banco, escolha <strong>PIX → Ler QR Code</strong> e aponte a câmera. Pelo celular, use o “copia e cola” abaixo.
          </p>

          <div className="w-full space-y-2">
            <p className="text-xs font-medium">PIX copia e cola</p>
            <div className="rounded-lg border bg-muted/40 p-2 text-[11px] font-mono break-all max-h-20 overflow-y-auto select-all">{code}</div>
            <Button type="button" variant="outline" className="w-full gap-2" onClick={copy}>
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado! Agora cole no app do banco" : "Copiar código PIX"}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Recebedor: <strong>{pixName}</strong>. Confira o nome no app do banco antes de confirmar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
