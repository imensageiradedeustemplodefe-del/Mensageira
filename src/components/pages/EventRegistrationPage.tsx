"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/fetcher";
import type { Event, EventRegistrationField } from "@/types/database";
import { Switch } from "@/components/ui/switch";
import { RatingInput, ratingStyleOf } from "@/components/forms/RatingInput";
import { ContributionBox, getSavedRegistrations, saveRegistration, type SavedRegistration } from "@/components/forms/ContributionBox";
import { formatBRL } from "@/lib/pix";
import { maskPhoneInput } from "@/lib/phone";

type EventWithFields = Event & { registration_fields: EventRegistrationField[]; registrations_count: number };

export function EventRegistrationPage({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventWithFields | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [regId, setRegId] = useState<string | null>(null);
  // inscrições já feitas neste aparelho (para acompanhar o pagamento)
  const [saved, setSaved] = useState<SavedRegistration[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<EventWithFields>(`/api/events/${eventId}`);
        if (!data.registration_required) throw new Error("Evento sem inscrição");
        setEvent(data);
        setSaved(getSavedRegistrations(eventId));
      } catch {
        toast({
          title: "Evento não encontrado",
          description: "Este evento não está disponível para inscrição",
          variant: "destructive",
        });
        router.replace("/eventos");
        return;
      }
      setLoading(false);
    })();
  }, [eventId, router, toast]);

  const fields = event?.registration_fields ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields = fields
      .filter((field) =>
        field.is_required &&
        (field.field_type === "checkbox" ? formData[field.field_name] !== "Sim" : !formData[field.field_name])
      )
      .map((field) => field.field_label);

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha os campos: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const reg = await api<{ id: string }>(`/api/events/${eventId}/registrations`, { method: "POST", json: { registration_data: formData } });
      if (reg?.id) {
        // nome (primeiro campo de texto preenchido) só para a pessoa reconhecer a inscrição depois
        const first = fields.find((f) => !["rating", "checkbox", "select", "date", "number"].includes(f.field_type) && formData[f.field_name]);
        const label = first ? String(formData[first.field_name]).slice(0, 40) : undefined;
        saveRegistration(eventId, { id: reg.id, label });
        setSaved(getSavedRegistrations(eventId));
        setRegId(reg.id);
      }
      setSubmitted(true);
      toast({ title: "Inscrição enviada!", description: "Sua inscrição foi registrada com sucesso" });
    } catch (err) {
      toast({
        title: "Erro ao enviar inscrição",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: EventRegistrationField) => {
    const commonProps = {
      id: field.field_name,
      required: field.is_required,
      placeholder: field.field_placeholder || "",
      value: formData[field.field_name] || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData({ ...formData, [field.field_name]: e.target.value }),
    };

    switch (field.field_type) {
      case "textarea":
        return <Textarea {...commonProps} rows={4} />;
      case "select":
        return (
          <Select
            value={formData[field.field_name] || ""}
            onValueChange={(value) => setFormData({ ...formData, [field.field_name]: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.field_placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {field.field_options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "rating":
        return (
          <RatingInput
            id={field.field_name}
            style={ratingStyleOf(field.field_options)}
            value={formData[field.field_name]}
            onChange={(v) => setFormData({ ...formData, [field.field_name]: v })}
          />
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch
              id={field.field_name}
              checked={formData[field.field_name] === "Sim"}
              onCheckedChange={(c) => setFormData({ ...formData, [field.field_name]: c ? "Sim" : "Não" })}
            />
            <span className="text-sm">{formData[field.field_name] === "Sim" ? "Sim" : "Não"}</span>
          </div>
        );
      case "date":
        return <Input {...commonProps} type="date" />;
      case "number":
        return <Input {...commonProps} type="number" />;
      case "phone":
      case "tel":
        return (
          <Input
            {...commonProps}
            type="tel"
            inputMode="tel"
            placeholder={field.field_placeholder || "(49) 99999-9999"}
            onChange={(e) => setFormData({ ...formData, [field.field_name]: maskPhoneInput(e.target.value) })}
          />
        );
      case "email":
        return <Input {...commonProps} type="email" />;
      default:
        return <Input {...commonProps} type="text" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="p-6 sm:p-12 text-center">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-4">Inscrição Confirmada!</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Sua inscrição para <strong>{event?.title}</strong> foi registrada com sucesso.
              </p>
              {event?.contribution_cents && regId ? (
                <div className="mb-8">
                  <ContributionBox
                    eventId={eventId}
                    eventTitle={event.title}
                    registrationId={regId}
                    amountCents={event.contribution_cents}
                    note={event.contribution_note}
                  />
                </div>
              ) : null}
              <Button variant={event?.contribution_cents ? "outline" : "default"} onClick={() => router.push("/eventos")}>Ver Outros Eventos</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            {event?.image_url && (
              <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardTitle className="text-3xl">{event?.title}</CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <Calendar className="w-4 h-4" />
              <span>
                {event?.event_date
                  ? new Date(event.event_date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
            {event?.location && <p className="text-sm text-muted-foreground">{event.location}</p>}
            {event?.description && <p className="text-muted-foreground mt-4">{event.description}</p>}
          </CardHeader>
          <CardContent>
            {saved.length > 0 && (
              <div className="mb-8 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  {saved.length === 1 ? "Você já está inscrito(a)" : "Inscrições feitas neste aparelho"}
                </h2>
                {event?.contribution_cents ? (
                  saved.map((r) => (
                    <ContributionBox
                      key={r.id}
                      eventId={eventId}
                      eventTitle={event.title}
                      registrationId={r.id}
                      label={r.label}
                      amountCents={event.contribution_cents!}
                      note={event.contribution_note}
                      onMissing={() => setSaved(getSavedRegistrations(eventId))}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{saved.map((r) => r.label).filter(Boolean).join(", ") || "Sua inscrição foi registrada."}</p>
                )}
                <p className="text-sm text-muted-foreground pt-2">Quer inscrever outra pessoa? É só preencher o formulário abaixo.</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold">Formulário de Inscrição</h2>
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.field_name}>
                    {field.field_label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
              {event?.contribution_cents ? (
                <div className="rounded-lg border border-[#32BCAD]/40 bg-[#32BCAD]/10 p-4 text-sm">
                  <p className="font-semibold">Contribuição: {formatBRL(event.contribution_cents)}</p>
                  {event.contribution_note && <p className="text-muted-foreground mt-0.5">{event.contribution_note}</p>}
                  <p className="text-muted-foreground mt-1">Depois de confirmar a inscrição, aparece o QR Code do PIX para pagar.</p>
                </div>
              ) : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Confirmar Inscrição"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
