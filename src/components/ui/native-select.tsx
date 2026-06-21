"use client";

import { Children, isValidElement, useState, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Select } from "antd";

type NativeOptionProps = ComponentProps<"option">;
type NativeSelectProps = Omit<ComponentProps<"select">, "onChange" | "value"> & {
  value?: string;
  onChange?: (value: string) => void;
};

function getOptionText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getOptionText).join("");
  }

  return "";
}

function NativeSelect({
  className,
  children,
  defaultValue,
  disabled,
  name,
  required: _required,
  value,
  onChange,
}: NativeSelectProps) {
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const option = child as ReactElement<NativeOptionProps>;
      const optionValue = String(option.props.value ?? getOptionText(option.props.children));

      return {
        label: option.props.children,
        value: optionValue,
        disabled: option.props.disabled,
      };
    });
  const fallbackValue = typeof defaultValue === "string" ? defaultValue : String(defaultValue ?? options[0]?.value ?? "");
  const [innerValue, setInnerValue] = useState(fallbackValue);
  const selectedValue = value ?? innerValue;

  return (
    <>
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      <Select
        className={className}
        value={selectedValue}
        disabled={disabled}
        options={options}
        onChange={(nextValue) => {
          setInnerValue(nextValue);
          onChange?.(nextValue);
        }}
      />
    </>
  );
}

export { NativeSelect };
