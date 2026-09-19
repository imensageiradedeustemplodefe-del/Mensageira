"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/fetcher";
import type { DailyVerse } from "@/types/database";

interface UseDailyVersesReturn {
  verse: DailyVerse | null;
  isLoading: boolean;
  error: string | null;
  refreshVerse: () => Promise<void>;
  getDailyVerse: () => Promise<void>;
}

const pickDailyIndex = (count: number) => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = dayOfYear + today.getFullYear() * 365;
  return seed % count;
};

export const useDailyVerses = (): UseDailyVersesReturn => {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allVerses, setAllVerses] = useState<DailyVerse[]>([]);

  const loadAllVersesAndDailyVerse = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const verses = await api<DailyVerse[]>("/api/verses");
      setAllVerses(verses);
      if (verses.length > 0) setVerse(verses[pickDailyIndex(verses.length)]);
    } catch (err) {
      console.error("Erro ao carregar versículos:", err);
      setError("Erro ao carregar versículos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllVersesAndDailyVerse();
  }, [loadAllVersesAndDailyVerse]);

  const getDailyVerse = useCallback(async () => {
    if (allVerses.length === 0) {
      await loadAllVersesAndDailyVerse();
      return;
    }
    setVerse(allVerses[pickDailyIndex(allVerses.length)]);
  }, [allVerses, loadAllVersesAndDailyVerse]);

  // Versículo aleatório (para o botão de atualizar), evitando repetições recentes
  const refreshVerse = useCallback(async () => {
    if (allVerses.length === 0) {
      await loadAllVersesAndDailyVerse();
      return;
    }
    try {
      const recentVersesStr = localStorage.getItem("recentVerses");
      const recentData = recentVersesStr ? JSON.parse(recentVersesStr) : { verses: [], lastClean: Date.now() };

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      if (recentData.lastClean < thirtyDaysAgo) {
        recentData.verses = [];
        recentData.lastClean = Date.now();
      }

      const maxRecent = Math.floor(allVerses.length * 0.5);
      const recentVerses: string[] = recentData.verses.slice(0, maxRecent);
      const availableVerses = allVerses.filter((v) => !recentVerses.includes(v.id));
      const pool = availableVerses.length > 0 ? availableVerses : allVerses;
      const selected = pool[Math.floor(Math.random() * pool.length)];

      localStorage.setItem(
        "recentVerses",
        JSON.stringify({ verses: [selected.id, ...recentVerses.slice(0, maxRecent - 1)], lastClean: recentData.lastClean })
      );
      setVerse(selected);
    } catch (err) {
      console.error("Erro ao atualizar versículo:", err);
      setError("Erro ao atualizar versículo");
    }
  }, [allVerses, loadAllVersesAndDailyVerse]);

  return { verse, isLoading, error, refreshVerse, getDailyVerse };
};
