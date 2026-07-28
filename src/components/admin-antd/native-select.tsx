"use client";
import { Children, isValidElement, useState, type ComponentProps, type ReactElement } from "react";
import { Select } from "antd";

export function NativeSelect({ children, name, value, defaultValue, onChange, className, disabled }: ComponentProps<"select">) {
  const [innerValue, setInnerValue] = useState(defaultValue?.toString());
  const options = Children.toArray(children).filter(isValidElement).map((child) => {
    const option = child as ReactElement<ComponentProps<"option">>;
    return { value: String(option.props.value ?? ""), label: option.props.children, disabled: option.props.disabled };
  });
  const current = value?.toString() ?? innerValue;
  return <><Select className={className} value={current} options={options} disabled={disabled} onChange={(next) => { setInnerValue(next); onChange?.({ target: { value: next, name } } as never); }} /><input type="hidden" name={name} value={current ?? ""} /></>;
}
