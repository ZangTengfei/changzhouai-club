"use client";

import type { ReactElement } from "react";
import { isValidElement } from "react";
import { Button as AntButton, type ButtonProps as AntButtonProps } from "antd";

type Props = Omit<AntButtonProps, "type" | "size" | "variant"> & {
  asChild?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link" | null;
  size?: "default" | "sm" | "lg" | "icon" | null;
  type?: "button" | "submit" | "reset";
};

export function Button({ asChild, variant = "default", size = "default", children, className, type, ...props }: Props) {
  const antType = variant === "default" ? "primary" : variant === "link" ? "link" : variant === "ghost" ? "text" : "default";
  const danger = variant === "destructive";
  const antSize = size === "sm" ? "small" : size === "lg" ? "large" : "middle";
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ href?: string; target?: string; children?: React.ReactNode }>;
    return <AntButton href={child.props.href} target={child.props.target} type={antType} danger={danger} size={antSize} className={className}>{child.props.children}</AntButton>;
  }
  return <AntButton htmlType={type === "submit" ? "submit" : type === "reset" ? "reset" : "button"} type={antType} danger={danger} size={antSize} className={className} {...props}>{children}</AntButton>;
}

export const buttonVariants = () => "";
