"use client";

import { useState, useEffect, useCallback } from "react";
import { useGoogleDrivePhotos as usePhotos, type DrivePhoto } from "@/hooks/useGoogleDrivePhotos";

export type { DrivePhoto };

export interface DriveAlbum {
  id: string;
  name: string;
  coverUrl?: string;
  photoCount?: number;
}

// Lists Drive albums through the server proxy. `enabled` mirrors the old `scriptUrl` argument:
// the request only runs when a non-empty value is passed.
export const useGoogleDriveAlbums = (enabled: string | null) => {
  const [albums, setAlbums] = useState<DriveAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/gallery/drive?action=albums", { cache: "no-store" });
      if (!res.ok) throw new Error("Erro ao buscar álbuns do Google Drive");
      const data = await res.json();
      if (data.configured === false) {
        setError("URL do script não configurada");
        setAlbums([]);
        return;
      }
      setAlbums(data.albums || []);
    } catch (err) {
      console.error("Erro ao buscar álbuns:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  return { albums, loading, error, refetch: fetchAlbums };
};

// Same signature as the original hook: (scriptUrl, albumId, pageSize, order). loadMore advances one page.
export const useGoogleDrivePhotos = (
  enabled: string | null,
  albumId?: string,
  pageSize: number = 24,
  order: "newest" | "oldest" | "name" = "newest"
) => {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [albumId]);
  const result = usePhotos(enabled ? albumId ?? null : null, pageSize, order, page);
  return { ...result, page, setPage, loadMore: () => result.hasMore && setPage((p) => p + 1) };
};
