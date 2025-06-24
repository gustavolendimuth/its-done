"use client";

import * as React from "react";
import InputMask from "react-input-mask";
import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value, ...props }, ref) => {
    // Determina qual máscara usar baseado no padrão brasileiro
    const getMask = (phoneValue: string) => {
      const numbers = phoneValue?.replace(/\D/g, "") || "";

      // Se tem pelo menos 3 dígitos, verifica o terceiro dígito
      if (numbers.length >= 3) {
        // Se o terceiro dígito é 9, é celular (11 dígitos)
        if (numbers[2] === "9") {
          return "(99) 99999-9999"; // Celular
        } else {
          // Se o terceiro dígito não é 9, é telefone fixo (10 dígitos)
          return "(99) 9999-9999"; // Telefone fixo
        }
      }

      // Default: inicia com máscara de celular até detectar o tipo
      return "(99) 99999-9999";
    };

    const [currentMask, setCurrentMask] = React.useState(() =>
      getMask(value as string)
    );

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      const numbers = inputValue.replace(/\D/g, "");

      // Determina a máscara com base nos dígitos atuais
      const detectedMask = getMask(numbers);

      // Determina o limite de dígitos baseado na máscara detectada
      const isFixedPhone = detectedMask === "(99) 9999-9999";
      const maxDigits = isFixedPhone ? 10 : 11;

      // Limita o número de dígitos baseado no tipo detectado
      if (numbers.length > maxDigits) {
        return; // Não permite mais dígitos que o máximo para o tipo
      }

      // Atualiza a máscara se necessário
      if (detectedMask !== currentMask) {
        setCurrentMask(detectedMask);
      }

      // Chama o onChange do pai
      if (onChange) {
        onChange(event);
      }
    };

    // Avoid findDOMNode warning by using a callback ref
    const setInputRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <InputMask
        {...props}
        mask={currentMask}
        value={value}
        onChange={handleInputChange}
        maskChar=""
        placeholder="(11) 99999-9999"
        alwaysShowMask={false}
      >
        {(inputProps: any) => (
          <input
            {...inputProps}
            ref={setInputRef}
            type="tel"
            autoComplete="tel"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          />
        )}
      </InputMask>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
