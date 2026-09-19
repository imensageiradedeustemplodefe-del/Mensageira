"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, MailOpen, Trash2, Clock, ChevronDown, ChevronUp, MessageCircle, Inbox } from "lucide-react";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function ContactMessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    try {
      setMessages(await api<ContactMessage[]>("/api/admin/contact-messages"));
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      toast({ title: "Erro", description: "Erro ao carregar mensagens de contato.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const setRead = async (id: string, isRead: boolean) => {
    try {
      await api(`/api/admin/contact-messages/${id}`, {
        method: "PATCH",
        json: { is_read: isRead, read_at: isRead ? new Date().toISOString() : null },
      });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: isRead, read_at: isRead ? new Date().toISOString() : null } : m)));
    } catch (error) {
      console.error("Erro ao atualizar mensagem:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a mensagem.", variant: "destructive" });
    }
  };

  const toggleExpand = (m: ContactMessage) => {
    const next = expanded === m.id ? null : m.id;
    setExpanded(next);
    if (next && !m.is_read) setRead(m.id, true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta mensagem? Esta ação não pode ser desfeita.")) return;
    try {
      await api(`/api/admin/contact-messages/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Mensagem excluída" });
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
      toast({ title: "Erro", description: "Não foi possível excluir a mensagem.", variant: "destructive" });
    }
  };

  // A mensagem aberta continua na aba "Não lidas" até ser recolhida, para não sumir na hora de ler
  const unread = messages.filter((m) => !m.is_read || m.id === expanded);
  const read = messages.filter((m) => m.is_read);

  const renderMessage = (m: ContactMessage) => {
    const isOpen = expanded === m.id;
    const whatsapp = m.phone ? onlyDigits(m.phone) : "";
    return (
      <Card key={m.id} className={`transition-all ${m.is_read ? "opacity-90" : "border-primary/40 shadow-sm"}`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div role="button" tabIndex={0} onClick={() => toggleExpand(m)} onKeyDown={(e) => e.key === "Enter" && toggleExpand(m)} className="flex-1 min-w-0 cursor-pointer">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {!m.is_read && <Badge className="bg-primary text-primary-foreground">Nova</Badge>}
                <span className="font-semibold text-foreground truncate">{m.subject}</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground/80">{m.name}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(m.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {!isOpen && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{m.message}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggleExpand(m)} aria-label={isOpen ? "Recolher" : "Expandir"}>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {isOpen && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/40 rounded-lg p-4">{m.message}</p>

              <div className="flex flex-wrap gap-2">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>
                  <Button size="sm" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    {m.email}
                  </Button>
                </a>
                {m.phone && (
                  <>
                    <a href={`tel:${m.phone}`}>
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        {m.phone}
                      </Button>
                    </a>
                    {whatsapp.length >= 10 && (
                      <a href={`https://wa.me/${whatsapp.startsWith("55") ? whatsapp : `55${whatsapp}`}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="text-green-700 border-green-600/40 hover:bg-green-50 dark:hover:bg-green-950/30">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                      </a>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button size="sm" variant="ghost" onClick={() => setRead(m.id, !m.is_read)}>
                  {m.is_read ? <Mail className="w-4 h-4 mr-2" /> : <MailOpen className="w-4 h-4 mr-2" />}
                  {m.is_read ? "Marcar como não lida" : "Marcar como lida"}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const empty = (text: string) => (
    <Card>
      <CardContent className="p-8 text-center text-muted-foreground">
        <Inbox className="w-10 h-10 mx-auto mb-3 opacity-60" />
        {text}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-muted-foreground">Carregando mensagens...</span>
      </div>
    );
  }

  return (
    <Tabs defaultValue="unread" className="space-y-4">
      <TabsList>
        <TabsTrigger value="unread">
          Não lidas {unread.length > 0 && <Badge className="ml-2 bg-primary text-primary-foreground">{unread.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="read">Lidas ({read.length})</TabsTrigger>
        <TabsTrigger value="all">Todas ({messages.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="unread" className="space-y-3">
        {unread.length ? unread.map(renderMessage) : empty("Nenhuma mensagem nova. Tudo em dia!")}
      </TabsContent>
      <TabsContent value="read" className="space-y-3">
        {read.length ? read.map(renderMessage) : empty("Nenhuma mensagem lida ainda.")}
      </TabsContent>
      <TabsContent value="all" className="space-y-3">
        {messages.length ? messages.map(renderMessage) : empty("Nenhuma mensagem recebida pelo formulário de contato.")}
      </TabsContent>
    </Tabs>
  );
}
