"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return <Toaster closeButton position="top-right" theme="light" visibleToasts={4} />;
}
