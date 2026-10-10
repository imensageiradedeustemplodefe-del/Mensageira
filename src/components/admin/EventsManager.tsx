"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar, Edit, Trash2, Plus, MapPin, Clock, Settings } from 'lucide-react';
import { api } from '@/lib/fetcher';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventRegistrationManager } from './EventRegistrationManager';
import { GenerateYearEvents } from './GenerateYearEvents';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date?: string | null;
  location?: string | null;
  category: string;
  is_published: boolean;
  registration_required: boolean;
  max_participants?: number | null;
  contribution_cents?: number | null;
  contribution_note?: string | null;
  image_url?: string | null;
  created_at: string;
}

interface EventTemplate {
  id: string;
  name: string;
  title: string;
  category: string;
  description: string | null;
  location: string | null;
  is_default: boolean;
}

// Modelos padrões de eventos - removidos pois agora são carregados do banco de dados

export default function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<"upcoming" | "past" | "all">("upcoming");
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [managingEventId, setManagingEventId] = useState<string | null>(null);
  const [managingEventTitle, setManagingEventTitle] = useState<string>('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    location: '',
    category: 'geral',
    is_published: false,
    registration_required: false,
    image_url: '',
    max_participants: '',
    contribution: '',
    contribution_note: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await api<Event[]>('/api/admin/events');
      setEvents([...data].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: "Erro ao Carregar",
        description: "Não foi possível carregar os eventos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setTemplates(await api<EventTemplate[]>('/api/admin/templates'));
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      end_date: '',
      location: '',
      category: 'geral',
      is_published: false,
      registration_required: false,
      image_url: '',
      max_participants: '',
      contribution: '',
      contribution_note: ''
    });
    setEditingEvent(null);
    setSelectedTemplate('');
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        category: template.category,
        description: template.description || '',
        location: template.location || ''
      }));
      setSelectedTemplate(templateId);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    // Convert to local timezone for datetime-local input
    const eventDate = new Date(event.event_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;
    
    // Adjust for timezone offset to maintain the same local time
    const localEventDate = new Date(eventDate.getTime() - (eventDate.getTimezoneOffset() * 60000));
    const localEndDate = endDate ? new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)) : null;
    
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: localEventDate.toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm format for datetime-local
      end_date: localEndDate ? localEndDate.toISOString().slice(0, 16) : '',
      location: event.location || '',
      category: event.category,
      is_published: event.is_published,
      registration_required: event.registration_required,
      image_url: event.image_url || '',
      max_participants: event.max_participants ? String(event.max_participants) : '',
      contribution: event.contribution_cents ? (event.contribution_cents / 100).toFixed(2).replace('.', ',') : '',
      contribution_note: event.contribution_note || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert datetime-local to ISO string maintaining local timezone
    if (!formData.event_date) return;
    const eventDate = new Date(formData.event_date).toISOString();
    const endDate = formData.end_date ? new Date(formData.end_date).toISOString() : null;
    
    const eventData = {
      title: formData.title,
      description: formData.description || null,
      event_date: eventDate,
      end_date: endDate,
      location: formData.location || null,
      category: formData.category,
      is_published: formData.is_published,
      registration_required: formData.registration_required,
      image_url: formData.image_url || null,
      max_participants: formData.max_participants ? Math.max(1, parseInt(formData.max_participants, 10)) || null : null,
      // "10", "10,00" ou "10.50" -> centavos
      contribution_cents: formData.contribution.trim()
        ? Math.round(parseFloat(formData.contribution.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')) * 100) || null
        : null,
      contribution_note: formData.contribution_note.trim() || null
    };

    try {
      if (editingEvent) {
        await api(`/api/admin/events/${editingEvent.id}`, { method: 'PATCH', json: eventData });

        toast({
          title: "Evento Atualizado",
          description: "O evento foi atualizado com sucesso.",
        });
      } else {
        await api('/api/admin/events', { method: 'POST', json: eventData });

        toast({
          title: "Evento Criado",
          description: "O evento foi criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Houve um problema ao salvar o evento.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await api(`/api/admin/events/${eventId}`, { method: 'DELETE' });

      toast({
        title: "Evento Excluído",
        description: "O evento foi excluído com sucesso.",
      });

      fetchEvents();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast({
        title: "Erro ao Excluir",
        description: "Houve um problema ao excluir o evento.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'culto': 'bg-blue-100 text-blue-800',
      'batismo': 'bg-cyan-100 text-cyan-800',
      'jovens': 'bg-pink-100 text-pink-800',
      'ceia': 'bg-indigo-100 text-indigo-800',
      'campanha': 'bg-yellow-100 text-yellow-800',
      'retiro': 'bg-orange-100 text-orange-800',
      'conferencia': 'bg-purple-100 text-purple-800',
      'evangelismo': 'bg-red-100 text-red-800',
      'lavacar': 'bg-green-100 text-green-800',
      'geral': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['geral'];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-muted-foreground">Carregando eventos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nowMs = Date.now() - 6 * 3600 * 1000; // até 6h depois do início ainda conta como "próximo"
  const upcomingCount = events.filter((e) => new Date(e.event_date).getTime() >= nowMs).length;
  const visibleEvents = events
    .filter((e) => {
      const t = new Date(e.event_date).getTime();
      if (view === "upcoming" && t < nowMs) return false;
      if (view === "past" && t >= nowMs) return false;
      const q = search.trim().toLowerCase();
      return !q || e.title.toLowerCase().includes(q) || (e.location ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const d = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      return view === "upcoming" ? d : -d;
    });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Gerenciar Eventos
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <GenerateYearEvents onDone={fetchEvents} />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingEvent && (
                <div className="space-y-2">
                  <Label htmlFor="template">Modelo Padrão</Label>
                  <Select value={selectedTemplate} onValueChange={applyTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um modelo ou crie do zero" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Título do evento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="culto">Culto</SelectItem>
                      <SelectItem value="batismo">Batismo</SelectItem>
                      <SelectItem value="jovens">Jovens</SelectItem>
                      <SelectItem value="ceia">Ceia</SelectItem>
                      <SelectItem value="campanha">Campanha</SelectItem>
                      <SelectItem value="retiro">Retiro</SelectItem>
                      <SelectItem value="conferencia">Conferência</SelectItem>
                      <SelectItem value="evangelismo">Evangelismo</SelectItem>
                      <SelectItem value="lavacar">Lava Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Descrição do evento..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Data/Hora Início *</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data/Hora Fim</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Local do evento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="registration_required"
                    checked={formData.registration_required}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, registration_required: checked as boolean})
                    }
                  />
                  <Label htmlFor="registration_required">Inscrição Obrigatória</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, is_published: checked as boolean})
                    }
                  />
                  <Label htmlFor="is_published">Publicado</Label>
                </div>
              </div>

              {formData.registration_required && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <p className="text-sm font-semibold">Inscrição</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_participants">Máximo de participantes (opcional)</Label>
                      <Input
                        id="max_participants"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                        placeholder="Sem limite"
                      />
                      <p className="text-xs text-muted-foreground">Quando lotar, o site fecha as inscrições sozinho.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contribution">Contribuição em R$ (opcional)</Label>
                      <Input
                        id="contribution"
                        inputMode="decimal"
                        value={formData.contribution}
                        onChange={(e) => setFormData({...formData, contribution: e.target.value})}
                        placeholder="Ex.: 10,00"
                      />
                      <p className="text-xs text-muted-foreground">Mostra o QR Code do PIX depois da inscrição.</p>
                    </div>
                  </div>
                  {formData.contribution.trim() && (
                    <div className="space-y-2">
                      <Label htmlFor="contribution_note">Descrição da contribuição (opcional)</Label>
                      <Input
                        id="contribution_note"
                        value={formData.contribution_note}
                        onChange={(e) => setFormData({...formData, contribution_note: e.target.value})}
                        placeholder="Ex.: para o lanche e a decoração"
                      />
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEvent ? 'Atualizar' : 'Criar'} Evento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {events.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="inline-flex rounded-lg border p-1 bg-muted/40 self-start">
              {([
                ["upcoming", `Próximos (${upcomingCount})`],
                ["past", "Anteriores"],
                ["all", "Todos"],
              ] as const).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${view === v ? "bg-background shadow font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar evento…"
              className="sm:max-w-xs"
            />
          </div>
        )}

        {events.length > 0 && visibleEvents.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum evento {view === "past" ? "anterior" : view === "upcoming" ? "próximo" : ""} encontrado{search ? ` para “${search}”` : ""}.</p>
        )}

        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-muted-foreground">
              Crie seu primeiro evento para começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground break-words min-w-0">{event.title}</h3>
                        <Badge className={getCategoryColor(event.category)}>
                          {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                        </Badge>
                        {event.registration_required && (
                          <Badge variant="outline" className="text-primary border-primary">Com inscrição</Badge>
                        )}
                        {event.is_published ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Rascunho
                          </Badge>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {event.registration_required && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setManagingEventId(event.id);
                            setManagingEventTitle(event.title);
                          }}
                          title="Gerenciar Formulário de Inscrição"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o evento "{event.title}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(event.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog para gerenciar formulário de inscrição */}
      <Dialog open={!!managingEventId} onOpenChange={(open) => !open && setManagingEventId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Formulário de Inscrição</DialogTitle>
          </DialogHeader>
          {managingEventId && (
            <EventRegistrationManager eventId={managingEventId} eventTitle={managingEventTitle} maxParticipants={events.find((e) => e.id === managingEventId)?.max_participants} contributionCents={events.find((e) => e.id === managingEventId)?.contribution_cents} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}