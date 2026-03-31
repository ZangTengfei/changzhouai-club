"use client";

import { useEffect, useState } from "react";

type ResourceState<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
};

export function useAdminResource<T>(url: string) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((current) => ({
        data: current.data,
        error: null,
        isLoading: true,
      }));

      try {
        const response = await fetch(url, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = (await response.json()) as T & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "加载失败，请稍后再试。");
        }

        if (!cancelled) {
          setState({
            data: payload,
            error: null,
            isLoading: false,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "加载失败，请稍后再试。",
            isLoading: false,
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
