"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/fetcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomNotification {
  id: string;
  title: string;
  message: string;
  icon: string | null;
  url: string | null;
  is_active: boolean;
  created_at: string;
}

export const CustomNotificationsManager = () => {
  const [notifications, setNotifications] = useState<CustomNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    icon: '📢',
    url: '/',
  });

  useEffect(() => {
    fetchNotifications();
  }, []);


  const fetchNotifications = async () => {
    try {
      setNotifications(await api<CustomNotification[]>('/api/admin/custom-notifications'));
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }

    setSubmitting(true);

    try {
      await api('/api/admin/custom-notifications', {
        method: 'POST',
        json: {
          title: formData.title.trim(),
          message: formData.message.trim(),
          icon: formData.icon,
          url: formData.url,
          is_active: true,
        },
      });

      toast.success('Notificação criada com sucesso!');
      setFormData({
        title: '',
        message: '',
        icon: '📢',
        url: '/',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      toast.error('Erro ao criar notificação');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      await api(`/api/admin/custom-notifications/${id}`, { method: 'PATCH', json: { is_active: !currentState } });

      toast.success(
        !currentState ? 'Notificação ativada' : 'Notificação desativada'
      );
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      toast.error('Erro ao atualizar notificação');
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Deseja excluir esta notificação?')) return;

    try {
      await api(`/api/admin/custom-notifications/${id}`, { method: 'DELETE' });

      toast.success('Notificação excluída');
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      toast.error('Erro ao excluir notificação');
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Notificação Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Nova atualização disponível"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon: value })
                  }
                >
                  <SelectTrigger id="icon">
                    <SelectValue placeholder="Selecione um ícone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="📢">📢 Megafone</SelectItem>
                    <SelectItem value="🔔">🔔 Sino</SelectItem>
                    <SelectItem value="⭐">⭐ Estrela</SelectItem>
                    <SelectItem value="🎉">🎉 Celebração</SelectItem>
                    <SelectItem value="📅">📅 Calendário</SelectItem>
                    <SelectItem value="🎵">🎵 Música</SelectItem>
                    <SelectItem value="📖">📖 Livro</SelectItem>
                    <SelectItem value="🙏">🙏 Oração</SelectItem>
                    <SelectItem value="✨">✨ Brilho</SelectItem>
                    <SelectItem value="💡">💡 Ideia</SelectItem>
                    <SelectItem value="❤️">❤️ Coração</SelectItem>
                    <SelectItem value="🎯">🎯 Alvo</SelectItem>
                    <SelectItem value="📣">📣 Alto-falante</SelectItem>
                    <SelectItem value="🌟">🌟 Destaque</SelectItem>
                    <SelectItem value="🔥">🔥 Fogo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Digite a mensagem da notificação..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Link de Destino</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="/eventos"
              />
              <p className="text-sm text-muted-foreground">
                Página para onde o usuário será direcionado ao clicar na notificação
              </p>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Notificação
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações Criadas</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma notificação criada ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="text-2xl">
                      {notification.icon}
                    </TableCell>
                    <TableCell className="font-medium">
                      {notification.title}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {notification.message}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {notification.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={notification.is_active}
                          onCheckedChange={() =>
                            toggleActive(notification.id, notification.is_active)
                          }
                        />
                        {notification.is_active ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
