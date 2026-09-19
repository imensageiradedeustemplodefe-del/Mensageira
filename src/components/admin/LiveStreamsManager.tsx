"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Play, Square, Youtube, Facebook, Globe, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLiveStreams } from "@/hooks/useLiveStreams";
import { LiveStream, StreamPlatform } from "@/types/database";

const LiveStreamsManager = () => {
  const { streams, loading, createStream, updateStream, deleteStream, toggleLiveStatus } = useLiveStreams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'youtube' as StreamPlatform,
    stream_url: '',
    embed_url: '',
    is_active: true,
    chat_enabled: true,
    scheduled_at: '',
    thumbnail_url: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      platform: 'youtube' as StreamPlatform,
      stream_url: '',
      embed_url: '',
      is_active: true,
      chat_enabled: true,
      scheduled_at: '',
      thumbnail_url: ''
    });
    setEditingStream(null);
  };

  const handleEdit = (stream: LiveStream) => {
    setFormData({
      title: stream.title,
      description: stream.description || '',
      platform: stream.platform as StreamPlatform,
      stream_url: stream.stream_url,
      embed_url: stream.embed_url || '',
      is_active: stream.is_active,
      chat_enabled: stream.chat_enabled,
      scheduled_at: stream.scheduled_at ? new Date(stream.scheduled_at).toISOString().slice(0, -1) : '',
      thumbnail_url: stream.thumbnail_url || ''
    });
    setEditingStream(stream);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.stream_url.trim()) {
      return;
    }

    const streamData = {
      ...formData,
      scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null,
      embed_url: formData.embed_url || generateEmbedUrl(formData.platform, formData.stream_url),
    };

    let success;
    if (editingStream) {
      success = await updateStream(editingStream.id, streamData);
    } else {
      success = await createStream(streamData);
    }

    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transmissão?')) return;
    await deleteStream(id);
  };

  const handleToggleLive = async (stream: LiveStream) => {
    await toggleLiveStatus(stream.id, !stream.is_live);
  };

  const generateEmbedUrl = (platform: string, streamUrl: string): string => {
    switch (platform) {
      case 'youtube':
        const youtubeId = extractYouTubeId(streamUrl);
        return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : streamUrl;
      case 'facebook':
        const encodedUrl = encodeURIComponent(streamUrl);
        return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=734&t=0`;
      default:
        return streamUrl;
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'bg-red-100 text-red-800';
      case 'facebook': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transmissões ao Vivo</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Transmissão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingStream ? 'Editar Transmissão' : 'Nova Transmissão'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Culto de Domingo"
                  />
                </div>
                <div>
                  <Label htmlFor="platform">Plataforma *</Label>
                  <Select value={formData.platform} onValueChange={(value: StreamPlatform) => 
                    setFormData(prev => ({ ...prev, platform: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da transmissão..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="stream_url">URL da Transmissão *</Label>
                <Input
                  id="stream_url"
                  value={formData.stream_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, stream_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <Label htmlFor="embed_url">URL de Incorporação (opcional)</Label>
                <Input
                  id="embed_url"
                  value={formData.embed_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, embed_url: e.target.value }))}
                  placeholder="Gerada automaticamente se não preenchida"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_at">Data/Hora Agendada</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="thumbnail_url">URL da Miniatura</Label>
                  <Input
                    id="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Ativa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="chat_enabled"
                    checked={formData.chat_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_enabled: checked }))}
                  />
                  <Label htmlFor="chat_enabled">Chat Habilitado</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingStream ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {streams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Play className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma transmissão configurada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie sua primeira transmissão ao vivo para gerenciar conteúdo em múltiplas plataformas.
              </p>
            </CardContent>
          </Card>
        ) : (
          streams.map((stream) => (
            <Card key={stream.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{stream.title}</CardTitle>
                      <Badge 
                        variant={stream.is_live ? "destructive" : "secondary"}
                        className={stream.is_live ? "animate-pulse" : ""}
                      >
                        {stream.is_live ? "AO VIVO" : "OFFLINE"}
                      </Badge>
                      <Badge 
                        variant={stream.is_active ? "default" : "outline"}
                      >
                        {stream.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className={getPlatformColor(stream.platform)}>
                          {getPlatformIcon(stream.platform)}
                          <span className="ml-1 capitalize">{stream.platform}</span>
                        </Badge>
                      </div>
                      {stream.scheduled_at && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(stream.scheduled_at).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{stream.viewer_count} visualizações</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={stream.is_live ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleLive(stream)}
                    >
                      {stream.is_live ? (
                        <>
                          <Square className="w-4 h-4 mr-1" />
                          Parar
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Iniciar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(stream)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(stream.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {stream.description && (
                <CardContent>
                  <p className="text-muted-foreground">{stream.description}</p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground break-all">
                      <strong>URL:</strong> {stream.stream_url}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveStreamsManager;