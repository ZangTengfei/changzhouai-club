"use client";

import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { Modal } from "antd";

import { Button } from "@/components/admin-antd/button";

export function AdminModal({
  title,
  triggerLabel,
  trigger,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  triggerLabel?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const actualOpen = open ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const triggerNode = trigger && isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onClick?: () => void }>, { onClick: () => setOpen(true) })
    : trigger;

  return (
    <>
      {triggerNode}
      {triggerLabel ? <Button type="button" onClick={() => setOpen(true)}>{triggerLabel}</Button> : null}
      <Modal title={title} open={actualOpen} onCancel={() => setOpen(false)} footer={null} width={720} destroyOnHidden>
        {children}
      </Modal>
    </>
  );
}
