"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";

export function ProjectApplicationSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="button home-primary-button"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? (
        <>
          正在提交
          <LoaderCircle aria-hidden="true" className="animate-spin" strokeWidth={2} />
        </>
      ) : (
        <>
          提交申请
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </>
      )}
    </button>
  );
}
