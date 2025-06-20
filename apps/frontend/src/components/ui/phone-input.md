# PhoneInput Component

Componente de input com máscara para números de telefone brasileiros.

## Características

- **Máscara dinâmica**: Ajusta automaticamente entre telefone fixo e celular
- **Celular brasileiro**: (XX) 9XXXX-XXXX (11 dígitos: 2 DDD + 9 número, começando com 9)
- **Telefone fixo**: (XX) XXXX-XXXX (10 dígitos: 2 DDD + 8 número)
- **Detecção inteligente**: Identifica o tipo baseado no terceiro dígito
- **Limite adaptativo**: 10 dígitos para fixo, 11 para celular
- **Validação**: Remove caracteres não numéricos automaticamente
- **Compatível**: Funciona com React Hook Form e outros sistemas de formulário

## Uso

```tsx
import { PhoneInput } from "@/components/ui/phone-input";

// Uso básico
<PhoneInput
  placeholder="(11) 99999-9999"
  onChange={handleChange}
  value={phoneValue}
/>

// Com React Hook Form
<PhoneInput
  {...register("phone")}
  placeholder="(11) 99999-9999"
/>
```

## Exemplos de formato

- **Celular**: (11) 99999-8888 (11 dígitos total, terceiro dígito sempre 9)
- **Telefone fixo**: (11) 3333-4444 (10 dígitos total, terceiro dígito diferente de 9)
- **DDDs válidos**: 11-99 (todos os DDDs brasileiros são suportados)

## Lógica de Detecção

1. **Celular detectado quando**:

   - Terceiro dígito é 9 (após DDD)
   - Máscara: (XX) 9XXXX-XXXX
   - Limite: 11 dígitos

2. **Telefone fixo detectado quando**:
   - Terceiro dígito não é 9 (após DDD)
   - Máscara: (XX) XXXX-XXXX
   - Limite: 10 dígitos

## Props

Herda todas as props de `HTMLInputElement` exceto `onChange`, que é tipado especificamente para o componente.

## Correções Implementadas

- **Formatação corrigida**: Números digitados agora aparecem corretamente no campo
- **Telefones fixos melhorados**: Formatação de 10 dígitos agora funciona perfeitamente
- **Máscara dinâmica otimizada**: A máscara muda automaticamente conforme padrão brasileiro
- **Limite adaptativo**: Previne digitação excessiva baseada no tipo detectado
- **Detecção aprimorada**: Melhor lógica para distinguir celular de telefone fixo
- **Conflito InputMask resolvido**: Removida lógica conflitante de formatação personalizada
