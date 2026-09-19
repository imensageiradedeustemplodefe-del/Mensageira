"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Calendar, Image as ImageIcon, FolderOpen, ArrowLeft, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoogleDrivePhotos } from "@/hooks/useGoogleDrivePhotos";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { api } from "@/lib/fetcher";
import type { GalleryAlbum } from "@/types/database";

const DATE_RE = /(\d{2})[.\-](\d{2})[.\-](\d{4})/;
const PAGE_SIZE = 20;

// Miniaturas mais nítidas: o Apps Script devolve sz=w400; pedimos 800px para telas retina
const hiResThumb = (url: string) => url.replace(/([?&]sz=)w\d+/, "$1w800");

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

const getCoverPhotoId = (coverUrl: string) =>
  coverUrl.match(/[?&]id=([^&]+)/)?.[1] ?? coverUrl.match(/\/d\/([^=/]+)/)?.[1] ?? null;

interface SelectedAlbum {
  id: string;
  name: string;
  coverUrl: string;
  driveFolderId: string | null;
  date: string;
  photoCount: number | null;
}

/** Builds the list of page numbers to display: 1 … (current±2) … last */
const pageRange = (current: number, total: number): (number | "…")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
};

export function GalleryPage({ initialAlbums }: { initialAlbums?: GalleryAlbum[] }) {
  const [selected, setSelected] = useState<SelectedAlbum | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: albumRows = [], isLoading: albumsLoading } = useQuery({
    queryKey: ["albums", "public"],
    queryFn: () => api<GalleryAlbum[]>("/api/albums"),
    initialData: initialAlbums,
    staleTime: 60 * 1000,
  });

  const albums = albumRows.map((album) => ({
    id: album.id,
    name: album.name,
    coverUrl: album.cover_photo_url || "",
    photoCount: album.photo_count ?? (album.photos?.length || null),
    driveFolderId: album.drive_folder_id || null,
  }));

  // A capa (CAPA_001) é o primeiro arquivo por nome; pulamos esse item para que cada página tenha PAGE_SIZE fotos de verdade
  const selectedCoverId = selected?.coverUrl ? getCoverPhotoId(selected.coverUrl) : null;
  const { photos, loading: photosLoading, hasMore } = useGoogleDrivePhotos(selected?.driveFolderId, PAGE_SIZE, "name", page, selectedCoverId ? 1 : 0);

  const filteredAlbums = useMemo(
    () =>
      albums
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
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [albumRows, searchQuery]
  );

  // Ao trocar de página, volta ao topo da grade de fotos
  useEffect(() => {
    if (selected) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, selected]);

  const handleAlbumClick = (album: (typeof albums)[number]) => {
    setSelected({
      id: album.id,
      name: album.name,
      coverUrl: album.coverUrl,
      driveFolderId: album.driveFolderId,
      date: extractDateFromAlbumName(album.name),
      photoCount: album.photoCount,
    });
    setPage(1);
  };

  const handleBackToAlbums = () => {
    setSelected(null);
    setPage(1);
  };

  const coverPhotoId = selectedCoverId;
  const filteredPhotos = coverPhotoId ? photos.filter((photo) => coverPhotoId !== photo.id) : photos;

  // Total de páginas: usa a contagem do Drive quando conhecida (descontando a capa)
  const totalPages = selected?.photoCount
    ? Math.max(1, Math.ceil(Math.max(0, selected.photoCount - (coverPhotoId ? 1 : 0)) / PAGE_SIZE))
    : hasMore
      ? page + 1
      : page;

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
  };

  const pagination = selected && totalPages > 1 ? (
          <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Paginação de fotos">
            <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1 || photosLoading}>
              <ChevronLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            {pageRange(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-2 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="min-w-[44px]"
                  onClick={() => goToPage(p)}
                  disabled={photosLoading}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </Button>
              )
            )}
            <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages || photosLoading}>
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight className="w-4 h-4 sm:ml-1" />
            </Button>
            {photosLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin text-primary" />}
          </nav>
  ) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Camera className="w-12 h-12 text-primary mx-auto mb-6" />
            {selected ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                  {extractCategoryFromAlbumName(selected.name)}
                  {selected.date ? ` - ${getDayOfWeek(selected.date)} - ${selected.date}` : ""}
                </h1>
                <p className="text-xl md:text-2xl font-semibold text-primary mb-4">{selected.name}</p>
                <p className="text-base md:text-lg text-muted-foreground">
                  {selected.photoCount ? `${Math.max(0, selected.photoCount - 1)} fotos` : "Explore as fotos deste momento especial"}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Galeria de Fotos</h1>
                <p className="text-base md:text-lg text-muted-foreground mb-8">Momentos especiais da nossa comunidade</p>
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
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {selected && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Button onClick={handleBackToAlbums} variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Álbuns
            </Button>
            {totalPages > 1 && (
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
            )}
          </div>
        )}

        {selected && totalPages > 1 && <div className="mb-6">{pagination}</div>}

        {/* ---------- Lista de álbuns ---------- */}
        {!selected && albumsLoading && albums.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-muted animate-pulse" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!selected && !albumsLoading && filteredAlbums.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum álbum encontrado</p>
          </div>
        )}

        {!selected && filteredAlbums.length > 0 && (
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
                  onClick={() => handleAlbumClick(album)}
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

        {/* ---------- Fotos do álbum ---------- */}
        {selected && photosLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 md:h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {selected && !photosLoading && filteredPhotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {filteredPhotos.map((photo, index) => (
              <Card
                key={photo.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                onClick={() => handlePhotoClick(index)}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hiResThumb(photo.thumbUrl)}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">{photo.name.replace(/\.(jpg|jpeg|png|gif|webp)$/i, "")}</h3>
                  {selected.date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      {selected.date}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selected && !photosLoading && filteredPhotos.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma foto encontrada neste álbum.</p>
          </div>
        )}

        {selected && totalPages > 1 && <div className="mt-4">{pagination}</div>}

        {!selected && albums.length > 0 && (
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
                <div className="text-3xl font-bold mb-1">
                  {albums.some((a) => a.photoCount)
                    ? albums.reduce((sum, a) => sum + Math.max(0, (a.photoCount ?? 0) - 1), 0).toLocaleString("pt-BR")
                    : "∞"}
                </div>
                <div className="text-sm text-muted-foreground">Fotos</div>
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

      {filteredPhotos.length > 0 && selected && (
        <PhotoLightbox
          photos={filteredPhotos}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          albumDate={selected.date}
        />
      )}
    </div>
  );
}
