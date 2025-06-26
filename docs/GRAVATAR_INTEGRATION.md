# Gravatar Integration Guide

Esta documentação descreve a implementação moderna e robusta do Gravatar no projeto, seguindo as melhores práticas e a documentação oficial mais recente.

## Visão Geral

Nossa implementação do Gravatar oferece:

- ✅ **URLs Oficiais**: Uso das URLs oficiais (`https://0.gravatar.com` para avatares)
- ✅ **API v3**: Integração com a API v3 oficial para dados de perfil
- ✅ **SHA256**: Hash SHA256 correto conforme documentação
- ✅ **Bearer Token**: Autenticação adequada via Bearer token
- ✅ **Fallback Inteligente**: Sistema robusto de fallbacks
- ✅ **Rich Profiles**: Suporte completo a perfis ricos do Gravatar
- ✅ **Performance**: Cache otimizado e verificação de conectividade

## Configuração

### 1. Variável de Ambiente

```bash
NEXT_PUBLIC_GRAVATAR_API_KEY="your-api-key-here"
```

**Como obter sua API Key:**

1. Faça login na sua conta Gravatar
2. Navegue até o [Developer Dashboard](https://gravatar.com/developers)
3. Clique em "Create New Application"
4. Preencha os dados necessários
5. Copie a API Key gerada

### 2. Configuração no Projeto

A configuração é automática via variáveis de ambiente. Nenhuma configuração adicional é necessária.

## Como Usar

### Hook Básico - useAvatar

```tsx
import { useAvatar } from "@/hooks/use-avatar";

function UserProfile() {
  const {
    avatarUrl,
    fallbackUrls,
    initials,
    displayName,
    email,
    gravatarProfile,
    isLoadingProfile
  } = useAvatar();

  return (
    <div>
      <img src={avatarUrl} alt={`${displayName} avatar`} />
      <h2>{displayName}</h2>

      {/* Rich profile data from Gravatar */}
      {gravatarProfile?.hasRichProfile && (
        <div>
          <p>{gravatarProfile.bio}</p>
          <p>{gravatarProfile.location}</p>
        </div>
      )}
    </div>
  );
}
```

### Componente Avatar Simples

```tsx
import { UserAvatar } from "@/components/ui/user-avatar";

function Header() {
  return (
    <UserAvatar
      size="md"
      className="border-2 border-primary"
    />
  );
}
```

### Componente Avatar Avançado

```tsx
import { EnhancedUserAvatar } from "@/components/ui/enhanced-user-avatar";

function ProfileSection() {
  return (
    <EnhancedUserAvatar
      size="lg"
      showProfileOnHover={true}
      showLoadingState={true}
    />
  );
}
```

## Serviços Disponíveis

### Gravatar Service (`@/services/gravatar`)

```tsx
import {
  generateGravatarAvatarUrl,
  useGravatarProfile,
  useGravatarHealth,
  extractGravatarDisplayInfo
} from "@/services/gravatar";

// Gerar URL de avatar
const avatarUrl = generateGravatarAvatarUrl("user@example.com", 80, "404");

// Usar dados de perfil
const { data: profile, isLoading } = useGravatarProfile("user@example.com");

// Verificar saúde do serviço
const { data: isHealthy } = useGravatarHealth();
```

### Funções Utilitárias

```tsx
import {
  generateGravatarHash,
  generateGravatarProfileUrl,
  isLikelyToHaveGravatar
} from "@/services/gravatar";

// Gerar hash SHA256
const hash = generateGravatarHash("user@example.com");

// URL do perfil público
const profileUrl = generateGravatarProfileUrl("user@example.com");

// Verificar se email provavelmente tem Gravatar
const likely = isLikelyToHaveGravatar("user@gmail.com"); // true
```

## Sistema de Fallback

A implementação usa um sistema inteligente de fallback por ordem de prioridade:

1. **Google Profile Image** - Mais confiável (via OAuth)
2. **Gravatar Thumbnail** - Maior qualidade (via API profile)
3. **Gravatar Avatar** - Padrão oficial
4. **Gravatar Identicon** - Para emails provavelmente com Gravatar
5. **UI Avatars** - Serviço confiável com iniciais
6. **DiceBear** - Serviço alternativo
7. **Local SVG** - Fallback final sempre funcional

## Dados de Perfil Rico

O sistema busca automaticamente dados ricos do perfil Gravatar:

```tsx
interface GravatarProfile {
  displayName: string;
  thumbnailUrl: string;
  bio?: string;
  location?: string;
  jobTitle?: string;
  company?: string;
  socialAccounts: Array<{
    domain: string;
    platform: string;
    url: string;
    verified: boolean;
  }>;
  interests: Array<{
    id: string;
    name: string;
  }>;
  // ... mais campos
}
```

## Performance e Cache

- **Avatares**: Cache automático pelo navegador
- **Profiles**: Cache de 15 minutos
- **Health Check**: Cache de 5 minutos, verificação a cada 10 minutos
- **Network Status**: Cache de 2 minutos

## Monitoramento

O sistema inclui métricas automáticas:

```tsx
import { getAvatarMetrics, recordAvatarMetric } from "@/services/avatar";

const metrics = getAvatarMetrics();
console.log({
  gravatarSuccess: metrics.gravatarSuccess,
  gravatarFails: metrics.gravatarFails,
  fallbackUsed: metrics.fallbackUsed
});
```

## Tratamento de Erros

- **Conectividade**: Detecção automática de problemas de rede
- **DNS**: Fallback quando Gravatar não está acessível
- **Rate Limiting**: Respeitamos os limites da API
- **Timeout**: Requests com timeout configurável

## Migração da Versão Anterior

A migração é automática. O código anterior continuará funcionando, mas recomendamos atualizar:

```tsx
// ❌ Versão antiga
import { useGravatarHealth } from "@/services/avatar";

// ✅ Nova versão
import { useGravatarHealth } from "@/services/gravatar";
```

## Exemplos Avançados

### Avatar com Informações Completas

```tsx
function RichUserCard() {
  const { gravatarProfile, displayName, avatarUrl } = useAvatar();

  return (
    <div className="p-4 border rounded-lg">
      <img src={avatarUrl} className="w-16 h-16 rounded-full" />

      <h3>{gravatarProfile?.displayName || displayName}</h3>

      {gravatarProfile?.jobTitle && (
        <p className="text-sm text-gray-600">
          {gravatarProfile.jobTitle}
          {gravatarProfile.company && ` at ${gravatarProfile.company}`}
        </p>
      )}

      {gravatarProfile?.interests && (
        <div className="mt-2">
          {gravatarProfile.interests.slice(0, 3).map(interest => (
            <span key={interest.id} className="inline-block bg-blue-100 rounded px-2 py-1 text-xs mr-1">
              {interest.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Verificação de Saúde

```tsx
function GravatarStatus() {
  const { data: isHealthy, isLoading } = useGravatarHealth();

  if (isLoading) return <div>Checking Gravatar...</div>;

  return (
    <div className={`p-2 rounded ${isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
      Gravatar Status: {isHealthy ? '✅ Online' : '❌ Offline'}
    </div>
  );
}
```

## Configurações Avançadas

### Customização de Fallback

```tsx
// No serviço gravatar.ts, você pode ajustar:
const GRAVATAR_CONFIG = {
  AVATAR_BASE_URL: "https://0.gravatar.com/avatar",
  DEFAULT_SIZE: 40,
  TIMEOUT: 5000,
};
```

### Domínios com Alta Probabilidade de Gravatar

```tsx
const gravatarFriendlyDomains = [
  "gmail.com",
  "wordpress.com",
  "automattic.com",
  "github.com",
  "stackoverflow.com",
];
```

## Troubleshooting

### API Key não funciona

- Verifique se a variável `NEXT_PUBLIC_GRAVATAR_API_KEY` está configurada
- Confirme que a API key está ativa no dashboard Gravatar

### Avatares não carregam

- Verifique conectividade de rede
- Confirme se o hook `useGravatarHealth` retorna `true`
- Verifique console para logs de erro

### Performance lenta

- Verifique se o cache está funcionando
- Consider usar `isLikelyToHaveGravatar` para otimizar requests

## Suporte

Para dúvidas ou problemas:

1. Verifique os logs no console do navegador
2. Teste a conectividade com Gravatar
3. Confirme se a API key está válida
4. Abra uma issue no repositório do projeto

---

Esta implementação segue as melhores práticas e a documentação oficial do Gravatar, proporcionando uma experiência robusta e profissional para os usuários.
