"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api-client";
import type { CatalogResponse } from "@/lib/types";

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return api<CatalogResponse>("/api/catalog")
      .then((data) => {
        setCatalog(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "The stall could not be loaded.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<CatalogResponse>("/api/catalog")
      .then((data) => {
        if (cancelled) return;
        setCatalog(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "The stall could not be loaded.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, error, loading, reload };
}
