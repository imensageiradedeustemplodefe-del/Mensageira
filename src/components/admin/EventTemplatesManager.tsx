"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Copy, Edit, Trash2, Plus, Bookmark } from 'lucide-react';
import { api } from '@/lib/fetcher';
import { useToast } from '@/hooks/use-toast';

interface EventTemplate {
  id: string;
  name: string;
  title: string;
  category: string;
  description: string | null;
  location: string | null;
  is_default: boolean;
  created_at: string;
}

export default function EventTemplatesManager() {
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    category: 'geral',
    description: '',
    location: ''
  });

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    try {
      setTemplates(await api<EventTemplate[]>('/api/admin/templates'));
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      toast({
        title: "Erro ao Carregar",
        description: "Não foi possível carregar os modelos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      category: 'geral',
      description: '',
      location: ''
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: EventTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      title: template.title,
      category: template.category,
      description: template.description || '',
      location: template.location || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const templateData = {
      name: formData.name,
      title: formData.title,
      category: formData.category,
      description: formData.description || null,
      location: formData.location || null,
      is_default: false
    };

    try {
      if (editingTemplate) {
        await api(`/api/admin/templates/${editingTemplate.id}`, { method: 'PATCH', json: templateData });

        toast({
          title: "Modelo Atualizado",
          description: "O modelo foi atualizado com sucesso.",
        });
      } else {
        await api('/api/admin/templates', { method: 'POST', json: templateData });

        toast({
          title: "Modelo Criado",
          description: "O modelo foi criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Houve um problema ao salvar o modelo.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (templateId: string, isDefault: boolean) => {
    if (isDefault) {
      toast({
        title: "Não é possível excluir",
        description: "Modelos padrões não podem ser excluídos.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api(`/api/admin/templates/${templateId}`, { method: 'DELETE' });

      toast({
        title: "Modelo Excluído",
        description: "O modelo foi excluído com sucesso.",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Erro ao excluir modelo:', error);
      toast({
        title: "Erro ao Excluir",
        description: "Houve um problema ao excluir o modelo.",
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
            <span className="text-muted-foreground">Carregando modelos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Copy className="w-5 h-5 mr-2" />
          Modelos de Eventos
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Modelo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Modelo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Ex: Culto de Domingo"
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
                <Label htmlFor="title">Título do Evento *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="Título que aparecerá no evento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Descrição padrão do evento..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Local padrão do evento"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Atualizar' : 'Criar'} Modelo
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8">
            <Copy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum modelo encontrado
            </h3>
            <p className="text-muted-foreground">
              Crie seu primeiro modelo para facilitar a criação de eventos.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                        </Badge>
                        {template.is_default && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            <Bookmark className="w-3 h-3 mr-1" />
                            Padrão
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium text-foreground mb-1">{template.title}</p>
                      
                      {template.description && (
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      {template.location && (
                        <p className="text-xs text-muted-foreground">
                          📍 {template.location}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={template.is_default}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o modelo "{template.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(template.id, template.is_default)}
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
    </Card>
  );
}