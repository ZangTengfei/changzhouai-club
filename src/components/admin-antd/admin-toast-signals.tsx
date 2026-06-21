"use client";

import { useEffect } from "react";
import { App as AntApp } from "antd";

export function AdminToastSignals({
  success,
  error,
}: {
  success?: string | null;
  error?: string | null;
}) {
  const { message } = AntApp.useApp();

  useEffect(() => {
    if (success) {
      message.success(success);
    }
  }, [message, success]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error, message]);

  return null;
}
