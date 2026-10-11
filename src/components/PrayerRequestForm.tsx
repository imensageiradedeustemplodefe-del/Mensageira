"use client";

import { useState } from "react";
import { maskPhoneInput } from "@/lib/phone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api } from "@/lib/fetcher";
import { PRAYER_CATEGORIES, PRAYER_CATEGORY_LABELS } from "@/lib/prayers";

const prayerRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  phone: z
    .string()
    .trim()
    .max(20, "Telefone muito longo")
    .regex(/^[\d\s\-()]*$/, "Formato de telefone inválido")
    .optional()
    .or(z.literal("")),
  request_text: z
    .string()
    .trim()
    .min(10, "Pedido deve ter pelo menos 10 caracteres")
    .max(2000, "Pedido deve ter no máximo 2000 caracteres")
    .refine((val) => !/<[^>]+>/.test(val), "HTML não é permitido")
    .refine((val) => !/https?:\/\/|www\./i.test(val), "URLs não são permitidas no pedido"),
  category: z.enum(PRAYER_CATEGORIES),
  is_urgent: z.boolean(),
  allow_public_share: z.boolean(),
});

type PrayerFormValues = z.infer<typeof prayerRequestSchema>;

export default function PrayerRequestForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<PrayerFormValues>({
    resolver: zodResolver(prayerRequestSchema),
    defaultValues: {
      name: "",
      phone: "",
      request_text: "",
      category: "geral",
      is_urgent: false,
      allow_public_share: false,
    },
  });

  const onSubmit = async (values: PrayerFormValues) => {
    try {
      await api("/api/prayers", { method: "POST", json: values });
      setIsSubmitted(true);
      toast({
        title: "Pedido de Oração Enviado",
        description: "Seu pedido foi recebido e será analisado pela equipe pastoral.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Erro ao Enviar",
        description: error instanceof Error ? error.message : "Houve um problema ao enviar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Pedido Recebido!</h3>
          <p className="text-muted-foreground mb-6">
            Obrigado por compartilhar sua necessidade conosco. Nossa equipe pastoral estará orando por você e sua
            situação.
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Enviar Outro Pedido
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto" role="form" aria-labelledby="prayer-form-title">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <Heart className="w-6 h-6 text-primary" />
        </div>
        <CardTitle id="prayer-form-title" className="text-2xl">
          Pedido de Oração
        </CardTitle>
        <p className="text-muted-foreground">
          Compartilhe sua necessidade de oração conosco. Estaremos intercedendo por você.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" aria-required="true" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone / WhatsApp (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="(49) 99999-9999"
                        autoComplete="tel"
                        {...field}
                        onChange={(e) => field.onChange(maskPhoneInput(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-label="Selecione a categoria" className="md:w-1/2">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRAYER_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {PRAYER_CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="request_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pedido de Oração *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Compartilhe sua necessidade de oração..."
                      className="resize-none"
                      aria-required="true"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_urgent"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} aria-label="Marcar como pedido urgente" />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">Marcar como pedido urgente</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allow_public_share"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Permitir compartilhamento público"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Permitir que minha oração seja compartilhada com outros membros da comunidade
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Alert role="note">
              <Heart className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Seus dados são tratados com confidencialidade. Apenas a equipe pastoral terá acesso completo ao seu
                pedido. Se você permitir o compartilhamento público, outros membros verão apenas seu nome e o pedido de
                oração.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting} aria-busy={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" aria-hidden="true" />
                  Enviar Pedido
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
