"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/fetcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Play, Pause, Edit, Trash2, Radio, Music } from 'lucide-react';

interface MediaCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  thumbnail_url: string | null;
  category_id: string | null;
  duration: number | null;
  artist: string | null;
  is_published: boolean;
  is_radio: boolean;
  play_count: number;
  created_at: string;
  category?: MediaCategory | null;
}

export function MediaManager() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_url: '',
    thumbnail_url: '',
    category_id: '',
    duration: '',
    artist: '',
    is_published: false,
    is_radio: false
  });

  useEffect(() => {
    fetchMediaItems();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMediaItems = async () => {
    try {
      setMediaItems(await api<MediaItem[]>('/api/admin/media'));
    } catch (error) {
      console.error('Erro ao buscar mídias:', error);
      toast.error('Erro ao carregar mídias');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { categories } = await api<{ categories: MediaCategory[] }>('/api/media');
      setCategories(categories);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const mediaData = {
        title: formData.title,
        description: formData.description || null,
        media_url: formData.media_url,
        thumbnail_url: formData.thumbnail_url || null,
        category_id: formData.category_id || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        artist: formData.artist || null,
        is_published: formData.is_published,
        is_radio: formData.is_radio
      };

      if (editingItem) {
        await api(`/api/admin/media/${editingItem.id}`, { method: 'PATCH', json: mediaData });
      } else {
        await api('/api/admin/media', { method: 'POST', json: mediaData });
      }

      toast.success(editingItem ? 'Mídia atualizada!' : 'Mídia adicionada!');
      resetForm();
      fetchMediaItems();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar mídia:', error);
      toast.error('Erro ao salvar mídia');
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      await api(`/api/admin/media/${id}`, { method: 'PATCH', json: { is_published: !currentStatus } });

      toast.success(currentStatus ? 'Mídia despublicada!' : 'Mídia publicada!');
      fetchMediaItems();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da mídia');
    }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mídia?')) {
      return;
    }

    try {
      await api(`/api/admin/media/${id}`, { method: 'DELETE' });

      toast.success('Mídia excluída!');
      fetchMediaItems();
    } catch (error) {
      console.error('Erro ao excluir mídia:', error);
      toast.error('Erro ao excluir mídia');
    }
  };

  const startEdit = (item: MediaItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url || '',
      category_id: item.category_id || '',
      duration: item.duration?.toString() || '',
      artist: item.artist || '',
      is_published: item.is_published,
      is_radio: item.is_radio
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      media_url: '',
      thumbnail_url: '',
      category_id: '',
      duration: '',
      artist: '',
      is_published: false,
      is_radio: false
    });
    setEditingItem(null);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center py-8">Carregando mídias...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Mídias</h2>
          <p className="text-muted-foreground">Gerencie músicas, pregações e rádios</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Upload className="w-4 h-4 mr-2" />
              Adicionar Mídia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Mídia' : 'Adicionar Nova Mídia'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações da mídia abaixo.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist">Artista</Label>
                  <Input
                    id="artist"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media_url">URL da Mídia *</Label>
                <Input
                  id="media_url"
                  type="url"
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  placeholder="https://exemplo.com/audio.mp3"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail_url">URL da Capa</Label>
                <Input
                  id="thumbnail_url"
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://exemplo.com/capa.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (segundos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Publicado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_radio"
                    checked={formData.is_radio}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_radio: checked })}
                  />
                  <Label htmlFor="is_radio">É Rádio</Label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingItem ? 'Atualizar Mídia' : 'Adicionar Mídia'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Media List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Music className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma mídia encontrada. Adicione a primeira mídia!
              </p>
            </CardContent>
          </Card>
        ) : (
          mediaItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square bg-muted relative">
                {item.thumbnail_url ? (
                  <img 
                    src={item.thumbnail_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.is_radio ? (
                      <Radio className="w-12 h-12 text-muted-foreground" />
                    ) : (
                      <Music className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                  {item.artist && (
                    <p className="text-xs text-muted-foreground">{item.artist}</p>
                  )}
                  {item.category && (
                    <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                      {item.category.name}
                    </span>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatDuration(item.duration)}</span>
                    <span>{item.play_count} plays</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.is_published 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                    }`}>
                      {item.is_published ? 'Publicado' : 'Rascunho'}
                    </span>
                    {item.is_radio && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        Rádio
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePublished(item.id, item.is_published)}
                    >
                      {item.is_published ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMedia(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}