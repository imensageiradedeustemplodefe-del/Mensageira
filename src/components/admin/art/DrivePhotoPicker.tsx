"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FolderOpen, Images, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/fetcher";
import { useGoogleDriveAlbums, useGoogleDrivePhotos } from "@/hooks/useGoogleDriveAlbums";

/** Escolher uma foto dos álbuns da galeria (Google Drive) como fundo da arte. */
export function DrivePhotoPicker({ onPick }: { onPick: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [album, setAlbum] = useState<{ id: string; name: string } | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const { albums, loading: albumsLoading, error } = useGoogleDriveAlbums(open ? "on" : "");
  const { photos, loading, hasMore, loadMore } = useGoogleDrivePhotos(open ? "on" : "", album?.id);

  const pick = async (id: string) => {
    setImporting(id);
    try {
      const { url } = await api<{ url: string }>("/api/admin/images/drive", { method: "POST", json: { id } });
      onPick(url);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível usar esta foto");
    } finally {
      setImporting(null);
    }
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Images className="w-4 h-4" /> Da galeria
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {album && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setAlbum(null)} aria-label="Voltar aos álbuns">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              {album ? album.name : "Escolher foto da galeria"}
            </DialogTitle>
            <DialogDescription>{album ? "Toque na foto para usar como fundo." : "Escolha um álbum."}</DialogDescription>
          </DialogHeader>
          {!album ? (
            albumsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <p className="text-sm text-destructive py-6 text-center">{error}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {albums.map((a) => (
                  <button key={a.id} type="button" onClick={() => setAlbum({ id: a.id, name: a.name })} className="text-left rounded-lg border overflow-hidden hover:border-primary block min-h-0">
                    {a.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.coverUrl} alt="" className="w-full aspect-[4/3] object-cover" loading="lazy" />
                    ) : (
                      <span className="flex w-full aspect-[4/3] items-center justify-center bg-muted">
                        <FolderOpen className="w-6 h-6 text-muted-foreground" />
                      </span>
                    )}
                    <span className="block p-2 text-xs font-medium line-clamp-2">{a.name}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((p) => (
                  <button key={p.id} type="button" onClick={() => pick(p.id)} disabled={!!importing} className="relative rounded overflow-hidden aspect-square bg-muted hover:ring-2 hover:ring-primary min-h-0 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    {importing === p.id && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
              {hasMore && !loading && (
                <Button type="button" variant="outline" className="w-full" onClick={loadMore}>
                  Carregar mais fotos
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
