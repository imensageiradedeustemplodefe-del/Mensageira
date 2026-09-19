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

// Lists the photos of a Drive folder, one page at a time, through the server proxy (/api/gallery/drive).
// The Apps Script pageToken is a numeric offset, so page N starts at (N-1) * pageSize.
export const useGoogleDrivePhotos = (
  albumId?: string | null,
  pageSize: number = 24,
  order: "newest" | "oldest" | "name" = "newest",
  page: number = 1
) => {
  const [photos, setPhotos] = useState<DrivePhoto[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!albumId) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ album: albumId, pageSize: String(pageSize), order });
      const offset = (page - 1) * pageSize;
      if (offset > 0) params.set("pageToken", String(offset));
      const res = await fetch(`/api/gallery/drive?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar fotos do Google Drive");
      const data: DriveGalleryData = await res.json();
      setPhotos(data.items ?? []);
      setHasMore(!!data.nextPageToken);
    } catch (err) {
      console.error("Erro ao buscar fotos:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [albumId, pageSize, order, page]);

  useEffect(() => {
    setPhotos([]);
    setHasMore(false);
    if (albumId) fetchPhotos();
  }, [albumId, fetchPhotos]);

  return { photos, loading, error, hasMore, refetch: fetchPhotos };
};
