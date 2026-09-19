"use client";

import { useState, useEffect, useCallback } from "react";

export interface DrivePhoto {
  id: string;
  name: string;
  createdTime: string;
  mimeType: string;
  thumbUrl: string;
  viewUrl: string;
}

interface DriveGalleryData {
  configured: boolean;
  nextPageToken: string | null;
  items: DrivePhoto[];
}

// Lists photos of a Drive folder through the server-side proxy (/api/gallery/drive).
export const useGoogleDrivePhotos = (
  albumId?: string | null,
  pageSize: number = 24,
  order: "newest" | "oldest" | "name" = "newest"
) => {
  const [photos, setPhotos] = useState<DrivePhoto[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(
    async (pageToken?: string) => {
      if (!albumId) return;
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ album: albumId, pageSize: String(pageSize), order });
        if (pageToken) params.set("pageToken", pageToken);
        const res = await fetch(`/api/gallery/drive?${params}`);
        if (!res.ok) throw new Error("Erro ao buscar fotos do Google Drive");
        const data: DriveGalleryData = await res.json();
        setPhotos((prev) => (pageToken ? [...prev, ...(data.items ?? [])] : data.items ?? []));
        setNextPageToken(data.nextPageToken ?? null);
      } catch (err) {
        console.error("Erro ao buscar fotos:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    },
    [albumId, pageSize, order]
  );

  useEffect(() => {
    setPhotos([]);
    setNextPageToken(null);
    if (albumId) fetchPhotos();
  }, [albumId, fetchPhotos]);

  const loadMore = () => {
    if (nextPageToken && !loading) fetchPhotos(nextPageToken);
  };

  return { photos, loading, error, hasMore: !!nextPageToken, loadMore, refetch: () => fetchPhotos() };
};
