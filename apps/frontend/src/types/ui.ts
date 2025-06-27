// ===== TIPOS DE INTERFACE DO USUÁRIO =====

export interface TranslationFunction {
  (key: string, values?: Record<string, string | number>): string;
}

export interface FormProps {
  defaultValues?: Record<string, string | number | boolean>;
  onSubmit: (data: Record<string, unknown>) => void;
  onError?: (error: import("./api").ApiError) => void;
}

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface PhoneInputRenderProps {
  inputProps: {
    name: string;
    onChange: (e: { target: { value: string } }) => void;
    value: string;
    placeholder?: string;
    disabled?: boolean;
  };
}

export interface TestComponentProps {
  invoices: import("./entities").Invoice[];
  workHours?: import("./entities").WorkHour[];
}
