"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Formata um telefone brasileiro a partir de qualquer entrada.
 * - Celular (11 dígitos): "(99) 99999-9999"
 * - Fixo (10 dígitos): "(99) 9999-9999"
 * O tipo é detectado pelo 3º dígito (9 = celular).
 *
 * Reimplementado sem `react-input-mask` porque essa biblioteca depende de
 * `ReactDOM.findDOMNode`, removido no React 19, o que quebrava qualquer
 * formulário com este campo (ex.: editar cliente).
 */
export function formatBrazilPhone(input: string | number | undefined): string {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 0) return "";

  // Remove o código do país (+55) quando presente (12 ou 13 dígitos), para
  // exibir apenas o número local. Números locais com 11 dígitos ou menos são
  // preservados mesmo que o DDD seja 55.
  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  const isMobile = digits.length < 3 || digits[2] === "9";
  const maxDigits = isMobile ? 11 : 10;
  const trimmed = digits.slice(0, maxDigits);

  const ddd = trimmed.slice(0, 2);
  if (trimmed.length <= 2) return `(${ddd}`;

  const rest = trimmed.slice(2);
  const splitAt = isMobile ? 5 : 4;
  if (rest.length <= splitAt) return `(${ddd}) ${rest}`;

  return `(${ddd}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value, placeholder, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      // Reescreve o valor no target para que consumidores que leem
      // event.target.value (react-hook-form, handlers de formulário) recebam o
      // valor já mascarado.
      event.target.value = formatBrazilPhone(event.target.value);
      onChange?.(event);
    };

    return (
      <input
        {...props}
        ref={ref}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value={formatBrazilPhone(value as string)}
        onChange={handleChange}
        placeholder={placeholder ?? "(11) 99999-9999"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
