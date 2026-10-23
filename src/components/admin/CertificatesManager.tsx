"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Plus, Printer, Pencil, Trash2, Loader2, ArrowLeft, Award, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import {
  CERTIFICATES,
  certificateTemplate,
  initialCertificateData,
  shortDate,
  type CertificateData,
  type CertificateTemplate,
} from "@/lib/certificates";
import { CertificateSheet, SHEET_H, SHEET_W } from "@/components/secretaria/CertificateSheet";
import type { MemberRow } from "@/components/admin/MembersManager";

interface CertificateRow {
  id: string;
  type: string;
  year: number;
  number: number;
  member_id: string | null;
  recipient_name: string;
  data: CertificateData;
  created_at: string;
}

type Editor = { id: string | null; number?: string; template: CertificateTemplate; memberId: string | null; data: CertificateData };

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const NO_MEMBER = "_none";

/** Prévia do certificado reduzida para caber na largura disponível. */
function ScaledPreview({ template, data, number }: { template: CertificateTemplate; data: CertificateData; number?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SHEET_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full rounded-md border shadow-sm overflow-hidden" style={{ height: SHEET_H * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: SHEET_W, height: SHEET_H }}>
        <CertificateSheet type={template.id} data={data} number={number} />
      </div>
    </div>
  );
}

export function CertificatesManager() {
  const [rows, setRows] = useState<CertificateRow[] | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const load = () =>
    api<CertificateRow[]>("/api/admin/certificates")
      .then(setRows)
      .catch((err) => toast({ title: "Erro ao carregar certificados", description: String(err.message ?? err), variant: "destructive" }));
  useEffect(() => {
    load();
    api<MemberRow[]>("/api/admin/members")
      .then((m) => setMembers(m.filter((x) => x.status === "ativo")))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter((r) => !q || r.recipient_name.toLowerCase().includes(q) || `${r.number}/${r.year}`.includes(q));
  }, [rows, search]);

  const openNew = (template: CertificateTemplate) => setEditor({ id: null, template, memberId: null, data: initialCertificateData(template) });
  const openEdit = (r: CertificateRow) => {
    const template = certificateTemplate(r.type);
    if (!template) return;
    setEditor({ id: r.id, number: `${r.number}/${r.year}`, template, memberId: r.member_id, data: { ...initialCertificateData(template), ...r.data } });
  };
  const setField = (k: string, v: string) => setEditor((e) => (e ? { ...e, data: { ...e.data, [k]: v } } : e));

  // Escolher um membro preenche nome, nascimento, bairro, cidade...
  const pickMember = (id: string) => {
    setEditor((e) => {
      if (!e) return e;
      const m = members.find((x) => x.id === id);
      if (!m) return { ...e, memberId: null };
      const data = { ...e.data };
      for (const f of e.template.fields) {
        if (!f.fromMember) continue;
        const v =
          f.fromMember === "name" ? m.name : f.fromMember === "birthDate" ? (m.birth_date ?? "").slice(0, 10) : (m[f.fromMember] ?? "");
        if (v) data[f.key] = v;
      }
      return { ...e, memberId: id, data };
    });
  };

  const save = async (print: boolean) => {
    if (!editor) return;
    const missing = editor.template.fields.find((f) => f.required && !(editor.data[f.key] ?? "").trim());
    if (missing) {
      toast({ title: `Preencha: ${missing.label}`, variant: "destructive" });
      return;
    }
    // abre a aba antes do await para o navegador não bloquear como pop-up
    const win = print ? window.open("about:blank", "_blank") : null;
    setSaving(true);
    try {
      const body = { type: editor.template.id, member_id: editor.memberId, data: editor.data };
      const saved = editor.id
        ? await api<CertificateRow>(`/api/admin/certificates/${editor.id}`, { method: "PATCH", json: body })
        : await api<CertificateRow>("/api/admin/certificates", { method: "POST", json: body });
      toast({ title: editor.id ? "Certificado atualizado" : `Certificado nº ${saved.number}/${saved.year} emitido` });
      if (win) win.location.href = `/admin/secretaria/certificados/${saved.id}`;
      setEditor(null);
      load();
    } catch (err) {
      win?.close();
      toast({ title: "Não foi possível salvar", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: CertificateRow) => {
    if (!confirm(`Excluir o certificado nº ${r.number}/${r.year} de ${r.recipient_name}? O número não volta a ser usado.`)) return;
    try {
      await api(`/api/admin/certificates/${r.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      toast({ title: "Não foi possível excluir", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  };

  if (editor) {
    const t = editor.template;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditor(null)}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <h2 className="font-semibold truncate">
            {t.name}
            {editor.number && <span className="text-muted-foreground font-normal"> · nº {editor.number}</span>}
          </h2>
        </div>
        <div className="grid lg:grid-cols-[minmax(280px,360px)_1fr] gap-4 items-start">
          <Card>
            <CardContent className="p-4 space-y-3">
              {members.length > 0 && (
                <div>
                  <Label>Membro (preenche os dados)</Label>
                  <Select value={editor.memberId ?? NO_MEMBER} onValueChange={(v) => (v === NO_MEMBER ? setEditor({ ...editor, memberId: null }) : pickMember(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_MEMBER}>— digitar os dados —</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {t.fields.map((f) => (
                <div key={f.key}>
                  <Label>
                    {f.label}
                    {f.required && " *"}
                  </Label>
                  {f.type === "gender" ? (
                    <Select value={editor.data[f.key] || "M"} onValueChange={(v) => setField(f.key, v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Sr. (masculino)</SelectItem>
                        <SelectItem value="F">Sra. (feminino)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : f.type === "uf" ? (
                    <Select value={editor.data[f.key] || undefined} onValueChange={(v) => setField(f.key, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={f.type === "date" ? "date" : "text"}
                      value={editor.data[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setField(f.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => save(true)} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  {editor.id ? "Salvar e imprimir" : "Emitir e imprimir / PDF"}
                </Button>
                <Button variant="outline" onClick={() => save(false)} disabled={saving}>
                  {editor.id ? "Salvar alterações" : "Só salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="min-w-0 space-y-2 lg:sticky lg:top-20">
            <ScaledPreview template={t} data={editor.data} number={editor.number} />
            <p className="text-xs text-muted-foreground">
              Prévia. O texto se ajusta ao tamanho dos nomes. Na impressão escolha papel A4, orientação paisagem e margens “nenhuma”.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Emitir novo certificado</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CERTIFICATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openNew(t)}
              className="group text-left rounded-lg border bg-card overflow-hidden hover:border-primary transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.background} alt="" className="w-full aspect-[297/210] object-cover" />
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{t.name}</span>
                <Plus className="w-4 h-4 text-primary shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Award className="w-4 h-4" /> Certificados emitidos {rows && <span className="text-muted-foreground font-normal">({rows.length})</span>}
        </h3>
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou número" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {!rows ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {rows.length === 0 ? "Nenhum certificado emitido ainda." : "Nenhum certificado encontrado."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="text-center shrink-0 w-14">
                  <div className="text-lg font-bold leading-none">{r.number}</div>
                  <div className="text-xs text-muted-foreground">{r.year}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{r.recipient_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {certificateTemplate(r.type)?.name ?? r.type}
                    {r.data.data && ` · ${shortDate(r.data.data)}`}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a href={`/admin/secretaria/certificados/${r.id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" aria-label="Imprimir / PDF" title="Imprimir / PDF">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Editar" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r)} aria-label="Excluir" title="Excluir" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
