"use client";
import { Input } from "antd";
import type { TextAreaProps } from "antd/es/input/TextArea";
export function Textarea(props: TextAreaProps) {
  return <Input.TextArea autoSize={{ minRows: 4 }} {...props} />;
}
