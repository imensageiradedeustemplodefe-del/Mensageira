"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Calendar, Image as ImageIcon, FolderOpen, ArrowLeft, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoogleDrivePhotos } from "@/hooks/useGoogleDrivePhotos";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { api } from "@/lib/fetcher";
import type { GalleryAlbum } from "@/types/database";

const DATE_RE = /(\d{2})[.\-](\d{2})[.\-](\d{4})/;

// Extrai data do nome do álbum (formato: DD.MM.AAAA ou DD-MM-AAAA)
const extractDateFromAlbumName = (albumName: string): string => {
  const m = albumName.match(DATE_RE);
  return m ? `${m[1]}/${m[2]}/${m[3]}` : "";
};

const getDayOfWeek = (dateString: string): string => {
  if (!dateString) return "";
  const [day, month, year] = dateString.split("/");
  const date = new Date(`${year}-${month}-${day}T12:00:00`);
  const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return days[date.getDay()];
};

const extractCategoryFromAlbumName = (albumName: string): string => {
  const parts = albumName.split(/(\d{2}[.\-]\d{2}[.\-]\d{4})/);
  return parts[0]?.trim() || albumName;
};

const getCoverPhotoId = (coverUrl: string) => coverUrl.match(/[?&]id=([^&]+)/)?.[1] ?? coverUrl.match(/\/d\/([^=/]+)/)?.[1] ?? null;

export function GalleryPage() {
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedDriveFolderId, setSelectedDriveFolderId] = useState<string | null>(null);
  const [selectedAlbumName, setSelectedAlbumName] = useState("");
  const [selectedAlbumCoverUrl, setSelectedAlbumCoverUrl] = useState("");
  const [selectedAlbumDate, setSelectedAlbumDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: supabaseAlbums = [], isLoading: albumsLoading } = useQuery({
    queryKey: ["albums", "public"],
    queryFn: () => api<GalleryAlbum[]>("/api/albums"),
  });

  const albums = supabaseAlbums.map((album) => ({
    id: album.id,
    name: album.name,
    coverUrl: album.cover_photo_url || "",
    photoCount: album.photos?.length || 0,
    driveFolderId: album.drive_folder_id || null,
  }));

  const { photos, loading: photosLoading, hasMore, loadMore } = useGoogleDrivePhotos(selectedDriveFolderId, 20, "name");

  const filteredAlbums = albums
    .filter((album) => album.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const dateA = a.name.match(DATE_RE);
      const dateB = b.name.match(DATE_RE);
      if (dateA && dateB) {
        const timeA = new Date(`${dateA[3]}-${dateA[2]}-${dateA[1]}`).getTime();
        const timeB = new Date(`${dateB[3]}-${dateB[2]}-${dateB[1]}`).getTime();
        return timeB - timeA;
      }
      if (dateA) return -1;
      if (dateB) return 1;
      return a.name.localeCompare(b.name);
    });

  const loading = albumsLoading || photosLoading;

  const handleAlbumClick = (albumId: string, albumName: string, coverUrl?: string, driveFolderId?: string | null) => {
    setSelectedAlbum(albumId);
    setSelectedDriveFolderId(driveFolderId || null);
    setSelectedAlbumName(albumName);
    setSelectedAlbumCoverUrl(coverUrl || "");
    setSelectedAlbumDate(extractDateFromAlbumName(albumName));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setSelectedDriveFolderId(null);
    setSelectedAlbumName("");
    setSelectedAlbumCoverUrl("");
    setSelectedAlbumDate("");
  };

  const coverPhotoId = selectedAlbumCoverUrl ? getCoverPhotoId(selectedAlbumCoverUrl) : null;
  const filteredPhotos = coverPhotoId ? photos.filter((photo) => coverPhotoId !== photo.id) : photos;

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (albumsLoading && albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 animate-fade-in">
        <Camera className="w-16 h-16 text-primary animate-pulse" />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">Carregando momentos especiais...</p>
        <p className="text-sm text-muted-foreground">Preparando as memórias da nossa comunidade</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <Camera className="w-12 h-12 text-primary mx-auto mb-6" />
            {selectedAlbum ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                  {extractCategoryFromAlbumName(selectedAlbumName)}
                  {selectedAlbumDate ? ` - ${getDayOfWeek(selectedAlbumDate)} - ${selectedAlbumDate}` : ""}
                </h1>
                <p className="text-xl md:text-2xl font-semibold text-primary mb-4">{selectedAlbumName}</p>
                <p className="text-base md:text-lg text-muted-foreground mb-8">Explore as fotos deste momento especial</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Galeria de Fotos</h1>
                <p className="text-base md:text-lg text-muted-foreground mb-8">Momentos especiais da nossa comunidade</p>
              </>
            )}
            {!selectedAlbum && (
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar por álbum..."
                  className="pl-10 bg-background/50 backdrop-blur"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {selectedAlbum && (
          <Button onClick={handleBackToAlbums} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Álbuns
          </Button>
        )}

        {!selectedAlbum && !albumsLoading && filteredAlbums.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum álbum encontrado</p>
          </div>
        )}

        {!selectedAlbum && filteredAlbums.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <FolderOpen className="w-8 h-8 text-primary" />
              Álbuns
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlbums.map((album) => (
                <Card
                  key={album.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
                  onClick={() => handleAlbumClick(album.id, album.name, album.coverUrl, album.driveFolderId)}
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    {album.coverUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={album.coverUrl}
                          alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderOpen className="w-16 h-16 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 leading-tight min-h-[3.5rem]">
                      {album.name.split(/(\d{2}[.\-]\d{2}[.\-]\d{4})/).map((part, idx) => (
                        <span key={idx} className={idx === 1 ? "block text-base font-normal text-muted-foreground mt-1" : ""}>
                          {part.trim()}
                        </span>
                      ))}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ImageIcon className="w-4 h-4" />
                      <span>{album.photoCount ? `${Math.max(0, album.photoCount - 1)} fotos` : "Ver fotos"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedAlbum && filteredPhotos.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredPhotos.map((photo, index) => (
                <Card
                  key={photo.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  onClick={() => handlePhotoClick(index)}
                >
                  <div className="relative h-64 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm truncate">{photo.name.replace(/\.(jpg|jpeg|png|gif|webp)$/i, "")}</h3>
                    {selectedAlbumDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Calendar className="w-3 h-3" />
                        {selectedAlbumDate}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <Button onClick={loadMore} disabled={loading} variant="outline">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Carregando mais momentos...
                    </>
                  ) : (
                    "Carregar mais fotos"
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {selectedAlbum && photosLoading && filteredPhotos.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-lg font-medium text-foreground mb-2">Carregando fotos...</p>
          </div>
        )}

        {selectedAlbum && filteredPhotos.length === 0 && !loading && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma foto encontrada neste álbum.</p>
          </div>
        )}

        {!selectedAlbum && albums.length > 0 && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold mb-1">{albums.length}</div>
                <div className="text-sm text-muted-foreground">Álbuns</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold mb-1">∞</div>
                <div className="text-sm text-muted-foreground">Fotos no Drive</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold mb-1">
                  {filteredAlbums.length > 0
                    ? extractDateFromAlbumName(filteredAlbums[0].name) ||
                      new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
                    : "-"}
                </div>
                <div className="text-sm text-muted-foreground">Última atualização</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {filteredPhotos.length > 0 && selectedAlbum && (
        <PhotoLightbox
          photos={filteredPhotos}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          albumDate={selectedAlbumDate}
        />
      )}
    </div>
  );
}
