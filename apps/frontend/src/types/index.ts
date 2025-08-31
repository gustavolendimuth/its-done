// ===== EXPORTAÇÕES PRINCIPAIS =====

// Entidades do banco de dados
export * from "./entities";

// Tipos de API e serviços
export * from "./api";

// Tipos de interface do usuário
export * from "./ui";

// Tipos para testes
export * from "./test";

export type TimeFormat = {
  hours: string; // Format HH:mm
};

export interface CreateTimeEntryDto {
  date: string;
  hours: number;
  clientId: string;
  projectId?: string;
}
