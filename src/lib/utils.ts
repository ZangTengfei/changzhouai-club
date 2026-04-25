import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type CssModuleStyles = Record<string, string>;

function splitClassNames(inputs: ClassValue[]) {
  return clsx(inputs).split(/\s+/).filter(Boolean);
}

export function cssModuleCx(styles: CssModuleStyles, ...inputs: ClassValue[]) {
  return splitClassNames(inputs)
    .map((className) => styles[className] ?? className)
    .join(" ");
}

export function cssModuleCxWithGlobals(
  styles: CssModuleStyles,
  ...inputs: ClassValue[]
) {
  return splitClassNames(inputs)
    .map((className) =>
      styles[className] ? `${styles[className]} ${className}` : className,
    )
    .join(" ");
}
