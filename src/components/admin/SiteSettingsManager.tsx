"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Save, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/fetcher";
import type { SiteSettingFull } from "@/types/database";

const CATEGORY_LABELS: Record<string, string> = {
  general: "Geral",
  contact: "Contato",
  social: "Redes Sociais",
  schedule: "Horários",
  live: "Transmissão",
  about: "Sobre",
  integrations: "Integrações Google",
};

const CATEGORY_ORDER = ["general", "contact", "social", "schedule", "live", "about", "integrations"];

export function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettingFull[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<SiteSettingFull[]>("/api/admin/settings");
        setSettings(data);
        setValues(Object.fromEntries(data.map((s) => [s.setting_key, s.setting_value ?? ""])));
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const present = new Set(settings.map((s) => s.category));
    return CATEGORY_ORDER.filter((c) => present.has(c)).concat([...present].filter((c) => !CATEGORY_ORDER.includes(c)));
  }, [settings]);

  const dirty = useMemo(
    () => settings.filter((s) => (s.setting_value ?? "") !== (values[s.setting_key] ?? "")),
    [settings, values]
  );

  const handleSave = async () => {
    if (dirty.length === 0) return;
    setSaving(true);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        json: { settings: dirty.map((s) => ({ setting_key: s.setting_key, setting_value: values[s.setting_key] ?? "" })) },
      });
      setSettings((prev) => prev.map((s) => ({ ...s, setting_value: values[s.setting_key] ?? "" })));
      toast.success(`${dirty.length} configuração(ões) salva(s)!`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Site
          </CardTitle>
          <CardDescription>Os valores abaixo alimentam os textos, contatos e integrações das páginas públicas.</CardDescription>
        </div>
        <Button onClick={handleSave} disabled={saving || dirty.length === 0}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações {dirty.length > 0 && `(${dirty.length})`}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="flex flex-wrap h-auto w-full justify-start">
            {categories.map((c) => (
              <TabsTrigger key={c} value={c} className="text-xs sm:text-sm">
                {CATEGORY_LABELS[c] ?? c}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((c) => (
            <TabsContent key={c} value={c} className="mt-6">
              <div className="grid gap-5 md:grid-cols-2">
                {settings
                  .filter((s) => s.category === c)
                  .map((s) => (
                    <div key={s.setting_key} className={`space-y-2 ${s.setting_type === "textarea" ? "md:col-span-2" : ""}`}>
                      <Label htmlFor={s.setting_key}>{s.display_name}</Label>
                      {s.setting_type === "textarea" ? (
                        <Textarea
                          id={s.setting_key}
                          rows={3}
                          value={values[s.setting_key] ?? ""}
                          onChange={(e) => setValues({ ...values, [s.setting_key]: e.target.value })}
                        />
                      ) : (
                        <Input
                          id={s.setting_key}
                          type={s.setting_type === "email" ? "email" : s.setting_type === "url" ? "url" : s.setting_type === "time" ? "time" : "text"}
                          value={values[s.setting_key] ?? ""}
                          onChange={(e) => setValues({ ...values, [s.setting_key]: e.target.value })}
                        />
                      )}
                      {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
