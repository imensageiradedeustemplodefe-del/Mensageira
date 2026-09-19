"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/fetcher";
import type { Testimony } from "@/types/database";

// Admin hook: lists ALL testimonies (pending + approved) via /api/admin.
export const useTestimonies = () => {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTestimonies = useCallback(async () => {
    try {
      setLoading(true);
      setTestimonies(await api<Testimony[]>("/api/admin/testimonies"));
    } catch (error) {
      console.error("Error fetching testimonies:", error);
      toast({ title: "Erro", description: "Erro ao carregar testemunhos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const approveTestimony = async (id: string) => {
    try {
      await api(`/api/admin/testimonies/${id}`, { method: "PATCH", json: { is_approved: true } });
      toast({ title: "Sucesso", description: "Testemunho aprovado!" });
      await fetchTestimonies();
      return true;
    } catch {
      toast({ title: "Erro", description: "Erro ao aprovar testemunho", variant: "destructive" });
      return false;
    }
  };

  const deleteTestimony = async (id: string) => {
    try {
      await api(`/api/admin/testimonies/${id}`, { method: "DELETE" });
      toast({ title: "Sucesso", description: "Testemunho excluído!" });
      await fetchTestimonies();
      return true;
    } catch {
      toast({ title: "Erro", description: "Erro ao excluir testemunho", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    fetchTestimonies();
  }, [fetchTestimonies]);

  return { testimonies, loading, fetchTestimonies, approveTestimony, deleteTestimony };
};
