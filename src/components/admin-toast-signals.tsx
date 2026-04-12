"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function AdminToastSignals({
  success,
  error,
}: {
  success?: string | null;
  error?: string | null;
}) {
  useEffect(() => {
    if (success) {
      toast.success(success);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return null;
}
