"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/fetcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Cloud, Save, AlertCircle, ExternalLink, FolderOpen, Image, RefreshCw, Database } from 'lucide-react';
import { useGoogleDriveAlbums, useGoogleDrivePhotos } from '@/hooks/useGoogleDriveAlbums';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export function GoogleDriveManager() {
  const [scriptUrl, setScriptUrl] = useState('');
  const [folderId, setFolderId] = useState('');
  const [eventScriptUrl, setEventScriptUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const isAdmin = true;
  const [isSaved, setIsSaved] = useState(false);
  const [eventScriptSaved, setEventScriptSaved] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch albums and photos using existing hooks
  const { albums, loading: albumsLoading, error: albumsError, refetch: refetchAlbums } = useGoogleDriveAlbums(scriptUrl);
  const { photos, loading: photosLoading, error: photosError, hasMore, loadMore, refetch: refetchPhotos } = useGoogleDrivePhotos(scriptUrl, selectedAlbumId || undefined);

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const loadSettings = async () => {
    try {
      const data = await api<{ setting_key: string; setting_value: string | null }[]>('/api/admin/settings');

      const urlSetting = data?.find(s => s.setting_key === 'google_drive_script_url');
      const folderSetting = data?.find(s => s.setting_key === 'google_drive_folder_id');
      const eventUrlSetting = data?.find(s => s.setting_key === 'event_registration_script_url');

      if (urlSetting) setScriptUrl(urlSetting.setting_value || '');
      if (folderSetting) setFolderId(folderSetting.setting_value || '');
      if (eventUrlSetting) {
        setEventScriptUrl(eventUrlSetting.setting_value || '');
        if (eventUrlSetting.setting_value) setEventScriptSaved(true);
      }
      
      if (urlSetting && folderSetting) {
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    if (!scriptUrl.trim()) {
      toast.error('Informe a URL do Apps Script');
      return;
    }

    try {
      setLoading(true);

      await api('/api/admin/settings', {
        method: 'PUT',
        json: {
          settings: [
            { setting_key: 'google_drive_script_url', setting_value: scriptUrl },
            { setting_key: 'google_drive_folder_id', setting_value: folderId },
          ],
        },
      });

      setIsSaved(true);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const syncAlbums = async () => {
    try {
      setSyncing(true);
      toast.info('Iniciando sincronização de álbuns...');

      const data = await api<{ success: boolean; created?: number; updated?: number; error?: string }>('/api/admin/albums/sync', { method: 'POST' });

      if (data?.success) {
        toast.success(
          `Sincronização concluída! ${data.created || 0} novos álbuns, ${data.updated || 0} atualizados`
        );
        refetchAlbums();
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error(`Erro ao sincronizar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSyncing(false);
    }
  };

  const saveEventScriptSettings = async () => {
    if (!eventScriptUrl.trim()) {
      toast.error('Informe a URL do Apps Script para Inscrições');
      return;
    }

    try {
      setLoading(true);

      await api('/api/admin/settings', {
        method: 'PUT',
        json: { settings: [{ setting_key: 'event_registration_script_url', setting_value: eventScriptUrl }] },
      });

      setEventScriptSaved(true);
      toast.success('URL do Apps Script de Inscrições salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Integração com Google Drive
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-muted-foreground mb-6">
              Apenas administradores podem acessar a integração com Google Drive.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Configuração do Google Apps Script
          </CardTitle>
          <CardDescription>
            Configure a integração com Google Drive usando Apps Script
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Instruções de Configuração:</p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Acesse <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    Google Apps Script <ExternalLink className="w-3 h-3" />
                  </a></li>
                  <li>Crie um novo projeto e cole o código do script fornecido pelo ChatGPT</li>
                  <li>No código, altere o <code className="bg-background px-1 py-0.5 rounded">FOLDER_ID</code> para o ID da sua pasta principal do Drive</li>
                  <li>Ative os "Serviços Avançados" → Drive API (v2 ou v3)</li>
                  <li>Implante como "Web app" com acesso "Qualquer pessoa"</li>
                  <li>Copie a URL gerada e cole abaixo</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scriptUrl">URL do Apps Script *</Label>
              <Input
                id="scriptUrl"
                type="url"
                value={scriptUrl}
                onChange={(e) => {
                  setScriptUrl(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Cole a URL da web app do seu Apps Script
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="folderId">ID da Pasta Principal (opcional)</Label>
              <Input
                id="folderId"
                value={folderId}
                onChange={(e) => {
                  setFolderId(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="18nmGpvjaUX_9MyRP1YcZj7rg5yABVHBL"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Referência do FOLDER_ID configurado no script (para documentação)
              </p>
            </div>

            <Button
              onClick={saveSettings}
              disabled={loading || !scriptUrl.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isSaved ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Configuração Salva ✓
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>

          {isSaved && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✓ Configuração salva! A galeria agora está conectada ao seu Google Drive.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Organize suas fotos em subpastas no Drive e elas aparecerão como álbuns na galeria.
                </p>
              </div>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      Sincronizar Álbuns com Banco de Dados
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sincronize os álbuns do Google Drive para o banco de dados do Supabase. 
                      Isso permitirá que as notificações funcionem quando novos álbuns forem adicionados.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={syncAlbums}
                  disabled={syncing}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Sincronizar Álbuns Agora
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Albums and Photos Viewer */}
      {isSaved && scriptUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Álbuns e Fotos do Drive
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchAlbums();
                  if (selectedAlbumId) refetchPhotos();
                }}
                disabled={albumsLoading || photosLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${(albumsLoading || photosLoading) ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
            <CardDescription>
              Visualize os álbuns e fotos disponíveis no seu Google Drive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="albums" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="albums">Álbuns</TabsTrigger>
                <TabsTrigger value="photos">Fotos</TabsTrigger>
              </TabsList>

              <TabsContent value="albums" className="space-y-4 mt-4">
                {albumsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Carregando álbuns...</p>
                  </div>
                ) : albumsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                    <p className="text-sm text-destructive">{albumsError}</p>
                  </div>
                ) : albums.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Nenhum álbum encontrado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {albums.map((album) => (
                      <Card
                        key={album.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedAlbumId(album.id)}
                      >
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" />
                            {album.name}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="photos" className="space-y-4 mt-4">
                {!selectedAlbumId ? (
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Selecione um álbum para ver as fotos</p>
                  </div>
                ) : photosLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Carregando fotos...</p>
                  </div>
                ) : photosError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                    <p className="text-sm text-destructive">{photosError}</p>
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Nenhuma foto encontrada neste álbum</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAlbumId(null)}
                      >
                        ← Voltar aos álbuns
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={photo.thumbUrl}
                            alt={photo.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                    {hasMore && (
                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          onClick={loadMore}
                          disabled={photosLoading}
                        >
                          {photosLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Carregando...
                            </>
                          ) : (
                            'Carregar mais'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Event Registration Apps Script */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Inscrições de Eventos (Google Apps Script)
          </CardTitle>
          <CardDescription>
            Configure o Apps Script para sincronizar inscrições de eventos com planilhas do Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Como Configurar:</p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Acesse <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    Google Apps Script <ExternalLink className="w-3 h-3" />
                  </a></li>
                  <li>Crie um novo projeto e cole o código do arquivo <code className="bg-background px-1 py-0.5 rounded">google-apps-script/EventRegistrations.gs</code></li>
                  <li>Implante como "Web app" executando como "Eu" e acesso "Qualquer pessoa"</li>
                  <li>Copie a URL gerada e cole abaixo</li>
                  <li>As inscrições serão automaticamente sincronizadas em planilhas na pasta "Inscrições_Eventos"</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventScriptUrl">URL do Apps Script (Inscrições de Eventos) *</Label>
              <Input
                id="eventScriptUrl"
                type="url"
                value={eventScriptUrl}
                onChange={(e) => {
                  setEventScriptUrl(e.target.value);
                  setEventScriptSaved(false);
                }}
                placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Cole a URL da web app do seu Apps Script para gerenciar inscrições de eventos
              </p>
            </div>

            <Button
              onClick={saveEventScriptSettings}
              disabled={loading || !eventScriptUrl.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : eventScriptSaved ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Configuração Salva ✓
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar URL do Apps Script
                </>
              )}
            </Button>
          </div>

          {eventScriptSaved && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✓ URL configurada! As inscrições de eventos serão automaticamente sincronizadas com o Google Sheets.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Quando usuários se inscreverem em eventos, as informações serão enviadas para planilhas organizadas na pasta "Inscrições_Eventos".
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
