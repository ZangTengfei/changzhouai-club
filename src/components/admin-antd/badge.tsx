"use client";
import type { ComponentProps } from "react";
import { Tag } from "antd";
export function Badge(props: ComponentProps<"span"> & { variant?: string | null }) { const { variant: _variant, ...rest } = props; return <Tag {...rest} />; }
export const badgeVariants = () => "";
