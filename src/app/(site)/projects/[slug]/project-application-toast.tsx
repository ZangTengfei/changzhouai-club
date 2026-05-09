"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type ProjectApplicationToastProps = {
  applied: boolean;
  errorMessage: string | null;
};

export function ProjectApplicationToast({
  applied,
  errorMessage,
}: ProjectApplicationToastProps) {
  useEffect(() => {
    if (applied) {
      toast.success("申请已提交", {
        description: "社区会根据你留下的信息继续联系和筛选。",
        id: "project-application-applied",
      });
      return;
    }

    if (errorMessage) {
      toast.error("申请提交失败", {
        description: errorMessage,
        id: `project-application-error-${errorMessage}`,
      });
    }
  }, [applied, errorMessage]);

  return null;
}
