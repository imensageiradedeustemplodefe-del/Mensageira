"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/fetcher";
import type { LiveStream, LiveStreamInsert, LiveStreamUpdate } from "@/types/database";

// activeOnly=true uses the public endpoint; otherwise the admin endpoint (all streams).
export const useLiveStreams = (activeOnly = false) => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStreams = useCallback(async () => {
    try {
      setLoading(true);
      setStreams(await api<LiveStream[]>(activeOnly ? "/api/live" : "/api/admin/live"));
    } catch (error) {
      console.error("Error fetching streams:", error);
      toast({ title: "Erro", description: "Erro ao carregar transmissões", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeOnly, toast]);

  const run = async (fn: () => Promise<unknown>, ok: string, fail: string) => {
    try {
      await fn();
      toast({ title: "Sucesso", description: ok });
      await fetchStreams();
      return true;
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: error instanceof Error ? error.message : fail, variant: "destructive" });
      return false;
    }
  };

  const createStream = (data: LiveStreamInsert) =>
    run(() => api("/api/admin/live", { method: "POST", json: data }), "Transmissão criada com sucesso!", "Erro ao criar transmissão");

  const updateStream = (id: string, data: LiveStreamUpdate) =>
    run(() => api(`/api/admin/live/${id}`, { method: "PATCH", json: data }), "Transmissão atualizada com sucesso!", "Erro ao atualizar transmissão");

  const deleteStream = (id: string) =>
    run(() => api(`/api/admin/live/${id}`, { method: "DELETE" }), "Transmissão excluída com sucesso!", "Erro ao excluir transmissão");

  const toggleLiveStatus = (id: string, isLive: boolean) =>
    run(
      () =>
        api(`/api/admin/live/${id}`, {
          method: "PATCH",
          json: isLive
            ? { is_live: true, started_at: new Date().toISOString(), ended_at: null }
            : { is_live: false, ended_at: new Date().toISOString() },
        }),
      `Transmissão ${isLive ? "iniciada" : "finalizada"}!`,
      "Erro ao atualizar status da transmissão"
    );

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return { streams, loading, fetchStreams, createStream, updateStream, deleteStream, toggleLiveStatus };
};
