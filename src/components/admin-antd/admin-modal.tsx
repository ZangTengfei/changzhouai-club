"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button, Modal } from "antd";

type TriggerElement = ReactElement<{
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}>;

export function AdminModal({
  title,
  triggerLabel,
  trigger,
  open,
  onOpenChange,
  width = 720,
  children,
}: {
  title: string;
  triggerLabel?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  width?: number;
  children: ReactNode;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const mergedOpen = open ?? innerOpen;

  function setModalOpen(nextOpen: boolean) {
    if (open === undefined) {
      setInnerOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  function renderTrigger(node: ReactNode) {
    if (!node) {
      return null;
    }

    if (!isValidElement(node)) {
      return (
        <span role="button" tabIndex={0} onClick={() => setModalOpen(true)}>
          {node}
        </span>
      );
    }

    const triggerElement = node as TriggerElement;

    return cloneElement(triggerElement, {
      onClick(event) {
        triggerElement.props.onClick?.(event);

        if (!event.defaultPrevented) {
          setModalOpen(true);
        }
      },
    });
  }

  return (
    <>
      {renderTrigger(trigger)}
      {triggerLabel ? (
        <Button type="primary" onClick={() => setModalOpen(true)}>
          {triggerLabel}
        </Button>
      ) : null}
      <Modal
        title={title}
        open={mergedOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={width}
        destroyOnHidden
        styles={{
          body: {
            maxHeight: "min(78vh, 760px)",
            overflowY: "auto",
            paddingTop: 12,
          },
        }}
      >
        {children}
      </Modal>
    </>
  );
}
